'use client';

import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  sublabel?: string;
  highlight?: 'high' | 'critical' | 'low';
  trend?: number;
  className?: string;
}

const HIGHLIGHT_STYLES: Record<string, { border: string; glow: string }> = {
  low:      { border: 'rgba(96,165,250,0.25)',  glow: 'rgba(96,165,250,0.08)' },
  high:     { border: 'rgba(249,115,22,0.3)',   glow: 'rgba(249,115,22,0.08)' },
  critical: { border: 'rgba(239,68,68,0.35)',   glow: 'rgba(239,68,68,0.1)'  },
};

export function MetricCard({
  label,
  value,
  icon,
  sublabel,
  highlight,
  trend,
  className,
}: MetricCardProps) {
  const hl = highlight ? HIGHLIGHT_STYLES[highlight] : null;

  return (
    <div
      className={cn('glass metric-card p-4', className)}
      style={hl ? {
        borderColor: hl.border,
        background: `linear-gradient(135deg, rgba(13,21,32,0.7), ${hl.glow})`,
      } : undefined}
      role="status"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-label">{label}</span>
        {icon && (
          <span
            style={{ color: hl ? (highlight === 'critical' ? '#ef4444' : highlight === 'high' ? '#f97316' : '#60a5fa') : '#3b9eff' }}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      <div
        className="text-mono font-bold"
        style={{
          fontSize: '1.5rem',
          color: hl ? (highlight === 'critical' ? '#ef4444' : highlight === 'high' ? '#f97316' : '#60a5fa') : '#e8edf4',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div className="text-xs mt-1" style={{ color: 'rgba(232,237,244,0.35)' }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}
