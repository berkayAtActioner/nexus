import { useState } from 'react';
import { McpAppData } from '../../../shared/types';

interface Props {
  appData: McpAppData;
  compact?: boolean;
  onDrilldown?: (serverId: string, toolName: string, args: Record<string, unknown>) => void;
}

function formatValue(val: any): string {
  if (typeof val === 'number') {
    if (val >= 1000) return '$' + val.toLocaleString();
    return String(val);
  }
  if (typeof val === 'string' && /^\d+$/.test(val) && parseInt(val) >= 1000) {
    return '$' + parseInt(val).toLocaleString();
  }
  return String(val ?? '');
}

const stageColors: Record<string, string> = {
  'Negotiation': '#f59e0b',
  'Proposal': '#6366f1',
  'Discovery': '#22c55e',
  'Closed Won': '#10b981',
  'Qualification': '#8b5cf6',
  'Demo': '#ec4899',
};

export default function DataTable({ appData, compact = false, onDrilldown }: Props) {
  const rows: any[] = Array.isArray(appData.data?.deals || appData.data?.items || appData.data)
    ? (appData.data?.deals || appData.data?.items || appData.data)
    : [];

  const [sortBy, setSortBy] = useState<string>('value');
  const [hoverRow, setHoverRow] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div style={{ padding: 16, color: '#9999aa', fontSize: 13, textAlign: 'center' }}>
        No data available.
      </div>
    );
  }

  // Auto-detect columns from first row
  const allKeys = Object.keys(rows[0]).filter(k => !k.startsWith('_') && k !== 'id' && k !== 'stageColor');
  const displayKeys = compact ? allKeys.slice(0, 4) : allKeys.slice(0, 6);

  // Sort rows
  const sorted = [...rows].sort((a, b) => {
    const va = typeof a[sortBy] === 'number' ? a[sortBy] : parseInt(String(a[sortBy]).replace(/[$,%]/g, '')) || 0;
    const vb = typeof b[sortBy] === 'number' ? b[sortBy] : parseInt(String(b[sortBy]).replace(/[$,%]/g, '')) || 0;
    return vb - va;
  });

  // Sortable keys (numeric-looking values)
  const sortableKeys = allKeys.filter(k => {
    const v = rows[0][k];
    return typeof v === 'number' || (typeof v === 'string' && /^[\d$,%]+$/.test(v.replace(/,/g, '')));
  });

  // Calculate total pipeline
  const valueKey = allKeys.find(k => k === 'value' || k === 'amount');
  let total = 0;
  if (valueKey) {
    total = rows.reduce((sum, r) => {
      const v = typeof r[valueKey] === 'number' ? r[valueKey] : parseInt(String(r[valueKey]).replace(/[$,]/g, '')) || 0;
      return sum + v;
    }, 0);
  }

  return (
    <div style={{ borderRadius: 12, border: '1px solid #e5e5ed', overflow: 'hidden', background: '#f8f8fa' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '10px 16px',
        borderBottom: '1px solid #e5e5ed', background: '#f0f0f5',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 14, color: '#22c55e' }}>&#x2B22;</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{appData.title}</span>
          <span style={{
            fontSize: 11, color: '#5a5a70', background: '#e5e5ed',
            padding: '1px 8px', borderRadius: 8,
          }}>{rows.length}</span>
        </div>
        {sortableKeys.length > 0 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {sortableKeys.slice(0, 3).map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{
                padding: '3px 10px', borderRadius: 6, border: 'none',
                background: sortBy === s ? '#6366f118' : 'transparent',
                color: sortBy === s ? '#6366f1' : '#5a5a70',
                cursor: 'pointer', fontSize: 11, fontWeight: 500, textTransform: 'capitalize',
              }}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Column Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: displayKeys.map(() => '1fr').join(' '),
        padding: '8px 16px', borderBottom: '1px solid #e5e5ed',
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#5a5a70',
      }}>
        {displayKeys.map(k => <span key={k}>{k}</span>)}
      </div>

      {/* Rows */}
      {sorted.map((row, idx) => {
        const rowId = row.id || String(idx);
        const stageColor = row.stageColor || stageColors[row.stage] || '#6366f1';
        return (
          <div
            key={rowId}
            onClick={() => onDrilldown?.(appData.serverId, 'actioner_get_deal', { dealId: row.id || rowId })}
            onMouseEnter={() => setHoverRow(rowId)}
            onMouseLeave={() => setHoverRow(null)}
            style={{
              display: 'grid',
              gridTemplateColumns: displayKeys.map(() => '1fr').join(' '),
              padding: '12px 16px', borderBottom: '1px solid #ededf3',
              cursor: onDrilldown ? 'pointer' : 'default',
              background: hoverRow === rowId ? '#f0f0f5' : 'transparent',
              transition: 'background 0.1s',
            }}
          >
            {displayKeys.map((k, ci) => {
              const val = row[k];
              // First column: name with stage color indicator
              if (ci === 0) {
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 24, borderRadius: 2, background: stageColor }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{String(val)}</div>
                    </div>
                  </div>
                );
              }
              // Stage column: badge
              if (k === 'stage') {
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 6,
                      background: stageColor + '18', color: stageColor, fontWeight: 600,
                    }}>{String(val)}</span>
                  </div>
                );
              }
              // Value/amount columns: formatted
              if (k === 'value' || k === 'amount') {
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
                    {formatValue(val)}
                  </div>
                );
              }
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#5a5a70' }}>
                  {String(val ?? '')}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Footer */}
      <div style={{
        padding: '8px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', background: '#f0f0f5',
      }}>
        {total > 0 && (
          <span style={{ fontSize: 11, color: '#5a5a70' }}>
            Pipeline: <span style={{ color: '#22c55e', fontWeight: 600 }}>${total.toLocaleString()}</span>
          </span>
        )}
        <span style={{ fontSize: 10, color: '#9999aa' }}>via {appData.serverId}</span>
      </div>
    </div>
  );
}
