import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as Y from 'yjs';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { yCollab } from 'y-codemirror.next';
import { useAuth } from '../context/AuthContext';
import { useCollabSocket } from '../hooks/useCollabSocket';
import PresenceAvatars from '../components/PresenceAvatars';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const ydocRef = useRef(null);

  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const titleTimer = useRef(null);

  const { connected, onlineUsers, remoteTitle, sendTitleChange } = useCollabSocket({ docId: id, user });

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

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const ytext = ydoc.getText('content');

    if (doc?.content) {
      ytext.insert(0, doc.content);
    }

    const userAwareness = {
      name: user?.name || 'Anonymous',
      color: user?.color || '#7c3aed',
      colorLight: (user?.color || '#7c3aed') + '33',
    };

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        markdown(),
        yCollab(ytext, { awareness: { getLocalState: () => userAwareness } }),
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
      ydoc.destroy();
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
    <div className="h-screen flex flex-col bg-white">
      <nav className="border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1 rounded hover:bg-gray-100 transition-colors"
        >
          ← Back
        </button>

        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:bg-gray-50 focus:px-2 rounded transition-all"
          placeholder="Untitled Document"
        />

        <div className="flex items-center gap-3 ml-auto">
          <PresenceAvatars users={onlineUsers} />

          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
            {connected ? 'Live' : 'Connecting...'}
          </div>

          {saveMsg && <span className="text-xs text-gray-400">{saveMsg}</span>}

          <button
            onClick={handleSave} disabled={saving}
            className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <div className="flex items-center gap-2 border-l pl-3">
            <button
              onClick={togglePublic}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${isPublic ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              {isPublic ? 'Public' : 'Private'}
            </button>
            <button
              onClick={copyShareLink}
              className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-hidden" ref={editorRef} />
    </div>
  );
}
