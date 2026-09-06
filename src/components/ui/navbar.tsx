'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Shield,
  Activity,
  AlertTriangle,
  Server,
  GitBranch,
  Zap,
  Terminal,
  Eye,
  Database,
  Cpu,
  Radar,
  Settings,
  CircleAlert,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',   label: 'Overview',    icon: Radar },
  { href: '/monitor',     label: 'Live Monitor', icon: Activity },
  { href: '/threats',     label: 'Threats',     icon: AlertTriangle },
  { href: '/hosts',       label: 'Hosts',       icon: Server },
  { href: '/campaigns',   label: 'Campaigns',   icon: GitBranch },
  { href: '/traffic',     label: 'Traffic',     icon: Zap },
  { href: '/models',      label: 'Models',      icon: Cpu },
  { href: '/simulation',  label: 'Simulation',  icon: Terminal },
  { href: '/forensics',   label: 'Forensics',   icon: Database },
];

interface NavbarProps {
  sensorOnline?: boolean;
  wsConnected?: boolean;
  alertCount?: number;
}

export function Navbar({
  sensorOnline = true,
  wsConnected = false,
  alertCount = 0,
}: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav
      className="glass-nav fixed top-0 left-0 right-0 z-50 h-14"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center h-full px-4 gap-0">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 mr-8 flex-shrink-0 group"
          aria-label="MIRAGE — go to home"
        >
          <div className="relative">
            <Shield
              size={20}
              className="text-accent transition-all duration-300 group-hover:scale-110"
              style={{ color: '#3b9eff' }}
            />
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'radial-gradient(circle, rgba(59,158,255,0.3) 0%, transparent 70%)' }}
            />
          </div>
          <span
            className="font-bold tracking-[0.15em] text-sm text-gradient"
            style={{ letterSpacing: '0.18em' }}
          >
            MIRAGE
          </span>
        </Link>

        {/* Nav items */}
        <div
          className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar"
          role="menubar"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                role="menuitem"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap',
                  isActive
                    ? 'text-white bg-white/8 border border-white/10'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/4',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={13} className="flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side status */}
        <div className="flex items-center gap-3 ml-6 flex-shrink-0">
          {/* Alert count */}
          {alertCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
              aria-label={`${alertCount} active alerts`}
            >
              <CircleAlert size={11} />
              {alertCount > 99 ? '99+' : alertCount}
            </div>
          )}

          {/* Sensor status */}
          <div
            className="flex items-center gap-1.5 text-xs"
            aria-label={`Sensor ${sensorOnline ? 'online' : 'offline'}`}
          >
            <span
              className="status-dot status-dot-pulse"
              style={{ background: sensorOnline ? '#4ade80' : '#ef4444' }}
              aria-hidden="true"
            />
            <span className="text-white/40 font-medium tracking-wide" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>
              SENSOR
            </span>
          </div>

          {/* WS connection */}
          <div
            className="flex items-center"
            aria-label={`WebSocket ${wsConnected ? 'connected' : 'disconnected'}`}
          >
            {wsConnected ? (
              <Wifi size={13} style={{ color: '#4ade80' }} />
            ) : (
              <WifiOff size={13} style={{ color: '#ef4444' }} />
            )}
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            aria-label="Settings"
            className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          >
            <Settings size={14} />
          </Link>

          {/* Eye icon — passive monitoring indicator */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
            style={{
              background: 'rgba(59,158,255,0.08)',
              border: '1px solid rgba(59,158,255,0.15)',
              color: 'rgba(59,158,255,0.7)',
            }}
            title="Passive monitoring active — one-way only"
          >
            <Eye size={11} />
            <span style={{ fontSize: '9px', letterSpacing: '0.1em', fontWeight: 600 }}>
              ONE-WAY
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
