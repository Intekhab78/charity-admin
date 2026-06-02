import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Package, Info, Users, Briefcase, LogOut,
  ChevronDown, ChevronRight, ChevronLeft, Plus, List,
  CreditCard, Clock, Gift, BarChart2, Globe,
  Star, CalendarDays, Boxes, PackageCheck, Beef, MapPin, Coins, ClipboardList
} from 'lucide-react';

import { bookingService } from '../services/api';

const baseBookingSubMenu = [
  { label: 'Start Booking',             path: '/bookings',               icon: Plus,         end: true  },
  { label: 'Booking List',              path: '/bookings/list',           icon: List               },
  { label: 'Payment List',              path: '/bookings/payments',       icon: CreditCard         },
  { label: 'Pending Cart List',         path: '/bookings/pending',        icon: Clock              },
  { label: 'Qurbani Collection',        path: '/bookings/collection',     icon: Gift   },
  { label: 'Qurbani Comparison',        path: '/bookings/comparison',     icon: BarChart2 },
  { label: 'Full Booking List',         path: '/bookings/full-list',      icon: List               },
  { label: 'Online Debit Pending List', path: '/bookings/online-pending', icon: Globe              },
  { label: 'Reviews',                   path: '/bookings/reviews',        icon: Star               }
];

const creationSubMenu = [
  { label: 'Create Batch', path: '/creation-master/batch', icon: PackageCheck },
  { label: 'Animal', path: '/creation-master/animal', icon: Beef },
  { label: 'Location', path: '/creation-master/location', icon: MapPin },
  { label: 'Currency', path: '/creation-master/currency', icon: Coins },
];

const Sidebar = ({ user, onLogout, isAdmin, collapsed, setCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isBookingsActive = location.pathname.startsWith('/bookings') && location.pathname !== '/bookings/schedule';
  const isScheduleActive = location.pathname === '/bookings/schedule';
  const isCreationActive = location.pathname.startsWith('/creation-master');
  const [bookingsOpen, setBookingsOpen] = useState(isBookingsActive);
  const [creationOpen, setCreationOpen] = useState(isCreationActive);
  const [scheduleOpen, setScheduleOpen] = useState(isScheduleActive);
  const [availableYears, setAvailableYears] = useState([]);
  const [scheduleMenuData, setScheduleMenuData] = useState(null);

  React.useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await bookingService.getAvailableYears();
        if (res.data?.data) {
          setAvailableYears(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch available years", err);
      }
    };
    fetchYears();

    const updateScheduleHandler = (e) => {
      setScheduleMenuData(e.detail);
    };
    window.addEventListener('qurbaniScheduleUpdated', updateScheduleHandler);
    return () => {
      window.removeEventListener('qurbaniScheduleUpdated', updateScheduleHandler);
    };
  }, []);

  const fullBookingSubMenu = [
    ...baseBookingSubMenu,
    ...availableYears.map(y => ({
      label: `Booked List-${y}`,
      path: `/bookings/year/${y}`,
      icon: CalendarDays,
    }))
  ];

  const visibleBookingSubMenu = isAdmin 
    ? fullBookingSubMenu 
    : fullBookingSubMenu.filter(item => item.label === 'Start Booking' || item.label === 'Booking List');

  return (
    <aside className="sidebar" style={{ 
      width: collapsed ? '70px' : '280px', 
      minWidth: collapsed ? '70px' : '280px', 
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'visible',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #d1fae5'
    }}>
      <style>{`
        .location-card { border: 1px solid #d1fae5; background: #f8fafc; border-radius: 6px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; color: #334155; font-weight: 700; margin-bottom: 4px; font-size: 11px; }
        .location-card div { display: flex; gap: 6px; align-items: center; }
        .location-card span { background: #0ea5e9; color: #fff; border-radius: 999px; padding: 2px 6px; font-size: 10px; font-weight: bold; }
        .location-card.active { background: #059669; color: #fff; border-color: #059669; }
        .location-card.active span { background: #fff; color: #059669; }
        .location-block { border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 4px; }
        .animal-line { display: flex; justify-content: space-between; gap: 6px; font-size: 10px; padding: 3px 6px; color: #475569; }
        .animal-line b { color: #0284c7; }
      `}</style>

      {/* ── Collapse/Fold Toggle Pill ── */}
      <button onClick={() => setCollapsed(!collapsed)} style={{
        position: 'absolute',
        top: '25px',
        right: '-12px',
        zIndex: 100,
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        border: '1px solid #059669',
        color: '#059669',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.transform = 'scale(1)'; }}
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* ── User Profile Snapshot ── */}
      <div style={{ padding: collapsed ? '15px 5px' : '20px', borderBottom: '1px solid #d1fae5', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: collapsed ? 'column' : 'row', alignItems: 'center', gap: collapsed ? '8px' : '15px' }}>
          <div style={{ width: collapsed ? 38 : 45, height: collapsed ? 38 : 45, borderRadius: '50%', background: '#fff', border: '2px solid #059669', overflow: 'hidden', flexShrink: 0, transition: 'all 0.2s' }}>
             <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || (isAdmin ? 'Administrator' : 'Vendor'))}&background=059669&color=fff`} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                {user?.name || (isAdmin ? 'Administrator' : 'Vendor')}
              </div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                {isAdmin ? 'Administrator' : 'Vendor'}
              </div>
              <div style={{ color: '#059669', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }}></div> Online
              </div>
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: '15px 20px 5px', color: '#059669', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          MAIN NAVIGATION
        </div>
      )}

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>

        {isAdmin && (
          <NavLink to="/inventory" className={({ isActive }) => isActive ? 'active' : ''} style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '11px 0' : '11px 14px' }}>
            <Package size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Charity Items</span>}
          </NavLink>
        )}

        <NavLink to="/customers" className={({ isActive }) => isActive ? 'active' : ''} style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '11px 0' : '11px 14px' }}>
          <Users size={16} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Charity Customers</span>}
        </NavLink>

        {/* Manage Bookings Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => !collapsed && setBookingsOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
            width: '100%', padding: collapsed ? '11px 0' : '11px 14px', background: isBookingsActive ? 'rgba(5,150,105,0.1)' : 'none',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            color: isBookingsActive ? '#059669' : '#475569',
            fontSize: 14, fontWeight: isBookingsActive ? 600 : 500,
            transition: 'all 0.18s', marginBottom: 2
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Briefcase size={16} style={{ flexShrink: 0 }} /> 
              {!collapsed && <span>Manage Bookings</span>}
            </span>
            {!collapsed && (bookingsOpen
              ? <ChevronDown size={14} style={{ opacity: 0.6 }} />
              : <ChevronRight size={14} style={{ opacity: 0.6 }} />)}
          </button>

          {bookingsOpen && !collapsed && (
            <div style={{
              marginLeft: 14, paddingLeft: 14,
              borderLeft: '1px solid rgba(5,150,105,0.3)',
              display: 'flex', flexDirection: 'column', gap: 1,
              marginBottom: 4
            }}>
              {visibleBookingSubMenu.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) => `sub-link ${isActive ? 'sub-active' : ''}`}
                  >
                    <Icon size={13} style={{ flexShrink: 0 }} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>



        {isAdmin && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button onClick={() => !collapsed && setCreationOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
                width: '100%', padding: collapsed ? '11px 0' : '11px 14px', background: isCreationActive ? 'rgba(5,150,105,0.1)' : 'none',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                color: isCreationActive ? '#059669' : '#475569',
                fontSize: 14, fontWeight: isCreationActive ? 600 : 500,
                transition: 'all 0.18s', marginBottom: 2
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Boxes size={16} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>Creation Master</span>}
                </span>
                {!collapsed && (creationOpen
                  ? <ChevronDown size={14} style={{ opacity: 0.6 }} />
                  : <ChevronRight size={14} style={{ opacity: 0.6 }} />)}
              </button>

              {creationOpen && !collapsed && (
                <div style={{
                  marginLeft: 14, paddingLeft: 14,
                  borderLeft: '1px solid rgba(5,150,105,0.3)',
                  display: 'flex', flexDirection: 'column', gap: 1,
                  marginBottom: 4
                }}>
                  {creationSubMenu.map(item => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `sub-link ${isActive ? 'sub-active' : ''}`}
                      >
                        <Icon size={13} style={{ flexShrink: 0 }} />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            <NavLink to="/vendors" className={({ isActive }) => isActive ? 'active' : ''} style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '11px 0' : '11px 14px' }}>
              <Users size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Manage Vendors</span>}
            </NavLink>
            <NavLink to="/qurbani-dates" className={({ isActive }) => isActive ? 'active' : ''} style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '11px 0' : '11px 14px' }}>
              <CalendarDays size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Qurbani Dates</span>}
            </NavLink>
            <NavLink to="/departments-master" className={({ isActive }) => isActive ? 'active' : ''} style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '11px 0' : '11px 14px' }}>
              <Briefcase size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Department Master</span>}
            </NavLink>
          </>
        )}
        {/* Qurbani Schedule Separate Menu */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => {
            if (collapsed) return;
            if (!isScheduleActive) {
              setScheduleOpen(true);
              navigate('/bookings/schedule');
            } else {
              setScheduleOpen(o => !o);
            }
          }} style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
            width: '100%', padding: collapsed ? '11px 0' : '11px 14px', background: isScheduleActive ? '#059669' : 'none',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            color: isScheduleActive ? '#fff' : '#475569',
            fontSize: 14, fontWeight: isScheduleActive ? 600 : 500,
            transition: 'all 0.18s', marginBottom: 2
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ClipboardList size={16} style={{ flexShrink: 0 }} /> 
              {!collapsed && <span>Qurbani Schedule</span>}
            </span>
            {!collapsed && (scheduleOpen
              ? <ChevronDown size={14} style={{ opacity: isScheduleActive ? 0.8 : 0.6 }} />
              : <ChevronRight size={14} style={{ opacity: isScheduleActive ? 0.8 : 0.6 }} />)}
          </button>

          {scheduleOpen && !collapsed && (
            <div style={{
              marginLeft: 14, paddingLeft: 14,
              borderLeft: '1px solid rgba(5,150,105,0.3)',
              display: 'flex', flexDirection: 'column', gap: 1,
              marginTop: 6, marginBottom: 4
            }}>
              {scheduleMenuData ? (
                <div style={{ paddingRight: '8px', pointerEvents: 'auto' }}>
                  <button className={`location-card ${scheduleMenuData.activeLocation === 'all' ? 'active' : ''}`} 
                          onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('changeQurbaniLocation', { detail: { location: 'all' }})); }} style={{ width: '100%' }}>
                    <div><MapPin size={12} /> All Locations</div>
                    <span>{scheduleMenuData.totalShares}</span>
                  </button>
                  {scheduleMenuData.locationSummary.map(loc => (
                    <div className="location-block" key={loc.location}>
                      <button className={`location-card ${scheduleMenuData.activeLocation === loc.location ? 'active' : ''}`} 
                              onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('changeQurbaniLocation', { detail: { location: loc.location }})); }} style={{ width: '100%' }}>
                        <div><MapPin size={12} /> {loc.location}</div>
                        <span>{loc.total}</span>
                      </button>
                      {loc.batches.map(group => (
                        <div className="animal-line" key={group.key}>
                          <span>{group.batch.animal_name || 'Animal'}</span>
                          <b>{group.rows.length}-{Number(group.batch.qty || 0)}</b>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '8px', fontSize: 11, color: '#64748b' }}>
                  Navigate to schedule to view.
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ── Logout ── */}
      <div style={{ padding: collapsed ? '12px 5px' : '12px 16px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center' }}>
        <button onClick={onLogout} style={{
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 12,
          width: '100%', padding: collapsed ? '10px 0' : '10px 14px',
          background: 'rgba(5,150,105,0.04)', border: 'none',
          borderRadius: 10, cursor: 'pointer',
          color: '#64748b', fontSize: 14, fontWeight: 500,
          transition: 'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,150,105,0.04)'; e.currentTarget.style.color = '#64748b'; }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} /> 
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
