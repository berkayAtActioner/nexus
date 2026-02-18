import { useEffect, ReactNode } from 'react';
import { Chat } from 'stream-chat-react';
import { useAuthStore } from '../../stores/auth-store';
import { useStreamStore } from '../../stores/stream-store';
import { usePeopleStore } from '../../stores/people-store';
import 'stream-chat-react/dist/css/v2/index.css';
import './StreamTheme.css';

interface StreamProviderProps {
  children: ReactNode;
}

export default function StreamProvider({ children }: StreamProviderProps) {
  const { streamToken, streamConfig, currentUser, isAuthenticated } = useAuthStore();
  const { client, connect, isConnected } = useStreamStore();
  const fetchUsers = usePeopleStore(s => s.fetchUsers);

  useEffect(() => {
    if (isAuthenticated && streamConfig?.configured && streamConfig.apiKey && streamToken && currentUser) {
      connect(streamConfig.apiKey, currentUser.id, streamToken, currentUser.name);
    }
  }, [isAuthenticated, streamConfig?.configured, streamToken, currentUser?.id]);

  // Fetch workspace users when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers().catch(() => {});
    }
  }, [isAuthenticated]);

  // If Stream is connected, wrap with Chat provider
  if (client && isConnected) {
    return (
      <Chat client={client} theme="str-chat__theme-light">
        {children}
      </Chat>
    );
  }

  // If Stream isn't configured/connected, just render children without Stream
  return <>{children}</>;
}
