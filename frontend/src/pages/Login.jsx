import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

/* ─── Animated particle canvas ─── */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const dots = Array.from({ length: 60 }, () => ({
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

      // Draw connection lines
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

      // Draw dots
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

  return <canvas ref={canvasRef} className="login-particles" />;
}

/* ─── Floating doc card ─── */
function DocCard({ title, excerpt, avatars, delay }) {
  return (
    <div className="login-doc-card" style={{ animationDelay: delay }}>
      <div className="login-doc-card__header">
        <span className="login-doc-card__icon">📄</span>
        <span className="login-doc-card__title">{title}</span>
      </div>
      <p className="login-doc-card__excerpt">{excerpt}</p>
      <div className="login-doc-card__footer">
        <div className="login-doc-card__avatars">
          {avatars.map((color, i) => (
            <span
              key={i}
              className="login-doc-card__avatar"
              style={{ background: color, zIndex: avatars.length - i }}
            />
          ))}
        </div>
        <div className="login-doc-card__cursor">
          <span className="login-doc-card__cursor-dot" />
          <span className="login-doc-card__cursor-label">editing…</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Login component ─── */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      {/* ── LEFT HERO PANEL ── */}
      <aside className="login-hero">
        <ParticleCanvas />

        {/* Glow orbs */}
        <div className="login-orb login-orb--1" />
        <div className="login-orb login-orb--2" />
        <div className="login-orb login-orb--3" />

        <div className="login-hero__inner">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="rgba(255,255,255,0.15)" />
                <path d="M7 8h10M7 12h6M7 16h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 14l3-3-1.5-1.5-3 3V14h1.5z" fill="white" />
              </svg>
            </div>
            <span className="login-logo__name">CollabDoc</span>
          </div>

          {/* Tagline */}
          <div className="login-tagline">
            <h2 className="login-tagline__heading">Collaborate<br />in Real-Time.</h2>
            <p className="login-tagline__sub">Write, edit, and share documents<br />together — anywhere, anytime.</p>
          </div>

          {/* Floating document cards */}
          <div className="login-cards">
            <DocCard
              title="Q2 Product Roadmap"
              excerpt="Next quarter we'll focus on the new editor experience, adding AI suggestions and…"
              avatars={['#a78bfa', '#60a5fa', '#34d399']}
              delay="0s"
            />
            <DocCard
              title="Design System v2"
              excerpt="Typography tokens updated. Primary palette shifted to violet-700 series…"
              avatars={['#f472b6', '#fb923c']}
              delay="0.4s"
            />
          </div>

          {/* Social proof */}
          <div className="login-social-proof">
            <div className="login-social-proof__avatars">
              {['#7c3aed', '#a78bfa', '#60a5fa', '#34d399', '#f472b6'].map((c, i) => (
                <span key={i} className="login-social-proof__avatar" style={{ background: c }} />
              ))}
            </div>
            <span className="login-social-proof__text">Join <strong>10,000+</strong> teams already collaborating</span>
          </div>
        </div>
      </aside>

      {/* ── RIGHT FORM PANEL ── */}
      <main className="login-form-panel">
        {/* Mobile logo (shows only on small screens) */}
        <div className="login-mobile-logo">
          <div className="login-logo__icon login-logo__icon--sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" fill="white" />
              <path d="M7 8h10M7 12h6M7 16h8" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M16 14l3-3-1.5-1.5-3 3V14h1.5z" fill="#7c3aed" />
            </svg>
          </div>
          <span className="login-mobile-logo__name">CollabDoc</span>
        </div>

        <div className="login-form-box">
          <div className="login-form-box__header">
            <h1 className="login-form-box__title">Welcome back</h1>
            <p className="login-form-box__sub">Sign in to your CollabDoc account</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#b91c1c" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="login-field">
              <label htmlFor="login-email" className="login-field__label">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-field__input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password" className="login-field__label">
                Password
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="login-field__show-pass"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </label>
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-field__input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="login-btn-primary"
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            id="login-google-btn"
            onClick={() => alert('Google sign-in coming soon!')}
            className="login-btn-google"
          >
            <svg className="login-btn-google__icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <p className="login-signup-link">
            Don't have an account?{' '}
            <Link to="/register" className="login-signup-link__a">Sign up free</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
