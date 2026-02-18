import Anthropic from '@anthropic-ai/sdk';
import { McpTool, McpAppData, ToolCallDisplay } from '../../shared/types';

let client: Anthropic | null = null;

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}

export function initClaudeService(apiKey: string): void {
  client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export function getClaudeClient(): Anthropic | null {
  return client;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function streamMessage(params: {
  model: string;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens: number;
  temperature: number;
  callbacks: StreamCallbacks;
}): Promise<void> {
  if (!client) {
    params.callbacks.onError(new Error('Claude client not initialized. Please set your API key.'));
    return;
  }

  let fullText = '';

  try {
    const stream = client.messages.stream({
      model: params.model,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      system: params.systemPrompt,
      messages: params.messages,
    });

    stream.on('text', (text) => {
      fullText += text;
      params.callbacks.onToken(text);
    });

    const finalMessage = await stream.finalMessage();

    // Extract full text from content blocks
    const completeText = finalMessage.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    params.callbacks.onComplete(completeText);
  } catch (error) {
    params.callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// Tool loop callbacks
export interface ToolCallbacks extends StreamCallbacks {
  onToolCallStart: (display: ToolCallDisplay) => void;
  onToolCallEnd: (display: ToolCallDisplay) => void;
  onNewIteration?: () => void;
}

// Convert McpTool to Claude API tool format
function toClaudeTool(tool: McpTool): Anthropic.Tool {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Anthropic.Tool['input_schema'],
  };
}

export async function sendMessageWithTools(params: {
  model: string;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens: number;
  temperature: number;
  tools: McpTool[];
  callTool: (serverId: string, toolName: string, args: Record<string, unknown>) => Promise<any>;
  callbacks: ToolCallbacks;
}): Promise<{ toolCalls: ToolCallDisplay[] }> {
  if (!client) {
    params.callbacks.onError(new Error('Claude client not initialized. Please set your API key.'));
    return { toolCalls: [] };
  }

  const claudeTools = params.tools.map(toClaudeTool);
  const toolMap = new Map(params.tools.map(t => [t.name, t]));

  // Build messages - start with text-only history, use content block arrays for tool turns
  const messages: Anthropic.MessageParam[] = params.messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  const allToolCalls: ToolCallDisplay[] = [];
  let fullText = '';

  try {
    let continueLoop = true;

    while (continueLoop) {
      const stream = client.messages.stream({
        model: params.model,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        system: params.systemPrompt,
        messages,
        tools: claudeTools,
      });

      stream.on('text', (text) => {
        fullText += text;
        params.callbacks.onToken(text);
      });

      const finalMessage = await stream.finalMessage();

      if (finalMessage.stop_reason === 'tool_use') {
        // Extract text and tool_use blocks from response
        const assistantContent: Anthropic.ContentBlock[] = finalMessage.content;

        // Add assistant message with full content blocks
        messages.push({ role: 'assistant', content: assistantContent });

        // Process each tool call
        const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];

        for (const block of assistantContent) {
          if (block.type !== 'tool_use') continue;

          const mcpTool = toolMap.get(block.name);
          if (!mcpTool) {
            toolResultBlocks.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Unknown tool: ${block.name}`,
              is_error: true,
            });
            continue;
          }

          const display: ToolCallDisplay = {
            id: block.id,
            toolName: block.name,
            serverId: mcpTool.serverId,
            args: block.input as Record<string, unknown>,
          };

          params.callbacks.onToolCallStart(display);
          const startTime = Date.now();

          try {
            const result = await withRetry(() => params.callTool(
              mcpTool.serverId,
              block.name,
              block.input as Record<string, unknown>
            ));

            // MCP returns { content: [{ type: 'text', text: '...' }] }
            const resultText = result?.content
              ?.map((c: any) => c.text || JSON.stringify(c))
              .join('\n') || JSON.stringify(result);

            display.result = resultText;
            display.duration = Date.now() - startTime;

            // Extract _app hints from tool result
            try {
              const parsed = JSON.parse(resultText);
              if (parsed && parsed._app) {
                const { _app, ...rest } = parsed;
                display.appData = {
                  type: _app.type || 'DataTable',
                  pinnable: !!_app.pinnable,
                  title: _app.title || mcpTool.name,
                  data: rest,
                  serverId: mcpTool.serverId,
                  toolName: block.name,
                } as McpAppData;
              }
            } catch {
              // Not JSON or no _app — ignore
            }

            params.callbacks.onToolCallEnd(display);

            toolResultBlocks.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: resultText,
            });
          } catch (error: any) {
            display.result = error.message;
            display.isError = true;
            display.duration = Date.now() - startTime;
            params.callbacks.onToolCallEnd(display);

            toolResultBlocks.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: error.message,
              is_error: true,
            });
          }

          allToolCalls.push(display);
        }

        // Add tool results as user message
        messages.push({ role: 'user', content: toolResultBlocks });

        // Reset fullText — the final iteration's text is what we care about
        fullText = '';
        params.callbacks.onNewIteration?.();
      } else {
        // stop_reason === 'end_turn' or 'max_tokens'
        continueLoop = false;

        const completeText = finalMessage.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map(block => block.text)
          .join('');

        // Use the full accumulated text if we had tool calls, otherwise use the final text
        params.callbacks.onComplete(allToolCalls.length > 0 ? completeText : completeText);
      }
    }
  } catch (error) {
    params.callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }

  return { toolCalls: allToolCalls };
}
