import { create } from 'zustand';
import { StreamChat, Channel } from 'stream-chat';
import { initStreamClient, disconnectStreamClient, getStreamClient } from '../services/stream-client';

interface StreamState {
  client: StreamChat | null;
  isConnected: boolean;
  channels: Channel[];         // channels user is a member of
  publicChannels: Channel[];   // public channels user has NOT joined
  activeChannelId: string | null;

  connect: (apiKey: string, userId: string, token: string, userName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  setActiveChannel: (channelId: string | null) => void;
  loadChannels: () => Promise<void>;
  createChannel: (name: string, members: string[], isPublic: boolean) => Promise<Channel | null>;
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

      // 1) Channels user is a member of (both public and private)
      const myFilter = { type: 'team', members: { $in: [client.userID] } };
      const myChannels = await client.queryChannels(myFilter, sort, { watch: true, state: true });

      // 2) Public channels user is NOT a member of
      const publicFilter = {
        type: 'team',
        isPublic: true,
        members: { $nin: [client.userID] },
      } as any;
      let publicChannels: Channel[] = [];
      try {
        publicChannels = await client.queryChannels(publicFilter, sort, { watch: false, state: false });
      } catch {
        // queryChannels with $nin may not work on all Stream plans, ignore
      }

      set({ channels: myChannels, publicChannels });
    } catch (err) {
      console.error('Load channels error:', err);
    }
  },

  createChannel: async (name, members, isPublic) => {
    const client = getStreamClient();
    if (!client?.userID) return null;

    try {
      const channelId = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      const allMembers = [...new Set([client.userID, ...members])];

      const channel = client.channel('team', channelId, {
        name,
        members: allMembers,
        isPublic: isPublic,
      } as any);
      await channel.create();
      await get().loadChannels();
      return channel;
    } catch (err) {
      console.error('Create channel error:', err);
      return null;
    }
  },

  joinChannel: async (channelId) => {
    const client = getStreamClient();
    if (!client?.userID) return;

    try {
      const channel = client.channel('team', channelId);
      await channel.addMembers([client.userID]);
      await get().loadChannels();
    } catch (err) {
      console.error('Join channel error:', err);
    }
  },
}));
