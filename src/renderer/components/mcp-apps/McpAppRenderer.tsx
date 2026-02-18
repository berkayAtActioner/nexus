import { McpAppData } from '../../../shared/types';
import DataTable from './DataTable';
import DetailView from './DetailView';
import ChartView from './ChartView';
import AppPinButton from './AppPinButton';

interface Props {
  appData: McpAppData;
  compact?: boolean;
  onDrilldown?: (serverId: string, toolName: string, args: Record<string, unknown>) => void;
  showPin?: boolean;
}

export default function McpAppRenderer({ appData, compact = false, onDrilldown, showPin = true }: Props) {
  let content: React.ReactNode;

  switch (appData.type) {
    case 'DataTable':
      content = <DataTable appData={appData} compact={compact} onDrilldown={onDrilldown} />;
      break;
    case 'DetailView':
      content = <DetailView appData={appData} compact={compact} />;
      break;
    case 'ChartView':
      content = <ChartView appData={appData} compact={compact} />;
      break;
    default:
      content = (
        <div style={{
          borderRadius: 12, border: '1px solid #e5e5ed', padding: 16,
          background: '#f8f8fa', fontFamily: 'monospace', fontSize: 12,
          color: '#5a5a70', whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: 300,
        }}>
          {JSON.stringify(appData.data, null, 2)}
        </div>
      );
  }

  return (
    <div style={{ position: 'relative', marginTop: 8 }}>
      {content}
      {showPin && appData.pinnable && (
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <AppPinButton appData={appData} />
        </div>
      )}
    </div>
  );
}
