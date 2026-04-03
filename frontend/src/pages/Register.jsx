import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import './Auth.css';

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/* ── Password strength meter ── */
function PasswordStrength({ password }) {
  const score =
    !password ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#f87171', '#fbbf24', '#34d399', '#a78bfa'];
  if (!password) return null;
  return (
    <div className="auth-strength">
      <div className="auth-strength__bars">
        {[1,2,3,4].map(i => (
          <div key={i} className="auth-strength__bar"
            style={{ background: i <= score ? colors[score] : 'rgba(128,128,128,0.15)' }} />
        ))}
      </div>
      <span className="auth-strength__label" style={{ color: colors[score] }}>{labels[score]}</span>
    </div>
  );
}

export default function Register() {
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]           = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const { register }                      = useAuth();
  const { theme, toggleTheme }            = useTheme();
  const navigate                          = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
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

  const passwordsMatch    = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  return (
    <div className="auth-root">
      {/* Background */}
      <div className="auth-dot-grid" />
      <div className="auth-aurora">
        <div className="auth-aurora__blob auth-aurora__blob--1" />
        <div className="auth-aurora__blob auth-aurora__blob--2" />
        <div className="auth-aurora__blob auth-aurora__blob--3" />
      </div>
      <div className="auth-shapes">
        <div className="auth-shape auth-shape--1" />
        <div className="auth-shape auth-shape--2" />
        <div className="auth-shape auth-shape--3" />
        <div className="auth-shape auth-shape--4" />
      </div>

      {/* Theme toggle */}
      <button
        id="register-theme-toggle"
        className="auth-theme-btn theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Card */}
      <div className="auth-card">

        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(165,243,252,0.25)" />
              <path d="M7 8h10M7 12h6M7 16h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 13l3-3-1.5-1.5-3 3V13h1.5z" fill="white" />
            </svg>
          </div>
          <span className="auth-brand__name">CollabDoc</span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start collaborating — free forever.</p>

        {/* Error */}
        {error && (
          <div className="auth-error" role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* Google */}
        <button type="button" id="register-google-btn" onClick={() => alert('Google sign-up coming soon!')} className="auth-btn-google">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sign up with Google
        </button>

        <div className="auth-divider"><span>or sign up with email</span></div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>

          <div className="auth-field">
            <label htmlFor="reg-name" className="auth-label">Full name</label>
            <input id="reg-name" type="text" value={name} onChange={e => setName(e.target.value)}
              className="auth-input" placeholder="Arjun Gogu" required autoComplete="name" />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">Email</label>
            <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="auth-input" placeholder="you@example.com" required autoComplete="email" />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password" className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input id="reg-password" type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                className="auth-input auth-input--pass" placeholder="Min 6 characters"
                required minLength={6} autoComplete="new-password" />
              <button type="button" className="auth-eye" onClick={() => setShowPass(!showPass)} aria-label="Toggle password">
                {showPass
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                }
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-confirm" className="auth-label">Confirm password</label>
            <div className="auth-input-wrap">
              <input id="reg-confirm"
                type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`auth-input auth-input--pass ${passwordsMatch ? 'auth-input--ok' : ''} ${passwordsMismatch ? 'auth-input--err' : ''}`}
                placeholder="••••••••" required autoComplete="new-password" />
              <button type="button" className="auth-eye" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle confirm password">
                {showConfirm
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                }
              </button>
              {passwordsMatch && (
                <span className="auth-match-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </div>
            {passwordsMismatch && <span className="auth-hint auth-hint--err">Passwords don't match</span>}
          </div>

          <button type="submit" id="register-submit-btn" disabled={loading} className="auth-btn-primary auth-btn-primary--cyan">
            {loading ? <><span className="auth-spinner" /> Creating account…</> : 'Create account →'}
          </button>
        </form>

        <p className="auth-terms">
          By signing up you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
        </p>

        <p className="auth-link-text">
          Already have an account? <Link to="/login" className="auth-link">Sign in →</Link>
        </p>
      </div>

      <Footer />
    </div>
  );
}
