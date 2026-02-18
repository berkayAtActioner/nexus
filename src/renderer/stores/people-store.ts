import { create } from 'zustand';
import { WorkspaceUser } from '../../shared/types';
import { apiFetch } from '../services/api-client';

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
      const data = await apiFetch<{ users: WorkspaceUser[] }>('/users');
      set({ users: data.users, isLoading: false });
    } catch (err) {
      console.error('Fetch users error:', err);
      set({ isLoading: false });
    }
  },

  getUserById: (id) => {
    return get().users.find(u => u.id === id);
  },
}));
