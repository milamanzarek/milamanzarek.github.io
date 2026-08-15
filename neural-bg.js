/* ============================================================
   NEURAL SYNAPSE BACKGROUND - 100% Density / Crystal Theme
   Matches Quantum Neural Network reference:
   - 500+ sparkly nodes with starburst rays
   - Dense synapse connections
   - Sparkly twinkling star background
   - Central radial luminance
   ============================================================ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';

(function initNeuralBackground() {
  const canvas = document.getElementById('neural-bg');
  if (!canvas) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    600
  );
  camera.position.set(0, 0, 42);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050508, 1);

  /* --- Crystal Purple palette --- */
  const palette = [
    new THREE.Color(0xb388ff),   // lavender
    new THREE.Color(0xe040fb),   // bright magenta
    new THREE.Color(0x7c4dff),   // deep purple
    new THREE.Color(0xea80fc),   // light magenta
    new THREE.Color(0xd500f9),   // vivid purple
    new THREE.Color(0xce93d8),   // pale purple
    new THREE.Color(0xf8bbd0),   // soft pink
    new THREE.Color(0xffffff),   // white core
  ];

  /* ---- Generate dense crystalline sphere of nodes ---- */
  const NODE_COUNT = 500;
  const nodes = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const LAYERS = 6;

  for (let layer = 0; layer < LAYERS; layer++) {
    const radius = 4 + layer * 3.4;
    const count = Math.floor(NODE_COUNT / LAYERS) + (layer < 2 ? 20 : 0);

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / Math.max(count - 1, 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * (i + layer * 23);

      const jitter = 0.5 + layer * 0.15;
      const pos = new THREE.Vector3(
        radius * radiusAtY * Math.cos(theta) + (Math.random() - 0.5) * jitter,
        radius * y + (Math.random() - 0.5) * jitter,
        radius * radiusAtY * Math.sin(theta) + (Math.random() - 0.5) * jitter
      );

      const isCore = layer <= 1;
      nodes.push({
        position: pos,
        size: isCore
          ? THREE.MathUtils.randFloat(1.5, 3.0)
          : THREE.MathUtils.randFloat(0.6, 1.8),
        color: palette[Math.random() < 0.15 ? 7 : Math.floor(Math.random() * 7)],
        layer,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: THREE.MathUtils.randFloat(0.4, 1.8)
      });
    }
  }

  /* ---- Build dense connections ---- */
  const connections = [];
  const MAX_DIST = 9.5;
  const MAX_PER_NODE = 6;

  for (let i = 0; i < nodes.length; i++) {
    const neighbors = [];
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = nodes[i].position.distanceTo(nodes[j].position);
      if (dist < MAX_DIST) {
        neighbors.push({ idx: j, dist });
      }
    }
    neighbors.sort((a, b) => a.dist - b.dist);
    const limit = Math.min(MAX_PER_NODE, neighbors.length);
    for (let k = 0; k < limit; k++) {
      connections.push({
        from: i,
        to: neighbors[k].idx,
        strength: 1 - neighbors[k].dist / MAX_DIST
      });
    }
  }

  /* ---- Node particles with STARBURST sparkle shader ---- */
  const positions = new Float32Array(nodes.length * 3);
  const colors = new Float32Array(nodes.length * 3);
  const sizes = new Float32Array(nodes.length);
  const phases = new Float32Array(nodes.length);
  const speeds = new Float32Array(nodes.length);

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    positions[i * 3]     = n.position.x;
    positions[i * 3 + 1] = n.position.y;
    positions[i * 3 + 2] = n.position.z;
    colors[i * 3]     = n.color.r;
    colors[i * 3 + 1] = n.color.g;
    colors[i * 3 + 2] = n.color.b;
    sizes[i]   = n.size;
    phases[i]  = n.pulsePhase;
    speeds[i]  = n.pulseSpeed;
  }

  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  nodeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  nodeGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  nodeGeo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  nodeGeo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

  const nodeMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      attribute float phase;
      attribute float speed;
      varying vec3 vColor;
      varying float vPulse;
      uniform float uTime;

      void main() {
        vColor = color;
        float pulse = sin(uTime * speed + phase) * 0.3 + 0.7;
        vPulse = pulse;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * pulse * (600.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vPulse;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float dist = length(uv);
        if (dist > 0.5) discard;

        // Bright core
        float core = smoothstep(0.12, 0.0, dist);

        // Soft glow halo
        float glow = exp(-dist * 5.0) * 0.9;

        // STARBURST RAYS - 4 spikes at 45 degree angles
        float angle = atan(uv.y, uv.x);
        float spike4 = pow(abs(cos(angle * 2.0)), 12.0);      // 4-point star
        float spike8 = pow(abs(cos(angle * 4.0)), 20.0) * 0.4; // 8-point fine rays
        float spikes = (spike4 + spike8) * exp(-dist * 3.0) * 0.6;

        // Outer diffuse fringe
        float fringe = exp(-dist * 2.5) * 0.2;

        vec3 white = vec3(1.0);
        vec3 coreColor = mix(vColor, white, core * 0.8);
        vec3 spikeColor = mix(vColor, white, 0.5);
        vec3 finalColor = coreColor * (core + glow) + spikeColor * spikes + vColor * fringe;

        float alpha = (core + glow + spikes + fringe) * vPulse;
        alpha = min(alpha, 1.0);
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  scene.add(new THREE.Points(nodeGeo, nodeMat));

  /* ---- Synapse connection lines ---- */
  const linePos = new Float32Array(connections.length * 6);
  const lineCol = new Float32Array(connections.length * 6);

  for (let i = 0; i < connections.length; i++) {
    const c = connections[i];
    const a = nodes[c.from], b = nodes[c.to];
    linePos[i*6]   = a.position.x;  linePos[i*6+1] = a.position.y;  linePos[i*6+2] = a.position.z;
    linePos[i*6+3] = b.position.x;  linePos[i*6+4] = b.position.y;  linePos[i*6+5] = b.position.z;

    const mix = a.color.clone().lerp(b.color, 0.5);
    lineCol[i*6]   = mix.r; lineCol[i*6+1] = mix.g; lineCol[i*6+2] = mix.b;
    lineCol[i*6+3] = mix.r; lineCol[i*6+4] = mix.g; lineCol[i*6+5] = mix.b;
  }

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3));

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  /* ---- SIGNAL PULSES - traveling along synapses ---- */
  const PULSE_COUNT = 120;

  // Each pulse: which connection, progress (0-1), speed, delay
  const pulseState = [];
  for (let i = 0; i < PULSE_COUNT; i++) {
    pulseState.push({
      connIdx: Math.floor(Math.random() * connections.length),
      progress: Math.random(), // 0 to 1
      speed: THREE.MathUtils.randFloat(0.3, 1.2),
      size: THREE.MathUtils.randFloat(0.8, 2.0)
    });
  }

  const pulsePositions = new Float32Array(PULSE_COUNT * 3);
  const pulseSizes = new Float32Array(PULSE_COUNT);
  const pulseAlphas = new Float32Array(PULSE_COUNT);

  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
  pulseGeo.setAttribute('size', new THREE.BufferAttribute(pulseSizes, 1));
  pulseGeo.setAttribute('alpha', new THREE.BufferAttribute(pulseAlphas, 1));

  const pulseMat = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float size;
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (500.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float dist = length(uv);
        if (dist > 0.5) discard;

        float core = smoothstep(0.08, 0.0, dist);
        float glow = exp(-dist * 6.0) * 0.8;
        float outer = exp(-dist * 3.0) * 0.3;

        vec3 white = vec3(1.0, 0.95, 1.0);
        vec3 pink = vec3(0.9, 0.5, 1.0);
        vec3 color = mix(pink, white, core);

        float a = (core + glow + outer) * vAlpha;
        gl_FragColor = vec4(color, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
  scene.add(pulsePoints);

  // Update pulse positions each frame
  function updatePulses(dt) {
    for (let i = 0; i < PULSE_COUNT; i++) {
      const p = pulseState[i];
      p.progress += p.speed * dt;

      // When pulse reaches the end, pick a new random connection
      if (p.progress >= 1.0) {
        // Try to chain -- move to a connection starting from the destination node
        const prevConn = connections[p.connIdx];
        const destNode = prevConn.to;
        const nextConns = connections
          .map((c, idx) => ({ c, idx }))
          .filter(({ c }) => c.from === destNode || c.to === destNode);

        if (nextConns.length > 0 && Math.random() > 0.3) {
          // Chain to a neighbor connection (signal propagation!)
          const pick = nextConns[Math.floor(Math.random() * nextConns.length)];
          p.connIdx = pick.idx;
          // If we arrived at "to", start from "from" side matching destination
          p.progress = 0;
        } else {
          // Random restart
          p.connIdx = Math.floor(Math.random() * connections.length);
          p.progress = 0;
        }
        p.speed = THREE.MathUtils.randFloat(0.3, 1.2);
      }

      const conn = connections[p.connIdx];
      const fromPos = nodes[conn.from].position;
      const toPos = nodes[conn.to].position;
      const t = p.progress;

      // Interpolate position along connection
      pulsePositions[i * 3]     = fromPos.x + (toPos.x - fromPos.x) * t;
      pulsePositions[i * 3 + 1] = fromPos.y + (toPos.y - fromPos.y) * t;
      pulsePositions[i * 3 + 2] = fromPos.z + (toPos.z - fromPos.z) * t;

      // Brightness peaks in middle of travel, fades at endpoints
      const edgeFade = Math.sin(t * Math.PI);
      pulseSizes[i] = p.size * (0.6 + edgeFade * 0.4);
      pulseAlphas[i] = edgeFade * 0.9 + 0.1;
    }

    pulseGeo.attributes.position.needsUpdate = true;
    pulseGeo.attributes.size.needsUpdate = true;
    pulseGeo.attributes.alpha.needsUpdate = true;
  }

  /* ---- Central radial glow ---- */
  const glowGeo = new THREE.PlaneGeometry(55, 55);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c);
        float pulse = sin(uTime * 0.25) * 0.08 + 0.92;
        float glow = exp(-d * 3.2) * 0.22 * pulse;
        float outer = exp(-d * 1.8) * 0.06;
        vec3 purple = vec3(0.45, 0.22, 0.7);
        vec3 pink = vec3(0.85, 0.25, 0.95);
        vec3 col = mix(pink, purple, d * 2.0);
        gl_FragColor = vec4(col, glow + outer);
      }
    `,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  glowMesh.position.z = -6;
  scene.add(glowMesh);

  /* ---- SPARKLY STARFIELD - 5000 twinkling stars ---- */
  const STAR_COUNT = 5000;
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starSz = new Float32Array(STAR_COUNT);
  const starPhase = new Float32Array(STAR_COUNT);
  const starSpeed = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    const r = THREE.MathUtils.randFloat(30, 300);
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
    starPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i*3+2] = r * Math.cos(phi);
    starSz[i]    = THREE.MathUtils.randFloat(0.04, 0.22);
    starPhase[i] = Math.random() * Math.PI * 2;
    starSpeed[i] = THREE.MathUtils.randFloat(1.0, 5.0);
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(starSz, 1));
  starGeo.setAttribute('phase', new THREE.BufferAttribute(starPhase, 1));
  starGeo.setAttribute('speed', new THREE.BufferAttribute(starSpeed, 1));

  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float size;
      attribute float phase;
      attribute float speed;
      varying float vTwinkle;
      uniform float uTime;
      void main() {
        // Each star twinkles independently at its own speed
        float twinkle = sin(uTime * speed + phase);
        // Sharp sparkle: most of the time dim, occasional bright flash
        vTwinkle = smoothstep(0.3, 1.0, twinkle);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (1.0 + vTwinkle * 2.0) * (180.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vTwinkle;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float dist = length(uv);
        if (dist > 0.5) discard;

        // Sparkle cross pattern for bright stars
        float angle = atan(uv.y, uv.x);
        float cross = pow(abs(cos(angle * 2.0)), 8.0) * vTwinkle;

        float core = smoothstep(0.15, 0.0, dist);
        float glow = exp(-dist * 6.0) * 0.5;
        float sparkle = cross * exp(-dist * 3.0) * 0.4;

        vec3 color = mix(vec3(0.6, 0.5, 0.85), vec3(1.0), core);
        float alpha = (core + glow + sparkle) * (0.3 + vTwinkle * 0.7);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  scene.add(new THREE.Points(starGeo, starMat));

  /* ---- Animation loop ---- */
  let time = 0;
  let rotY = 0;
  let mouseX = 0, mouseY = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.012;
    rotY += 0.0003;

    scene.rotation.y = rotY + mouseX * 0.04;
    scene.rotation.x = Math.sin(time * 0.1) * 0.06 + mouseY * 0.025;

    nodeMat.uniforms.uTime.value = time;
    starMat.uniforms.uTime.value = time;
    glowMat.uniforms.uTime.value = time;

    // Advance signal pulses along synapses
    updatePulses(0.012);

    renderer.render(scene, camera);
  }
  animate();

  /* ---- Mouse parallax ---- */
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ---- Resize ---- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });
})();
