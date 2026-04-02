import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Scene Setup ────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Particles ──────────────────────────────────────────────────
    const PARTICLE_COUNT = 180;
    const positions = [];
    const velocities = [];
    const colors = [];
    const palette = [
      new THREE.Color('#7c3aed'), // violet-600
      new THREE.Color('#8b5cf6'), // violet-500
      new THREE.Color('#a78bfa'), // violet-400
      new THREE.Color('#c4b5fd'), // violet-300
      new THREE.Color('#4f46e5'), // indigo-600
      new THREE.Color('#6366f1'), // indigo-500
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions.push(
        (Math.random() - 0.5) * 160,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 60
      );
      velocities.push(
        (Math.random() - 0.5) * 0.06,
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.02
      );
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors.push(c.r, c.g, c.b);
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Custom circular sprite texture
    const canvas2d = document.createElement('canvas');
    canvas2d.width = 64;
    canvas2d.height = 64;
    const ctx2d = canvas2d.getContext('2d');
    const gradient = ctx2d.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(167,139,250,0.8)');
    gradient.addColorStop(1, 'rgba(124,58,237,0)');
    ctx2d.fillStyle = gradient;
    ctx2d.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(canvas2d);

    const particleMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      map: sprite,
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Connection Lines ───────────────────────────────────────────
    const MAX_DIST = 28;
    const linePositions = [];
    const lineColors = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        linePositions.push(0, 0, 0, 0, 0, 0); // placeholders
        lineColors.push(0, 0, 0, 0, 0, 0);
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    const posAttr = new THREE.Float32BufferAttribute(linePositions, 3);
    const colAttr = new THREE.Float32BufferAttribute(lineColors, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    lineGeo.setAttribute('position', posAttr);
    lineGeo.setAttribute('color', colAttr);

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineSegments);

    // ── Mouse Parallax ─────────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ── Resize ─────────────────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // ── Animation Loop ─────────────────────────────────────────────
    let frameId;
    const posArr = particleGeo.attributes.position.array;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Move particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
        posArr[ix] += velocities[ix];
        posArr[iy] += velocities[iy];
        posArr[iz] += velocities[iz];

        // Bounce
        if (posArr[ix] > 80 || posArr[ix] < -80) velocities[ix] *= -1;
        if (posArr[iy] > 50 || posArr[iy] < -50) velocities[iy] *= -1;
        if (posArr[iz] > 30 || posArr[iz] < -30) velocities[iz] *= -1;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Update connection lines
      const lPos = lineGeo.attributes.position.array;
      const lCol = lineGeo.attributes.color.array;
      let lineIdx = 0;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const ax = posArr[i * 3], ay = posArr[i * 3 + 1], az = posArr[i * 3 + 2];
          const bx = posArr[j * 3], by = posArr[j * 3 + 1], bz = posArr[j * 3 + 2];
          const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2);

          if (dist < MAX_DIST) {
            const alpha = 1 - dist / MAX_DIST;
            const r = 0.55 * alpha, g = 0.27 * alpha, b = 0.93 * alpha;
            lPos[lineIdx * 6] = ax; lPos[lineIdx * 6 + 1] = ay; lPos[lineIdx * 6 + 2] = az;
            lPos[lineIdx * 6 + 3] = bx; lPos[lineIdx * 6 + 4] = by; lPos[lineIdx * 6 + 5] = bz;
            lCol[lineIdx * 6] = r; lCol[lineIdx * 6 + 1] = g; lCol[lineIdx * 6 + 2] = b;
            lCol[lineIdx * 6 + 3] = r; lCol[lineIdx * 6 + 4] = g; lCol[lineIdx * 6 + 5] = b;
          } else {
            // Hide disconnected lines by zeroing them
            for (let k = 0; k < 6; k++) {
              lPos[lineIdx * 6 + k] = 0;
              lCol[lineIdx * 6 + k] = 0;
            }
          }
          lineIdx++;
        }
      }

      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.color.needsUpdate = true;

      // Subtle camera parallax
      camera.position.x += (mouse.x * 8 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 4 - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      // Slowly rotate the whole particle group
      particles.rotation.y += 0.0008;
      lineSegments.rotation.y += 0.0008;

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
