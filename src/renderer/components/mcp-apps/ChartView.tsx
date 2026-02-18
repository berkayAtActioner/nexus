import { McpAppData } from '../../../shared/types';

interface Props {
  appData: McpAppData;
  compact?: boolean;
}

const stageColors = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#10b981', '#ef4444'];

export default function ChartView({ appData, compact = false }: Props) {
  const data = appData.data || {};

  // Extract stages/bars data
  const stages: { name: string; value: number; count?: number }[] =
    data.stages || data.pipeline || data.bars || [];

  // Extract summary cards
  const summary = data.summary || {};
  const summaryCards: { label: string; value: string | number }[] = [];
  if (summary.totalPipeline != null) summaryCards.push({ label: 'Total Pipeline', value: typeof summary.totalPipeline === 'number' ? '$' + summary.totalPipeline.toLocaleString() : summary.totalPipeline });
  if (summary.activeDeals != null) summaryCards.push({ label: 'Active Deals', value: summary.activeDeals });
  if (summary.weightedForecast != null) summaryCards.push({ label: 'Weighted Forecast', value: typeof summary.weightedForecast === 'number' ? '$' + summary.weightedForecast.toLocaleString() : summary.weightedForecast });
  if (summary.avgDealSize != null) summaryCards.push({ label: 'Avg Deal Size', value: typeof summary.avgDealSize === 'number' ? '$' + summary.avgDealSize.toLocaleString() : summary.avgDealSize });

  // If no structured summary, try to build from top-level keys
  if (summaryCards.length === 0) {
    for (const [k, v] of Object.entries(data)) {
      if (k === 'stages' || k === 'pipeline' || k === 'bars' || k.startsWith('_')) continue;
      if (typeof v === 'number' || typeof v === 'string') {
        summaryCards.push({ label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()), value: v });
      }
    }
  }

  const maxValue = Math.max(...stages.map(s => s.value), 1);

  return (
    <div style={{ borderRadius: 12, border: '1px solid #e5e5ed', overflow: 'hidden', background: '#f8f8fa' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #e5e5ed', background: '#f0f0f5',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14, color: '#6366f1' }}>&#x25C8;</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{appData.title}</span>
      </div>

      {/* Summary Cards */}
      {summaryCards.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(2, 1fr)' : `repeat(${Math.min(summaryCards.length, 4)}, 1fr)`,
          gap: 1, padding: 16, background: '#f8f8fa',
        }}>
          {summaryCards.map((card, i) => (
            <div key={i} style={{
              padding: '12px 16px', borderRadius: 10,
              background: '#fff', border: '1px solid #e5e5ed',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#5a5a70', marginBottom: 4 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bar Chart */}
      {stages.length > 0 && (
        <div style={{ padding: '12px 16px 16px' }}>
          {stages.map((stage, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
              <div style={{ width: compact ? 80 : 120, fontSize: 12, color: '#5a5a70', textAlign: 'right', flexShrink: 0 }}>
                {stage.name}
              </div>
              <div style={{ flex: 1, height: 24, background: '#ededf3', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 6,
                  background: stageColors[i % stageColors.length],
                  width: `${(stage.value / maxValue) * 100}%`,
                  transition: 'width 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                  minWidth: stage.value > 0 ? 40 : 0,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>
                    ${(stage.value / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
              {stage.count != null && (
                <div style={{ width: 40, fontSize: 11, color: '#9999aa', textAlign: 'right' }}>
                  {stage.count} deals
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e5e5ed' }}>
        <span style={{ fontSize: 10, color: '#9999aa' }}>via {appData.serverId}</span>
      </div>
    </div>
  );
}
