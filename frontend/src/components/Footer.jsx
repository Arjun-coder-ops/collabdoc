import { useTheme } from '../context/ThemeContext';

export default function Footer({ name = 'Arjun Gogu' }) {
  const { theme } = useTheme();
  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        textAlign: 'center',
        padding: '0.6rem 1rem',
        fontSize: '0.72rem',
        fontFamily: "'Inter', sans-serif",
        letterSpacing: '0.04em',
        color: theme === 'dark' ? 'rgba(148,163,184,0.45)' : 'rgba(100,80,160,0.5)',
        background: 'transparent',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      Developed by <span style={{ fontWeight: 600, opacity: 0.75 }}>{name}</span>
    </footer>
  );
}
