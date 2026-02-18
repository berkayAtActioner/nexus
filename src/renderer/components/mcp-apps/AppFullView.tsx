import { useUIStore } from '../../stores/ui-store';
import McpAppRenderer from './McpAppRenderer';
import { useMcpStore } from '../../stores/mcp-store';
import { McpAppData } from '../../../shared/types';
import { useState } from 'react';

interface Props {
  appId: string;
}

export default function AppFullView({ appId }: Props) {
  const pinnedApps = useUIStore(s => s.pinnedApps);
  const unpinApp = useUIStore(s => s.unpinApp);
  const setActiveView = useUIStore(s => s.setActiveView);
  const [drilldownApp, setDrilldownApp] = useState<McpAppData | null>(null);

  const app = pinnedApps.find(p => p.id === appId);
  if (!app) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9999aa' }}>
        App not found
      </div>
    );
  }

  const handleDrilldown = async (serverId: string, toolName: string, args: Record<string, unknown>) => {
    try {
      const result = await useMcpStore.getState().callTool(serverId, toolName, args);
      const resultText = result?.content
        ?.map((c: any) => c.text || JSON.stringify(c))
        .join('\n') || JSON.stringify(result);

      try {
        const parsed = JSON.parse(resultText);
        if (parsed && parsed._app) {
          const { _app, ...rest } = parsed;
          setDrilldownApp({
            type: _app.type || 'DetailView',
            pinnable: !!_app.pinnable,
            title: _app.title || toolName,
            data: rest,
            serverId,
            toolName,
          });
          return;
        }
      } catch { /* not JSON */ }

      // No app data — just show raw result
      setDrilldownApp({
        type: 'DetailView',
        pinnable: false,
        title: toolName,
        data: { result: resultText },
        serverId,
        toolName,
      });
    } catch (error: any) {
      console.error('Drilldown error:', error);
    }
  };

  const currentApp = drilldownApp || app.appData;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid #e5e5ed',
        display: 'flex', alignItems: 'center', gap: 12, background: '#fff',
      }}>
        <span style={{ fontSize: 20 }}>{app.icon}</span>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e', flex: 1 }}>
          {currentApp.title}
        </h2>
        {drilldownApp && (
          <button
            onClick={() => setDrilldownApp(null)}
            style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #e5e5ed',
              background: '#fff', color: '#5a5a70', cursor: 'pointer', fontSize: 12,
            }}
          >
            &larr; Back to {app.appData.title}
          </button>
        )}
        <button
          onClick={() => unpinApp(app.id)}
          title="Unpin app"
          style={{
            padding: '4px 12px', borderRadius: 6, border: '1px solid #e5e5ed',
            background: '#fff', color: '#5a5a70', cursor: 'pointer', fontSize: 12,
          }}
        >
          Unpin
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <McpAppRenderer
          appData={currentApp}
          compact={false}
          onDrilldown={handleDrilldown}
          showPin={false}
        />
      </div>
    </div>
  );
}
