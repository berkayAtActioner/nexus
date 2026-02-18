import { useState } from 'react';
import { SessionParticipant, WorkspaceUser } from '../../../shared/types';
import { usePeopleStore } from '../../stores/people-store';
import InvitePicker from './InvitePicker';

interface Props {
  participants: SessionParticipant[];
  onInvite: (userId: string) => void;
  onRemove: (userId: string) => void;
}

export default function ParticipantAvatars({ participants, onInvite, onRemove }: Props) {
  const [showInvite, setShowInvite] = useState(false);
  const getUserById = usePeopleStore(s => s.getUserById);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
      {/* Overlapping avatars */}
      {participants.map((p, i) => {
        const user = getUserById(p.user_id);
        return (
          <div
            key={p.user_id}
            title={user?.name || p.user_id}
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: '#ededf7', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, color: '#6366f1',
              marginLeft: i > 0 ? -8 : 0, zIndex: participants.length - i,
              overflow: 'hidden',
            }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} style={{ width: 28, height: 28, borderRadius: 8 }} />
            ) : (
              (user?.name || '?')[0].toUpperCase()
            )}
          </div>
        );
      })}

      {/* Invite button */}
      <button
        onClick={() => setShowInvite(!showInvite)}
        style={{
          width: 28, height: 28, borderRadius: 8, marginLeft: 4,
          border: '1px dashed #e5e5ed', background: 'transparent',
          cursor: 'pointer', fontSize: 14, color: '#9999aa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Invite user"
      >
        +
      </button>

      {showInvite && (
        <InvitePicker
          existingIds={participants.map(p => p.user_id)}
          onSelect={(userId) => { onInvite(userId); setShowInvite(false); }}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}
