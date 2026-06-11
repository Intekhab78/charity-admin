import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ClipboardList, Loader2, Sparkles } from 'lucide-react';
import { bookingService, customerService } from '../../services/api';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Toggle Command Palette with Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch data only when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      fetchSearchData();
      // Auto focus input
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const fetchSearchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, customersRes] = await Promise.all([
        bookingService.list(),
        customerService.list()
      ]);
      setBookings(bookingsRes.data?.data || []);
      setCustomers(customersRes.data?.data || []);
    } catch (err) {
      console.error('Failed to pre-fetch search database:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and compute combined search results
  const getFilteredResults = () => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) {
      // Show default/recent suggestions if query is empty
      const recentCustomers = customers.slice(0, 4).map(c => ({
        id: c.id || c._id,
        title: c.trn_name || 'Unnamed Customer',
        subtitle: `Phone: ${c.customer_phone || '-'} | Code: ${c.customer_code || '-'}`,
        type: 'customer',
        link: `/customers/view/${c.id || c._id}`
      }));
      const recentBookings = bookings.slice(0, 4).map(b => ({
        id: b.id || b._id,
        title: b.customer_name || 'Unnamed Booking',
        subtitle: `Order ID: ${b.id || b._id} | Shares: ${b.total_shares} | Rs. ${b.total_amount}`,
        type: 'booking',
        link: `/bookings/view/${b.id || b._id}`
      }));
      return [...recentCustomers, ...recentBookings];
    }

    const matchedCustomers = customers
      .filter(c => 
        (c.trn_name || '').toLowerCase().includes(lowerQuery) ||
        (c.customer_phone || '').includes(lowerQuery) ||
        (c.customer_email || '').toLowerCase().includes(lowerQuery) ||
        (c.customer_code || '').toLowerCase().includes(lowerQuery)
      )
      .map(c => ({
        id: c.id || c._id,
        title: c.trn_name,
        subtitle: `Code: ${c.customer_code || '-'} | Mobile: ${c.customer_phone || '-'}`,
        type: 'customer',
        link: `/customers/view/${c.id || c._id}`
      }));

    const matchedBookings = bookings
      .filter(b => 
        (b.customer_name || '').toLowerCase().includes(lowerQuery) ||
        (b.customer_phone || '').includes(lowerQuery) ||
        String(b.id || b._id || '').toLowerCase().includes(lowerQuery) ||
        (b.share_code || '').toLowerCase().includes(lowerQuery)
      )
      .map(b => ({
        id: b.id || b._id,
        title: b.customer_name,
        subtitle: `Order #${b.id || b._id} | ${b.total_shares} Shares | Rs. ${b.total_amount}`,
        type: 'booking',
        link: `/bookings/view/${b.id || b._id}`
      }));

    return [...matchedCustomers, ...matchedBookings];
  };

  const results = getFilteredResults();

  // Keyboard navigation within results
  useEffect(() => {
    const handleNavigation = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, results, selectedIndex]);

  // Keep active keyboard selection in view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (item) => {
    navigate(item.link);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[9999] flex items-start justify-center pt-[12vh] p-4 animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col max-h-[60vh] transform scale-100 transition-transform duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25)' }}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/60">
          <Search className="text-emerald-500 animate-pulse" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search bookings, customers, phone, email... (Esc to close)"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 text-base placeholder-slate-400 font-medium font-sans"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200/40 text-[10px] font-bold text-slate-400 tracking-wider">
            ESC
          </div>
        </div>

        {/* Search Results list */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[150px] max-h-[45vh] scroll-smooth">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="animate-spin text-emerald-500" size={26} />
              <p className="text-xs font-bold uppercase tracking-wider">Loading Search Database...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No matches found</p>
              <p className="text-xs mt-1">Try searching with name, mobile, email, code or order ID.</p>
            </div>
          ) : (
            <div>
              {/* Tip / Header when query is empty */}
              {!query && (
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={11} className="text-emerald-500" /> Recent / Quick suggestions
                </div>
              )}

              <div ref={listRef} className="flex flex-col gap-0.5">
                {results.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
                        isSelected 
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {item.type === 'booking' ? <ClipboardList size={16} /> : <Users size={16} />}
                        </div>
                        <div>
                          <p className={`text-sm font-bold leading-tight ${
                            isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'
                          }`}>
                            {item.title}
                          </p>
                          <p className={`text-xs mt-0.5 ${
                            isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                        isSelected 
                          ? 'bg-white/20 border-white/30 text-white' 
                          : item.type === 'booking'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40 text-indigo-500 dark:text-indigo-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-500 dark:text-emerald-400'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm text-[10px]">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm text-[10px]">Enter</kbd> Select</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-500 tracking-wider">Ctrl + K</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
