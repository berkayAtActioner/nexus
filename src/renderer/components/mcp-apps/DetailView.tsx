import { McpAppData } from '../../../shared/types';

interface Props {
  appData: McpAppData;
  compact?: boolean;
}

const typeColors: Record<string, { bg: string; color: string; icon: string }> = {
  call: { bg: '#6366f118', color: '#6366f1', icon: '\u{1F4DE}' },
  email: { bg: '#22c55e18', color: '#22c55e', icon: '\u2709' },
  meeting: { bg: '#f59e0b18', color: '#f59e0b', icon: '\u{1F4C5}' },
  note: { bg: '#8b5cf618', color: '#8b5cf6', icon: '\u{1F4DD}' },
};

const stageColors: Record<string, string> = {
  'Negotiation': '#f59e0b',
  'Proposal': '#6366f1',
  'Discovery': '#22c55e',
  'Closed Won': '#10b981',
  'Qualification': '#8b5cf6',
  'Demo': '#ec4899',
};

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export default function DetailView({ appData, compact = false }: Props) {
  const data = appData.data || {};
  const stageColor = data.stageColor || stageColors[data.stage] || '#6366f1';

  // Extract known fields
  const { name, value, stage, probability, nextStep, contacts, timeline, ...rest } = data;

  return (
    <div style={{ borderRadius: 12, border: '1px solid #e5e5ed', overflow: 'hidden', background: '#f8f8fa' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5ed' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 3, height: 40, borderRadius: 2, background: stageColor, marginTop: 4 }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: compact ? 16 : 20, fontWeight: 700, color: '#1a1a2e' }}>
              {name || appData.title}
            </h3>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {value && (
                <span style={{ fontSize: compact ? 18 : 22, fontWeight: 700, color: '#22c55e' }}>
                  {typeof value === 'number' ? '$' + value.toLocaleString() : value}
                </span>
              )}
              {stage && (
                <span style={{
                  fontSize: 13, padding: '4px 12px', borderRadius: 8,
                  background: stageColor + '18', color: stageColor, fontWeight: 600,
                }}>{stage}</span>
              )}
              {probability && (
                <span style={{ fontSize: 13, color: '#9999aa' }}>{probability} probability</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Next Step */}
      {nextStep && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e5ed' }}>
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: '#fff', border: '1px solid #e5e5ed',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: 1, color: '#f59e0b', marginBottom: 6,
            }}>Next Step</div>
            <div style={{ fontSize: 13, color: '#1a1a2e', lineHeight: 1.5 }}>{nextStep}</div>
          </div>
        </div>
      )}

      <div style={{
        display: compact ? 'block' : 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0,
      }}>
        {/* Contacts */}
        {contacts && Array.isArray(contacts) && contacts.length > 0 && (
          <div style={{ padding: '14px 20px', borderRight: compact ? 'none' : '1px solid #e5e5ed', borderBottom: '1px solid #e5e5ed' }}>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: 1, color: '#5a5a70', marginBottom: 10,
            }}>Contacts</div>
            {contacts.map((c: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderBottom: i < contacts.length - 1 ? '1px solid #ededf3' : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: '#e5e5ed', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#5a5a70',
                }}>
                  {getInitials(c.name || '')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1a1a2e' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#5a5a70' }}>{c.role}</div>
                </div>
                {c.lastContacted && (
                  <div style={{ fontSize: 10.5, color: '#5a5a70' }}>{c.lastContacted}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        {timeline && Array.isArray(timeline) && timeline.length > 0 && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e5ed' }}>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: 1, color: '#5a5a70', marginBottom: 10,
            }}>Activity Timeline</div>
            {timeline.map((t: any, i: number) => {
              const tc = typeColors[t.type] || typeColors.note;
              return (
                <div key={i} style={{
                  display: 'flex', gap: 10, padding: '8px 0',
                  borderBottom: i < timeline.length - 1 ? '1px solid #ededf3' : 'none',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: tc.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, color: tc.color,
                  }}>
                    {tc.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#1a1a2e' }}>{t.subject || t.event}</div>
                    <div style={{ fontSize: 10.5, color: '#5a5a70', marginTop: 2 }}>{t.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Auto-render remaining object/array fields */}
      {Object.entries(rest).filter(([k, v]) => !k.startsWith('_') && k !== 'id' && k !== 'stageColor').map(([key, val]) => {
        if (Array.isArray(val)) {
          return (
            <div key={key} style={{ padding: '14px 20px', borderBottom: '1px solid #e5e5ed' }}>
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: 1, color: '#5a5a70', marginBottom: 10,
              }}>{key}</div>
              {(val as any[]).map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: '#1a1a2e', padding: '4px 0' }}>
                  {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                </div>
              ))}
            </div>
          );
        }
        if (typeof val === 'object' && val !== null) {
          return (
            <div key={key} style={{ padding: '14px 20px', borderBottom: '1px solid #e5e5ed' }}>
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: 1, color: '#5a5a70', marginBottom: 10,
              }}>{key}</div>
              {Object.entries(val as Record<string, any>).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontSize: 12, color: '#5a5a70' }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{String(v)}</span>
                </div>
              ))}
            </div>
          );
        }
        return null;
      })}

      {/* Footer */}
      <div style={{ padding: '8px 20px', display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: '#9999aa' }}>via {appData.serverId}</span>
      </div>
    </div>
  );
}
