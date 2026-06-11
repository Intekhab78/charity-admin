import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

let _addToast = null;

// Standalone helper so non-React code (or pages without access to the hook) can call toast()
export const toast = {
  success: (msg, opts) => _addToast?.({ type: 'success', message: msg, ...opts }),
  error:   (msg, opts) => _addToast?.({ type: 'error',   message: msg, ...opts }),
  warning: (msg, opts) => _addToast?.({ type: 'warning', message: msg, ...opts }),
  info:    (msg, opts) => _addToast?.({ type: 'info',    message: msg, ...opts }),
};

// ── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', message, duration = 3500 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message, exiting: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
  }, []);

  // Register global helper
  useEffect(() => { _addToast = addToast; return () => { _addToast = null; }; }, [addToast]);

  const config = {
    success: { icon: CheckCircle, bg: '#ecfdf5', border: '#6ee7b7', text: '#065f46', iconColor: '#10b981' },
    error:   { icon: XCircle,     bg: '#fef2f2', border: '#fca5a5', text: '#7f1d1d', iconColor: '#ef4444' },
    warning: { icon: AlertTriangle,bg:'#fffbeb', border: '#fde68a', text: '#78350f', iconColor: '#f59e0b' },
    info:    { icon: Info,         bg: '#eff6ff', border: '#93c5fd', text: '#1e3a5f', iconColor: '#3b82f6' },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        gap: '10px', maxWidth: '400px', width: '100%',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = config[t.type] || config.info;
          const Icon = c.icon;
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              background: c.bg, border: `1px solid ${c.border}`,
              borderRadius: '16px', padding: '14px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
              pointerEvents: 'auto',
              animation: t.exiting ? 'toastExit 0.35s ease-in forwards' : 'toastEnter 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              transform: 'translateX(0)',
            }}>
              <Icon size={20} style={{ color: c.iconColor, flexShrink: 0, marginTop: '1px' }} />
              <div style={{ flex: 1, fontSize: '13.5px', fontWeight: '600', color: c.text, lineHeight: '1.5' }}>
                {t.message}
              </div>
              <button onClick={() => dismiss(t.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: c.text, opacity: 0.5, padding: '2px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', transition: 'opacity 0.15s',
                flexShrink: 0,
              }} onMouseEnter={e => e.target.style.opacity = '1'}
                 onMouseLeave={e => e.target.style.opacity = '0.5'}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastEnter {
          from { opacity: 0; transform: translateX(100%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastExit {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to   { opacity: 0; transform: translateX(100%) scale(0.9); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
export default ToastProvider;
