import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
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

  const deleteDoc = (id) => {
    setTimeout(async () => {
      if (!window.confirm('Delete this document?')) return;
      try {
        await axios.delete(`/api/documents/${id}`);
        setDocuments(prev => prev.filter(d => d._id !== id));
      } catch (e) {
        console.error(e);
        alert(e.response?.data?.message || 'Failed to delete document. You may not have permission.');
      }
    }, 10);
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="dashboard-root">
      {/* Navbar */}
      <nav className="db-nav">
        <div className="db-logo">
          <div className="db-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
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
                style={{ animationDelay: `${i * 0.06}s`, position: 'relative' }}
              >
                {/* Native Link overlay covering 100% of the card area securely above the text */}
                <Link
                  to={`/doc/${doc._id}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    display: 'block',
                    textDecoration: 'none'
                  }}
                  title="Open Document"
                />

                {/* Content placed below the Link overlay */}
                <div className="db-card-header" style={{ position: 'relative', zIndex: 1 }}>
                  <div className="db-card-icon">📝</div>
                </div>
                <h3 className="db-card-title" style={{ position: 'relative', zIndex: 1 }}>{doc.title}</h3>
                <p className="db-card-meta" style={{ position: 'relative', zIndex: 1 }}>Edited {timeAgo(doc.updatedAt)}</p>
                {doc.isPublic && <span className="db-card-badge" style={{ position: 'relative', zIndex: 1 }}>Public</span>}

                {/* Delete Button explicitly layered visually above everything else as a sibling */}
                <button
                  className="db-card-delete"
                  onClick={() => deleteDoc(doc._id)}
                  title="Delete document"
                  style={{ position: 'absolute', top: '1.4rem', right: '1.4rem', zIndex: 20 }}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
