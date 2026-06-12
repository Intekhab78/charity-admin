import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Package, Info, Users, Briefcase, LogOut,
  ChevronDown, ChevronRight, ChevronLeft, Plus, List,
  CreditCard, Clock, Gift, BarChart2, Globe,
  Star, CalendarDays, Boxes, PackageCheck, Beef, MapPin, Coins, ClipboardList,
  LayoutDashboard, Settings, User, Building2, Activity
} from 'lucide-react';

import { bookingService, UPLOADS_BASE_URL } from '../../services/api';

const baseBookingSubMenu = [
  { label: 'Start Booking', path: '/bookings', icon: Plus, end: true },
  { label: 'Booking List', path: '/bookings/list', icon: List },
  { label: 'Payment List', path: '/bookings/payments', icon: CreditCard },
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
    `group relative flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg transition-all duration-300 font-medium text-[14px] whitespace-nowrap ${
      isActive 
        ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
        : 'bg-transparent text-slate-600 hover:text-emerald-600 hover:bg-slate-50 hover:translate-x-1'
    } ${collapsed ? 'justify-center mx-2 px-3' : 'justify-start'}`;

  const NavBtnClasses = (isActive) =>
    `group w-full flex items-center justify-between gap-3 mx-3 px-3 py-2.5 rounded-lg transition-all duration-300 font-medium text-[14px] whitespace-nowrap ${
      isActive
        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
        : 'bg-transparent text-slate-600 hover:text-emerald-600 hover:bg-slate-50 hover:translate-x-1'
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
              strokeWidth={isActive ? 2.5 : 1.5}
              className={`transition-all duration-300 z-10 ${
                isActive 
                  ? 'text-emerald-600 scale-110' 
                  : 'text-slate-400 group-hover:text-emerald-600 group-hover:scale-110'
              }`} 
            />
            {!collapsed && <span className="transition-colors duration-200 z-10">{label}</span>}
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 bg-emerald-500 rounded-r-md transition-all duration-300 ease-out ${isActive ? 'h-full opacity-100' : 'h-0 opacity-0'}`} />
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 md:relative flex flex-col bg-white text-slate-700 border-r border-slate-200 transition-all duration-300 shadow-sm
      ${collapsed ? 'md:w-20 md:min-w-[80px]' : 'md:w-[280px] md:min-w-[280px]'}
      ${mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'}
    `}>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-7 -right-3.5 z-[100] w-7 h-7 md:flex hidden items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 shadow-sm transition-all duration-200 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:scale-105 active:scale-95"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* ── Profile Card ── */}
      <div className={`transition-all duration-300 ${
        collapsed 
          ? 'py-6 border-b border-slate-200 flex justify-center' 
          : 'p-4 mx-4 mt-6 mb-4 bg-slate-50 border border-slate-100 rounded-xl'
      }`}>
        <div className={`flex items-center gap-4 min-w-0 ${collapsed ? 'flex-col' : 'flex-row'}`}>
          <div className="relative flex-shrink-0">
            <div className={`rounded-xl overflow-hidden p-[2px] bg-white border border-slate-200 transition-all ${
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
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || (isAdmin ? 'Admin' : 'Vendor'))}&background=0f172a&color=34d399&bold=true&font-size=0.4`}
                  alt="User"
                  className="w-full h-full object-cover rounded-[10px]"
                />
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-[2px] border-white"></span>
            </span>
          </div>
          
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-slate-800 font-bold text-[15px] truncate leading-tight tracking-wide">
                {user?.name || (isAdmin ? 'Admin User' : 'Vendor User')}
              </div>
              <div className="text-emerald-600 text-[10px] font-bold tracking-wider uppercase mt-1">
                {isAdmin ? 'System Admin' : 'Vendor Operator'}
              </div>
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="px-6 pt-4 pb-2 text-slate-400 text-xs font-bold tracking-wider uppercase select-none">
          Main Menu
        </div>
      )}

      <nav className="flex-1 py-2 flex flex-col gap-1 overflow-y-auto sidebar-scroll">
        {/* Dashboard */}
        {renderLink('/dashboard', LayoutDashboard, 'Dashboard')}

        {/* Reports */}
        {isAdmin && renderLink('/reports', Activity, 'Reports')}

        {isAdmin && renderLink('/inventory', Package, 'Inventory Items')}

        {renderLink('/customers', Users, 'Customers')}

        {/* Manage Bookings Dropdown */}
        <div className="flex flex-col">
          <button onClick={() => !collapsed && setBookingsOpen(o => !o)} className={NavBtnClasses(isBookingsActive)}>
            <div className="flex items-center gap-3.5">
              <Briefcase 
                size={20} 
                strokeWidth={isBookingsActive ? 2 : 1.5}
                className={`transition-all duration-200 ${
                  isBookingsActive 
                    ? 'text-emerald-600' 
                    : 'text-slate-400 group-hover:text-emerald-600'
                }`} 
              />
              {!collapsed && <span className="transition-colors duration-200">Bookings</span>}
            </div>
            {!collapsed && (
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 text-slate-400 ${bookingsOpen ? 'rotate-0' : '-rotate-90'}`} 
              />
            )}
          </button>

          {bookingsOpen && !collapsed && (
            <div className="ml-9 pl-3 border-l border-slate-200 mt-1 mb-2 flex flex-col gap-1 pr-3">
              {visibleBookingSubMenu.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                        : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50 hover:translate-x-1'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon 
                          size={16} 
                          className={`transition-all duration-300 z-10 ${
                            isActive 
                              ? 'text-emerald-600 scale-110' 
                              : 'text-slate-400 group-hover:text-emerald-600 group-hover:scale-110'
                          }`} 
                        />
                        <span className="z-10">{item.label}</span>
                        <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-emerald-500 rounded-r-md transition-all duration-300 ease-out ${isActive ? 'h-full opacity-100' : 'h-0 opacity-0'}`} />
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
                strokeWidth={isCreationActive ? 2 : 1.5}
                className={`transition-all duration-200 ${
                  isCreationActive 
                    ? 'text-emerald-600' 
                    : 'text-slate-400 group-hover:text-emerald-600'
                }`} 
              />
              {!collapsed && <span className="transition-colors duration-200">Creation Master</span>}
            </div>
            {!collapsed && (
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 text-slate-400 ${creationOpen ? 'rotate-0' : '-rotate-90'}`} 
              />
            )}
              </button>

              {creationOpen && !collapsed && (
                <div className="ml-9 pl-3 border-l border-slate-200 mt-1 mb-2 flex flex-col gap-1 pr-3">
                  {creationSubMenu.map(item => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                            : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50 hover:translate-x-1'
                        }`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon 
                              size={16} 
                              className={`transition-all duration-300 z-10 ${
                                isActive 
                                  ? 'text-emerald-600 scale-110' 
                                  : 'text-slate-400 group-hover:text-emerald-600 group-hover:scale-110'
                              }`} 
                            />
                            <span className="z-10">{item.label}</span>
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-emerald-500 rounded-r-md transition-all duration-300 ease-out ${isActive ? 'h-full opacity-100' : 'h-0 opacity-0'}`} />
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
        <div className="flex flex-col mb-4">
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
            <div className="flex items-center gap-3">
              <ClipboardList 
                size={20} 
                strokeWidth={isScheduleActive ? 2 : 1.5}
                className={`transition-all duration-200 ${
                  isScheduleActive 
                    ? 'text-emerald-600' 
                    : 'text-slate-400 group-hover:text-emerald-600'
                }`} 
              />
              {!collapsed && <span className="transition-colors duration-200">Schedule</span>}
            </div>
            {!collapsed && (
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 text-slate-400 ${scheduleOpen ? 'rotate-0' : '-rotate-90'}`} 
              />
            )}
          </button>

          {scheduleOpen && !collapsed && (
            <div className="ml-9 pl-3 border-l border-slate-200 mt-2 mb-2 flex flex-col gap-1 pr-3">
              {scheduleMenuData ? (
                <div className="pt-1">
                  <button
                    onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('changeQurbaniLocation', { detail: { location: 'all' } })); setMobileOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 p-2 mb-2 rounded-lg border font-medium text-xs transition-all duration-200 active:scale-95 ${
                      scheduleMenuData.activeLocation === 'all'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-emerald-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className={scheduleMenuData.activeLocation === 'all' ? 'text-emerald-600' : 'text-slate-400'} /> 
                      <span>All Locations</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      scheduleMenuData.activeLocation === 'all' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>{scheduleMenuData.totalShares}</span>
                  </button>
                  {scheduleMenuData.locationSummary.map(loc => {
                    const isLocActive = scheduleMenuData.activeLocation === loc.location;
                    return (
                      <div className="mb-2" key={loc.location}>
                        <button
                          onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('changeQurbaniLocation', { detail: { location: loc.location } })); setMobileOpen(false); }}
                          className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg border font-medium text-xs transition-all duration-200 active:scale-95 ${
                            isLocActive
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-emerald-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className={isLocActive ? 'text-emerald-600' : 'text-slate-400'} /> 
                            <span>{loc.location}</span>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isLocActive 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>{loc.total}</span>
                        </button>
                        {loc.batches.map(group => (
                          <div className="flex justify-between gap-2 text-[10px] px-3 py-1 mt-1 font-medium text-slate-600 bg-slate-50 rounded-md mx-1 border border-slate-100" key={group.key}>
                            <span className="truncate max-w-[120px]">{group.batch.animal_name || 'Animal'}</span>
                            <span className="text-emerald-600 font-bold">{group.rows.length}/{Number(group.batch.qty || 0)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2 text-[11px] text-slate-400 italic">
                  Navigate to see status
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Settings Division */}
        {!collapsed && (
          <div className="px-6 pt-4 pb-2 text-slate-400 text-xs font-bold tracking-wider uppercase select-none border-t border-slate-100 mt-2">
            Settings & Reports
          </div>
        )}
        {isAdmin && renderLink('/reports', BarChart2, 'Reports & Analytics')}
        {renderLink('/settings/profile', User, 'My Profile')}
        {isAdmin && renderLink('/settings/company', Building2, 'Company Settings')}
      </nav>
    </aside>
  );
};

export default Sidebar;
