import { useCallback } from 'react';
import { useChatStore } from '../stores/chat-store';
import { useAgentStore } from '../stores/agent-store';
import { useAuthStore } from '../stores/auth-store';
import { useMcpStore } from '../stores/mcp-store';
import { useToastStore } from '../stores/toast-store';
import { streamMessage, sendMessageWithTools, initClaudeService } from '../services/claude-service';
import { apiFetch } from '../services/api-client';
import { McpAppData } from '../../shared/types';

interface FullAgent {
  id: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  mcpServers: string[];
}

export function useChat() {
  const {
    messages,
    streaming,
    activeSessionId,
    addUserMessage,
    addAssistantMessage,
    setStreaming,
    appendStreamToken,
  } = useChatStore();

  const activeAgent = useAgentStore(s => s.getActiveAgent());
  const apiKey = useAuthStore(s => s.apiKey);
  const addToast = useToastStore(s => s.addToast);
  const setLastFailedMessage = useChatStore(s => s.setLastFailedMessage);

  const createSession = useChatStore(s => s.createSession);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeAgent || !apiKey) return;

    // Auto-create session if none exists
    let sessionId = useChatStore.getState().activeSessionId;
    if (!sessionId) {
      const session = await createSession(activeAgent.id);
      sessionId = session.id;
    }

    // Add user message
    await addUserMessage(content);

    // Start streaming
    setStreaming({ isStreaming: true, currentText: '', activeToolCall: null });

    // Get full agent config (including systemPrompt) from server
    let fullAgent: FullAgent;
    try {
      fullAgent = await apiFetch<FullAgent>(`/agents/${activeAgent.id}?full=true`);
    } catch {
      // Fallback
      fullAgent = {
        id: activeAgent.id,
        model: activeAgent.model,
        systemPrompt: `You are ${activeAgent.name}, a helpful AI assistant.`,
        temperature: activeAgent.temperature,
        maxTokens: activeAgent.maxTokens,
        mcpServers: activeAgent.mcpServers || [],
      };
    }

    // Build message history (text-only for simplicity in Phase 1B)
    const chatMessages = useChatStore.getState().messages;
    const history = chatMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Ensure Claude client is initialized
    initClaudeService(apiKey);

    // Check if agent has MCP servers and tools available
    const mcpStore = useMcpStore.getState();
    const effectiveServers = mcpStore.getEffectiveServers(fullAgent.id, fullAgent.mcpServers || []);
    const tools = mcpStore.getToolsForServers(effectiveServers);

    if (tools.length > 0) {
      // Shared mutable array — populated during tool loop, read in onComplete
      const collectedToolCalls: import('../../shared/types').ToolCallDisplay[] = [];

      await sendMessageWithTools({
        model: fullAgent.model,
        systemPrompt: fullAgent.systemPrompt,
        messages: history,
        maxTokens: fullAgent.maxTokens,
        temperature: fullAgent.temperature,
        tools,
        callTool: mcpStore.callTool,
        callbacks: {
          onToken: (token) => {
            appendStreamToken(token);
          },
          onToolCallStart: (display) => {
            setStreaming({ activeToolCall: { toolName: display.toolName, serverId: display.serverId } });
          },
          onToolCallEnd: (display) => {
            collectedToolCalls.push(display);
            setStreaming({ activeToolCall: null });
          },
          onNewIteration: () => {
            setStreaming({ currentText: '' });
          },
          onComplete: async (fullText) => {
            // Collect MCP app data from tool calls
            const appDataList = collectedToolCalls
              .filter(tc => tc.appData)
              .map(tc => tc.appData!);
            await addAssistantMessage(
              fullText,
              collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
              appDataList.length > 0 ? appDataList : undefined,
            );
          },
          onError: (error) => {
            console.error('Stream error:', error);
            setStreaming({ isStreaming: false, currentText: '', activeToolCall: null });
            setLastFailedMessage({ content });
            addToast(error.message || 'Failed to send message', 'error');
          },
        },
      });
    } else {
      // No tools — use simple streaming
      await streamMessage({
        model: fullAgent.model,
        systemPrompt: fullAgent.systemPrompt,
        messages: history,
        maxTokens: fullAgent.maxTokens,
        temperature: fullAgent.temperature,
        callbacks: {
          onToken: (token) => {
            appendStreamToken(token);
          },
          onComplete: async (fullText) => {
            await addAssistantMessage(fullText);
          },
          onError: (error) => {
            console.error('Stream error:', error);
            setStreaming({ isStreaming: false, currentText: '' });
            setLastFailedMessage({ content });
            addToast(error.message || 'Failed to send message', 'error');
          },
        },
      });
    }
  }, [activeAgent, apiKey, addUserMessage, addAssistantMessage, setStreaming, appendStreamToken, createSession, addToast, setLastFailedMessage]);

  const drilldown = useCallback(async (serverId: string, toolName: string, args: Record<string, unknown>) => {
    const mcpStore = useMcpStore.getState();
    try {
      const result = await mcpStore.callTool(serverId, toolName, args);
      const resultText = result?.content
        ?.map((c: any) => c.text || JSON.stringify(c))
        .join('\n') || JSON.stringify(result);

      let appData: McpAppData | undefined;
      try {
        const parsed = JSON.parse(resultText);
        if (parsed && parsed._app) {
          const { _app, ...rest } = parsed;
          appData = {
            type: _app.type || 'DetailView',
            pinnable: !!_app.pinnable,
            title: _app.title || toolName,
            data: rest,
            serverId,
            toolName,
          };
        }
      } catch { /* not JSON */ }

      // Create a synthetic assistant message with the drilldown result
      const content = appData ? `Here's the detail for ${appData.title}:` : resultText;
      await addAssistantMessage(
        content,
        undefined,
        appData ? [appData] : undefined,
      );
    } catch (error: any) {
      console.error('Drilldown error:', error);
      await addAssistantMessage(`Error loading details: ${error.message}`);
    }
  }, [addAssistantMessage]);

  return {
    messages,
    streaming,
    sendMessage,
    drilldown,
  };
}
