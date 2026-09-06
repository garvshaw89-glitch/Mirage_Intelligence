'use client';

import { useState } from 'react';
import {
  GitBranch,
  Shield,
  AlertTriangle,
  Server,
  Activity,
  Layers,
  ArrowRight,
  ExternalLink,
  Clock,
  Radio,
} from 'lucide-react';

interface CampaignNode {
  id: string;
  type: 'host' | 'c2' | 'server' | 'dns' | 'alert' | 'attacker';
  label: string;
  risk: number;
  x: number;
  y: number;
}

interface CampaignEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  confidence: number;
  risk_score: number;
  host_count: number;
  event_count: number;
  duration: string;
  threat_types: string[];
  nodes: CampaignNode[];
  edges: CampaignEdge[];
}

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-01',
    title: 'CAMPAIGN-APT-CORRELATION-001',
    description: 'Multi-host coordinated intrusion: Reconnaissance flood on 10.0.0.10 masking persistent C2 beaconing on 10.0.0.21 and Base32 DNS exfiltration on 10.0.0.31.',
    severity: 'CRITICAL',
    confidence: 0.94,
    risk_score: 92.4,
    host_count: 4,
    event_count: 26,
    duration: '18 min 42s',
    threat_types: ['SYN_FLOOD', 'C2_BEACON', 'DNS_TUNNEL'],
    nodes: [
      { id: '10.0.0.50', type: 'host', label: 'Attacker (10.0.0.50)', risk: 91.5, x: 80, y: 120 },
      { id: '10.0.0.10', type: 'server', label: 'Auth Target (10.0.0.10)', risk: 35.0, x: 280, y: 120 },
      { id: '10.0.0.21', type: 'host', label: 'Compromised Eng (10.0.0.21)', risk: 88.0, x: 280, y: 280 },
      { id: '198.51.100.42', type: 'c2', label: 'External C2 Server', risk: 95.0, x: 500, y: 280 },
      { id: '10.0.0.31', type: 'host', label: 'Finance Exfil (10.0.0.31)', risk: 72.0, x: 280, y: 440 },
      { id: '1.1.1.1', type: 'dns', label: 'DNS Resolver (1.1.1.1)', risk: 20.0, x: 500, y: 440 },
    ],
    edges: [
      { id: 'e1', source: '10.0.0.50', target: '10.0.0.10', relationship: 'SYN_FLOOD_DISTRACTION' },
      { id: 'e2', source: '10.0.0.21', target: '198.51.100.42', relationship: 'BEACONS_PERIODIC' },
      { id: 'e3', source: '10.0.0.31', target: '1.1.1.1', relationship: 'DNS_TUNNEL_EXFIL' },
      { id: 'e4', source: '10.0.0.10', target: '10.0.0.21', relationship: 'LATERAL_AUTH_TOKEN' },
    ],
  },
];

export default function CampaignsPage() {
  const [campaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign>(DEMO_CAMPAIGNS[0]);
  const [selectedNode, setSelectedNode] = useState<CampaignNode | null>(DEMO_CAMPAIGNS[0].nodes[2]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl glass-card border border-white/10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <GitBranch className="text-purple-400" size={22} />
            Attack Campaigns & Temporal Graph
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Correlates discrete passive detections into coordinated, multi-stage attack campaigns across the network.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            1 ACTIVE CAMPAIGN
          </span>
        </div>
      </div>

      {/* Campaign Summary Card */}
      <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                {selectedCampaign.severity}
              </span>
              <h2 className="text-base font-bold text-white font-mono tracking-wide">
                {selectedCampaign.title}
              </h2>
            </div>
            <p className="text-xs text-white/60 mt-1">
              {selectedCampaign.description}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <div className="text-[10px] text-white/40 uppercase">CONFIDENCE</div>
              <div className="text-sm font-bold text-emerald-400">{(selectedCampaign.confidence * 100).toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase">RISK SCORE</div>
              <div className="text-sm font-bold text-red-400">{selectedCampaign.risk_score.toFixed(1)}/100</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase">DURATION</div>
              <div className="text-sm font-bold text-white">{selectedCampaign.duration}</div>
            </div>
          </div>
        </div>

        {/* Threat Types Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-white/40 text-[11px] font-semibold">TACTICS DETECTED:</span>
          {selectedCampaign.threat_types.map((type) => (
            <span
              key={type}
              className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-white/5 text-white/80 border border-white/10"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Interactive Visual Graph Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Graph Viewport */}
        <div className="lg:col-span-8 p-5 rounded-xl glass-card border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-blue-400" />
              Temporal Attack Graph Topology
            </h3>
            <span className="text-[11px] text-white/40">Click any node to inspect telemetry</span>
          </div>

          {/* SVG Graph Viewport */}
          <div className="relative w-full h-[520px] rounded-lg bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 620 540">
              {/* Grid Background */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Edges */}
              {selectedCampaign.edges.map((edge) => {
                const srcNode = selectedCampaign.nodes.find((n) => n.id === edge.source);
                const tgtNode = selectedCampaign.nodes.find((n) => n.id === edge.target);
                if (!srcNode || !tgtNode) return null;

                const midX = (srcNode.x + tgtNode.x) / 2;
                const midY = (srcNode.y + tgtNode.y) / 2;

                return (
                  <g key={edge.id}>
                    <line
                      x1={srcNode.x}
                      y1={srcNode.y}
                      x2={tgtNode.x}
                      y2={tgtNode.y}
                      stroke="rgba(59,158,255,0.4)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                    <text
                      x={midX}
                      y={midY - 6}
                      fill="rgba(255,255,255,0.5)"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {edge.relationship}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {selectedCampaign.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const nodeColor =
                  node.type === 'c2'
                    ? '#ef4444'
                    : node.type === 'attacker'
                    ? '#f97316'
                    : node.risk > 70
                    ? '#eab308'
                    : '#3b82f6';

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer transition-transform duration-200"
                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                  >
                    {/* Outer Glow */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected ? 24 : 18}
                      fill={nodeColor}
                      fillOpacity={isSelected ? 0.3 : 0.15}
                      stroke={nodeColor}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    {/* Inner Core */}
                    <circle cx={node.x} cy={node.y} r={isSelected ? 10 : 8} fill={nodeColor} />
                    {/* Label */}
                    <text
                      x={node.x}
                      y={node.y + 32}
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {node.label}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 44}
                      fill="rgba(255,255,255,0.4)"
                      fontSize="8"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                    >
                      Risk: {node.risk.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Node Inspector */}
        <div className="lg:col-span-4">
          {selectedNode ? (
            <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4">
              <div className="pb-3 border-b border-white/10">
                <span className="text-[10px] text-white/40 uppercase font-semibold">GRAPH NODE INSPECTION</span>
                <h4 className="text-base font-bold text-white font-mono mt-0.5">{selectedNode.label}</h4>
                <div className="text-xs text-white/60 font-mono mt-0.5">ID: {selectedNode.id}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-white/40 block text-[9px]">NODE ROLE</span>
                  <span className="text-white font-bold uppercase">{selectedNode.type}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-white/40 block text-[9px]">ISOLATED RISK</span>
                  <span className="text-red-400 font-bold">{selectedNode.risk.toFixed(1)}/100</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-white/70">
                <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Associated Graph Edges:
                </div>
                {selectedCampaign.edges
                  .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                  .map((e) => (
                    <div key={e.id} className="p-2 rounded bg-white/5 border border-white/10 font-mono text-[11px]">
                      <span className="text-blue-400 font-bold">{e.relationship}</span>
                      <div className="text-white/40 text-[10px] mt-0.5">
                        {e.source} → {e.target}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 leading-relaxed">
                MIRAGE groups hosts by shared command-and-control external IPs, common timing distributions, and synchronized volume spikes.
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-white/40 glass-card rounded-xl">
              Click a graph node to inspect edge relationships.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
