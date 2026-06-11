import React from 'react';
import { X } from 'lucide-react';

/**
 * PremiumModal — shared glassmorphic modal used across all ERP pages.
 *
 * Props:
 *   open         — bool: whether modal is visible
 *   onClose      — fn: called when X or backdrop clicked
 *   title        — string: modal heading
 *   subtitle     — string: optional secondary text
 *   headerIcon   — ReactNode: icon rendered inside gradient badge
 *   accentColor  — hex: accent color for gradient + glow (default #10b981)
 *   accentDark   — hex: darker shade (default #059669)
 *   maxWidth     — number: max-width px (default 580)
 *   footer       — ReactNode: renders in sticky footer area
 *   children     — ReactNode: form / view content
 */
const PremiumModal = ({
  open,
  onClose,
  title,
  subtitle,
  headerIcon,
  accentColor = '#10b981',
  accentDark = '#059669',
  maxWidth = 580,
  footer,
  children,
}) => {
  if (!open) return null;

  const spinKeyframe = `@keyframes pmSpin{to{transform:rotate(360deg)}}`;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,8,16,0.78)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{spinKeyframe}</style>
      <div
        style={{
          position: 'relative', width: '100%', margin: '0 16px',
          maxWidth, maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(145deg,#ffffff 0%,#f8fafc 100%)',
          borderRadius: 24,
          boxShadow: `0 32px 80px rgba(0,0,0,0.38), 0 0 0 1px ${accentColor}20, inset 0 1px 0 rgba(255,255,255,0.9)`,
          overflow: 'hidden',
          animation: 'pmIn .3s cubic-bezier(.22,1,.36,1) both',
        }}
      >
        <style>{`@keyframes pmIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* ── Dark Header ── */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#0a1a10 100%)', padding: '22px 28px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          {/* Orbs */}
          <div style={{ position:'absolute',top:-50,right:-50,width:160,height:160,borderRadius:'50%',background:`radial-gradient(circle,${accentColor}30 0%,transparent 70%)`,pointerEvents:'none' }}/>
          <div style={{ position:'absolute',bottom:-30,left:80,width:100,height:100,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)',pointerEvents:'none' }}/>

          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative' }}>
            <div style={{ display:'flex',alignItems:'center',gap:14 }}>
              {headerIcon && (
                <div style={{ width:42,height:42,borderRadius:13,background:`linear-gradient(135deg,${accentColor},${accentDark})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 6px 16px ${accentColor}45`,flexShrink:0 }}>
                  {headerIcon}
                </div>
              )}
              <div>
                <h3 style={{ margin:0,fontSize:18,fontWeight:800,color:'#fff',letterSpacing:'-0.02em',fontFamily:'Outfit,sans-serif',lineHeight:1.2 }}>{title}</h3>
                {subtitle && <p style={{ margin:0,fontSize:12,color:'rgba(255,255,255,0.45)',marginTop:3 }}>{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ width:34,height:34,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(255,255,255,0.7)',transition:'background .2s',flexShrink:0 }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}
            >
              <X size={15}/>
            </button>
          </div>
        </div>

        {/* ── Accent bar ── */}
        <div style={{ height:3,background:`linear-gradient(90deg,${accentDark},${accentColor},${accentDark})`,flexShrink:0 }}/>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY:'auto',flex:1,padding:'24px 28px' }}>
          {children}
        </div>

        {/* ── Footer ── */}
        {footer && (
          <div style={{ padding:'16px 28px',borderTop:'1px solid #f1f5f9',background:'#fcfcfd',display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/** Shared input style helper */
export const pmInput = (focused = false, accent = '#10b981', readOnly = false) => ({
  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
  border: `1.5px solid ${focused ? accent : readOnly ? '#f1f5f9' : '#e2e8f0'}`,
  borderRadius: 12, fontSize: 14,
  color: readOnly ? '#64748b' : '#0f172a',
  background: readOnly ? '#f8fafc' : '#fff',
  outline: 'none', fontFamily: 'Inter,sans-serif',
  cursor: readOnly ? 'not-allowed' : 'text',
  boxShadow: focused ? `0 0 0 4px ${accent}18` : 'none',
  transition: 'all .2s',
});

export const pmLabel = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 7,
};

export const pmSection = (color = '#10b981', label) => (
  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16,marginTop:4 }}>
    <div style={{ width:3,height:16,background:`linear-gradient(180deg,${color},${color}aa)`,borderRadius:2 }}/>
    <span style={{ fontSize:11,fontWeight:700,color,textTransform:'uppercase',letterSpacing:'0.1em' }}>{label}</span>
  </div>
);

export const CancelBtn = ({ onClick, children = 'Cancel' }) => (
  <button type="button" onClick={onClick}
    style={{ display:'flex',alignItems:'center',gap:6,padding:'10px 20px',border:'1.5px solid #e2e8f0',borderRadius:12,background:'#fff',color:'#64748b',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'background .2s' }}
    onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
    onMouseLeave={e=>e.currentTarget.style.background='#fff'}
  >
    <X size={13}/> {children}
  </button>
);

export const SaveBtn = ({ loading, label, loadingLabel = 'Saving...', accent = '#10b981', accentDark = '#059669', ...props }) => (
  <button type="submit" disabled={loading} {...props}
    style={{ display:'flex',alignItems:'center',gap:6,padding:'10px 24px',border:'none',borderRadius:12,background:loading?'#a3e6c8':`linear-gradient(135deg,${accentDark},${accent})`,color:'#fff',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',boxShadow:`0 4px 14px ${accent}40`,transition:'all .2s',fontFamily:'Inter,sans-serif' }}
    onMouseEnter={e=>{ if(!loading) e.currentTarget.style.transform='translateY(-1px)' }}
    onMouseLeave={e=>{ e.currentTarget.style.transform='none' }}
  >
    {loading
      ? <><div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'pmSpin .6s linear infinite' }}/>{loadingLabel}</>
      : label
    }
  </button>
);

/** Premium read-only detail row */
export const DetailRow = ({ label, value, span = false }) => (
  <div style={{ display:'flex',flexDirection:'column',gap:6, gridColumn: span ? '1/-1' : undefined }}>
    <span style={{ fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em' }}>{label}</span>
    <span style={{ fontSize:14,fontWeight:600,color:'#1e293b',background:'#f8fafc',padding:'10px 14px',borderRadius:12,border:'1px solid #e8edf3',lineHeight:1.4 }}>{value || '—'}</span>
  </div>
);

export default PremiumModal;
