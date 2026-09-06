'use client';

import { useState } from 'react';
import {
  Cpu,
  Shield,
  CheckCircle2,
  TrendingUp,
  Database,
  Layers,
  Sparkles,
  BarChart2,
  Lock,
} from 'lucide-react';

interface ModelItem {
  id: string;
  name: string;
  version: string;
  model_type: string;
  dataset: string;
  feature_version: string;
  precision: number;
  recall: number;
  f1_score: number;
  status: string;
  description: string;
  weights_hash: string;
}

const MODELS: ModelItem[] = [
  {
    id: 'm1',
    name: 'IsolationForest_NetAnomaly',
    version: 'v1.4.2',
    model_type: 'Unsupervised Isolation Forest',
    dataset: 'NTRO_Unidirectional_Benchmark_v1',
    feature_version: 'fv3_temporal_fft',
    precision: 0.962,
    recall: 0.941,
    f1_score: 0.951,
    status: 'ACTIVE_IN_ENCLAVE',
    description: 'Isolates anomalies by randomly partitioning multivariate behavioral feature spaces. Detects zero-day exfiltration without prior threat signatures.',
    weights_hash: 'e89c10f293b4a81d...8921',
  },
  {
    id: 'm2',
    name: 'RandomForest_SignatureEnsemble',
    version: 'v2.1.0',
    model_type: 'Supervised Ensemble Classifier',
    dataset: 'NTRO_CyberRange_SyntheticFloods',
    feature_version: 'fv3_temporal_fft',
    precision: 0.978,
    recall: 0.965,
    f1_score: 0.971,
    status: 'ACTIVE_IN_ENCLAVE',
    description: 'Trained on high-volume hping3 SYN/UDP floods, Slowloris, and multi-host coordinated intrusions. High precision with minimal false alarms.',
    weights_hash: '3f901ab887c2409d...a710',
  },
  {
    id: 'm3',
    name: 'EWMA_AdaptiveBaseline',
    version: 'v1.0.0',
    model_type: 'Statistical Dynamic Profiling',
    dataset: 'Passive_Continuous_Stream',
    feature_version: 'fv1_packet_flow',
    precision: 0.920,
    recall: 0.895,
    f1_score: 0.907,
    status: 'ACTIVE_IN_ENCLAVE',
    description: 'Calculates continuous rolling mean and Welford variance per host. Flags sudden deviations exceeding 4.0 standard deviations.',
    weights_hash: '7c81920eb1293a40...9481',
  },
  {
    id: 'm4',
    name: 'Entropy_DNSTunnel_Classifier',
    version: 'v1.2.0',
    model_type: 'Shannon Entropy & Subdomain Analysis',
    dataset: 'dnscat2_iodine_dga_corpus',
    feature_version: 'fv2_dns_labels',
    precision: 0.985,
    recall: 0.970,
    f1_score: 0.977,
    status: 'ACTIVE_IN_ENCLAVE',
    description: 'Evaluates bits of entropy in DNS query labels. Discovers encrypted or compressed covert tunneling channels (dnscat2, iodine, DGA).',
    weights_hash: '1a9024f0c81293be...5029',
  },
];

export default function ModelsPage() {
  const [models] = useState<ModelItem[]>(MODELS);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl glass-card border border-white/10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Cpu className="text-purple-400" size={22} />
            AI & ML Model Registry
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Tracking versioned models, dataset provenance, precision/recall metrics, and cryptographic weights hashes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            4 MODELS VALIDATED
          </span>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {models.map((m) => (
          <div key={m.id} className="p-5 rounded-xl glass-card border border-white/10 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    {m.version}
                  </span>
                  <h2 className="text-base font-bold text-white font-mono">{m.name}</h2>
                </div>
                <div className="text-xs text-white/50 font-mono mt-1">{m.model_type}</div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">{m.description}</p>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-center font-mono">
              <div>
                <span className="text-[9px] text-white/40 uppercase block">PRECISION</span>
                <span className="text-sm font-bold text-emerald-400">
                  {(m.precision * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-white/40 uppercase block">RECALL</span>
                <span className="text-sm font-bold text-blue-400">
                  {(m.recall * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-white/40 uppercase block">F1 SCORE</span>
                <span className="text-sm font-bold text-purple-400">
                  {(m.f1_score * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Provenance & Hashes */}
            <div className="space-y-1.5 text-[11px] font-mono text-white/50 pt-1">
              <div className="flex justify-between">
                <span>Training Corpus:</span>
                <span className="text-white/80">{m.dataset}</span>
              </div>
              <div className="flex justify-between">
                <span>Feature Schema:</span>
                <span className="text-white/80">{m.feature_version}</span>
              </div>
              <div className="flex justify-between">
                <span>Artifact Hash:</span>
                <span className="text-blue-400">{m.weights_hash}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
