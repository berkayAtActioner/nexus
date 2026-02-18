import { useEffect } from 'react';
import { useUIStore } from '../stores/ui-store';
import { useChatStore } from '../stores/chat-store';
import { useAgentStore } from '../stores/agent-store';
import { useToastStore } from '../stores/toast-store';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      switch (e.key) {
        case ',': {
          e.preventDefault();
          useUIStore.getState().openSettings();
          break;
        }
        case 'n': {
          e.preventDefault();
          const agentId = useAgentStore.getState().activeAgentId;
          if (agentId) {
            useChatStore.getState().createSession(agentId);
          }
          break;
        }
        case 'w': {
          e.preventDefault();
          const sessionId = useChatStore.getState().activeSessionId;
          if (sessionId && window.confirm('Delete this session?')) {
            useChatStore.getState().deleteSession(sessionId);
            useToastStore.getState().addToast('Session deleted', 'success');
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
