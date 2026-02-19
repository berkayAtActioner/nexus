import { useEffect, useState, useCallback } from 'react';
import { getStreamClient } from '../services/stream-client';
import { useAuthStore } from '../stores/auth-store';
import { useChatStore } from '../stores/chat-store';
import { SessionParticipant } from '../../shared/types';
import { apiFetch } from '../services/api-client';

export function useMultiUserSession(sessionId: string | null) {
  const currentUser = useAuthStore(s => s.currentUser);
  const isSharedSession = useChatStore(s => s.isSharedSession);
  const reloadCurrentSessions = useChatStore(s => s.reloadCurrentSessions);
  const messages = useChatStore(s => s.messages);
  const sessions = useChatStore(s => s.sessions);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);

  // Load participants from Stream channel members (for shared sessions)
  // or from local SQLite (for local-only sessions)
  const loadParticipants = useCallback(async () => {
    if (!sessionId) { setParticipants([]); return; }

    if (isSharedSession(sessionId)) {
      // Read from Stream channel members
      const client = getStreamClient();
      if (client) {
        try {
          const channelId = `ai-session-${sessionId}`;
          const channel = client.channel('messaging', channelId);
          await channel.watch();
          const members = Object.values(channel.state.members || {});
          setParticipants(members.map(m => ({
            session_id: sessionId,
            user_id: m.user_id || m.user?.id || '',
            role: m.role || 'member',
            joined_at: m.created_at?.toString() || new Date().toISOString(),
          })));
        } catch (err) {
          console.error('Load Stream participants error:', err);
          setParticipants([]);
        }
      }
    } else {
      // Local session — load from SQLite
      try {
        const data = await window.nexus.db.getParticipants(sessionId);
        setParticipants(data);
      } catch (err) {
        console.error('Load participants error:', err);
      }
    }
  }, [sessionId, isSharedSession]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const inviteUser = useCallback(async (userId: string) => {
    if (!sessionId || !currentUser) return;

    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    try {
      // Call server to create/update Stream channel
      await apiFetch('/sessions/share', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          agentId: session.agent_id,
          title: session.title,
          memberIds: [currentUser.id, userId],
          messages: messages.map(m => ({
            content: m.content,
            role: m.role,
            sender_name: m.sender_name,
            tool_calls: m.tool_calls,
            mcp_app_data: m.mcp_app_data,
            created_at: m.created_at,
          })),
        }),
      });

      // Reload sessions so the shared flag picks up
      await reloadCurrentSessions();
      await loadParticipants();
    } catch (err) {
      console.error('Invite user error:', err);
    }
  }, [sessionId, currentUser, sessions, messages, reloadCurrentSessions, loadParticipants]);

  const removeUser = useCallback(async (userId: string) => {
    if (!sessionId) return;
    try {
      await apiFetch('/sessions/unshare', {
        method: 'POST',
        body: JSON.stringify({ sessionId, userId }),
      });
      await reloadCurrentSessions();
      await loadParticipants();
    } catch (err) {
      console.error('Remove user error:', err);
    }
  }, [sessionId, reloadCurrentSessions, loadParticipants]);

  return {
    participants,
    inviteUser,
    removeUser,
    loadParticipants,
    isMultiUser: participants.length > 1,
  };
}
