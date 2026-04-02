import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as THREE from 'three';
import './Login.css';

/* ─────────────────────────────────────────────────
   THREE.JS CANVAS  –  Live collaborative editing scene
   A document with active cursors drifting along text rows,
   showing exactly what CollabDoc does in real time.
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
    scene.fog = new THREE.FogExp2(0x050818, 0.028);
    const camera = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camera.position.set(0, 0, 22);

    // ── Main document ──
    const DOC_W = 10, DOC_H = 13;
    const docGroup = new THREE.Group();
    docGroup.rotation.set(0.06, -0.15, 0.02);
    scene.add(docGroup);

    // Paper
    const paperGeo = new THREE.PlaneGeometry(DOC_W, DOC_H);
    docGroup.add(new THREE.Mesh(
      paperGeo,
      new THREE.MeshBasicMaterial({ color: 0x100825, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    ));
    // Border
    docGroup.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(paperGeo),
      new THREE.LineBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.55 })
    ));

    // ── Text rows ──
    const ROWS = 13;
    const TOP_Y = DOC_H / 2 - 1.1;
    const STEP_Y = (DOC_H - 2.2) / ROWS;
    const rows = [];
    for (let i = 0; i < ROWS; i++) {
      const y = TOP_Y - i * STEP_Y;
      const halfW = i === 0 ? 2.8 : 1.8 + Math.random() * 2.4;
      const pts = [
        new THREE.Vector3(-halfW, y, 0.01),
        new THREE.Vector3( halfW, y, 0.01),
      ];
      docGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({
          color: 0xa78bfa,
          transparent: true,
          opacity: i === 0 ? 0.42 : 0.18 + Math.random() * 0.12,
        })
      ));
      rows.push({ y, halfW });
    }

    // ── Collaborator cursors ──
    const CURSOR_CONFIGS = [
      { color: 0x7c3aed, rowIdx: 2, phase: 0.0, speed: 0.008 },
      { color: 0x06b6d4, rowIdx: 5, phase: 2.1, speed: 0.006 },
      { color: 0x10b981, rowIdx: 9, phase: 4.2, speed: 0.009 },
    ];

    const cursors = CURSOR_CONFIGS.map((cfg) => {
      const row = rows[cfg.rowIdx];
      const curGeo = new THREE.PlaneGeometry(0.09, 0.48);
      const curMat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.9 });
      const curMesh = new THREE.Mesh(curGeo, curMat);
      curMesh.position.set(-row.halfW, row.y, 0.02);

      // Label pill
      const labelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 0.3),
        new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.8 })
      );
      labelMesh.position.set(0.5, 0.38, 0.01);
      curMesh.add(labelMesh);

      docGroup.add(curMesh);
      return { curMesh, curMat, cfg, row };
    });

    // ── Ghost secondary document (far right) ──
    const ghostGroup = new THREE.Group();
    ghostGroup.rotation.set(-0.05, 0.42, 0.04);
    ghostGroup.position.set(8, 1, -8);
    const ghostGeo = new THREE.PlaneGeometry(7, 9);
    ghostGroup.add(new THREE.Mesh(
      ghostGeo,
      new THREE.MeshBasicMaterial({ color: 0x0d0622, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    ));
    ghostGroup.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(ghostGeo),
      new THREE.LineBasicMaterial({ color: 0x4f46e5, transparent: true, opacity: 0.28 })
    ));
    for (let i = 0; i < 8; i++) {
      const gW = 1.2 + Math.random() * 2;
      const gY = 3.5 - i * 0.9;
      ghostGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-gW, gY, 0.01),
          new THREE.Vector3( gW, gY, 0.01),
        ]),
        new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.14 })
      ));
    }
    scene.add(ghostGroup);

    // ── Mouse parallax ──
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation ──
    const clock = new THREE.Clock();
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Gentle document breath
      docGroup.position.y = Math.sin(t * 0.28) * 0.25;
      docGroup.rotation.z = Math.sin(t * 0.18) * 0.018;
      ghostGroup.position.y = 1 + Math.sin(t * 0.22) * 0.2;

      // Animate cursors along their rows
      cursors.forEach(({ curMesh, curMat, cfg, row }) => {
        curMesh.position.x = Math.sin(t * cfg.speed * 60 + cfg.phase) * row.halfW * 0.82;
        curMat.opacity = 0.55 + 0.45 * Math.abs(Math.sin(t * 2.8 + cfg.phase));
      });

      // Camera parallax
      camera.position.x += (mouse.x * 2.5 - camera.position.x) * 0.028;
      camera.position.y += (mouse.y * 1.8 - camera.position.y) * 0.028;
      camera.lookAt(scene.position);

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
