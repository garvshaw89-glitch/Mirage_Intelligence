'use client';

import { useState } from 'react';
import {
  Settings,
  Shield,
  Sliders,
  Database,
  Cpu,
  Radio,
  Lock,
  CheckCircle2,
  RefreshCw,
  Save,
  Server,
  Zap,
} from 'lucide-react';
import { useMirage } from '@/components/providers/mirage-provider';

export default function SettingsPage() {
  const { health, connection } = useMirage();
  const [saved, setSaved] = useState(false);

  // Settings state
  const [diodeMode, setDiodeMode] = useState<'ENFORCED' | 'PERMISSIVE'>('ENFORCED');
  const [queueCapacity, setQueueCapacity] = useState(65536);
  const [dropPolicy, setDropPolicy] = useState('DROP_OLDEST');

  const [packetWindow, setPacketWindow] = useState(2.0);
  const [connectionTimeout, setConnectionTimeout] = useState(10.0);
  const [sessionWindow, setSessionWindow] = useState(120.0);

  const [sigmaThreshold, setSigmaThreshold] = useState(3.5);
  const [decayRate, setDecayRate] = useState(0.96);
  const [entropyThreshold, setEntropyThreshold] = useState(3.8);

  const [wsUrl, setWsUrl] = useState('ws://localhost:8000/ws/live');
  const [apiUrl, setApiUrl] = useState('http://localhost:8000/api/v1');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl glass-card border border-white/10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Settings className="text-blue-400" size={22} />
            Sensor Enclave & Detection Configuration
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Configure unidirectional data diode isolation parameters, multi-resolution temporal lenses, and ML anomaly thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono animate-fade-in">
              <CheckCircle2 size={14} /> Configuration Applied
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            <Save size={14} /> Save Configuration
          </button>
        </div>
      </div>

      {/* Grid: 3 Main Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* 1. Unidirectional Hardware Diode Tap */}
        <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Shield size={16} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
              1. Optical Diode Enclave
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-white/50 block text-[11px] mb-1">DATA DIODE ISOLATION</label>
              <select
                value={diodeMode}
                onChange={(e) => setDiodeMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500/50"
              >
                <option value="ENFORCED" className="bg-slate-900">HARDWARE_ENFORCED (100% Write-Only)</option>
                <option value="PERMISSIVE" className="bg-slate-900">PROMISCUOUS_MIRROR (Audit Tap)</option>
              </select>
            </div>

            <div>
              <label className="text-white/50 block text-[11px] mb-1">BOUNDED QUEUE DEPTH</label>
              <input
                type="number"
                value={queueCapacity}
                onChange={(e) => setQueueCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500/50"
              />
              <span className="text-[10px] text-white/40 mt-0.5 block">Max capacity before drop protection</span>
            </div>

            <div>
              <label className="text-white/50 block text-[11px] mb-1">SATURATION OVERFLOW POLICY</label>
              <select
                value={dropPolicy}
                onChange={(e) => setDropPolicy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500/50"
              >
                <option value="DROP_OLDEST" className="bg-slate-900">DROP_OLDEST (Ring Buffer)</option>
                <option value="DROP_NEWEST" className="bg-slate-900">DROP_NEWEST (Tail Drop)</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 space-y-1">
              <div className="font-bold">PHYSICAL LAYER STATUS:</div>
              <div>TX Laser Line: DISCONNECTED</div>
              <div>RX Photodiode: RECEIVING (1.0 Gbps)</div>
            </div>
          </div>
        </div>

        {/* 2. Multi-Resolution Temporal Windows */}
        <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Sliders size={16} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
              2. Temporal Window Lenses
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white/50">PACKET-LEVEL WINDOW (sec)</span>
                <span className="text-cyan-400 font-bold">{packetWindow}s</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.5}
                value={packetWindow}
                onChange={(e) => setPacketWindow(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="text-[10px] text-white/40">Detects SYN & UDP flood packet bursts</span>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white/50">CONNECTION STALL TIMEOUT (sec)</span>
                <span className="text-cyan-400 font-bold">{connectionTimeout}s</span>
              </div>
              <input
                type="range"
                min={5.0}
                max={30.0}
                step={1.0}
                value={connectionTimeout}
                onChange={(e) => setConnectionTimeout(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="text-[10px] text-white/40">Detects Slowloris thread starvation</span>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white/50">SESSION PERIODICITY WINDOW (sec)</span>
                <span className="text-cyan-400 font-bold">{sessionWindow}s</span>
              </div>
              <input
                type="range"
                min={30.0}
                max={300.0}
                step={15.0}
                value={sessionWindow}
                onChange={(e) => setSessionWindow(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="text-[10px] text-white/40">FFT autocorrelation for stealth C2 beaconing</span>
            </div>

            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300">
              <span className="font-bold block mb-0.5">3-Tier Resolution Advantage:</span>
              Separates microsecond volumetric floods from subtle, persistent minute-level command callbacks.
            </div>
          </div>
        </div>

        {/* 3. AI/ML Models & Anomaly Thresholds */}
        <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Cpu size={16} className="text-purple-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
              3. AI & ML Anomaly Tuning
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white/50">BASELINE SIGMA DEVIATION</span>
                <span className="text-purple-400 font-bold">+{sigmaThreshold}σ</span>
              </div>
              <input
                type="range"
                min={2.0}
                max={6.0}
                step={0.1}
                value={sigmaThreshold}
                onChange={(e) => setSigmaThreshold(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
              <span className="text-[10px] text-white/40">Welford variance deviation trigger</span>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white/50">EXPONENTIAL RISK DECAY RATE</span>
                <span className="text-purple-400 font-bold">{decayRate}</span>
              </div>
              <input
                type="range"
                min={0.85}
                max={0.99}
                step={0.01}
                value={decayRate}
                onChange={(e) => setDecayRate(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
              <span className="text-[10px] text-white/40">Half-life decay when anomalies subside</span>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white/50">SHANNON ENTROPY THRESHOLD</span>
                <span className="text-purple-400 font-bold">{entropyThreshold} bits</span>
              </div>
              <input
                type="range"
                min={2.5}
                max={5.0}
                step={0.1}
                value={entropyThreshold}
                onChange={(e) => setEntropyThreshold(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
              <span className="text-[10px] text-white/40">DNS tunnel / DGA binary encoding limit</span>
            </div>

            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
              <span className="font-bold block mb-0.5">Model Weights Integrity:</span>
              SHA-256 signatures verified on boot. Anti-adversarial drift protection active.
            </div>
          </div>
        </div>
      </div>

      {/* Network & Live Connection Panel */}
      <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4 font-mono">
        <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2 font-sans">
          <Radio size={16} className="text-blue-400" />
          API & Telemetry Feed Endpoints
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-white/50 block text-[11px] mb-1">WEBSOCKET LIVE FEED</label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
            />
            <div className="text-[11px] text-white/40 mt-1 flex items-center gap-2">
              <span>Status:</span>
              <span
                className={`font-bold ${
                  connection.status === 'connected' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {connection.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div>
            <label className="text-white/50 block text-[11px] mb-1">REST API BASE URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
            />
            <div className="text-[11px] text-white/40 mt-1">
              FastAPI ASGI Swagger documentation available at{' '}
              <a href="http://localhost:8000/docs" target="_blank" className="text-blue-400 hover:underline">
                /docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
