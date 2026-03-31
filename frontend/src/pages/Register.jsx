import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

/* ─── Animated particle canvas (shared visual) ─── */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const dots = Array.from({ length: 55 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      dots.forEach((a, i) => {
        dots.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(196,167,255,${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.7;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        });
      });
      dots.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,187,255,${d.alpha})`;
        ctx.fill();
        d.x += d.dx;
        d.y += d.dy;
        if (d.x < 0 || d.x > w) d.dx *= -1;
        if (d.y < 0 || d.y > h) d.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="reg-particles" />;
}

/* ─── Feature pill badge ─── */
function FeaturePill({ icon, label }) {
  return (
    <div className="reg-pill">
      <span className="reg-pill__icon">{icon}</span>
      <span className="reg-pill__label">{label}</span>
    </div>
  );
}

/* ─── Stats card ─── */
function StatCard({ value, label, delay }) {
  return (
    <div className="reg-stat-card" style={{ animationDelay: delay }}>
      <span className="reg-stat-card__value">{value}</span>
      <span className="reg-stat-card__label">{label}</span>
    </div>
  );
}

/* ─── Password strength indicator ─── */
function PasswordStrength({ password }) {
  const score = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
    : 3;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#22c55e', '#7c3aed'];

  if (!password) return null;
  return (
    <div className="reg-strength">
      <div className="reg-strength__bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="reg-strength__bar"
            style={{ background: i <= score ? colors[score] : '#e5e7eb' }}
          />
        ))}
      </div>
      <span className="reg-strength__label" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}

/* ─── Main Register component ─── */
export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      {/* ── LEFT HERO PANEL ── */}
      <aside className="reg-hero">
        <ParticleCanvas />

        {/* Glow orbs */}
        <div className="reg-orb reg-orb--1" />
        <div className="reg-orb reg-orb--2" />
        <div className="reg-orb reg-orb--3" />

        <div className="reg-hero__inner">
          {/* Logo */}
          <div className="reg-logo">
            <div className="reg-logo__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="rgba(255,255,255,0.15)" />
                <path d="M7 8h10M7 12h6M7 16h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 14l3-3-1.5-1.5-3 3V14h1.5z" fill="white" />
              </svg>
            </div>
            <span className="reg-logo__name">CollabDoc</span>
          </div>

          {/* Tagline */}
          <div className="reg-tagline">
            <h2 className="reg-tagline__heading">Start creating<br />together today.</h2>
            <p className="reg-tagline__sub">Join thousands of teams who write,<br />edit, and ship faster with CollabDoc.</p>
          </div>

          {/* Feature pills */}
          <div className="reg-pills">
            <FeaturePill icon="✍️" label="Real-time co-editing" />
            <FeaturePill icon="💬" label="Inline comments" />
            <FeaturePill icon="📂" label="Version history" />
            <FeaturePill icon="🔒" label="Access controls" />
          </div>

          {/* Stats */}
          <div className="reg-stats">
            <StatCard value="10K+" label="Teams" delay="0s" />
            <StatCard value="2M+" label="Documents" delay="0.15s" />
            <StatCard value="99.9%" label="Uptime" delay="0.3s" />
          </div>
        </div>
      </aside>

      {/* ── RIGHT FORM PANEL ── */}
      <main className="reg-form-panel">
        <div className="reg-form-box">
          <div className="reg-form-box__header">
            <h1 className="reg-form-box__title">Create account</h1>
            <p className="reg-form-box__sub">Start collaborating on CollabDoc — free forever</p>
          </div>

          {error && (
            <div className="reg-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#b91c1c" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          {/* Google sign-up first (reduces friction) */}
          <button
            type="button"
            id="register-google-btn"
            onClick={() => alert('Google sign-up coming soon!')}
            className="reg-btn-google"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" className="reg-btn-google__icon">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign up with Google
          </button>

          <div className="reg-divider"><span>or sign up with email</span></div>

          <form onSubmit={handleSubmit} className="reg-form" noValidate>
            {/* Full name */}
            <div className="reg-field">
              <label htmlFor="reg-name" className="reg-field__label">Full name</label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="reg-field__input"
                placeholder="Arjun Gogu"
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="reg-field">
              <label htmlFor="reg-email" className="reg-field__label">Email</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="reg-field__input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="reg-field">
              <label htmlFor="reg-password" className="reg-field__label">
                Password
                <button type="button" onClick={() => setShowPass(!showPass)} className="reg-field__show-pass">
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </label>
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="reg-field__input"
                placeholder="Min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <PasswordStrength password={password} />
            </div>

            {/* Confirm password */}
            <div className="reg-field">
              <label htmlFor="reg-confirm" className="reg-field__label">
                Confirm password
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="reg-field__show-pass">
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </label>
              <div className="reg-field__input-wrap">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`reg-field__input ${passwordsMatch ? 'reg-field__input--ok' : ''} ${passwordsMismatch ? 'reg-field__input--err' : ''}`}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
                {passwordsMatch && (
                  <span className="reg-field__tick">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              {passwordsMismatch && (
                <span className="reg-field__hint reg-field__hint--err">Passwords don't match</span>
              )}
            </div>

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
                'Create account'
              )}
            </button>
          </form>

          <p className="reg-terms">
            By signing up you agree to our{' '}
            <a href="#" className="reg-terms__link">Terms</a> &amp;{' '}
            <a href="#" className="reg-terms__link">Privacy Policy</a>
          </p>

          <p className="reg-login-link">
            Already have an account?{' '}
            <Link to="/login" className="reg-login-link__a">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
