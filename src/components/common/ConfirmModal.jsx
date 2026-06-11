import React, { useEffect } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'Do you really want to perform this action? This cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'info' | 'success'
  onConfirm,
  onCancel
}) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: '#ef4444',
          iconBg: 'rgba(239, 68, 68, 0.1)',
          confirmBg: '#ef4444',
          confirmHoverBg: '#dc2626',
          confirmShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
        };
      case 'success':
        return {
          iconColor: '#10b981',
          iconBg: 'rgba(16, 185, 129, 0.1)',
          confirmBg: '#10b981',
          confirmHoverBg: '#059669',
          confirmShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
        };
      default: // info
        return {
          iconColor: '#3b82f6',
          iconBg: 'rgba(59, 130, 246, 0.1)',
          confirmBg: '#3b82f6',
          confirmHoverBg: '#2563eb',
          confirmShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'confirm-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={onCancel}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes confirm-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirm-zoom-in {
          from { transform: scale(0.95) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}} />
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '30px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          position: 'relative',
          animation: 'confirm-zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#475569';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <X size={18} />
        </button>

        {/* Content Layout */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* Header Icon */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            background: styles.iconBg,
            color: styles.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            {type === 'danger' ? (
              <AlertTriangle size={28} />
            ) : (
              <HelpCircle size={28} />
            )}
          </div>

          {/* Text Info */}
          <h3 style={{
            fontSize: '18px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 10px 0',
            fontFamily: "'Outfit', 'Inter', sans-serif"
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            lineHeight: '1.6',
            margin: '0 0 28px 0',
            fontFamily: "'Inter', sans-serif"
          }}>
            {message}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '14px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '14px',
                border: 'none',
                background: styles.confirmBg,
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: styles.confirmShadow,
                fontFamily: 'inherit',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = styles.confirmHoverBg;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = styles.confirmBg;
                e.currentTarget.style.transform = 'none';
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
