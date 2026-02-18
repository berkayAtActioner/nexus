import { useEffect, useState } from 'react';
import { Channel as StreamChannel } from 'stream-chat';
import { Channel, MessageList, MessageInput, Window } from 'stream-chat-react';
import { useStreamStore } from '../../stores/stream-store';

interface Props {
  channelId: string;
}

export default function ChannelView({ channelId }: Props) {
  const client = useStreamStore(s => s.client);
  const isConnected = useStreamStore(s => s.isConnected);
  const [channel, setChannel] = useState<StreamChannel | null>(null);

  useEffect(() => {
    if (!client || !isConnected || !channelId) {
      setChannel(null);
      return;
    }

    const ch = client.channel('team', channelId);
    ch.watch().then(() => setChannel(ch)).catch(err => {
      console.error('Failed to watch channel:', err);
      setChannel(null);
    });
  }, [client, isConnected, channelId]);

  if (!isConnected) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9999aa', fontSize: 14,
      }}>
        Stream not connected. Configure Stream API keys to use channels.
      </div>
    );
  }

  if (!channel) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9999aa', fontSize: 14,
      }}>
        Loading channel...
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
