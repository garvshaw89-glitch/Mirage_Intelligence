import type { Metadata } from 'next';
import { MirageProvider } from '@/components/providers/mirage-provider';
import { DashboardShell } from '@/components/ui/dashboard-shell';

export const metadata: Metadata = {
  title: {
    template: '%s | MIRAGE',
    default: 'Overview | MIRAGE',
  },
};

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: '#080c12' }}>
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
