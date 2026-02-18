import { useEffect, useState } from 'react';
import { Channel, MessageList, MessageInput, Window } from 'stream-chat-react';
import { useStreamStore } from '../../stores/stream-store';
import { useAuthStore } from '../../stores/auth-store';
import type { Channel as StreamChannel } from 'stream-chat';

interface Props {
  userId: string;
}

export default function DmView({ userId }: Props) {
  const client = useStreamStore(s => s.client);
  const isConnected = useStreamStore(s => s.isConnected);
  const currentUser = useAuthStore(s => s.currentUser);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client || !isConnected || !currentUser) {
      setLoading(false);
      return;
    }

    const initDm = async () => {
      try {
        const members = [currentUser.id, userId].sort();
        const channelId = `dm-${members.join('-')}`;
        const ch = client.channel('messaging', channelId, {
          members,
        });
        await ch.watch();
        setChannel(ch);
      } catch (err) {
        console.error('DM init error:', err);
      }
      setLoading(false);
    };

    initDm();
  }, [client, isConnected, userId, currentUser?.id]);

  if (!isConnected) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9999aa', fontSize: 14,
      }}>
        Stream not connected. Configure Stream API keys for DMs.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9999aa', fontSize: 14,
      }}>
        Loading conversation...
      </div>
    );
  }

  if (!channel) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9999aa', fontSize: 14,
      }}>
        Could not load conversation
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Channel channel={channel}>
        <Window>
          <MessageList />
          <MessageInput />
        </Window>
      </Channel>
    </div>
  );
}
