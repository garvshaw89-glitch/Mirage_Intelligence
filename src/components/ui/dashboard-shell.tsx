'use client';

import { type ReactNode } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { useMirage } from '@/components/providers/mirage-provider';

export function DashboardShell({ children }: { children: ReactNode }) {
  const { alerts, health, connection } = useMirage();
  const activeAlerts = alerts.filter((a) => a.isActive);
  const isConnected = connection.status === 'connected';

  return (
    <>
      <Navbar
        sensorOnline={health?.sensorStatus === 'ONLINE' || true}
        wsConnected={isConnected}
        alertCount={activeAlerts.length}
      />
      <main className="pt-16 px-4 md:px-6 max-w-[1680px] mx-auto pb-12">
        {children}
      </main>
    </>
  );
}
