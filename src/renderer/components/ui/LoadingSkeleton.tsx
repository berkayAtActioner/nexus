import { useEffect, useState } from 'react';

interface LoadingSkeletonProps {
  lines?: number;
  style?: React.CSSProperties;
}

export default function LoadingSkeleton({ lines = 3, style }: LoadingSkeletonProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 800);
    return () => clearInterval(interval);
  }, []);

  const widths = ['85%', '70%', '55%', '90%', '60%'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 14,
            borderRadius: 6,
            background: '#ededf3',
            width: widths[i % widths.length],
            opacity: pulse ? 0.5 : 1,
            transition: 'opacity 0.4s ease-in-out',
          }}
        />
      ))}
    </div>
  );
}

export function MessageSkeleton() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
      {/* User message skeleton */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          width: '45%', height: 40, borderRadius: '16px 16px 4px 16px',
          background: '#ededf7', opacity: pulse ? 0.5 : 1, transition: 'opacity 0.4s ease-in-out',
        }} />
      </div>
      {/* Assistant message skeleton */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{
          width: '65%', height: 60, borderRadius: '16px 16px 16px 4px',
          background: '#f4f4f8', opacity: pulse ? 0.5 : 1, transition: 'opacity 0.4s ease-in-out',
        }} />
      </div>
    </div>
  );
}

export function AgentSkeleton() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        }}>
          <div style={{
            width: i === 1 ? 30 : 28, height: i === 1 ? 30 : 28, borderRadius: 8,
            background: '#ededf3', opacity: pulse ? 0.5 : 1, transition: 'opacity 0.4s ease-in-out',
          }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{
              height: 12, width: '60%', borderRadius: 4, background: '#ededf3',
              opacity: pulse ? 0.5 : 1, transition: 'opacity 0.4s ease-in-out',
            }} />
            <div style={{
              height: 10, width: '40%', borderRadius: 4, background: '#ededf3',
              opacity: pulse ? 0.5 : 1, transition: 'opacity 0.4s ease-in-out',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
