import { useEffect, useState } from 'react';
import { useToastStore, Toast } from '../../stores/toast-store';

const typeColors: Record<Toast['type'], string> = {
  error: '#ef4444',
  success: '#22c55e',
  info: '#6366f1',
  warning: '#f59e0b',
};

const typeIcons: Record<Toast['type'], string> = {
  error: '✕',
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const color = typeColors[toast.type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 10,
        background: '#fff',
        border: '1px solid #e5e5ed',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        fontSize: 13,
        color: '#1a1a2e',
        maxWidth: 360,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.2s, transform 0.2s',
      }}
    >
      <span style={{
        width: 22, height: 22, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}15`, color, fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {typeIcons[toast.type]}
      </span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9999aa', fontSize: 14, padding: '0 2px', lineHeight: 1, flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  const removeToast = useToastStore(s => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'auto',
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}
