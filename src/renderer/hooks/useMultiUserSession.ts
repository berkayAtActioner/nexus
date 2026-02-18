import { useEffect, useState, useCallback } from 'react';
import { getStreamClient } from '../services/stream-client';
import { useAuthStore } from '../stores/auth-store';
import { SessionParticipant } from '../../shared/types';
import type { Channel as StreamChannel } from 'stream-chat';

export function useMultiUserSession(sessionId: string | null) {
  const currentUser = useAuthStore(s => s.currentUser);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [syncChannel, setSyncChannel] = useState<StreamChannel | null>(null);

  // Load participants from SQLite
  const loadParticipants = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await window.nexus.db.getParticipants(sessionId);
      setParticipants(data);
    } catch (err) {
      console.error('Load participants error:', err);
    }
  }, [sessionId]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  // Set up Stream sync channel when there are multiple participants
  useEffect(() => {
    const client = getStreamClient();
    if (!client || !sessionId || participants.length <= 1) {
      setSyncChannel(null);
      return;
    }

    const memberIds = participants.map(p => p.user_id);
    const channelId = `ai-session-${sessionId}`;
    const channel = client.channel('messaging', channelId, {
      members: memberIds,
      name: 'AI Session Sync',
    } as any);

    channel.watch().then(() => setSyncChannel(channel)).catch(console.error);

    return () => {
      channel.stopWatching().catch(() => {});
    };
  }, [sessionId, participants.length]);

  const inviteUser = useCallback(async (userId: string) => {
    if (!sessionId) return;
    await window.nexus.db.addParticipant(sessionId, userId, 'member');
    await loadParticipants();
  }, [sessionId, loadParticipants]);

  const removeUser = useCallback(async (userId: string) => {
    if (!sessionId) return;
    await window.nexus.db.removeParticipant(sessionId, userId);
    await loadParticipants();
  }, [sessionId, loadParticipants]);

  const broadcastMessage = useCallback(async (content: string, role: string, senderName: string) => {
    if (!syncChannel) return;
    try {
      await syncChannel.sendMessage({
        text: content,
        user_id: currentUser?.id,
        custom: { role, sender_name: senderName, session_id: sessionId },
      } as any);
    } catch (err) {
      console.error('Broadcast error:', err);
    }
  }, [syncChannel, currentUser?.id, sessionId]);

  return {
    participants,
    syncChannel,
    inviteUser,
    removeUser,
    broadcastMessage,
    loadParticipants,
    isMultiUser: participants.length > 1,
  };
}
