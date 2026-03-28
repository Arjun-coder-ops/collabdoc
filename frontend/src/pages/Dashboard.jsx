import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">CD</span>
          </div>
          <span className="font-semibold text-gray-900">CollabDoc</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: user?.color || '#7c3aed' }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Documents</h1>
            <p className="text-gray-500 text-sm mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={createDoc} disabled={creating}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-60"
          >
            <span>+</span> New document
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📄</span>
            </div>
            <h3 className="text-gray-700 font-medium mb-2">No documents yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first document to get started</p>
            <button onClick={createDoc} className="bg-violet-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors">
              Create document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <div
                key={doc._id}
                onClick={() => navigate(`/doc/${doc._id}`)}
                className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-violet-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center">
                    <span className="text-violet-600 text-lg">📝</span>
                  </div>
                  <button
                    onClick={e => deleteDoc(e, doc._id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-lg leading-none transition-all"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">{doc.title}</h3>
                <p className="text-xs text-gray-400">Edited {timeAgo(doc.updatedAt)}</p>
                {doc.isPublic && (
                  <span className="mt-2 inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Public</span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
