import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ─── Helpers ───────────────────────────────────────────────────── */

/** Build a semi-transparent "document" plane with faint ruled lines */
function makeDocument(scene) {
  const group = new THREE.Group();

  // Paper backing
  const paperGeo = new THREE.PlaneGeometry(7, 9);
  const paperMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#1e1040'),
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
  });
  const paper = new THREE.Mesh(paperGeo, paperMat);
  group.add(paper);

  // Border / frame
  const edges = new THREE.EdgesGeometry(paperGeo);
  const borderMat = new THREE.LineBasicMaterial({
    color: new THREE.Color('#7c3aed'),
    transparent: true,
    opacity: 0.55,
  });
  group.add(new THREE.LineSegments(edges, borderMat));

  // Ruled text lines
  const LINE_ROWS = 8;
  const startY = 3.2;
  const stepY  = 0.72;
  for (let i = 0; i < LINE_ROWS; i++) {
    const width = 3.5 + Math.random() * 2.2; // varied line lengths
    const linePts = [
      new THREE.Vector3(-width / 2, startY - i * stepY, 0.01),
      new THREE.Vector3( width / 2, startY - i * stepY, 0.01),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#a78bfa'),
      transparent: true,
      opacity: 0.28 + Math.random() * 0.18,
    });
    group.add(new THREE.Line(lineGeo, lineMat));
  }

  // Glowing "cursor" beacon on a random text line
  const cursorY  = startY - Math.floor(Math.random() * LINE_ROWS) * stepY;
  const cursorX  = -2.5 + Math.random() * 3;
  const cursorGeo = new THREE.PlaneGeometry(0.12, 0.55);
  const cursorMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#c4b5fd'),
    transparent: true,
    opacity: 0.9,
  });
  const cursor   = new THREE.Mesh(cursorGeo, cursorMat);
  cursor.position.set(cursorX, cursorY, 0.02);
  group.add(cursor);

  // Metadata stored on the group so the animation loop can drive it
  group.userData = {
    cursor,
    cursorMat,
    // Slow drift velocities
    vx:    (Math.random() - 0.5) * 0.004,
    vy:    (Math.random() - 0.5) * 0.003,
    vz:    (Math.random() - 0.5) * 0.002,
    vRotX: (Math.random() - 0.5) * 0.0006,
    vRotY: (Math.random() - 0.5) * 0.0006,
    // Cursor blink phase
    blinkPhase: Math.random() * Math.PI * 2,
    // Cursor drift within the doc
    cursorDriftX: 0,
    driftDir: Math.random() > 0.5 ? 1 : -1,
  };

  scene.add(group);
  return group;
}

/** Draw a soft line between two 3D positions (collaboration thread) */
function makeThread(scene, a, b) {
  const pts = [a.clone(), b.clone()];
  const geo  = new THREE.BufferGeometry().setFromPoints(pts);
  const mat  = new THREE.LineBasicMaterial({
    color: new THREE.Color('#6d28d9'),
    transparent: true,
    opacity: 0.18,
  });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  return { line, geo };
}

/* ─── Component ─────────────────────────────────────────────────── */
export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* Scene */
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 500);
    camera.position.set(0, 0, 40);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    /* Ambient soft fog */
    scene.fog = new THREE.FogExp2(0x0d0015, 0.013);

    /* Documents */
    const DOC_COUNT = 7;
    const docs = [];
    for (let i = 0; i < DOC_COUNT; i++) {
      const g = makeDocument(scene);
      g.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 18 - 4,
      );
      g.rotation.set(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.15,
      );
      docs.push(g);
    }

    /* Collaboration threads — connect nearby doc pairs */
    const threads = [];
    for (let i = 0; i < DOC_COUNT; i++) {
      for (let j = i + 1; j < DOC_COUNT; j++) {
        if (docs[i].position.distanceTo(docs[j].position) < 30) {
          threads.push({ a: docs[i], b: docs[j], ...makeThread(scene, docs[i].position, docs[j].position) });
        }
      }
    }

    /* Mouse parallax target */
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.y = (e.clientY / window.clientHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    /* Bounds for document bouncing */
    const BOUNDS = { x: 30, y: 20, z: 12 };

    let frameId;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      /* Drive each document */
      docs.forEach((doc) => {
        const ud = doc.userData;

        // Drift
        doc.position.x += ud.vx;
        doc.position.y += ud.vy;
        doc.position.z += ud.vz;

        // Gentle bounce at bounds
        if (Math.abs(doc.position.x) > BOUNDS.x) ud.vx *= -1;
        if (Math.abs(doc.position.y) > BOUNDS.y) ud.vy *= -1;
        if (Math.abs(doc.position.z) > BOUNDS.z) ud.vz *= -1;

        // Slow self-rotation (like a page tumbling in zero-g)
        doc.rotation.x += ud.vRotX;
        doc.rotation.y += ud.vRotY;

        // Cursor blink
        ud.cursorMat.opacity = 0.5 + 0.5 * Math.sin(t * 2.8 + ud.blinkPhase);

        // Cursor slow horizontal drift
        ud.cursorDriftX += 0.0015 * ud.driftDir;
        if (Math.abs(ud.cursorDriftX) > 0.8) ud.driftDir *= -1;
        ud.cursor.position.x += 0.0015 * ud.driftDir;
      });

      /* Update collaboration threads */
      threads.forEach(({ a, b, geo }) => {
        const pts = [a.position.clone(), b.position.clone()];
        geo.setFromPoints(pts);
        geo.attributes.position.needsUpdate = true;
      });

      /* Smooth camera parallax */
      camera.position.x += (mouse.x * 5 - camera.position.x) * 0.025;
      camera.position.y += (-mouse.y * 3 - camera.position.y) * 0.025;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
