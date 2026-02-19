import { create } from 'zustand';
import { StreamChat, Channel, Event } from 'stream-chat';
import { initStreamClient, disconnectStreamClient, getStreamClient } from '../services/stream-client';
import { apiFetch } from '../services/api-client';
import { useChatStore } from './chat-store';
import { ChatMessage } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

interface PublicChannelInfo {
  id: string;
  name: string;
  memberCount: number;
}

interface StreamState {
  client: StreamChat | null;
  isConnected: boolean;
  channels: Channel[];              // channels user is a member of
  publicChannels: PublicChannelInfo[]; // public channels user has NOT joined (from server)
  activeChannelId: string | null;

  connect: (apiKey: string, userId: string, token: string, userName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  setActiveChannel: (channelId: string | null) => void;
  loadChannels: () => Promise<void>;
  createChannel: (name: string, members: string[], isPublic: boolean) => Promise<{ id: string } | null>;
  joinChannel: (channelId: string) => Promise<void>;
}

export const useStreamStore = create<StreamState>((set, get) => ({
  client: null,
  isConnected: false,
  channels: [],
  publicChannels: [],
  activeChannelId: null,

  connect: async (apiKey, userId, token, userName) => {
    set({ client: null, isConnected: false, channels: [], publicChannels: [] });
    try {
      const client = await initStreamClient(apiKey, userId, token, userName);
      set({ client, isConnected: true });

      // Listen for channel events to auto-refresh the list
      client.on('notification.added_to_channel', (event: Event) => {
        get().loadChannels();
        // If it's an ai-session channel, reload chat sessions
        const channelId = event.channel?.id || '';
        if (channelId.startsWith('ai-session-')) {
          useChatStore.getState().reloadCurrentSessions();
        }
      });
      client.on('notification.removed_from_channel', (event: Event) => {
        get().loadChannels();
        const channelId = event.channel?.id || '';
        if (channelId.startsWith('ai-session-')) {
          useChatStore.getState().reloadCurrentSessions();
        }
      });
      client.on('channel.deleted', () => {
        get().loadChannels();
      });

      // Listen for new messages in ai-session channels
      client.on('message.new', (event: Event) => {
        const channelId = event.channel_id || event.cid?.split(':').pop() || '';
        if (!channelId.startsWith('ai-session-')) return;

        const sessionId = channelId.replace('ai-session-', '');
        const chatStore = useChatStore.getState();

        // Only process if this session is active and it's not our own message
        if (chatStore.activeSessionId !== sessionId) return;
        if (event.user?.id === client.userID) return;

        const msg = event.message;
        if (!msg) return;

        const custom = msg as any;
        const chatMessage: ChatMessage = {
          id: msg.id || uuidv4(),
          session_id: sessionId,
          role: (custom.role || 'user') as 'user' | 'assistant' | 'system',
          sender_name: custom.sender_name || event.user?.name || null,
          content: msg.text || '',
          mcp_app_data: custom.mcp_app_data || null,
          attachments: null,
          tool_calls: custom.tool_calls || null,
          created_at: custom.original_created_at || msg.created_at?.toString() || new Date().toISOString(),
        };

        chatStore.addStreamMessage(sessionId, chatMessage);
      });

      await get().loadChannels();
    } catch (err) {
      console.error('Stream connect error:', err);
      set({ client: null, isConnected: false });
    }
  },

  disconnect: async () => {
    await disconnectStreamClient();
    set({ client: null, isConnected: false, channels: [], publicChannels: [], activeChannelId: null });
  },

  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),

  loadChannels: async () => {
    const client = getStreamClient();
    if (!client?.userID) return;

    try {
      const sort = [{ last_message_at: -1 as const }];

      // 1) Channels user is a member of
      const myFilter = { type: 'team', members: { $in: [client.userID] } };
      const myChannels = await client.queryChannels(myFilter, sort, { watch: true, state: true });

      // 2) Public channels from server (admin query — user can't see channels they haven't joined)
      let publicChannels: PublicChannelInfo[] = [];
      try {
        const data = await apiFetch<{ channels: PublicChannelInfo[] }>('/channels/public');
        publicChannels = data.channels;
      } catch (e) {
        console.warn('[Stream] Public channel fetch failed:', e);
      }

      set({ channels: myChannels, publicChannels });
    } catch (err) {
      console.error('Load channels error:', err);
    }
  },

  // Create channel via server API (admin privileges, avoids permission issues)
  createChannel: async (name, members, isPublic) => {
    const client = getStreamClient();
    if (!client?.userID) return null;

    try {
      const allMembers = [...new Set([client.userID, ...members])];
      const data = await apiFetch<{ channel: { id: string } }>('/channels', {
        method: 'POST',
        body: JSON.stringify({ name, members: allMembers, isPublic }),
      });
      await get().loadChannels();
      return data.channel;
    } catch (err) {
      console.error('Create channel error:', err);
      return null;
    }
  },

  joinChannel: async (channelId) => {
    const client = getStreamClient();
    if (!client?.userID) return;

    try {
      // Use server API to join (admin adds user as member)
      await apiFetch('/channels/join', {
        method: 'POST',
        body: JSON.stringify({ channelId }),
      });
      await get().loadChannels();
    } catch (err) {
      console.error('Join channel error:', err);
    }
  },
}));
