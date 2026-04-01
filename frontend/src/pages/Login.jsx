import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as THREE from 'three';
import './Login.css';

/* ─────────────────────────────────────────────────
   THREE.JS CANVAS  –  Floating geometry + aurora
   ───────────────────────────────────────────────── */
function ThreeCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene & Camera ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    // ── Lights ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x7c3aed, 3, 20);
    pointLight1.position.set(3, 4, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 2, 20);
    pointLight2.position.set(-4, -2, 2);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xf43f5e, 1.5, 15);
    pointLight3.position.set(0, -5, 1);
    scene.add(pointLight3);

    // ── Materials ──
    const glassMat = (color, opacity = 0.15) =>
      new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity,
        shininess: 120,
        specular: new THREE.Color(0xffffff),
        side: THREE.DoubleSide,
        wireframe: false,
      });

    const wireMat = (color) =>
      new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.25 });

    // ── Geometries ──
    const shapes = [];

    // Icosahedron (large central)
    const icosaGeo = new THREE.IcosahedronGeometry(1.4, 0);
    const icosaMesh = new THREE.Mesh(icosaGeo, glassMat(0x7c3aed, 0.18));
    icosaMesh.position.set(-1.5, 0.5, -1);
    scene.add(icosaMesh);
    shapes.push({ mesh: icosaMesh, speed: { x: 0.003, y: 0.005, z: 0.002 }, float: { y: 0, speed: 0.0008, amp: 0.4 } });

    // Icosahedron wireframe overlay
    const icosaWire = new THREE.Mesh(icosaGeo, wireMat(0xa78bfa));
    icosaWire.position.copy(icosaMesh.position);
    scene.add(icosaWire);
    shapes.push({ mesh: icosaWire, speed: { x: 0.003, y: 0.005, z: 0.002 }, float: { y: 0, speed: 0.0008, amp: 0.4 } });

    // Octahedron
    const octaGeo = new THREE.OctahedronGeometry(0.9, 0);
    const octaMesh = new THREE.Mesh(octaGeo, glassMat(0x06b6d4, 0.2));
    octaMesh.position.set(2.8, -1.5, 0);
    scene.add(octaMesh);
    shapes.push({ mesh: octaMesh, speed: { x: 0.006, y: -0.004, z: 0.003 }, float: { y: 0, speed: 0.0012, amp: 0.3 } });

    // Torus
    const torusGeo = new THREE.TorusGeometry(0.75, 0.22, 16, 80);
    const torusMesh = new THREE.Mesh(torusGeo, glassMat(0xf43f5e, 0.22));
    torusMesh.position.set(-3.2, -2, 0.5);
    scene.add(torusMesh);
    shapes.push({ mesh: torusMesh, speed: { x: 0.008, y: 0.003, z: 0.01 }, float: { y: 0, speed: 0.001, amp: 0.25 } });

    // Small tetrahedra scattered
    const tetraGeo = new THREE.TetrahedronGeometry(0.55, 0);
    const tetraPositions = [
      [3, 2.5, -1],
      [-2, 2.8, 0.5],
      [1.5, -3, 0.8],
      [-3.5, 0.5, -0.5],
    ];
    tetraPositions.forEach(([x, y, z], i) => {
      const m = new THREE.Mesh(
        tetraGeo,
        glassMat([0x818cf8, 0x34d399, 0xfbbf24, 0xf472b6][i], 0.25)
      );
      m.position.set(x, y, z);
      scene.add(m);
      shapes.push({ mesh: m, speed: { x: 0.007 + i * 0.002, y: -0.005 + i * 0.003, z: 0.004 }, float: { y: 0, speed: 0.0009 + i * 0.0003, amp: 0.2 } });
    });

    // Dodecahedron
    const dodecaGeo = new THREE.DodecahedronGeometry(0.7, 0);
    const dodecaMesh = new THREE.Mesh(dodecaGeo, glassMat(0x10b981, 0.18));
    dodecaMesh.position.set(0.5, 3, -0.5);
    scene.add(dodecaMesh);
    shapes.push({ mesh: dodecaMesh, speed: { x: -0.004, y: 0.007, z: 0.003 }, float: { y: 0, speed: 0.0007, amp: 0.35 } });

    // ── Particle field ──
    const particleCount = 200;
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      pPositions[i] = (Math.random() - 0.5) * 20;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xc4b5fd,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Mouse parallax ──
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Resize handler ──
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ──
    let raf;
    let t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.01;

      // Parallax camera
      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Rotate & float shapes
      shapes.forEach((s, i) => {
        s.mesh.rotation.x += s.speed.x;
        s.mesh.rotation.y += s.speed.y;
        s.mesh.rotation.z += s.speed.z;
        s.mesh.position.y += Math.sin(t * s.float.speed * 100 + i) * s.float.amp * 0.01;
      });

      // Rotate particles slowly
      particles.rotation.y += 0.0005;

      // Pulse lights
      pointLight1.intensity = 3 + Math.sin(t * 0.8) * 0.8;
      pointLight2.intensity = 2 + Math.cos(t * 1.1) * 0.6;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="login-three-canvas" />;
}

/* ─────────────────────────────────────────────────
   MAIN LOGIN COMPONENT
   ───────────────────────────────────────────────── */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ── FULL-SCREEN THREE.JS BACKGROUND ── */}
      <ThreeCanvas />

      {/* ── AURORA OVERLAY ── */}
      <div className="login-aurora">
        <div className="login-aurora__blob login-aurora__blob--1" />
        <div className="login-aurora__blob login-aurora__blob--2" />
        <div className="login-aurora__blob login-aurora__blob--3" />
      </div>

      {/* ── GRID OVERLAY ── */}
      <div className="login-grid-overlay" />

      {/* ── GLASS CARD ── */}
      <div className="login-glass-card">

        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(167,139,250,0.3)" />
              <path d="M7 8h10M7 12h6M7 16h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 13l3-3-1.5-1.5-3 3V13h1.5z" fill="white" />
            </svg>
          </div>
          <span className="login-logo__name">CollabDoc</span>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1 className="login-heading__title">Welcome back</h1>
          <p className="login-heading__sub">Sign in to continue collaborating</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error" role="alert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>

          {/* Email */}
          <div className={`login-field ${focused === 'email' ? 'login-field--focused' : ''}`}>
            <label htmlFor="login-email" className="login-field__label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="login-field__icon">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="2" />
              </svg>
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
              className="login-field__input"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className={`login-field ${focused === 'password' ? 'login-field--focused' : ''}`}>
            <label htmlFor="login-password" className="login-field__label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="login-field__icon">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Password
            </label>
            <div className="login-field__input-wrap">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                className="login-field__input login-field__input--pass"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="login-field__eye"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="login-btn-primary"
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                Authenticating…
              </>
            ) : (
              <>
                Sign in
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="login-btn-primary__arrow">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider"><span>or continue with</span></div>

        {/* Google */}
        <button
          type="button"
          id="login-google-btn"
          onClick={() => alert('Google sign-in coming soon!')}
          className="login-btn-google"
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>

        {/* Sign-up link */}
        <p className="login-signup-link">
          No account?{' '}
          <Link to="/register" className="login-signup-link__a">Create one free →</Link>
        </p>

        {/* Social proof bar */}
        <div className="login-proof">
          <div className="login-proof__avatars">
            {['#7c3aed', '#06b6d4', '#10b981', '#f43f5e', '#f59e0b'].map((c, i) => (
              <span key={i} className="login-proof__avatar" style={{ background: c }} />
            ))}
          </div>
          <span className="login-proof__text"><strong>10,000+</strong> teams collaborating</span>
        </div>
      </div>
    </div>
  );
}
