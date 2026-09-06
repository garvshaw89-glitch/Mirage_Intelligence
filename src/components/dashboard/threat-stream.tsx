'use client';

import { useEffect, useRef } from 'react';
import { Activity, CircleAlert } from 'lucide-react';
import type { ThreatEventDisplay } from '@/types';
import { cn } from '@/lib/utils';

const SEVERITY_CONFIG = {
  INFO:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  label: 'INFO'     },
  LOW:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  label: 'LOW'      },
  MEDIUM:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  label: 'MED'      },
  HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)',  label: 'HIGH'     },
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    label: 'CRIT'     },
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  } catch {
    return '--:--:--';
  }
}

interface ThreatStreamProps {
  events: ThreatEventDisplay[];
}

export function ThreatStream({ events }: ThreatStreamProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Auto-scroll to top (newest) when new events arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [events.length]);

  return (
    <div
      className="glass flex flex-col"
      style={{ height: '420px' }}
      role="log"
      aria-label="Live threat event stream"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <Activity size={13} style={{ color: '#3b9eff' }} />
          <span className="text-heading-4 text-xs">Live Threat Stream</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(232,237,244,0.4)' }}>
          <span className="status-dot status-dot-pulse" style={{ background: '#4ade80' }} aria-hidden="true" />
          <span style={{ fontSize: '10px' }}>{events.length} events</span>
        </div>
      </div>

      {/* Events list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto"
        style={{ padding: '8px 0' }}
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Activity size={24} style={{ color: 'rgba(232,237,244,0.2)' }} />
            <div className="text-xs" style={{ color: 'rgba(232,237,244,0.35)', textAlign: 'center' }}>
              <div style={{ marginBottom: '4px' }}>Monitoring active</div>
              <div style={{ fontSize: '11px', color: 'rgba(232,237,244,0.25)' }}>
                Events will appear here as traffic is observed
              </div>
            </div>
          </div>
        ) : (
          events.map((event, index) => {
            const cfg = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.INFO;
            const isCampaign = event.threatType === 'MULTI_HOST_CAMPAIGN';

            return (
              <div
                key={event.id}
                className={cn(
                  'flex items-start gap-2.5 px-4 py-2 threat-event-new transition-all',
                  isCampaign && 'campaign-detected',
                )}
                style={{
                  background: index === 0 ? cfg.bg : 'transparent',
                  borderLeft: index === 0 ? `2px solid ${cfg.color}` : '2px solid transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  animationDelay: `${index * 0}ms`,
                }}
                aria-label={`${cfg.label}: ${event.message}`}
              >
                {/* Time */}
                <span
                  className="text-mono flex-shrink-0 mt-0.5"
                  style={{ fontSize: '10px', color: 'rgba(232,237,244,0.3)', width: '60px' }}
                >
                  {formatTime(event.timestamp)}
                </span>

                {/* Severity badge */}
                <span
                  className="flex-shrink-0 mt-0.5 text-xs font-bold"
                  style={{
                    color: cfg.color,
                    background: cfg.bg,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontSize: '9px',
                    letterSpacing: '0.08em',
                    minWidth: '36px',
                    textAlign: 'center',
                  }}
                >
                  {cfg.label}
                </span>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs"
                    style={{
                      color: isCampaign ? '#ef4444' : index === 0 ? '#e8edf4' : 'rgba(232,237,244,0.65)',
                      fontWeight: isCampaign ? 700 : index < 3 ? 500 : 400,
                    }}
                  >
                    {event.message}
                  </div>
                  {(event.srcIp || event.dstIp) && (
                    <div className="text-mono text-xs mt-0.5" style={{ color: 'rgba(232,237,244,0.3)', fontSize: '10px' }}>
                      {event.srcIp && <span>{event.srcIp}</span>}
                      {event.srcIp && event.dstIp && <span style={{ margin: '0 4px' }}>→</span>}
                      {event.dstIp && <span>{event.dstIp}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
