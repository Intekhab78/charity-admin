import React, { useState, useEffect, useRef } from 'react';
import { Menu, Mail, Bell, Flag, Settings, ChevronRight, Check } from 'lucide-react';
import { bookingService, qurbaniDateService } from '../services/api';

const TopNav = ({ user, sidebarCollapsed }) => {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'mail' | 'bell' | 'flag' | 'settings' | null
  
  // Dynamic metrics states
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingList, setPendingList] = useState([]);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [activeDatesCount, setActiveDatesCount] = useState(0);
  const [activeDates, setActiveDates] = useState([]);

  const containerRef = useRef(null);

  // Close dropdowns on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchNotificationMetrics = async () => {
    try {
      const bookingsRes = await bookingService.list();
      const bookings = bookingsRes.data?.data || [];
      const pending = bookings.filter(b => b.is_approved_by_admin === 0);
      setPendingCount(pending.length);
      setPendingList(pending.slice(0, 3));
      setTotalBookingsCount(bookings.length);
      
      const datesRes = await qurbaniDateService.list();
      const activeD = (datesRes.data?.data || []).filter(d => d.status === 1);
      setActiveDatesCount(activeD.length);
      setActiveDates(activeD.slice(0, 3));
    } catch (err) {
      console.error("TopNav failed to fetch real-time metrics:", err);
    }
  };

  useEffect(() => {
    fetchNotificationMetrics();
    // Poll every 15 seconds to keep notifications fresh
    const interval = setInterval(fetchNotificationMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleDropdown = (type) => {
    setActiveDropdown(prev => prev === type ? null : type);
  };

  return (
    <div className="top-nav" ref={containerRef}>
      <div className="nav-left" style={{
        width: sidebarCollapsed ? '70px' : '280px',
        minWidth: sidebarCollapsed ? '70px' : '280px',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <span className="brand-text" style={{ fontSize: sidebarCollapsed ? '16px' : '20px' }}>
          {sidebarCollapsed ? 'MS' : 'MaktabaShah'}
        </span>
      </div>

      <div className="nav-right-container">
        <button className="menu-btn" onClick={() => alert("Menu drawer collapsed state handled by the fold button inside sidebar.")}>
          <Menu size={20} />
        </button>

        <div className="nav-right">
          <div className="nav-icon-group">
            {/* Mail Notification (Pending Approvals) */}
            <div className="icon-wrapper" onClick={() => toggleDropdown('mail')} title="Pending Approvals">
              <Mail size={18} />
              {pendingCount > 0 && <span className="badge badge-green">{pendingCount}</span>}

              {activeDropdown === 'mail' && (
                <div className="nav-dropdown animate-slide-up">
                  <div className="dropdown-header">Pending Approvals ({pendingCount})</div>
                  <div className="dropdown-body">
                    {pendingList.length > 0 ? pendingList.map(b => (
                      <div key={b._id} className="dropdown-item" onClick={() => window.location.href='/bookings/pending'}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{b.customer_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                          <span>{b.share_code}</span>
                          <span style={{ fontWeight: '600', color: '#059669' }}>₹{b.total_amount}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="dropdown-empty">All bookings are fully approved!</div>
                    )}
                  </div>
                  <div className="dropdown-footer" onClick={() => window.location.href='/bookings/pending'}>
                    View Pending Cart List <ChevronRight size={12} />
                  </div>
                </div>
              )}
            </div>

            {/* Bell Notification (System Activity) */}
            <div className="icon-wrapper" onClick={() => toggleDropdown('bell')} title="System Status">
              <Bell size={18} />
              <span className="badge badge-yellow">2</span>

              {activeDropdown === 'bell' && (
                <div className="nav-dropdown animate-slide-up">
                  <div className="dropdown-header">System Notifications</div>
                  <div className="dropdown-body">
                    <div className="dropdown-item">
                      <div style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Check size={12} style={{ color: '#059669' }} /> System status: Online
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Total system bookings loaded: {totalBookingsCount}
                      </div>
                    </div>
                    <div className="dropdown-item">
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>Portal Upgraded</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Collapsible sidebar is active
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-footer" onClick={() => setActiveDropdown(null)}>
                    Dismiss All Notifications
                  </div>
                </div>
              )}
            </div>

            {/* Flag Notification (Active Qurbani Dates) */}
            <div className="icon-wrapper" onClick={() => toggleDropdown('flag')} title="Qurbani Dates">
              <Flag size={18} />
              {activeDatesCount > 0 && <span className="badge badge-red">{activeDatesCount}</span>}

              {activeDropdown === 'flag' && (
                <div className="nav-dropdown animate-slide-up">
                  <div className="dropdown-header">Active Qurbani Dates ({activeDatesCount})</div>
                  <div className="dropdown-body">
                    {activeDates.length > 0 ? activeDates.map(d => (
                      <div key={d._id} className="dropdown-item" onClick={() => window.location.href='/qurbani-dates'}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>Day {d.eid_day}: {new Date(d.qurbani_date).toLocaleDateString()}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Status: Active Booking Target
                        </div>
                      </div>
                    )) : (
                      <div className="dropdown-empty">No active Qurbani days set.</div>
                    )}
                  </div>
                  <div className="dropdown-footer" onClick={() => window.location.href='/qurbani-dates'}>
                    Manage Qurbani Dates <ChevronRight size={12} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Profile Pill */}
          <div className="user-profile" onClick={() => toggleDropdown('settings')}>
            <div className="avatar-small">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=059669&color=fff`} alt="Avatar" />
            </div>
            <span className="user-name">{user?.name || 'Charity Operator'}</span>
            <button className="settings-btn">
              <Settings size={18} />
            </button>

            {activeDropdown === 'settings' && (
              <div className="nav-dropdown animate-slide-up" style={{ top: '40px', width: '200px' }}>
                <div className="dropdown-header">Account Controls</div>
                <div className="dropdown-body">
                  <div className="dropdown-item" onClick={() => alert(`Logged in as: ${user?.email || 'current user'}`)}>
                    Profile Info
                  </div>
                  <div className="dropdown-item" onClick={() => alert("Theme configurations locked to harmony emerald green.")}>
                    Theme Settings
                  </div>
                </div>
                <div className="dropdown-footer" style={{ color: '#ef4444' }} onClick={() => window.location.reload()}>
                  Reload Portal
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .top-nav {
          display: flex;
          align-items: center;
          background-color: #059669; /* Emerald Green */
          color: white;
          height: 50px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          z-index: 1000;
        }

        .nav-left {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background-color: #047857; /* Darker Green for logo area */
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .nav-right-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
          padding: 0 15px;
          height: 100%;
        }

        .menu-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 8px 12px;
          transition: background 0.2s;
          border-radius: 6px;
        }
        .menu-btn:hover {
          background: rgba(0,0,0,0.1);
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .nav-icon-group {
          display: flex;
          gap: 15px;
        }

        .icon-wrapper {
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: rgba(255,255,255,0.9);
          padding: 5px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .icon-wrapper:hover {
          color: white;
          background: rgba(0,0,0,0.1);
        }

        .badge {
          position: absolute;
          top: -2px;
          right: -2px;
          font-size: 9px;
          font-weight: bold;
          padding: 2px 4px;
          border-radius: 4px;
          color: white;
          line-height: 1;
        }
        .badge-green { background-color: #10b981; border: 1px solid #059669; }
        .badge-yellow { background-color: #f59e0b; border: 1px solid #d97706; }
        .badge-red { background-color: #ef4444; border: 1px solid #dc2626; }

        .user-profile {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 4px 14px 4px 4px;
          background: #ffffff;
          border-radius: 9999px;
          transition: all 0.2s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .user-profile:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .avatar-small img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: #047857; /* Dark Emerald */
        }

        .settings-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color 0.2s;
        }
        .settings-btn:hover {
          color: #047857;
        }

        /* Popover Dropdown Styles */
        .nav-dropdown {
          position: absolute;
          top: 40px;
          right: 0;
          width: 280px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
          border: 1px solid #d1fae5;
          color: #1e293b;
          overflow: hidden;
          z-index: 10000;
          display: flex;
          flex-direction: column;
        }

        .animate-slide-up {
          animation: slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-header {
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-weight: 700;
          font-size: 13px;
          color: #047857;
        }

        .dropdown-body {
          max-height: 220px;
          overflow-y: auto;
        }

        .dropdown-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.15s;
          text-align: left;
        }
        .dropdown-item:hover {
          background: #ecfdf5;
        }

        .dropdown-empty {
          padding: 24px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }

        .dropdown-footer {
          padding: 11px 16px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #059669;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: background 0.15s;
        }
        .dropdown-footer:hover {
          background: #ecfdf5;
        }
      `}</style>
    </div>
  );
};

export default TopNav;
