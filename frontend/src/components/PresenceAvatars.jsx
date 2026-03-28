export default function PresenceAvatars({ users }) {
  if (!users.length) return null;

  return (
    <div className="flex items-center gap-1">
      {users.slice(0, 5).map((u, i) => (
        <div
          key={u.socketId}
          title={u.user?.name || 'User'}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
          style={{
            backgroundColor: u.user?.color || '#7c3aed',
            marginLeft: i > 0 ? '-6px' : 0,
            zIndex: 10 - i,
          }}
        >
          {(u.user?.name || 'U').charAt(0).toUpperCase()}
        </div>
      ))}
      {users.length > 5 && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold border-2 border-white" style={{ marginLeft: '-6px' }}>
          +{users.length - 5}
        </div>
      )}
      <span className="text-xs text-gray-500 ml-2">
        {users.length} editing
      </span>
    </div>
  );
}
