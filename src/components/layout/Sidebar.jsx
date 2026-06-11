import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Package, Info, Users, Briefcase, LogOut,
  ChevronDown, ChevronRight, ChevronLeft, Plus, List,
  CreditCard, Clock, Gift, BarChart2, Globe,
  Star, CalendarDays, Boxes, PackageCheck, Beef, MapPin, Coins, ClipboardList,
  LayoutDashboard, Settings, User, Building2
} from 'lucide-react';

import { bookingService, UPLOADS_BASE_URL } from '../../services/api';

const baseBookingSubMenu = [
  { label: 'Start Booking', path: '/bookings', icon: Plus, end: true },
  { label: 'Booking List', path: '/bookings/list', icon: List },
  { label: 'Payment List', path: '/bookings/payments', icon: CreditCard },
  { label: 'Pending Cart List', path: '/bookings/pending', icon: Clock },
  { label: 'Qurbani Collection', path: '/bookings/collection', icon: Gift },
  { label: 'Qurbani Comparison', path: '/bookings/comparison', icon: BarChart2 },
  { label: 'Full Booking List', path: '/bookings/full-list', icon: List },
  { label: 'Online Debit Pending List', path: '/bookings/online-pending', icon: Globe },
  { label: 'Reviews', path: '/bookings/reviews', icon: Star }
];

const creationSubMenu = [
  { label: 'Create Batch', path: '/creation-master/batch', icon: PackageCheck },
  { label: 'Animal', path: '/creation-master/animal', icon: Beef },
  { label: 'Location', path: '/creation-master/location', icon: MapPin },
  { label: 'Currency', path: '/creation-master/currency', icon: Coins },
];

const Sidebar = ({ user, isAdmin, collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
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

  const NavLinkClasses = ({ isActive }) =>
    `group relative flex items-center gap-3.5 mx-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-[15px] whitespace-nowrap border active:scale-[0.98] ${
      isActive 
        ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 text-primary border-emerald-500/15 shadow-[0_4px_12px_rgba(16,185,129,0.06)] dark:from-primary/15 dark:to-primary/5 dark:text-primary dark:border-primary/20' 
        : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:text-primary hover:bg-primary-light/80 dark:hover:bg-primary/5 dark:hover:text-primary hover:translate-x-1'
    } ${collapsed ? 'justify-center mx-2 px-3' : 'justify-start'}`;

  const NavBtnClasses = (isActive) =>
    `group w-full flex items-center justify-between gap-3.5 mx-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-[15px] whitespace-nowrap border active:scale-[0.98] ${
      isActive
        ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 text-primary border-emerald-500/15 shadow-[0_4px_12px_rgba(16,185,129,0.06)] dark:from-primary/15 dark:to-primary/5 dark:text-primary dark:border-primary/20'
        : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:text-primary hover:bg-primary-light/80 dark:hover:bg-primary/5 dark:hover:text-primary hover:translate-x-1'
    } ${collapsed ? 'justify-center mx-2 px-3' : 'justify-start'}`;

  const renderLink = (to, Icon, label, end = false) => {
    return (
      <NavLink 
        to={to} 
        end={end}
        className={NavLinkClasses} 
        onClick={() => setMobileOpen(false)}
      >
        {({ isActive }) => (
          <>
            <Icon 
              size={20} 
              className={`transition-colors duration-200 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-slate-400 dark:text-slate-500 group-hover:text-primary'
              }`} 
            />
            {!collapsed && <span className="transition-colors duration-200">{label}</span>}
            {isActive && !collapsed && (
              <span className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#10b981]" />
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 md:relative flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]
      ${collapsed ? 'md:w-20 md:min-w-[80px]' : 'md:w-[280px] md:min-w-[280px]'}
      ${mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'}
    `}>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-7 -right-3.5 z-[100] w-7 h-7 md:flex hidden items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 shadow-md transition-all duration-200 hover:text-primary hover:border-primary hover:shadow-lg hover:scale-105 active:scale-95"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* ── Profile Card ── */}
      <div className={`transition-all duration-300 ${
        collapsed 
          ? 'py-6 border-b border-slate-200/80 dark:border-slate-800 flex justify-center' 
          : 'p-4 mx-4.5 mt-5 mb-2 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl'
      }`}>
        <div className={`flex items-center gap-4 min-w-0 ${collapsed ? 'flex-col' : 'flex-row'}`}>
          <div className="relative flex-shrink-0">
            <div className={`rounded-xl overflow-hidden p-0.5 border border-emerald-500/20 dark:border-emerald-500/30 transition-all ${
              collapsed ? 'w-11 h-11' : 'w-12 h-12'
            }`}>
              {user?.profile_image ? (
                <img
                  src={`${UPLOADS_BASE_URL}/uploads/${user.profile_image}`}
                  alt="User"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || (isAdmin ? 'Admin' : 'Vendor'))}&background=10b981&color=fff&bold=true&font-size=0.4`}
                  alt="User"
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-[2px] border-white dark:border-slate-900"></span>
            </span>
          </div>
          
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-slate-800 dark:text-slate-200 font-extrabold text-[15px] truncate leading-tight">
                {user?.name || (isAdmin ? 'Admin User' : 'Vendor User')}
              </div>
              <div className="text-slate-400 dark:text-slate-500 text-[11px] font-bold tracking-wider uppercase mt-1">
                {isAdmin ? 'System Admin' : 'Vendor Operator'}
              </div>
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="px-6 pt-5 pb-2 text-slate-400 dark:text-slate-500 text-[11px] font-extrabold tracking-[1.5px] uppercase select-none">
          Main Menu
        </div>
      )}

      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto sidebar-scroll">
        {/* Dashboard */}
        {renderLink('/dashboard', LayoutDashboard, 'Dashboard')}

        {isAdmin && renderLink('/inventory', Package, 'Inventory Items')}

        {renderLink('/customers', Users, 'Customers')}

        {/* Manage Bookings Dropdown */}
        <div className="flex flex-col">
          <button onClick={() => !collapsed && setBookingsOpen(o => !o)} className={NavBtnClasses(isBookingsActive)}>
            <div className="flex items-center gap-3.5">
              <Briefcase 
                size={20} 
                className={`transition-colors duration-200 ${
                  isBookingsActive 
                    ? 'text-primary' 
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-primary'
                }`} 
              />
              {!collapsed && <span className="transition-colors duration-200">Bookings</span>}
            </div>
            {!collapsed && (
              <ChevronDown 
                size={16} 
                className={`opacity-60 transition-transform duration-300 ${bookingsOpen ? 'rotate-0' : '-rotate-90'}`} 
              />
            )}
          </button>

          {bookingsOpen && !collapsed && (
            <div className="ml-8 pl-3.5 border-l border-slate-200 dark:border-slate-800 mt-1 mb-2 flex flex-col gap-0.5 animate-slide-down pr-3">
              {visibleBookingSubMenu.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) => `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary-light/60 text-primary dark:bg-primary/10' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary-light/40 dark:hover:bg-primary/5 hover:translate-x-1'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon 
                          size={15} 
                          className={`transition-colors duration-200 ${
                            isActive 
                              ? 'text-primary' 
                              : 'text-slate-400 dark:text-slate-500 group-hover:text-primary'
                          }`} 
                        />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {isAdmin && (
          <>
            {/* Creation Master Dropdown */}
            <div className="flex flex-col">
              <button onClick={() => !collapsed && setCreationOpen(o => !o)} className={NavBtnClasses(isCreationActive)}>
                <div className="flex items-center gap-3.5">
                  <Boxes 
                    size={20} 
                    className={`transition-colors duration-200 ${
                      isCreationActive 
                        ? 'text-primary' 
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-primary'
                    }`} 
                  />
                  {!collapsed && <span className="transition-colors duration-200">Creation Master</span>}
                </div>
                {!collapsed && (
                  <ChevronDown 
                    size={16} 
                    className={`opacity-60 transition-transform duration-300 ${creationOpen ? 'rotate-0' : '-rotate-90'}`} 
                  />
                )}
              </button>

              {creationOpen && !collapsed && (
                <div className="ml-8 pl-3.5 border-l border-slate-200 dark:border-slate-800 mt-1 mb-2 flex flex-col gap-0.5 animate-slide-down pr-3">
                  {creationSubMenu.map(item => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-200 ${
                          isActive 
                            ? 'bg-primary-light/60 text-primary dark:bg-primary/10' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary-light/40 dark:hover:bg-primary/5 hover:translate-x-1'
                        }`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon 
                              size={15} 
                              className={`transition-colors duration-200 ${
                                isActive 
                                  ? 'text-primary' 
                                  : 'text-slate-400 dark:text-slate-500 group-hover:text-primary'
                              }`} 
                            />
                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            {renderLink('/vendors', Users, 'Vendors')}
            {renderLink('/qurbani-dates', CalendarDays, 'Qurbani Dates')}
            {renderLink('/departments-master', Briefcase, 'Departments')}
          </>
        )}

        {/* Schedule Dropdown */}
        {isAdmin && (
        <div className="flex flex-col">
          <button
            onClick={() => {
              if (collapsed) return;
              if (!isScheduleActive) {
                setScheduleOpen(true);
                navigate('/bookings/schedule');
              } else {
                setScheduleOpen(o => !o);
              }
            }}
            className={NavBtnClasses(isScheduleActive)}
          >
            <div className="flex items-center gap-3.5">
              <ClipboardList 
                size={20} 
                className={`transition-colors duration-200 ${
                  isScheduleActive 
                    ? 'text-primary' 
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-primary'
                }`} 
              />
              {!collapsed && <span className="transition-colors duration-200">Schedule</span>}
            </div>
            {!collapsed && (
              <ChevronDown 
                size={16} 
                className={`opacity-60 transition-transform duration-300 ${scheduleOpen ? 'rotate-0' : '-rotate-90'}`} 
              />
            )}
          </button>

          {scheduleOpen && !collapsed && (
            <div className="ml-8 pl-3.5 border-l border-slate-200 dark:border-slate-800 mt-1 mb-2 flex flex-col gap-0.5 animate-slide-down pr-3">
              {scheduleMenuData ? (
                <div className="pt-2">
                  <button
                    onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('changeQurbaniLocation', { detail: { location: 'all' } })); setMobileOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 p-3 mb-2 rounded-xl border font-semibold text-[13.5px] transition-all duration-200 active:scale-[0.98] ${
                      scheduleMenuData.activeLocation === 'all'
                        ? 'bg-primary border-primary text-white shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-primary-light/30 dark:hover:bg-primary/5 hover:text-primary dark:hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className={scheduleMenuData.activeLocation === 'all' ? 'text-white' : 'text-slate-400 dark:text-slate-500'} /> 
                      <span>All Locations</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold shadow-sm ${
                      scheduleMenuData.activeLocation === 'all' 
                        ? 'bg-white text-primary' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700'
                    }`}>{scheduleMenuData.totalShares}</span>
                  </button>
                  {scheduleMenuData.locationSummary.map(loc => {
                    const isLocActive = scheduleMenuData.activeLocation === loc.location;
                    return (
                      <div className="mb-2" key={loc.location}>
                        <button
                          onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('changeQurbaniLocation', { detail: { location: loc.location } })); setMobileOpen(false); }}
                          className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl border font-semibold text-[13.5px] transition-all duration-200 active:scale-[0.98] ${
                            isLocActive
                              ? 'bg-primary border-primary text-white shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                              : 'bg-white dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-primary-light/30 dark:hover:bg-primary/5 hover:text-primary dark:hover:text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin size={15} className={isLocActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'} /> 
                            <span>{loc.location}</span>
                          </div>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold shadow-sm ${
                            isLocActive 
                              ? 'bg-white text-primary' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700'
                          }`}>{loc.total}</span>
                        </button>
                        {loc.batches.map(group => (
                          <div className="flex justify-between gap-2 text-[11.5px] px-3.5 py-1.5 mt-0.5 font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg mx-1" key={group.key}>
                            <span className="truncate max-w-[120px]">{group.batch.animal_name || 'Animal'}</span>
                            <span className="text-primary font-bold">{group.rows.length}/{Number(group.batch.qty || 0)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 text-[12.5px] text-slate-400 dark:text-slate-550 italic">
                  Navigate to see status
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Settings Division */}
        {!collapsed && (
          <div className="px-6 pt-5 pb-2 text-slate-400 dark:text-slate-500 text-[11px] font-extrabold tracking-[1.5px] uppercase select-none">
            Settings
          </div>
        )}
        {renderLink('/settings/profile', User, 'My Profile')}
        {isAdmin && renderLink('/settings/company', Building2, 'Company Settings')}
      </nav>
    </aside>
  );
};

export default Sidebar;
