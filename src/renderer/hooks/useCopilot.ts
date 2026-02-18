import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCopilotStore } from '../stores/copilot-store';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';
import { useStreamStore } from '../stores/stream-store';
import { useAgentStore } from '../stores/agent-store';
import { getClaudeClient } from '../services/claude-service';
import { getStreamClient } from '../services/stream-client';
import { CopilotMessage } from '../../shared/types';

export function useCopilot() {
  const currentUser = useAuthStore(s => s.currentUser);
  const copilotAgentId = useUIStore(s => s.copilotAgentId);
  const activeView = useUIStore(s => s.activeView);
  const channels = useStreamStore(s => s.channels);
  const agents = useAgentStore(s => s.agents);

  const {
    messages, isStreaming, currentText,
    addMessage, setStreaming, appendStreamToken, clearStreamText,
  } = useCopilotStore();

  const agent = agents.find(a => a.id === copilotAgentId);

  const getChannelContext = useCallback(async (): Promise<string> => {
    const client = getStreamClient();
    if (!client || activeView.type !== 'channel') return '';

    try {
      const channel = channels.find(c => c.id === (activeView as any).channelId);
      if (!channel) return '';

      const response = await channel.query({ messages: { limit: 50 } });
      const msgs = response.messages || [];
      return msgs.map(m =>
        `[${m.user?.name || 'Unknown'}]: ${m.text || ''}`
      ).join('\n');
    } catch {
      return '';
    }
  }, [activeView, channels]);

  const sendMessage = useCallback(async (content: string) => {
    if (!copilotAgentId || !currentUser || isStreaming) return;

    const contextType = activeView.type === 'channel' ? 'channel' : 'dm';
    const contextId = activeView.type === 'channel'
      ? (activeView as any).channelId
      : activeView.type === 'human-dm'
        ? (activeView as any).userId
        : '';

    // Save user message
    const userMsg: CopilotMessage = {
      id: uuidv4(),
      user_id: currentUser.id,
      agent_id: copilotAgentId,
      context_type: contextType,
      context_id: contextId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    addMessage(userMsg);
    window.nexus.db.saveCopilotMessage(userMsg).catch(console.error);

    // Build system prompt with channel context
    const channelContext = await getChannelContext();
    const systemPrompt = [
      'You are a helpful AI assistant.',
      channelContext ? `\n\nHere is the recent conversation in the channel:\n\n${channelContext}` : '',
      '\n\nYou are acting as a copilot assistant. Help the user with questions about this conversation, summarize it, or help draft messages.',
    ].join('');

    // Build message history
    const history = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    history.push({ role: 'user', content });

    // Stream response
    setStreaming(true);
    let fullResponse = '';

    try {
      const claude = getClaudeClient();
      if (!claude) throw new Error('Claude not initialized');

      const stream = await claude.messages.stream({
        model: agent?.model || 'claude-sonnet-4-20250514',
        max_tokens: agent?.maxTokens || 4096,
        system: systemPrompt,
        messages: history,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && (event.delta as any).type === 'text_delta') {
          const token = (event.delta as any).text;
          fullResponse += token;
          appendStreamToken(token);
        }
      }
    } catch (err: any) {
      fullResponse = `Error: ${err.message}`;
    }

    clearStreamText();

    // Save assistant message
    const assistantMsg: CopilotMessage = {
      id: uuidv4(),
      user_id: currentUser.id,
      agent_id: copilotAgentId,
      context_type: contextType,
      context_id: contextId,
      role: 'assistant',
      content: fullResponse,
      created_at: new Date().toISOString(),
    };
    addMessage(assistantMsg);
    window.nexus.db.saveCopilotMessage(assistantMsg).catch(console.error);
  }, [copilotAgentId, currentUser, isStreaming, messages, agent, activeView, getChannelContext]);

  const postToChannel = useCallback(async (content: string) => {
    const client = getStreamClient();
    if (!client || activeView.type !== 'channel') return;

    try {
      const channel = channels.find(c => c.id === (activeView as any).channelId);
      if (channel) {
        await channel.sendMessage({ text: content });
      }
    } catch (err) {
      console.error('Post to channel error:', err);
    }
  }, [activeView, channels]);

  return {
    messages,
    isStreaming,
    currentText,
    agent,
    sendMessage,
    postToChannel,
  };
}
