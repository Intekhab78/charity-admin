import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import InventoryTable from './pages/inventory/InventoryPage';
import VendorManagement from './pages/vendors/VendorPage';
import CustomerManagement from './pages/customers/CustomerPage';
import BookingManagement from './pages/bookings/BookingPage';
import PaymentList from './pages/bookings/PaymentListPage';
import QurbaniDateMaster from './pages/qurbani/QurbaniDateMasterPage';
import DepartmentMaster from './pages/departments/DepartmentMasterPage';
import PendingCartList from './pages/bookings/PendingCartPage';
import QurbaniCollection from './pages/qurbani/QurbaniCollectionPage';
import QurbaniComparison from './pages/qurbani/QurbaniComparisonPage';
import OnlinePendingList from './pages/bookings/OnlinePendingPage';
import ReviewsManager from './pages/reviews/ReviewsPage';
import CreationMaster from './pages/creation-master/CreationMasterPage';
import QurbaniSchedule from './pages/qurbani/QurbaniSchedulePage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/settings/ProfilePage';
import CompanySettingsPage from './pages/settings/CompanySettingsPage';
import { authService } from './services/api';
import CommandPalette from './components/common/CommandPalette';

import TopNav from './components/layout/TopNav';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== 'undefined') {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Particle canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      o: Math.random() * 0.5 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16,185,129,${p.o})`;
        ctx.fill();
      });
      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(16,185,129,${0.15 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await authService.login(credentials);
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', res.data.token);
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center text-primary font-bold animate-pulse">Loading...</div>;

  const isAdmin = user && (user.role?.toLowerCase().includes('admin'));

  if (!user) {
    return (
      <div className="login-page-root">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;600;700;800;900&display=swap');
          .login-page-root {
            display: flex; height: 100vh; width: 100vw; overflow: hidden;
            background: #030712; font-family: 'Inter', sans-serif;
          }
          /* ---- LEFT PANEL ---- */
          .login-left {
            position: relative; flex: 1; display: flex; flex-direction: column;
            justify-content: flex-end; padding: 52px;
            background: linear-gradient(135deg, #020c06 0%, #071a0f 40%, #0a2418 100%);
            overflow: hidden;
          }
          .login-left-canvas {
            position: absolute; inset: 0; width: 100%; height: 100%;
          }
          .login-left-orb1 {
            position: absolute; top: -80px; right: -80px;
            width: 420px; height: 420px; border-radius: 50%;
            background: radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%);
            filter: blur(40px); pointer-events: none;
          }
          .login-left-orb2 {
            position: absolute; bottom: 100px; left: -60px;
            width: 320px; height: 320px; border-radius: 50%;
            background: radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 70%);
            filter: blur(40px); pointer-events: none;
          }
          .login-left-orb3 {
            position: absolute; top: 40%; left: 40%;
            width: 250px; height: 250px; border-radius: 50%;
            background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
            filter: blur(60px); pointer-events: none;
          }
          .login-hex-ring {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 500px; height: 500px; border-radius: 50%;
            border: 1px solid rgba(16,185,129,0.07);
            box-shadow: inset 0 0 60px rgba(16,185,129,0.03);
            pointer-events: none;
            animation: loginRingPulse 4s ease-in-out infinite;
          }
          .login-hex-ring-2 {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 350px; height: 350px; border-radius: 50%;
            border: 1px solid rgba(16,185,129,0.1);
            pointer-events: none;
            animation: loginRingPulse 4s ease-in-out infinite 2s;
          }
          @keyframes loginRingPulse {
            0%, 100% { opacity: 0.4; transform: translate(-50%,-50%) scale(1); }
            50% { opacity: 1; transform: translate(-50%,-50%) scale(1.03); }
          }
          .login-left-badge {
            position: relative; display: inline-flex; align-items: center; gap: 8px;
            background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
            border-radius: 100px; padding: 6px 14px; margin-bottom: 24px;
            backdrop-blur: 8px;
          }
          .login-left-badge-dot {
            width: 7px; height: 7px; background: #10b981; border-radius: 50%;
            box-shadow: 0 0 8px #10b981; animation: loginDotPulse 2s ease-in-out infinite;
          }
          @keyframes loginDotPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }
          .login-left-badge-text { font-size: 11px; font-weight: 600; color: #6ee7b7; letter-spacing: 0.08em; text-transform: uppercase; }
          .login-left-quote {
            position: relative; font-size: 36px; font-weight: 800; font-family: 'Outfit', sans-serif;
            line-height: 1.18; color: #fff; letter-spacing: -0.03em; margin-bottom: 20px;
            max-width: 480px;
          }
          .login-left-quote em {
            font-style: normal;
            background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          }
          .login-left-sub {
            color: #4b6360; font-size: 14px; font-weight: 400; line-height: 1.6;
            max-width: 360px; position: relative;
          }
          .login-left-stats {
            position: relative; display: flex; gap: 32px; margin-top: 40px;
          }
          .login-stat { display: flex; flex-direction: column; gap: 2px; }
          .login-stat-val { font-size: 26px; font-weight: 800; font-family: 'Outfit', sans-serif; color: #fff; }
          .login-stat-lbl { font-size: 11px; font-weight: 500; color: #4b6360; letter-spacing: 0.06em; text-transform: uppercase; }
          .login-left-footer {
            position: relative; display: flex; align-items: center; gap: 10px;
            margin-top: 48px; padding-top: 24px;
            border-top: 1px solid rgba(255,255,255,0.05);
          }
          .login-left-footer-logo {
            width: 32px; height: 32px; background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 8px; display: flex; align-items: center; justify-content: center;
            font-size: 14px; font-weight: 900; color: #fff; font-family: 'Outfit', sans-serif;
            flex-shrink: 0;
          }
          .login-left-footer-text { font-size: 12px; color: #2d4d44; font-weight: 500; }
          /* ---- RIGHT PANEL ---- */
          .login-right {
            width: 480px; flex-shrink: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center; padding: 48px 40px;
            background: #080f0a; border-left: 1px solid rgba(16,185,129,0.08);
            position: relative; overflow: hidden;
          }
          .login-right::before {
            content: ''; position: absolute; top: -200px; right: -200px;
            width: 500px; height: 500px; border-radius: 50%;
            background: radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%);
            pointer-events: none;
          }
          .login-card {
            position: relative; width: 100%; max-width: 380px;
            animation: loginCardIn 0.6s cubic-bezier(.22,1,.36,1) both;
          }
          @keyframes loginCardIn {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .login-logo-wrap {
            display: flex; align-items: center; gap: 14px; margin-bottom: 36px;
          }
          .login-logo-icon {
            width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; font-weight: 900; color: #fff; font-family: 'Outfit', sans-serif;
            box-shadow: 0 8px 24px rgba(16,185,129,0.35), 0 0 0 1px rgba(16,185,129,0.2);
          }
          .login-logo-title { font-size: 20px; font-weight: 700; color: #f0fdf4; font-family: 'Outfit', sans-serif; letter-spacing: -0.02em; }
          .login-logo-sub { font-size: 12px; color: #2d4d44; font-weight: 500; margin-top: 2px; }
          .login-heading { font-size: 28px; font-weight: 800; color: #ecfdf5; font-family: 'Outfit', sans-serif; letter-spacing: -0.03em; margin-bottom: 8px; }
          .login-subheading { font-size: 14px; color: #2d4d44; font-weight: 400; margin-bottom: 36px; line-height: 1.5; }
          .login-divider { width: 40px; height: 3px; background: linear-gradient(90deg, #10b981, #059669); border-radius: 2px; margin-bottom: 36px; }
          .login-field { margin-bottom: 20px; }
          .login-label { font-size: 11px; font-weight: 600; color: #4b6360; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; display: block; }
          .login-input-wrap { position: relative; }
          .login-input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #2d4d44; pointer-events: none; }
          .login-input {
            width: 100%; box-sizing: border-box; padding: 14px 16px 14px 44px;
            background: rgba(16,185,129,0.04); border: 1px solid rgba(16,185,129,0.12);
            border-radius: 12px; font-size: 14px; color: #ecfdf5; outline: none;
            transition: all 0.2s; font-family: 'Inter', sans-serif;
          }
          .login-input::placeholder { color: #1e3a30; }
          .login-input:focus { border-color: rgba(16,185,129,0.5); background: rgba(16,185,129,0.07); box-shadow: 0 0 0 4px rgba(16,185,129,0.08); }
          .login-pw-toggle {
            position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
            background: none; border: none; cursor: pointer; color: #2d4d44;
            padding: 4px; transition: color 0.2s; display: flex; align-items: center;
          }
          .login-pw-toggle:hover { color: #10b981; }
          .login-error {
            display: flex; align-items: center; gap: 8px;
            padding: 12px 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
            border-radius: 10px; margin-bottom: 20px;
            font-size: 13px; color: #f87171; font-weight: 500;
            animation: loginShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
          }
          @keyframes loginShake {
            10%, 90% { transform: translateX(-2px); }
            20%, 80% { transform: translateX(4px); }
            30%, 50%, 70% { transform: translateX(-4px); }
            40%, 60% { transform: translateX(4px); }
          }
          .login-btn {
            width: 100%; padding: 15px; border: none; border-radius: 12px; cursor: pointer;
            background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
            background-size: 200% auto;
            color: #fff; font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif;
            letter-spacing: 0.01em;
            box-shadow: 0 4px 20px rgba(16,185,129,0.35), 0 0 0 1px rgba(16,185,129,0.2);
            transition: all 0.3s; margin-top: 8px; position: relative; overflow: hidden;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          }
          .login-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(16,185,129,0.45); background-position: right center; }
          .login-btn:active:not(:disabled) { transform: scale(0.98); }
          .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
          .login-btn-spinner {
            width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #fff; border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .login-footer-note {
            text-align: center; margin-top: 28px; font-size: 11px; color: #1e3a30;
            letter-spacing: 0.06em; display: flex; align-items: center; justify-content: center; gap: 6px;
          }
          .login-footer-note svg { color: #10b981; }
          /* Dots bg pattern */
          .login-dots-bg {
            position: absolute; inset: 0; pointer-events: none; overflow: hidden; opacity: 0.3;
            background-image: radial-gradient(circle, rgba(16,185,129,0.15) 1px, transparent 1px);
            background-size: 28px 28px;
          }
          /* Responsive */
          @media (max-width: 900px) {
            .login-left { display: none; }
            .login-right { width: 100%; border-left: none; }
          }
        `}</style>

        {/* LEFT PANEL */}
        <div className="login-left">
          <canvas ref={canvasRef} className="login-left-canvas" />
          <div className="login-left-orb1" />
          <div className="login-left-orb2" />
          <div className="login-left-orb3" />
          <div className="login-hex-ring" />
          <div className="login-hex-ring-2" />

          <div className="login-left-badge">
            <div className="login-left-badge-dot" />
            <span className="login-left-badge-text">Enterprise ERP System</span>
          </div>
          <h2 className="login-left-quote">
            Making every<br />
            <em>act of charity</em><br />
            count — together.
          </h2>
          <p className="login-left-sub">
            A unified platform to manage bookings, payments, qurbani schedules,
            and beneficiary allocations with precision and transparency.
          </p>
          <div className="login-left-stats">
            <div className="login-stat">
              <span className="login-stat-val">10K+</span>
              <span className="login-stat-lbl">Bookings</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-val">50+</span>
              <span className="login-stat-lbl">Locations</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-val">99.9%</span>
              <span className="login-stat-lbl">Uptime</span>
            </div>
          </div>
          <div className="login-left-footer">
            <div className="login-left-footer-logo">C</div>
            <span className="login-left-footer-text">Charity ERP Portal · v2.1 · All Rights Reserved</span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="login-right">
          <div className="login-dots-bg" />
          <div className="login-card">
            <div className="login-logo-wrap">
              <div className="login-logo-icon">C</div>
              <div>
                <div className="login-logo-title">Charity ERP Portal</div>
                <div className="login-logo-sub">Enterprise Management System</div>
              </div>
            </div>

            <h1 className="login-heading">Welcome back</h1>
            <p className="login-subheading">Sign in to access your dashboard and manage operations.</p>
            <div className="login-divider" />

            {loginError && (
              <div className="login-error">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="login-field">
                <label className="login-label">Email Address</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/><path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </span>
                  <input
                    className="login-input"
                    type="email"
                    placeholder="name@charity.com"
                    value={credentials.email}
                    onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Password</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </span>
                  <input
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="login-pw-toggle" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                    {showPassword ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loginLoading}>
                {loginLoading ? (
                  <><div className="login-btn-spinner" /> Signing in...</>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    Sign In to Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="login-footer-note">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              256-bit SSL encrypted · SECURE CHARITY ERP v2.1
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <CommandPalette />
      <div className="flex flex-col h-screen overflow-hidden">
        <TopNav 
          user={user} 
          sidebarCollapsed={sidebarCollapsed} 
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setMobileSidebarOpen(prev => !prev);
            } else {
              setSidebarCollapsed(prev => !prev);
            }
          }}
          onLogout={handleLogout}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar 
            user={user} 
            isAdmin={isAdmin} 
            collapsed={sidebarCollapsed} 
            setCollapsed={setSidebarCollapsed} 
            mobileOpen={mobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
          />

          {/* Mobile backdrop overlay */}
          {mobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[40] md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          <main className="flex-1 p-3 md:p-5 bg-slate-50 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="/dashboard" element={<DashboardPage user={user} />} />

              <Route path="/inventory" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Charity Items</h1></header> */}
                  <InventoryTable user={user} viewMode="list" />
                </>
              } />

              <Route path="/inventory/view/:id" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Charity Item Details</h1></header> */}
                  <InventoryTable user={user} viewMode="view" />
                </>
              } />

              <Route path="/inventory/add" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Add Item</h1></header> */}
                  <InventoryTable user={user} viewMode="form" />
                </>
              } />

              <Route path="/inventory/edit/:id" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Edit Item</h1></header> */}
                  <InventoryTable user={user} viewMode="form" />
                </>
              } />

              <Route path="/customers" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Charity Customers</h1></header> */}
                  <CustomerManagement user={user} viewMode="list" />
                </>
              } />

              <Route path="/customers/view/:id" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Customer Details</h1></header> */}
                  <CustomerManagement user={user} viewMode="view" />
                </>
              } />

              <Route path="/customers/add" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Add Customer</h1></header> */}
                  <CustomerManagement user={user} viewMode="form" />
                </>
              } />

              <Route path="/customers/edit/:id" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Edit Customer</h1></header> */}
                  <CustomerManagement user={user} viewMode="form" />
                </>
              } />

              <Route path="/bookings" element={
                <>
                  {/* <header className="mb-3"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Start Booking</h1></header> */}
                  <BookingManagement user={user} viewMode="form" />
                </>
              } />

              <Route path="/bookings/add" element={
                <>
                  <BookingManagement user={user} viewMode="form" />
                </>
              } />

              <Route path="/bookings/view/:id" element={
                <>
                  {/* <header className="mb-3"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Booking Details</h1></header> */}
                  <BookingManagement user={user} viewMode="view" />
                </>
              } />

              <Route path="/bookings/edit/:id" element={
                <>
                  {/* <header className="mb-3"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Edit Booking</h1></header> */}
                  <BookingManagement user={user} viewMode="form" />
                </>
              } />

              <Route path="/bookings/list" element={
                <BookingManagement user={user} viewMode="list" />
              } />

              <Route path="/bookings/payments" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Payment List</h1></header> */}
                  <PaymentList user={user} />
                </>
              } />

              <Route path="/bookings/pending" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Pending Cart List</h1></header> */}
                  <PendingCartList user={user} />
                </>
              } />

              <Route path="/bookings/collection" element={
                isAdmin ? <QurbaniCollection /> : <Navigate to="/dashboard" replace />
              } />

              <Route path="/bookings/comparison" element={
                isAdmin ? <QurbaniComparison /> : <Navigate to="/dashboard" replace />
              } />

              <Route path="/bookings/schedule" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Qurbani Schedule</h1></header> */}
                  <QurbaniSchedule />
                </>
              } />

              <Route path="/bookings/full-list" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Full Booking List</h1></header> */}
                  <BookingManagement user={user} viewMode="list" />
                </>
              } />

              <Route path="/bookings/online-pending" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Online Debit Pending List</h1></header> */}
                  <OnlinePendingList user={user} />
                </>
              } />

              <Route path="/bookings/reviews" element={
                <>
                  <ReviewsManager user={user} />
                </>
              } />

              <Route path="/bookings/year/:year" element={
                <>
                  {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Bookings By Year</h1></header> */}
                  <BookingManagement user={user} viewMode="list" />
                </>
              } />

              <Route path="/vendors" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Manage Vendors</h1></header> */}
                    <VendorManagement viewMode="list" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/vendors/view/:id" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Vendor Details</h1></header> */}
                    <VendorManagement viewMode="view" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/vendors/add" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Add Vendor</h1></header> */}
                    <VendorManagement viewMode="form" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/vendors/edit/:id" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Edit Vendor</h1></header> */}
                    <VendorManagement viewMode="form" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/creation-master/:mode" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Creation Master</h1></header> */}
                    <CreationMaster />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/qurbani-dates" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Qurbani Dates Master</h1></header> */}
                    <QurbaniDateMaster viewMode="list" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/qurbani-dates/view/:id" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">View Qurbani Date</h1></header> */}
                    <QurbaniDateMaster viewMode="view" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/qurbani-dates/add" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Add Date</h1></header> */}
                    <QurbaniDateMaster viewMode="form" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/qurbani-dates/edit/:id" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Edit Date</h1></header> */}
                    <QurbaniDateMaster viewMode="form" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/departments-master" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Department Master</h1></header> */}
                    <DepartmentMaster viewMode="list" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/departments-master/view/:id" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">View Department</h1></header> */}
                    <DepartmentMaster viewMode="view" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/departments-master/add" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Add Department</h1></header> */}
                    <DepartmentMaster viewMode="form" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/departments-master/edit/:id" element={
                isAdmin ? (
                  <>
                    {/* <header className="mb-6"><h1 className="text-[22px] font-bold font-outfit text-slate-800 tracking-tight">Edit Department</h1></header> */}
                    <DepartmentMaster viewMode="form" />
                  </>
                ) : (
                  <Navigate to="/inventory" replace />
                )
              } />

              <Route path="/settings/profile" element={
                <ProfilePage user={user} onUpdateUser={(updatedUser) => {
                  setUser(updatedUser);
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                }} />
              } />

              <Route path="/settings/company" element={
                isAdmin ? <CompanySettingsPage user={user} /> : <Navigate to="/dashboard" replace />
              } />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
