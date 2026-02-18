import { StreamChat } from 'stream-chat';

let serverClient: StreamChat | null = null;

export function getStreamClient(): StreamChat {
  if (!serverClient) {
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;
    if (!apiKey || !apiSecret || apiKey === 'your-stream-api-key') {
      throw new Error('Stream API key/secret not configured');
    }
    serverClient = StreamChat.getInstance(apiKey, apiSecret);
  }
  return serverClient;
}

export function isStreamConfigured(): boolean {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;
  return !!(apiKey && apiSecret && apiKey !== 'your-stream-api-key' && apiSecret !== 'your-stream-api-secret');
}

export function generateStreamToken(userId: string): string {
  const client = getStreamClient();
  return client.createToken(userId);
}

export async function upsertStreamUser(user: { id: string; name: string; image?: string }): Promise<void> {
  const client = getStreamClient();
  await client.upsertUser({
    id: user.id,
    name: user.name,
    image: user.image,
  });
}

export async function createStreamChannel(
  type: string,
  id: string,
  createdById: string,
  data: { name?: string; members?: string[] }
): Promise<any> {
  const client = getStreamClient();
  const channel = client.channel(type, id, {
    name: data.name,
    members: data.members,
    created_by_id: createdById,
  });
  await channel.create();
  return channel;
}
