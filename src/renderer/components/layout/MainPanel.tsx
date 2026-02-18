import { useUIStore } from '../../stores/ui-store';
import ChatView from '../chat/ChatView';
import AppFullView from '../mcp-apps/AppFullView';
import ChannelView from '../channels/ChannelView';
import DmView from '../people/DmView';
import SidePanel from '../copilot/SidePanel';

export default function MainPanel() {
  const activeView = useUIStore(s => s.activeView);
  const copilotOpen = useUIStore(s => s.copilotOpen);

  return (
    <div style={{ flex: 1, display: 'flex', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        {activeView.type === 'agent-dm' && <ChatView />}
        {activeView.type === 'pinned-app' && <AppFullView appId={activeView.appId} />}
        {activeView.type === 'channel' && <ChannelView channelId={activeView.channelId} />}
        {activeView.type === 'human-dm' && <DmView userId={activeView.userId} />}
      </div>
      {copilotOpen && <SidePanel />}
    </div>
  );
}
