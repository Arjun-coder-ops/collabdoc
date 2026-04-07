import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as Y from 'yjs';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { yCollab } from 'y-codemirror.next';
import { Awareness } from 'y-protocols/awareness';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCollabSocket } from '../hooks/useCollabSocket';
import PresenceAvatars from '../components/PresenceAvatars';
import './Editor.css';

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

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const ydoc = useMemo(() => new Y.Doc(), []);

  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const titleTimer = useRef(null);

  const { connected, onlineUsers, remoteTitle, sendTitleChange } = useCollabSocket({ docId: id, user, ydoc });

  useEffect(() => {
    axios.get(`/api/documents/${id}`)
      .then(res => {
        const d = res.data.document;
        setDoc(d);
        setTitle(d.title);
        setIsPublic(d.isPublic);
      })
      .catch(() => navigate('/dashboard'));
  }, [id]);

  useEffect(() => {
    if (remoteTitle) setTitle(remoteTitle);
  }, [remoteTitle]);

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const ytext = ydoc.getText('content');

    const userAwareness = {
      name: user?.name || 'Anonymous',
      color: user?.color || '#7c3aed',
      colorLight: (user?.color || '#7c3aed') + '33',
    };

    const awareness = new Awareness(ydoc);
    awareness.setLocalStateField('user', userAwareness);

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        markdown(),
        yCollab(ytext, awareness),
        EditorView.theme({
          '&': { height: '100%', fontSize: '15px', fontFamily: 'ui-monospace, monospace' },
          '.cm-content': { padding: '24px', lineHeight: '1.8' },
          '.cm-focused': { outline: 'none' },
          '.cm-scroller': { overflow: 'auto' },
        }),
        EditorView.lineWrapping,
      ],
    });

    viewRef.current = new EditorView({ state, parent: editorRef.current });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [doc]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    sendTitleChange(val);
    clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(async () => {
      try {
        await axios.patch(`/api/documents/${id}/title`, { title: val });
      } catch (e) { console.error(e); }
    }, 1000);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const content = viewRef.current?.state?.doc?.toString() || '';
      await axios.patch(`/api/documents/${id}/title`, { title });
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (e) {
      setSaveMsg('Error saving');
    } finally {
      setSaving(false);
    }
  }, [id, title]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const togglePublic = async () => {
    try {
      const res = await axios.patch(`/api/documents/${id}/visibility`, { isPublic: !isPublic });
      setIsPublic(res.data.document.isPublic);
    } catch (e) { console.error(e); }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/doc/${id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ed-root">
      <nav className="ed-nav">
        <button
          onClick={() => navigate('/dashboard')}
          className="ed-back-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="ed-title-input"
          placeholder="Untitled Document"
        />

        <div className="ed-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ marginRight: '8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          
          <PresenceAvatars users={onlineUsers} />

          <div className={`ed-status ${!connected ? 'ed-status--offline' : ''}`}>
            <div className="ed-status-dot" />
            {connected ? 'Live' : 'Connecting...'}
          </div>

          {saveMsg && <span className="ed-save-msg">{saveMsg}</span>}

          <button
            onClick={handleSave} disabled={saving}
            className="ed-btn ed-btn-primary"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <div className="ed-divider" />

          <button
            onClick={togglePublic}
            className={`ed-btn ${isPublic ? 'ed-btn-primary' : ''}`}
          >
            {isPublic ? 'Public' : 'Private'}
          </button>
          <button
            onClick={copyShareLink}
            className="ed-btn"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </nav>

      <div className="ed-workspace" ref={editorRef} />
    </div>
  );
}
