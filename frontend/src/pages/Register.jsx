import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as THREE from 'three';
import './Register.css';

/* ─────────────────────────────────────────────────
   THREE.JS CANVAS  –  Joining a live collaboration
   Four cursors on a central document + two ghost docs
   flanking the sides — showing a shared workspace.
   ───────────────────────────────────────────────── */
function ThreeCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050818, 0.026);
    const camera = new THREE.PerspectiveCamera(54, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camera.position.set(0, 0, 24);

    // ── Main document ──
    const DOC_W = 10, DOC_H = 13;
    const docGroup = new THREE.Group();
    docGroup.rotation.set(-0.04, 0.12, -0.02);
    scene.add(docGroup);

    const paperGeo = new THREE.PlaneGeometry(DOC_W, DOC_H);
    docGroup.add(new THREE.Mesh(
      paperGeo,
      new THREE.MeshBasicMaterial({ color: 0x0e0720, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
    ));
    docGroup.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(paperGeo),
      new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.5 })
    ));

    // Text rows
    const ROWS = 13;
    const TOP_Y = DOC_H / 2 - 1.1;
    const STEP_Y = (DOC_H - 2.2) / ROWS;
    const rows = [];
    for (let i = 0; i < ROWS; i++) {
      const y = TOP_Y - i * STEP_Y;
      const halfW = i === 0 ? 2.6 : 1.6 + Math.random() * 2.6;
      docGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-halfW, y, 0.01),
          new THREE.Vector3( halfW, y, 0.01),
        ]),
        new THREE.LineBasicMaterial({
          color: 0xa5f3fc,
          transparent: true,
          opacity: i === 0 ? 0.4 : 0.16 + Math.random() * 0.12,
        })
      ));
      rows.push({ y, halfW });
    }

    // ── 4 Cursors (last one = new member joining) ──
    const CURSOR_CONFIGS = [
      { color: 0x7c3aed, rowIdx: 1,  phase: 0.0, speed: 0.007 },
      { color: 0x06b6d4, rowIdx: 4,  phase: 1.6, speed: 0.0055 },
      { color: 0x10b981, rowIdx: 7,  phase: 3.1, speed: 0.009 },
      { color: 0xf43f5e, rowIdx: 11, phase: 4.7, speed: 0.006 },
    ];

    const cursors = CURSOR_CONFIGS.map((cfg) => {
      const row = rows[cfg.rowIdx];
      const curGeo = new THREE.PlaneGeometry(0.09, 0.48);
      const curMat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.9 });
      const curMesh = new THREE.Mesh(curGeo, curMat);
      curMesh.position.set(-row.halfW, row.y, 0.02);

      const labelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 0.3),
        new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.8 })
      );
      labelMesh.position.set(0.5, 0.38, 0.01);
      curMesh.add(labelMesh);

      docGroup.add(curMesh);
      return { curMesh, curMat, cfg, row };
    });

    // ── Side ghost documents ──
    const makeGhost = (x, y, z, rotY, borderColor) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.set(0.02, rotY, 0);
      const gGeo = new THREE.PlaneGeometry(6, 8);
      g.add(new THREE.Mesh(gGeo,
        new THREE.MeshBasicMaterial({ color: 0x0c0618, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
      ));
      g.add(new THREE.LineSegments(new THREE.EdgesGeometry(gGeo),
        new THREE.LineBasicMaterial({ color: borderColor, transparent: true, opacity: 0.25 })
      ));
      for (let i = 0; i < 7; i++) {
        const w = 0.9 + Math.random() * 2.2;
        const gy = 3.2 - i * 0.85;
        g.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w, gy, 0.01), new THREE.Vector3(w, gy, 0.01),
          ]),
          new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.14 })
        ));
      }
      scene.add(g);
      return g;
    };

    const ghostL = makeGhost(-9,  0.5, -6,  0.48, 0x7c3aed);
    const ghostR = makeGhost( 9, -0.5, -6, -0.48, 0x06b6d4);

    // Mouse parallax
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

    const clock = new THREE.Clock();
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      docGroup.position.y = Math.sin(t * 0.25) * 0.22;
      docGroup.rotation.z = Math.sin(t * 0.2) * 0.015;

      ghostL.position.y =  0.5 + Math.sin(t * 0.3)        * 0.18;
      ghostR.position.y = -0.5 + Math.sin(t * 0.26 + 1.0) * 0.18;

      cursors.forEach(({ curMesh, curMat, cfg, row }) => {
        curMesh.position.x = Math.sin(t * cfg.speed * 60 + cfg.phase) * row.halfW * 0.82;
        curMat.opacity = 0.55 + 0.45 * Math.abs(Math.sin(t * 2.6 + cfg.phase));
      });

      camera.position.x += (mouse.x * 2.8 - camera.position.x) * 0.025;
      camera.position.y += (mouse.y * 1.8 - camera.position.y) * 0.025;
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

  return <div ref={mountRef} className="reg-three-canvas" />;
}

/* ─────────────────────────────────────────────────
   PASSWORD STRENGTH METER
   ───────────────────────────────────────────────── */
function PasswordStrength({ password }) {
  const score =
    password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
    : 3;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#f87171', '#fbbf24', '#34d399', '#a78bfa'];

  if (!password) return null;
  return (
    <div className="reg-strength">
      <div className="reg-strength__bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="reg-strength__bar"
            style={{ background: i <= score ? colors[score] : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </div>
      <span className="reg-strength__label" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   MAIN REGISTER COMPONENT
   ───────────────────────────────────────────────── */
export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  return (
    <div className="reg-root">
      {/* ── THREE.JS BACKGROUND ── */}
      <ThreeCanvas />

      {/* ── AURORA BLOBS ── */}
      <div className="reg-aurora">
        <div className="reg-aurora__blob reg-aurora__blob--1" />
        <div className="reg-aurora__blob reg-aurora__blob--2" />
        <div className="reg-aurora__blob reg-aurora__blob--3" />
      </div>

      {/* ── GRID OVERLAY ── */}
      <div className="reg-grid-overlay" />

      {/* ── GLASS CARD ── */}
      <div className="reg-glass-card">

        {/* Logo */}
        <div className="reg-logo">
          <div className="reg-logo__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(165,243,252,0.25)" />
              <path d="M7 8h10M7 12h6M7 16h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 13l3-3-1.5-1.5-3 3V13h1.5z" fill="white" />
            </svg>
          </div>
          <span className="reg-logo__name">CollabDoc</span>
        </div>

        {/* Heading */}
        <div className="reg-heading">
          <h1 className="reg-heading__title">Create account</h1>
          <p className="reg-heading__sub">Start collaborating — free forever</p>
        </div>

        {/* Error */}
        {error && (
          <div className="reg-error" role="alert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* Google button — top for reduced friction */}
        <button
          type="button"
          id="register-google-btn"
          onClick={() => alert('Google sign-up coming soon!')}
          className="reg-btn-google"
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Sign up with Google
        </button>

        {/* Divider */}
        <div className="reg-divider"><span>or sign up with email</span></div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="reg-form" noValidate>

          {/* Full name */}
          <div className={`reg-field ${focused === 'name' ? 'reg-field--focused' : ''}`}>
            <label htmlFor="reg-name" className="reg-field__label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="reg-field__icon">
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Full name
            </label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused('')}
              className="reg-field__input"
              placeholder="Arjun Gogu"
              required
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div className={`reg-field ${focused === 'email' ? 'reg-field--focused' : ''}`}>
            <label htmlFor="reg-email" className="reg-field__label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="reg-field__icon">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="2" />
              </svg>
              Email address
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
              className="reg-field__input"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className={`reg-field ${focused === 'password' ? 'reg-field--focused' : ''}`}>
            <label htmlFor="reg-password" className="reg-field__label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="reg-field__icon">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Password
            </label>
            <div className="reg-field__input-wrap">
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                className="reg-field__input reg-field__input--pass"
                placeholder="Min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="reg-field__eye"
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
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div className={`reg-field ${focused === 'confirm' ? 'reg-field--focused' : ''}`}>
            <label htmlFor="reg-confirm" className="reg-field__label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="reg-field__icon">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Confirm password
            </label>
            <div className="reg-field__input-wrap">
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused('')}
                className={`reg-field__input reg-field__input--pass ${
                  passwordsMatch ? 'reg-field__input--ok' : ''
                } ${passwordsMismatch ? 'reg-field__input--err' : ''}`}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="reg-field__eye"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? (
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
              {passwordsMatch && (
                <span className="reg-field__match-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
            {passwordsMismatch && (
              <span className="reg-field__hint reg-field__hint--err">Passwords don't match</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="register-submit-btn"
            disabled={loading}
            className="reg-btn-primary"
          >
            {loading ? (
              <>
                <span className="reg-spinner" />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="reg-btn-primary__arrow">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Terms */}
        <p className="reg-terms">
          By signing up you agree to our{' '}
          <a href="#" className="reg-terms__link">Terms</a> &amp;{' '}
          <a href="#" className="reg-terms__link">Privacy Policy</a>
        </p>

        {/* Sign-in link */}
        <p className="reg-login-link">
          Already have an account?{' '}
          <Link to="/login" className="reg-login-link__a">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
