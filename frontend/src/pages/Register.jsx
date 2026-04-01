import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as THREE from 'three';
import './Register.css';

/* ─────────────────────────────────────────────────
   THREE.JS CANVAS  –  same space theme, different
   geometry combo so it feels fresh vs Login page
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
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    // Lights — shifted to teal + pink + amber for a different vibe
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);

    const pl1 = new THREE.PointLight(0x06b6d4, 3, 20);   // cyan
    pl1.position.set(-3, 4, 3);
    scene.add(pl1);

    const pl2 = new THREE.PointLight(0xf43f5e, 2.5, 18); // rose
    pl2.position.set(4, -2, 2);
    scene.add(pl2);

    const pl3 = new THREE.PointLight(0xfbbf24, 1.8, 15); // amber
    pl3.position.set(-1, -5, 1);
    scene.add(pl3);

    // Materials
    const glassMat = (color, opacity = 0.16) =>
      new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity,
        shininess: 130,
        specular: new THREE.Color(0xffffff),
        side: THREE.DoubleSide,
      });
    const wireMat = (color) =>
      new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.22 });

    const shapes = [];

    // Large torus knot — eye-catching centrepiece
    const knotGeo = new THREE.TorusKnotGeometry(0.9, 0.28, 128, 16);
    const knotMesh = new THREE.Mesh(knotGeo, glassMat(0x06b6d4, 0.2));
    knotMesh.position.set(2, 0.5, -1);
    scene.add(knotMesh);
    shapes.push({ mesh: knotMesh, speed: { x: 0.004, y: 0.007, z: 0.003 }, float: { speed: 0.0009, amp: 0.35 } });

    // Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(1.1, 0);
    const icoMesh = new THREE.Mesh(icoGeo, glassMat(0xf43f5e, 0.18));
    icoMesh.position.set(-2.8, 0, -0.5);
    scene.add(icoMesh);
    shapes.push({ mesh: icoMesh, speed: { x: 0.005, y: -0.004, z: 0.006 }, float: { speed: 0.0011, amp: 0.3 } });

    // Icosahedron wireframe overlay
    const icoWire = new THREE.Mesh(icoGeo, wireMat(0xa5f3fc));
    icoWire.position.copy(icoMesh.position);
    scene.add(icoWire);
    shapes.push({ mesh: icoWire, speed: { x: 0.005, y: -0.004, z: 0.006 }, float: { speed: 0.0011, amp: 0.3 } });

    // Octahedron
    const octaGeo = new THREE.OctahedronGeometry(0.8, 0);
    const octaMesh = new THREE.Mesh(octaGeo, glassMat(0xfbbf24, 0.22));
    octaMesh.position.set(0, -3, 0.5);
    scene.add(octaMesh);
    shapes.push({ mesh: octaMesh, speed: { x: 0.007, y: 0.005, z: -0.004 }, float: { speed: 0.0013, amp: 0.28 } });

    // Small tetrahedra
    const tetraGeo = new THREE.TetrahedronGeometry(0.5, 0);
    [
      { pos: [-1, 3, 0.5], col: 0xa78bfa },
      { pos: [3.5, -2, 0], col: 0x34d399 },
      { pos: [-3.5, -1.5, -0.5], col: 0xfb7185 },
      { pos: [1, 3.5, 0], col: 0x38bdf8 },
    ].forEach(({ pos, col }, i) => {
      const m = new THREE.Mesh(tetraGeo, glassMat(col, 0.24));
      m.position.set(...pos);
      scene.add(m);
      shapes.push({ mesh: m, speed: { x: 0.006 + i * 0.002, y: -0.004 + i * 0.003, z: 0.005 }, float: { speed: 0.001 + i * 0.0003, amp: 0.22 } });
    });

    // Cone
    const coneGeo = new THREE.ConeGeometry(0.6, 1.4, 6, 1);
    const coneMesh = new THREE.Mesh(coneGeo, glassMat(0x818cf8, 0.2));
    coneMesh.position.set(-1, -2.5, 0.5);
    scene.add(coneMesh);
    shapes.push({ mesh: coneMesh, speed: { x: -0.005, y: 0.008, z: 0.004 }, float: { speed: 0.0008, amp: 0.4 } });

    // Particle field
    const pCount = 220;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 22;
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xa5f3fc, size: 0.04, transparent: true, opacity: 0.65, sizeAttenuation: true })
    );
    scene.add(particles);

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

    let raf, t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.01;

      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      shapes.forEach((s, i) => {
        s.mesh.rotation.x += s.speed.x;
        s.mesh.rotation.y += s.speed.y;
        s.mesh.rotation.z += s.speed.z;
        s.mesh.position.y += Math.sin(t * s.float.speed * 100 + i) * s.float.amp * 0.01;
      });

      particles.rotation.y += 0.0006;
      particles.rotation.x += 0.0002;

      pl1.intensity = 3 + Math.sin(t * 0.9) * 0.9;
      pl2.intensity = 2.5 + Math.cos(t * 1.3) * 0.7;

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
