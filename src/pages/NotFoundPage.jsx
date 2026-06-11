import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', padding: '40px' }}>
      <div style={{ fontSize: '100px', fontWeight: '900', color: '#e2e8f0', lineHeight: 1, letterSpacing: '-0.05em' }}>404</div>
      <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '16px 0 8px' }}>Page Not Found</h2>
      <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '380px', margin: '0 auto 32px' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '700', fontSize: '14px', color: '#475569', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Go Back
        </button>
        <button onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', color: '#fff', cursor: 'pointer' }}>
          <Home size={16} /> Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
