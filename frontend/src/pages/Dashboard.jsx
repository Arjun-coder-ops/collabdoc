import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import './Dashboard.css';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    axios.get('/api/documents')
      .then(res => setDocuments(res.data.documents))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const createDoc = async () => {
    setCreating(true);
    try {
      const res = await axios.post('/api/documents', { title: 'Untitled Document' });
      navigate(`/doc/${res.data.document._id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const deleteDoc = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    try {
      await axios.delete(`/api/documents/${id}`);
      setDocuments(prev => prev.filter(d => d._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="dashboard-root">
      {/* CSS animated background */}
      <div className="db-dot-grid" />
      <div className="db-aurora">
        <div className="db-aurora__blob db-aurora__blob--1" />
        <div className="db-aurora__blob db-aurora__blob--2" />
      </div>

      {/* ── Navbar ── */}
      <nav className="db-nav">
        <div className="db-logo">
          <div className="db-logo-icon">CD</div>
          <span className="db-logo-text">CollabDoc</span>
        </div>

        <div className="db-nav-right">
          {/* Theme toggle */}
          <button
            id="dashboard-theme-toggle"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className="db-avatar" style={{ backgroundColor: user?.color || '#7c3aed' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="db-user-name">{user?.name}</span>
          <button className="db-sign-out" onClick={logout}>Sign out</button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="db-main">

        {/* Hero */}
        <div className="db-hero">
          <p className="db-hero-greeting">✦ Welcome back</p>
          <h1 className="db-hero-title">Hey, {firstName} 👋</h1>
          <p className="db-hero-sub">Your collaborative workspace is ready.</p>
        </div>

        {/* Toolbar */}
        <div className="db-toolbar">
          <span className="db-doc-count">
            {loading ? 'Loading…' : `${documents.length} document${documents.length !== 1 ? 's' : ''}`}
          </span>
          <button
            id="new-doc-btn"
            className="db-new-btn"
            onClick={createDoc}
            disabled={creating}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {creating ? 'Creating…' : 'New Document'}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="db-state-center">
            <div className="db-spinner" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading your documents…</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="db-state-center">
            <div className="db-empty-icon">📄</div>
            <p className="db-empty-title">No documents yet</p>
            <p className="db-empty-sub">Create your first document to get started!</p>
            <button className="db-new-btn" style={{ marginTop: '0.5rem' }} onClick={createDoc}>
              + Create document
            </button>
          </div>
        ) : (
          <div className="db-grid">
            {documents.map((doc, i) => (
              <div
                key={doc._id}
                className="db-card"
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => navigate(`/doc/${doc._id}`)}
              >
                <div className="db-card-header">
                  <div className="db-card-icon">📝</div>
                  <button
                    className="db-card-delete"
                    onClick={e => deleteDoc(e, doc._id)}
                    title="Delete document"
                  >
                    ×
                  </button>
                </div>
                <h3 className="db-card-title">{doc.title}</h3>
                <p className="db-card-meta">Edited {timeAgo(doc.updatedAt)}</p>
                {doc.isPublic && <span className="db-card-badge">Public</span>}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
