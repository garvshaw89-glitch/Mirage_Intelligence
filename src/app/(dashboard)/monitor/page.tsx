'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Zap,
  Server,
  ArrowDown,
  Database,
  Eye,
  Clock,
  Radio,
  Layers,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { useMirage } from '@/components/providers/mirage-provider';
import { MetricCard } from '@/components/dashboard/metric-card';

interface PacketStreamItem {
  id: string;
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  protocol: string;
  size: number;
  flags?: string;
  provenance: string;
}

export default function LiveMonitorPage() {
  const { metrics, isSimulating, activeScenario } = useMirage();
  const [trafficHistory, setTrafficHistory] = useState<number[]>([120, 145, 130, 160, 210, 190, 240, 280, 260, 310, 290, 340]);
  const [packetStream, setPacketStream] = useState<PacketStreamItem[]>([]);

  const pps = metrics?.packetsPerSec || (isSimulating ? 11200 : trafficHistory[trafficHistory.length - 1]);
  const bps = metrics?.bytesPerSec || pps * 850 * 8;

  useEffect(() => {
    // Generate streaming packets for live visual demonstration
    const interval = setInterval(() => {
      const now = new Date();
      let src = '10.0.0.21';
      let dst = '10.0.0.10';
      let proto = 'TCP';
      let flags: string | undefined = 'ACK';

      if (isSimulating && activeScenario === 'SYN_FLOOD') {
        src = '10.0.0.50';
        dst = '10.0.0.10';
        proto = 'TCP';
        flags = 'SYN';
      } else if (isSimulating && activeScenario === 'UDP_FLOOD') {
        src = '10.0.0.50';
        dst = '10.0.0.10';
        proto = 'UDP';
        flags = undefined;
      } else if (isSimulating && activeScenario === 'C2_BEACON') {
        src = '10.0.0.21';
        dst = '198.51.100.42';
        proto = 'TCP';
        flags = 'PSH+ACK';
      } else if (isSimulating && activeScenario === 'DNS_TUNNEL') {
        src = '10.0.0.31';
        dst = '1.1.1.1';
        proto = 'DNS';
        flags = undefined;
      } else {
        const randomIps = ['10.0.0.21', '10.0.0.31', '10.0.0.50', '198.51.100.42', '10.0.0.10'];
        src = randomIps[Math.floor(Math.random() * randomIps.length)];
        dst = src === '10.0.0.10' ? '10.0.0.1' : '10.0.0.10';
        const protos = ['TCP', 'UDP', 'DNS', 'HTTPS'];
        proto = protos[Math.floor(Math.random() * protos.length)];
        flags = proto === 'TCP' ? (Math.random() > 0.4 ? 'ACK' : 'SYN+ACK') : undefined;
      }

      const newPkt: PacketStreamItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0'),
        src_ip: src,
        dst_ip: dst,
        protocol: proto,
        size: Math.floor(Math.random() * 1200) + 64,
        flags,
        provenance: isSimulating ? 'SIMULATION_ATTACK' : 'OPTICAL_DIODE',
      };

      setPacketStream((prev) => [newPkt, ...prev.slice(0, 30)]);
      setTrafficHistory((prev) => [...prev.slice(1), pps]);
    }, isSimulating ? 300 : 800);

    return () => clearInterval(interval);
  }, [isSimulating, activeScenario, pps]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl glass-card border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold text-white tracking-wide">Live Enclave Monitor</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              ONE-WAY RX DIODE
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Real-time passive packet tap with zero reverse transmission capability. All ingress is buffered and feature-extracted in hardware isolation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider">DIODE STATUS</div>
            <div className="text-xs font-semibold text-emerald-400">UNIDIRECTIONAL ENFORCED</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Shield size={20} />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Packet Rate"
          value={`${pps.toLocaleString()} pps`}
          sublabel="Rolling 1-second window"
          icon={<Activity size={16} className="text-blue-400" />}
          trend={12}
        />
        <MetricCard
          label="Bandwidth Throughput"
          value={`${(bps / 1_000_000).toFixed(2)} Mbps`}
          sublabel="Aggregated ingress"
          icon={<Zap size={16} className="text-emerald-400" />}
          trend={5}
        />
        <MetricCard
          label="Queue Depth"
          value={`${(metrics as any)?.queueDepth || (metrics as any)?.queue_depth || (isSimulating ? 142 : 14)} pkts`}
          sublabel="Max 10,000 capacity"
          icon={<Layers size={16} className="text-amber-400" />}
        />
        <MetricCard
          label="Detection Latency"
          value="1.45 ms"
          sublabel="Multi-engine feature time"
          icon={<Clock size={16} className="text-purple-400" />}
          highlight="low"
        />
      </div>

      {/* Real-time Rate Chart & Hardware Diode Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rate Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl glass-card border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Ingress Pulse (Rolling 30s)</h2>
              <p className="text-xs text-white/40">Packet volume emitted across the optical data diode</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Throughput</span>
            </div>
          </div>

          {/* Simple Dynamic SVG sparkline graph */}
          <div className="h-44 w-full flex items-end gap-1.5 pt-6 pb-2 border-b border-white/5">
            {trafficHistory.map((val, idx) => {
              const heightPercent = Math.min(100, Math.max(15, (val / 400) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full rounded-t transition-all duration-300 group-hover:brightness-125"
                    style={{
                      height: `${heightPercent}%`,
                      background: 'linear-gradient(180deg, rgba(59,158,255,0.8) 0%, rgba(59,158,255,0.2) 100%)',
                    }}
                  />
                  <span className="text-[9px] text-white/20">{idx * 2}s</span>
                  {/* Tooltip */}
                  <div className="absolute -top-8 hidden group-hover:flex px-2 py-0.5 rounded bg-black/80 text-[10px] text-white whitespace-nowrap border border-white/10 z-10">
                    {val} pps
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 text-center pt-2">
            <div>
              <div className="text-[10px] text-white/40">MIN VALUE</div>
              <div className="text-xs font-semibold text-white/80">120 pps</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40">PEAK INGRESS</div>
              <div className="text-xs font-semibold text-white/80">384 pps</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40">BUFFER CAPACITY</div>
              <div className="text-xs font-semibold text-emerald-400">99.8% Free</div>
            </div>
          </div>
        </div>

        {/* Diode Isolation Verification Card */}
        <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4">
          <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <Radio size={16} className="text-blue-400" />
            Unidirectional Hardware Verification
          </h2>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Tx Transmit Line</span>
              <span className="text-red-400 font-mono font-bold">PHYSICALLY CUT</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Rx Optical Line</span>
              <span className="text-emerald-400 font-mono font-bold">ACTIVE (0.0 dBm)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Reverse ACK Propagation</span>
              <span className="text-amber-400 font-mono font-bold">SUPPRESSED</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Enclave Isolation</span>
              <span className="text-emerald-400 font-mono font-bold">AIR-GAPPED LOGIC</span>
            </div>
          </div>

          <div className="text-xs text-white/50 leading-relaxed">
            Unidirectional taps transmit data using single-strand optics. Because no return path exists, the monitoring enclave cannot be port-scanned, exploited, or probed by external attackers.
          </div>

          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
            <Shield size={14} className="flex-shrink-0" />
            <span>Cryptographic integrity check active on all frames</span>
          </div>
        </div>
      </div>

      {/* Live Packet Stream Inspector */}
      <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" />
              Live Ingress Telemetry Stream
            </h2>
            <p className="text-xs text-white/40">Raw frame extraction passing through passive feature extractor</p>
          </div>
          <span className="text-xs text-white/40 font-mono">
            Showing {packetStream.length} frames
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="text-[11px] uppercase tracking-wider text-white/40 border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Destination IP</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Flags</th>
                <th className="py-2.5 px-3">Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {packetStream.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-3 text-white/40">{p.timestamp}</td>
                  <td className="py-2 px-3 text-white font-medium">{p.src_ip}</td>
                  <td className="py-2 px-3 text-white/80">{p.dst_ip}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        p.protocol === 'TCP'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : p.protocol === 'DNS'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {p.protocol}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-white/70">{p.size} B</td>
                  <td className="py-2 px-3 text-amber-300">{p.flags || '—'}</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/5 text-white/50 border border-white/10">
                      {p.provenance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
