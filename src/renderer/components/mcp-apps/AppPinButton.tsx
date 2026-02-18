import { McpAppData } from '../../../shared/types';
import { useUIStore } from '../../stores/ui-store';

interface Props {
  appData: McpAppData;
}

export default function AppPinButton({ appData }: Props) {
  const pinnedApps = useUIStore(s => s.pinnedApps);
  const pinApp = useUIStore(s => s.pinApp);
  const unpinApp = useUIStore(s => s.unpinApp);

  if (!appData.pinnable) return null;

  const pinId = `${appData.serverId}:${appData.toolName}:${appData.title}`;
  const isPinned = pinnedApps.some(p => p.id === pinId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned) {
      unpinApp(pinId);
    } else {
      pinApp({
        id: pinId,
        title: appData.title,
        icon: appData.type === 'DataTable' ? '\u2B22' : appData.type === 'ChartView' ? '\u25C8' : '\u25CE',
        color: '#6366f1',
        appData,
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      title={isPinned ? 'Unpin app' : 'Pin to sidebar'}
      style={{
        width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5ed',
        background: isPinned ? '#6366f118' : '#fff',
        color: isPinned ? '#6366f1' : '#9999aa',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = isPinned ? '#6366f130' : '#f0f0f5'; }}
      onMouseLeave={e => { e.currentTarget.style.background = isPinned ? '#6366f118' : '#fff'; }}
    >
      {isPinned ? '\u{1F4CC}' : '\u{1F4CC}'}
    </button>
  );
}
