'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Shield,
  Activity,
  AlertTriangle,
  Crosshair,
  RotateCw,
  Compass,
  Globe,
} from 'lucide-react';
import type { Alert, Host } from '@/types';

export interface ThreatNode {
  id: string;
  ip: string;
  label: string;
  location: string;
  lat: number;
  lon: number;
  role: 'attacker' | 'c2' | 'target' | 'internal_compromised' | 'gateway';
  riskScore: number;
  threatType?: string;
  packetRate?: number;
}

const DEFAULT_THREAT_NODES: ThreatNode[] = [
  {
    id: 'node-attacker-50',
    ip: '10.0.0.50',
    label: 'SYN/UDP Flood Attacker',
    location: 'Eurasia Transit / Node 50',
    lat: 55.75,
    lon: 37.61,
    role: 'attacker',
    riskScore: 94.5,
    threatType: 'SYN_FLOOD',
    packetRate: 12400,
  },
  {
    id: 'node-c2-42',
    ip: '198.51.100.42',
    label: 'External C2 Rendezvous',
    location: 'Offshore Relay Server',
    lat: 22.31,
    lon: 114.16,
    role: 'c2',
    riskScore: 92.0,
    threatType: 'C2_BEACON',
    packetRate: 420,
  },
  {
    id: 'node-target-10',
    ip: '10.0.0.10',
    label: 'Core Auth Target (Enclave)',
    location: 'Primary Secure DC / Diode Rx',
    lat: 28.61,
    lon: 77.20,
    role: 'target',
    riskScore: 18.0,
    packetRate: 850,
  },
  {
    id: 'node-comp-21',
    ip: '10.0.0.21',
    label: 'Compromised Workstation',
    location: 'Internal Engineering Enclave',
    lat: 51.50,
    lon: -0.12,
    role: 'internal_compromised',
    riskScore: 88.0,
    threatType: 'C2_BEACON',
    packetRate: 64,
  },
  {
    id: 'node-finance-31',
    ip: '10.0.0.31',
    label: 'Finance Host (DNS Exfil)',
    location: 'Branch Office Terminal',
    lat: 40.71,
    lon: -74.00,
    role: 'internal_compromised',
    riskScore: 76.5,
    threatType: 'DNS_TUNNEL',
    packetRate: 38,
  },
];

interface CyberGlobeProps {
  alerts?: Alert[];
  hosts?: Host[];
  activeScenario?: string | null;
  className?: string;
}

// Convert Lat/Lon to 3D Cartesian Vector on sphere of radius R
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Generate realistic procedural Earth textures (Day/Continent, Night Lights, Specular)
function createProceduralEarthTextures() {
  const width = 2048;
  const height = 1024;

  // 1. Day / Landmass canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean background
  const oceanGradient = ctx.createLinearGradient(0, 0, 0, height);
  oceanGradient.addColorStop(0, '#040b18');
  oceanGradient.addColorStop(0.5, '#061326');
  oceanGradient.addColorStop(1, '#030812');
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle ocean bathymetry grid lines
  ctx.strokeStyle = 'rgba(59, 158, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Draw landmasses procedurally with organic polygon approximations of continents
  ctx.fillStyle = '#11253e';
  ctx.shadowColor = 'rgba(59, 158, 255, 0.4)';
  ctx.shadowBlur = 10;

  function drawContinent(points: [number, number][]) {
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const [lon, lat] = points[i];
      const x = ((lon + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // North America
  drawContinent([
    [-168, 65], [-140, 70], [-100, 75], [-60, 80], [-55, 50],
    [-75, 45], [-75, 25], [-90, 20], [-105, 22], [-120, 35],
    [-125, 48], [-140, 58], [-168, 65],
  ]);

  // South America
  drawContinent([
    [-80, 10], [-50, 0], [-35, -5], [-40, -22], [-55, -35],
    [-65, -55], [-75, -50], [-72, -30], [-80, -5], [-80, 10],
  ]);

  // Europe & Scandinavia
  drawContinent([
    [-10, 36], [0, 42], [5, 52], [10, 58], [25, 70],
    [32, 70], [30, 60], [45, 60], [40, 45], [25, 38],
    [10, 36], [-10, 36],
  ]);

  // Africa
  drawContinent([
    [-17, 32], [10, 37], [32, 31], [50, 12], [42, -5],
    [35, -25], [20, -35], [12, -18], [0, 5], [-17, 15], [-17, 32],
  ]);

  // Asia
  drawContinent([
    [32, 31], [60, 40], [80, 72], [140, 72], [170, 65],
    [140, 40], [120, 25], [105, 10], [90, 22], [75, 8],
    [68, 25], [45, 30], [32, 31],
  ]);

  // Australia
  drawContinent([
    [114, -22], [125, -15], [142, -12], [152, -28], [148, -38],
    [135, -35], [115, -35], [114, -22],
  ]);

  // 2. Night Lights Layer (Golden city clusters)
  ctx.shadowBlur = 0;
  const cities: [number, number, number][] = [
    [-74, 40, 8], [-118, 34, 7], [-87, 41, 6], [-95, 29, 6], [-122, 37, 6],
    [-43, -22, 6], [-46, -23, 7], [-58, -34, 6],
    [0, 51, 8], [2, 48, 8], [13, 52, 7], [12, 41, 6], [37, 55, 7],
    [31, 30, 6], [28, -26, 5],
    [55, 25, 7], [77, 28, 9], [72, 19, 8], [80, 13, 7], [88, 22, 7],
    [116, 39, 8], [121, 31, 9], [114, 22, 8], [139, 35, 9], [126, 37, 8],
    [151, -33, 6], [144, -37, 6],
  ];

  cities.forEach(([lon, lat, r]) => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;

    const radGrad = ctx.createRadialGradient(x, y, 1, x, y, r * 4);
    radGrad.addColorStop(0, 'rgba(255, 205, 80, 0.95)');
    radGrad.addColorStop(0.3, 'rgba(245, 160, 40, 0.6)');
    radGrad.addColorStop(0.7, 'rgba(59, 158, 255, 0.2)');
    radGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(x, y, r * 4, 0, Math.PI * 2);
    ctx.fill();

    // Hot center core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function CyberGlobe({
  alerts = [],
  hosts = [],
  activeScenario,
  className,
}: CyberGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<ThreatNode>(DEFAULT_THREAT_NODES[0]);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Active threat nodes with live risk overrides
  const threatNodes = useMemo(() => {
    return DEFAULT_THREAT_NODES.map((node) => {
      const matchHost = hosts.find((h) => h.ip === node.ip);
      const matchAlert = alerts.find((a) => a.srcIp === node.ip || a.dstIp === node.ip);
      return {
        ...node,
        riskScore: matchHost ? matchHost.riskScore : node.riskScore,
        threatType: matchAlert ? matchAlert.threatType : node.threatType,
      };
    });
  }, [hosts, alerts]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3, 14);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0f1c30, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xd4e7ff, 2.5);
    sunLight.position.set(20, 10, 15);
    scene.add(sunLight);

    const blueRimLight = new THREE.DirectionalLight(0x2288ff, 3.2);
    blueRimLight.position.set(-15, 8, -12);
    scene.add(blueRimLight);

    // Earth Sphere
    const globeRadius = 4.8;
    const earthGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const earthTexture = createProceduralEarthTextures();

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.25,
      emissive: new THREE.Color(0x051325),
      emissiveIntensity: 0.6,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // Atmospheric Fresnel Glow
    const atmosphereShader = {
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.8);
          vec3 atmColor = vec3(0.18, 0.58, 1.0);
          gl_FragColor = vec4(atmColor, fresnel * 0.75);
        }
      `,
    };

    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereShader.vertexShader,
      fragmentShader: atmosphereShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });

    const atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(globeRadius * 1.15, 48, 48),
      atmosphereMaterial
    );
    scene.add(atmosphereMesh);

    // Space Particles
    const starCount = 350;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 80;
      starPositions[i + 1] = (Math.random() - 0.5) * 80;
      starPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 0.8,
      color: 0x6bb3ff,
      transparent: true,
      opacity: 0.6,
    });
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // Orbital Satellite Rings (matching user reference image)
    const orbitalGroup = new THREE.Group();
    const orbitRingConfigs = [
      { radius: globeRadius * 1.35, rotX: 0.35, rotZ: 0.25, color: 0x3b9eff },
      { radius: globeRadius * 1.5, rotX: -0.6, rotZ: 0.5, color: 0x4ade80 },
      { radius: globeRadius * 1.25, rotX: 0.85, rotZ: -0.4, color: 0xf59e0b },
    ];

    orbitRingConfigs.forEach(({ radius, rotX, rotZ, color }) => {
      const ringGeom = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 128);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = rotX;
      ringMesh.rotation.z = rotZ;
      orbitalGroup.add(ringMesh);
    });
    scene.add(orbitalGroup);

    // 3D Threat Pins & Pulsing Impact Shockwaves
    const pinGroup = new THREE.Group();
    const shockwaveMeshes: { mesh: THREE.Mesh; scale: number; maxScale: number }[] = [];

    threatNodes.forEach((node) => {
      const pos = latLonToVector3(node.lat, node.lon, globeRadius * 1.01);
      const isTarget = node.role === 'target';
      const isAttacker = node.role === 'attacker';
      const nodeColor = isTarget
        ? 0x38bdf8
        : isAttacker
        ? 0xef4444
        : node.role === 'c2'
        ? 0xa855f7
        : 0xf59e0b;

      // Pin Head
      const headGeom = new THREE.SphereGeometry(0.14, 16, 16);
      const headMat = new THREE.MeshBasicMaterial({ color: nodeColor });
      const head = new THREE.Mesh(headGeom, headMat);
      head.position.copy(pos);
      pinGroup.add(head);

      // Pin stem
      const normal = pos.clone().normalize();
      const stemGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: nodeColor, transparent: true, opacity: 0.8 });
      const stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.17)));
      stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      pinGroup.add(stem);

      // Shockwave Ring
      const ringGeom = new THREE.RingGeometry(0.1, 0.16, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: nodeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const shockwave = new THREE.Mesh(ringGeom, ringMat);
      shockwave.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.02)));
      shockwave.lookAt(pos.clone().add(normal));
      pinGroup.add(shockwave);

      shockwaveMeshes.push({ mesh: shockwave, scale: 1, maxScale: 3.5 });
    });
    earthMesh.add(pinGroup);

    // Live Attack Trajectory Arcs with Traveling Laser Particles
    const arcGroup = new THREE.Group();
    const targetNode = threatNodes.find((n) => n.role === 'target') || threatNodes[2];
    const targetVec = latLonToVector3(targetNode.lat, targetNode.lon, globeRadius);

    interface AttackArcData {
      curve: THREE.QuadraticBezierCurve3;
      pulseMeshes: THREE.Mesh[];
      color: number;
    }
    const attackArcs: AttackArcData[] = [];

    threatNodes
      .filter((n) => n.role !== 'target')
      .forEach((srcNode) => {
        const srcVec = latLonToVector3(srcNode.lat, srcNode.lon, globeRadius);
        const midPoint = srcVec.clone().add(targetVec).multiplyScalar(0.5);
        const distance = srcVec.distanceTo(targetVec);
        const altitude = globeRadius * (1.18 + distance * 0.08);
        midPoint.normalize().multiplyScalar(altitude);

        const curve = new THREE.QuadraticBezierCurve3(srcVec, midPoint, targetVec);
        const points = curve.getPoints(64);
        const arcGeom = new THREE.BufferGeometry().setFromPoints(points);

        const arcColor =
          srcNode.role === 'attacker'
            ? 0xef4444
            : srcNode.role === 'c2'
            ? 0xa855f7
            : 0xf59e0b;

        const arcMat = new THREE.LineBasicMaterial({
          color: arcColor,
          transparent: true,
          opacity: 0.65,
          linewidth: 2,
        });
        const arcLine = new THREE.Line(arcGeom, arcMat);
        arcGroup.add(arcLine);

        // Moving pulse laser nodes along the arc
        const pulseCount = 2;
        const pulseMeshes: THREE.Mesh[] = [];
        for (let p = 0; p < pulseCount; p++) {
          const pulseGeom = new THREE.SphereGeometry(0.1, 12, 12);
          const pulseMat = new THREE.MeshBasicMaterial({
            color: arcColor,
            transparent: true,
            opacity: 0.9,
          });
          const pulseMesh = new THREE.Mesh(pulseGeom, pulseMat);
          arcGroup.add(pulseMesh);
          pulseMeshes.push(pulseMesh);
        }

        attackArcs.push({ curve, pulseMeshes, color: arcColor });
      });
    earthMesh.add(arcGroup);

    // Mouse Interaction (Orbit / Rotate)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      earthMesh.rotation.y += deltaX * 0.005;
      earthMesh.rotation.x += deltaY * 0.005;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Earth rotation
      if (autoRotate && !isDragging) {
        earthMesh.rotation.y += 0.0022;
      }

      // Rotate orbital rings
      orbitalGroup.rotation.y += 0.001;
      orbitalGroup.rotation.z += 0.0005;

      // Animate shockwave rings
      shockwaveMeshes.forEach((item) => {
        item.scale += 0.04;
        if (item.scale > item.maxScale) item.scale = 1.0;
        item.mesh.scale.set(item.scale, item.scale, item.scale);
        const mat = item.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 1.0 - item.scale / item.maxScale;
      });

      // Animate traveling attack pulses along arcs
      attackArcs.forEach(({ curve, pulseMeshes }, arcIdx) => {
        pulseMeshes.forEach((pulse, pIdx) => {
          const t = (elapsedTime * 0.45 + pIdx * 0.5 + arcIdx * 0.25) % 1.0;
          const pos = curve.getPoint(t);
          pulse.position.copy(pos);
          pulse.scale.setScalar(0.8 + Math.sin(t * Math.PI) * 0.8);
        });
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [threatNodes, autoRotate]);

  return (
    <div className={`relative rounded-2xl overflow-hidden glass border border-white/10 ${className || 'h-[620px]'}`}>
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Sci-Fi HUD Bracket Overlays (Matching Image Aesthetics) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={18} className="text-cyan-400 animate-pulse" />
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-cyan-300 uppercase">
            ORBITAL CYBER THREAT RADAR
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            3D REVOLVING
          </span>
        </div>
        <h2 className="text-2xl font-black tracking-widest text-white uppercase font-sans">
          GLOBAL INGRESS TAP
        </h2>
        <div className="text-xs text-white/50 font-mono flex items-center gap-3 mt-1">
          <span>LAT: 28.61° N · LON: 77.20° E</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            DIODE HARDWARE ISOLATED
          </span>
        </div>
      </div>

      {/* Futuristic Bracket Line Top-Left */}
      <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-cyan-400/40 pointer-events-none" />
      <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-cyan-400/40 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-cyan-400/40 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-cyan-400/40 pointer-events-none" />

      {/* HUD Telemetry Card Left (Matching Image's "IN LOW ORBIT / SATELLITES" Box) */}
      <div className="absolute top-24 left-4 z-10 max-w-[280px] p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 space-y-3 font-mono">
        <div className="flex items-center justify-between text-[10px] text-white/50 pb-2 border-b border-white/10">
          <span className="font-bold text-white tracking-widest">INGRESS TELEMETRY</span>
          <span className="text-red-400 animate-pulse font-bold">
            {activeScenario ? activeScenario : 'LIVE TRAFFIC'}
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="text-[10px] text-white/40 uppercase">ACTIVE THREAT CONDUITS</div>
          <div className="text-lg font-black text-red-400">
            {threatNodes.filter((n) => n.riskScore >= 70).length} HOSTS FLAGGED
          </div>
          <p className="text-[11px] text-white/60 font-sans leading-relaxed">
            Passive optical tap extracts features at 1Gbps with zero reverse packet reflection.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10px]">
          <div>
            <span className="text-white/40 block">BEAMS ACTIVE</span>
            <span className="text-cyan-300 font-bold text-sm">4 Trajectories</span>
          </div>
          <div>
            <span className="text-white/40 block">RADAR RESOLUTION</span>
            <span className="text-emerald-400 font-bold text-sm">&lt; 5ms</span>
          </div>
        </div>
      </div>

      {/* Floating Attack Origin IP Address List (Right Side) */}
      <div className="absolute top-4 right-4 z-10 w-72 max-h-[500px] overflow-y-auto space-y-2 p-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 font-mono text-xs">
        <div className="flex items-center justify-between text-[11px] font-bold text-white/70 px-1 pb-1 border-b border-white/10">
          <span className="flex items-center gap-1.5 text-red-400">
            <Crosshair size={13} /> ATTACK ORIGIN IPS
          </span>
          <span className="text-[10px] text-white/40">GEO-MAPPED</span>
        </div>

        {threatNodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isAttacker = node.role === 'attacker' || node.role === 'c2' || node.riskScore >= 70;

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white font-mono text-xs flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAttacker ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                  {node.ip}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    node.riskScore >= 80
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : node.riskScore >= 60
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  Risk {Math.round(node.riskScore)}
                </span>
              </div>

              <div className="text-[11px] text-white/60 truncate font-sans">{node.label}</div>
              <div className="text-[10px] text-white/40 mt-1 flex justify-between">
                <span>{node.location}</span>
                {node.threatType && <span className="text-cyan-400 font-bold">{node.threatType}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Node Bottom Inspection HUD */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 z-10 p-3.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Compass size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">{selectedNode.ip}</span>
                <span className="text-white/40 font-sans">({selectedNode.location})</span>
              </div>
              <div className="text-white/60 text-[11px] mt-0.5">
                Targeting: Core Enclave Gateway (10.0.0.10) · Diode Optical Ingress
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-white/40 text-[10px] block">COORDINATES</span>
              <span className="text-white font-bold">
                {selectedNode.lat.toFixed(2)}°, {selectedNode.lon.toFixed(2)}°
              </span>
            </div>
            <div className="text-right">
              <span className="text-white/40 text-[10px] block">ISOLATED RISK</span>
              <span
                className={`font-bold text-sm ${
                  selectedNode.riskScore >= 80 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {selectedNode.riskScore.toFixed(1)}/100
              </span>
            </div>
            <button
              onClick={() => setAutoRotate((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-sans text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCw size={13} className={autoRotate ? 'animate-spin' : ''} />
              {autoRotate ? 'Revolving' : 'Paused'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
