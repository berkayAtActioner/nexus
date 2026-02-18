import { useState } from 'react';
import { useUIStore } from '../../stores/ui-store';
import AgentList from '../agents/AgentList';
import SessionList from '../agents/SessionList';
import ChannelListSection from '../channels/ChannelListSection';
import PeopleListSection from '../people/PeopleListSection';

function SectionHeader({ label, collapsed, onToggle }: { label: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, width: '100%',
        padding: '8px 16px 6px', background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2,
        color: '#9999aa', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 8, transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
        ▼
      </span>
      {label}
    </button>
  );
}

export default function Sidebar() {
  const sidebarSection = useUIStore(s => s.sidebarSection);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggle = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div style={{
      width: 232, background: '#f8f8fa', borderRight: '1px solid #e5e5ed',
      display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: 0, overflow: 'hidden',
    }}>
      {/* Channels Section */}
      <SectionHeader label="Channels" collapsed={!!collapsedSections.channels} onToggle={() => toggle('channels')} />
      {!collapsedSections.channels && (
        <div style={{ padding: '0 8px', maxHeight: sidebarSection === 'channels' ? 'none' : 120, overflow: 'hidden' }}>
          <ChannelListSection />
        </div>
      )}

      <div style={{ height: 1, background: '#e5e5ed', margin: '4px 12px' }} />

      {/* People Section */}
      <SectionHeader label="People" collapsed={!!collapsedSections.people} onToggle={() => toggle('people')} />
      {!collapsedSections.people && (
        <div style={{ padding: '0 8px', maxHeight: sidebarSection === 'people' ? 'none' : 120, overflow: 'hidden' }}>
          <PeopleListSection />
        </div>
      )}

      <div style={{ height: 1, background: '#e5e5ed', margin: '4px 12px' }} />

      {/* AI Agents Section */}
      <SectionHeader label="AI Agents" collapsed={!!collapsedSections.agents} onToggle={() => toggle('agents')} />
      {!collapsedSections.agents && (
        <>
          <div style={{ padding: '0 8px' }}>
            <AgentList />
          </div>
          {sidebarSection === 'agents' && (
            <>
              <div style={{ height: 1, background: '#e5e5ed', margin: '4px 12px' }} />
              <div style={{
                padding: '4px 16px 8px', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 1.2, color: '#9999aa',
              }}>
                Sessions
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
                <SessionList />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
