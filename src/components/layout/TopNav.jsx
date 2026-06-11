import React, { useState, useEffect, useRef } from 'react';
import { Menu, Mail, Bell, Flag, Settings, ChevronRight, Check, Sun, Moon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingService, qurbaniDateService, UPLOADS_BASE_URL } from '../../services/api';
import { toast } from '../../components/common/Toast';

const TopNav = ({ user, sidebarCollapsed, onToggleSidebar, onLogout }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingList, setPendingList] = useState([]);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [activeDatesCount, setActiveDatesCount] = useState(0);
  const [activeDates, setActiveDates] = useState([]);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      toast.success('Dark mode enabled!');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      toast.success('Light mode enabled!');
    }
  };

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
    const interval = setInterval(fetchNotificationMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleDropdown = (type) => setActiveDropdown(prev => prev === type ? null : type);

  const Dropdown = ({ children, width = 'w-72' }) => (
    <div className={`absolute top-10 right-0 ${width} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-primary-light dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-hidden z-[10000] flex flex-col animate-slide-down`}>
      {children}
    </div>
  );
  const DropHeader = ({ children }) => (
    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 font-bold text-[13px] text-primary-dark dark:text-primary">{children}</div>
  );
  const DropBody = ({ children }) => (
    <div className="max-h-56 overflow-y-auto">{children}</div>
  );
  const DropItem = ({ onClick, className = '', children }) => (
    <div onClick={onClick} className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer text-[12px] hover:bg-primary-light/50 dark:hover:bg-slate-800/80 transition-colors ${className}`}>
      {children}
    </div>
  );
  const DropEmpty = ({ children }) => (
    <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-[12px]">{children}</div>
  );
  const DropFooter = ({ onClick, children }) => (
    <div onClick={onClick} className="px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] font-bold text-primary cursor-pointer hover:bg-primary-light/50 dark:hover:bg-slate-800/80 flex items-center justify-center gap-1 transition-colors">
      {children}
    </div>
  );

  return (
    <div ref={containerRef} className="flex items-center bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white h-[60px] border-b border-slate-800 shadow-lg shadow-slate-950/20 z-[1000]">
      {/* Brand */}
      <div
        className="items-center justify-center h-full bg-slate-950/20 border-r border-slate-800/80 tracking-wide transition-all duration-300 md:flex hidden"
        style={{ width: sidebarCollapsed ? '80px' : '280px', minWidth: sidebarCollapsed ? '80px' : '280px' }}
      >
        <span 
          className={`font-outfit font-black transition-all duration-300 ${sidebarCollapsed ? 'text-base' : 'text-xl'}`}
          style={{ color: '#ffffff' }}
        >
          {sidebarCollapsed ? (
            <span style={{ color: '#34d399' }}>CE</span>
          ) : (
            <>
              Charity <span style={{ color: '#34d399' }}>ERP</span>
            </>
          )}
        </span>
      </div>

      {/* Right Container */}
      <div className="flex items-center justify-between flex-1 px-4 md:px-6 h-full">
        <div className="flex items-center">
          <button 
            onClick={onToggleSidebar}
            className="bg-transparent border-none text-slate-400 cursor-pointer flex items-center p-2 rounded-xl hover:bg-white/5 hover:text-white transition-all"
          >
            <Menu size={20} />
          </button>
          <span 
            className="font-outfit font-black text-white md:hidden block ml-3 text-lg"
            style={{ color: '#ffffff' }}
          >
            Charity <span style={{ color: '#34d399' }}>ERP</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Icon Group */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="bg-transparent border-none text-white/90 cursor-pointer flex items-center p-1.5 rounded-md hover:bg-black/10 hover:text-white transition-all outline-none"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mail */}
            <div className="relative cursor-pointer flex items-center text-white/90 p-1.5 rounded-md hover:bg-black/10 transition-all" onClick={() => toggleDropdown('mail')}>
              <Mail size={18} />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-emerald-400 border border-emerald-600 text-white px-1 py-0.5 rounded leading-none">{pendingCount}</span>
              )}
              {activeDropdown === 'mail' && (
                <Dropdown>
                  <DropHeader>Pending Approvals ({pendingCount})</DropHeader>
                  <DropBody>
                    {pendingList.length > 0 ? pendingList.map(b => (
                      <DropItem key={b._id} onClick={() => { setActiveDropdown(null); navigate('/bookings/pending'); }}>
                        <div className="font-bold text-slate-900">{b.customer_name}</div>
                        <div className="flex justify-between mt-0.5 text-slate-500">
                          <span>{b.share_code}</span>
                          <span className="font-semibold text-primary">₹{b.total_amount}</span>
                        </div>
                      </DropItem>
                    )) : <DropEmpty>All bookings are fully approved!</DropEmpty>}
                  </DropBody>
                  <DropFooter onClick={() => { setActiveDropdown(null); navigate('/bookings/pending'); }}>View Pending Cart List <ChevronRight size={12} /></DropFooter>
                </Dropdown>
              )}
            </div>

            {/* Bell */}
            <div className="relative cursor-pointer flex items-center text-white/90 p-1.5 rounded-md hover:bg-black/10 transition-all" onClick={() => toggleDropdown('bell')}>
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-amber-400 border border-amber-600 text-white px-1 py-0.5 rounded leading-none">2</span>
              {activeDropdown === 'bell' && (
                <Dropdown>
                  <DropHeader>System Notifications</DropHeader>
                  <DropBody>
                    <DropItem>
                      <div className="font-bold text-slate-900 flex items-center gap-1"><Check size={12} className="text-primary" /> System status: Online</div>
                      <div className="text-slate-500 mt-0.5">Total system bookings loaded: {totalBookingsCount}</div>
                    </DropItem>
                    <DropItem>
                      <div className="font-bold text-slate-900">Portal Upgraded</div>
                      <div className="text-slate-500 mt-0.5">Collapsible sidebar is active</div>
                    </DropItem>
                  </DropBody>
                  <DropFooter onClick={() => setActiveDropdown(null)}>Dismiss All Notifications</DropFooter>
                </Dropdown>
              )}
            </div>

            {/* Flag */}
            <div className="relative cursor-pointer flex items-center text-white/90 p-1.5 rounded-md hover:bg-black/10 transition-all" onClick={() => toggleDropdown('flag')}>
              <Flag size={18} />
              {activeDatesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-red-500 border border-red-700 text-white px-1 py-0.5 rounded leading-none">{activeDatesCount}</span>
              )}
              {activeDropdown === 'flag' && (
                <Dropdown>
                  <DropHeader>Active Qurbani Dates ({activeDatesCount})</DropHeader>
                  <DropBody>
                    {activeDates.length > 0 ? activeDates.map(d => (
                      <DropItem key={d._id} onClick={() => { setActiveDropdown(null); navigate('/qurbani-dates'); }}>
                        <div className="font-bold text-slate-900">Day {d.eid_day}: {new Date(d.qurbani_date).toLocaleDateString()}</div>
                        <div className="text-slate-500 mt-0.5">Status: Active Booking Target</div>
                      </DropItem>
                    )) : <DropEmpty>No active Qurbani days set.</DropEmpty>}
                  </DropBody>
                  <DropFooter onClick={() => { setActiveDropdown(null); navigate('/qurbani-dates'); }}>Manage Qurbani Dates <ChevronRight size={12} /></DropFooter>
                </Dropdown>
              )}
            </div>
          </div>

          {/* User Profile Pill */}
          <div className="relative flex items-center gap-2.5 cursor-pointer py-1 pl-1 pr-3 bg-white/5 border border-white/10 rounded-full shadow-sm hover:-translate-y-px hover:bg-white/10 transition-all" onClick={() => toggleDropdown('settings')}>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0 border border-white/20">
              {user?.profile_image ? (
                <img src={`${UPLOADS_BASE_URL}/uploads/${user.profile_image}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=059669&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
              )}
            </div>
            <span className="text-[13px] font-semibold text-slate-200">{user?.name || 'Charity Operator'}</span>
            <Settings size={16} className="text-slate-400" />
            {activeDropdown === 'settings' && (
              <Dropdown width="w-52">
                <DropHeader>Account Controls</DropHeader>
                <DropBody>
                  <DropItem onClick={() => { setActiveDropdown(null); navigate('/settings/profile'); }}>My Profile</DropItem>
                  {user?.role?.toLowerCase().includes('admin') && (
                    <DropItem onClick={() => { setActiveDropdown(null); navigate('/settings/company'); }}>Company Settings</DropItem>
                  )}
                  <DropItem onClick={() => { setActiveDropdown(null); toggleDarkMode(); }}>
                    Toggle Theme ({darkMode ? 'Light' : 'Dark'})
                  </DropItem>
                  <DropItem 
                    onClick={() => { setActiveDropdown(null); onLogout(); }} 
                    className="text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 font-bold flex items-center gap-2 border-b-transparent"
                  >
                    <LogOut size={14} className="text-rose-500" />
                    <span>Logout Session</span>
                  </DropItem>
                </DropBody>
                <DropFooter onClick={() => { setActiveDropdown(null); navigate(0); }}><span className="text-slate-500">Reload Portal</span></DropFooter>
              </Dropdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
