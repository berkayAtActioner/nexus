import { StreamChat } from 'stream-chat';

let clientInstance: StreamChat | null = null;

export function getStreamClient(): StreamChat | null {
  return clientInstance;
}

export async function initStreamClient(apiKey: string, userId: string, token: string, userName: string): Promise<StreamChat> {
  if (clientInstance) {
    await clientInstance.disconnectUser();
  }

  clientInstance = StreamChat.getInstance(apiKey);
  await clientInstance.connectUser(
    { id: userId, name: userName },
    token
  );

  return clientInstance;
}

export async function disconnectStreamClient(): Promise<void> {
  if (clientInstance) {
    await clientInstance.disconnectUser();
    clientInstance = null;
  }
}
