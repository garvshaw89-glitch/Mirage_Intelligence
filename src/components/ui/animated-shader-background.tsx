'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface AnimatedShaderBackgroundProps {
  className?: string;
  intensity?: number;
  paused?: boolean;
  reducedMotion?: boolean;
}

// Vertex shader — minimal, just passes UVs
const VERT_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// Fragment shader — atmospheric, procedural, premium
const FRAG_SHADER = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;
varying vec2 vUv;

// Simplex-style noise
vec3 hash3(vec2 p) {
  vec3 q = vec3(
    dot(p, vec2(127.1, 311.7)),
    dot(p, vec2(269.5, 183.3)),
    dot(p, vec2(419.2, 371.9))
  );
  return fract(sin(q) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash3(i + vec2(0,0)).xy, f - vec2(0,0)),
        dot(hash3(i + vec2(1,0)).xy, f - vec2(1,0)), u.x),
    mix(dot(hash3(i + vec2(0,1)).xy, f - vec2(0,1)),
        dot(hash3(i + vec2(1,1)).xy, f - vec2(1,1)), u.x), u.y
  );
}

float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = (uv * 2.0 - 1.0) * aspect;

  float t = uTime * 0.08;

  // Slow flowing nebula
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0), 4),
    fbm(p + vec2(5.2, 1.3), 4)
  );

  vec2 r = vec2(
    fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * t, 4),
    fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.126 * t, 4)
  );

  float f = fbm(p + 4.0 * r, 4);

  // Deep space base — near black with subtle tones
  vec3 col = mix(
    vec3(0.02, 0.04, 0.08),   // deep navy-black
    vec3(0.04, 0.08, 0.16),   // dark blue
    clamp((f * f * 4.0 + 0.2 * f), 0.0, 1.0)
  );

  col = mix(col,
    vec3(0.03, 0.06, 0.14),  // slightly lighter blue
    clamp(length(q), 0.0, 1.0)
  );

  // Subtle violet-blue nebula veins
  col = mix(col,
    vec3(0.08, 0.06, 0.18),
    clamp(length(r), 0.0, 1.0)
  );

  // Faint cool highlights
  float highlight = smoothstep(0.7, 0.9, f);
  col += highlight * vec3(0.04, 0.10, 0.22) * 0.4;

  // Subtle radial vignette darkening from edges
  float vignette = 1.0 - smoothstep(0.5, 1.4, length(uv - 0.5) * 2.0);
  col *= vignette * 0.9 + 0.1;

  // Very subtle glow at center
  float centerGlow = exp(-length(uv - 0.5) * 4.0);
  col += centerGlow * vec3(0.02, 0.06, 0.14) * 0.3;

  col *= uIntensity;

  // Clamp to avoid over-brightness
  col = clamp(col, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`;

export function AnimatedShaderBackground({
  className = '',
  intensity = 1.0,
  paused = false,
  reducedMotion = false,
}: AnimatedShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const rafRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const [webGLFailed, setWebGLFailed] = useState(false);

  const effectivelyPaused = paused || reducedMotion;

  const stopRendering = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startRendering = useCallback(() => {
    if (effectivelyPaused) return;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const material = materialRef.current;
    const clock = clockRef.current;
    if (!renderer || !scene || !camera || !material || !clock) return;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      material.uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();
  }, [effectivelyPaused]);

  // Initialize Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: 'low-power',
      });
    } catch {
      setWebGLFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT_SHADER,
      fragmentShader: FRAG_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        uIntensity: { value: intensity },
      },
    });

    scene.add(new THREE.Mesh(geometry, material));

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    materialRef.current = material;
    clockRef.current = clock;

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !material) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      material.uniforms.uResolution.value.set(w, h);
    });
    resizeObserver.observe(container);

    // Page visibility — pause when hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRendering();
      } else if (!effectivelyPaused) {
        startRendering();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!effectivelyPaused) {
      const animate = () => {
        rafRef.current = requestAnimationFrame(animate);
        material.uniforms.uTime.value = clock.getElapsedTime();
        renderer.render(scene, camera);
      };
      animate();
    }

    return () => {
      stopRendering();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize only once

  // Respond to paused/intensity changes without re-init
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uIntensity.value = intensity;
    }
  }, [intensity]);

  useEffect(() => {
    if (effectivelyPaused) {
      stopRendering();
    } else {
      startRendering();
    }
  }, [effectivelyPaused, stopRendering, startRendering]);

  // Fallback for WebGL failure
  if (webGLFailed) {
    return (
      <div
        className={className}
        style={{
          background: 'linear-gradient(135deg, #080c12 0%, #0d1520 50%, #080c12 100%)',
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      style={{ overflow: 'hidden' }}
    />
  );
}
