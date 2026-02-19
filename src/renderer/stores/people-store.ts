import { create } from 'zustand';
import { WorkspaceUser } from '../../shared/types';
import { getStreamClient } from '../services/stream-client';

interface PeopleState {
  users: WorkspaceUser[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
  getUserById: (id: string) => WorkspaceUser | undefined;
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
  users: [],
  isLoading: false,

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const client = getStreamClient();
      if (!client?.userID) {
        set({ isLoading: false });
        return;
      }

      // Query all users from Stream Chat (the shared service)
      const { users: streamUsers } = await client.queryUsers(
        { id: { $ne: '' } } as any,
        { last_active: -1 },
        { limit: 100 }
      );

      const users: WorkspaceUser[] = streamUsers.map(u => ({
        id: u.id,
        email: (u as any).email || `${u.id}@nexus.app`,
        name: u.name || u.id,
        avatar_url: (u.image as string) || null,
        provider: 'stream',
        online: u.online,
      }));

      set({ users, isLoading: false });
    } catch (err) {
      console.error('Fetch users error:', err);
      set({ isLoading: false });
    }
  },

  getUserById: (id) => {
    return get().users.find(u => u.id === id);
  },
}));
