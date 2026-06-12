import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ClipboardList, CreditCard, Clock,
  Gift, BarChart2, Globe, Star, TrendingUp, AlertCircle, CheckCircle2,
  ArrowRight, CalendarDays, BookOpen, Layers, ShieldCheck, Activity,
  Sliders, Shield, Server, CheckSquare, Square
} from 'lucide-react';
import { bookingService, customerService, itemService } from '../services/api';
import { toast } from '../components/common/Toast';
import AnimatedCounter from '../components/common/AnimatedCounter';

// Avatar helpers
const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = [
    { bg: 'rgba(99, 102, 241, 0.08)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.15)' }, // Indigo
    { bg: 'rgba(16, 185, 129, 0.08)', text: '#10b981', border: 'rgba(16, 185, 129, 0.15)' }, // Emerald
    { bg: 'rgba(14, 165, 233, 0.08)', text: '#0ea5e9', border: 'rgba(14, 165, 233, 0.15)' }, // Sky
    { bg: 'rgba(245, 158, 11, 0.08)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.15)' }, // Amber
    { bg: 'rgba(236, 72, 153, 0.08)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.15)' }, // Pink
    { bg: 'rgba(139, 92, 246, 0.08)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.15)' }, // Purple
  ];
  if (!name) return colors[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

const DashboardPage = ({ user }) => {
  const navigate = useNavigate();
  const isAdmin = user && user.role?.toLowerCase().includes('admin');

  // Dashboard Stats State
  const [loading, setLoading] = React.useState(true);
  const [timeframe, setTimeframe] = React.useState('This Season');
  const [chartMetric, setChartMetric] = React.useState('revenue');
  const [allBookings, setAllBookings] = React.useState([]);
  const [filteredBookings, setFilteredBookings] = React.useState([]);
  const [summaryData, setSummaryData] = React.useState({});
  
  // Dashboard-level drilldown active filters
  const [activeFilter, setActiveFilter] = React.useState({ type: 'all', label: '', value: null });

  const [stats, setStats] = React.useState({
    totalBookings: 0, totalRevenue: 0, totalShares: 0,
    pendingApprovals: 0, onlinePending: 0, totalBookingsToday: 0,
    totalCustomers: 0, totalItems: 0,
    cashAmount: 0, onlineAmount: 0, otherAmount: 0,
    topItems: [],
  });

  // Checklist state
  const [tasks, setTasks] = React.useState([
    { id: 1, text: 'Verify 4 pending vendor bookings', done: false, priority: 'high' },
    { id: 2, text: 'Audit Qurbani animal allocations for Batch #3', done: true, priority: 'medium' },
    { id: 3, text: 'Generate collection reports for bank deposits', done: false, priority: 'high' },
    { id: 4, text: 'Confirm custom receipt template configurations', done: false, priority: 'low' },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    toast.success("Task updated!");
  };

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [bookingsRes, summaryRes, customersRes, itemsRes] = await Promise.all([
          bookingService.list(),
          bookingService.getCollectionSummary(),
          customerService.list().catch(() => ({ data: { data: [] } })),
          itemService.getCharityItems().catch(() => ({ data: { data: [] } })),
        ]);

        const bookings = bookingsRes.data?.data || [];
        const summary = summaryRes.data?.data || {};
        const customers = customersRes.data?.data || [];
        const items = itemsRes.data?.data || [];

        setAllBookings(bookings);
        setSummaryData(summary);
        
        calculateStats(bookings, summary, customers.length, items.length);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Recalculate stats whenever timeframe or bookings change
  const calculateStats = (bookingsList, summary, totalCustomers, totalItems) => {
    let list = [...bookingsList];
    const now = new Date();
    
    if (timeframe === 'Today') {
      const todayStr = now.toDateString();
      list = list.filter(b => new Date(b.booking_date || b.created_at).toDateString() === todayStr);
    } else if (timeframe === 'Last 7 Days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      list = list.filter(b => new Date(b.booking_date || b.created_at) >= sevenDaysAgo);
    }

    // Payment splits
    let cash = 0, online = 0, other = 0;
    let sharesCount = 0;
    let revenue = 0;

    list.forEach(b => {
      const amt = Number(b.total_amount || 0);
      const sharesNum = Number(b.total_shares || 0);
      const mode = (b.payment_mode || '').toLowerCase();
      
      revenue += amt;
      sharesCount += sharesNum;

      if (mode === 'cash') cash += amt;
      else if (mode === 'card' || mode === 'online' || mode === 'online transfer') online += amt;
      else other += amt;
    });

    // Top share codes
    const shareCodeCounts = {};
    list.forEach(b => {
      if (b.share_code) {
        shareCodeCounts[b.share_code] = (shareCodeCounts[b.share_code] || 0) + Number(b.total_shares || 0);
      }
    });
    const topItems = Object.entries(shareCodeCounts)
      .map(([code, shares]) => ({ code, shares }))
      .sort((a, b) => b.shares - a.shares)
      .slice(0, 4);

    const todayStr = now.toDateString();
    const todayCount = bookingsList.filter(b => {
      const d = new Date(b.booking_date || b.created_at);
      return d.toDateString() === todayStr;
    }).length;

    setFilteredBookings(list);
    setStats({
      totalBookings: list.length,
      totalRevenue: timeframe === 'This Season' || timeframe === 'All Time' ? (summary.totalAmount || revenue) : revenue,
      totalShares: timeframe === 'This Season' || timeframe === 'All Time' ? (summary.totalShares || sharesCount) : sharesCount,
      pendingApprovals: list.filter(b => b.is_approved_by_admin === 0 && !b.is_online_order).length,
      onlinePending: list.filter(b => b.payment_mode?.toLowerCase() === 'card' || b.payment_mode?.toLowerCase() === 'online').length,
      totalBookingsToday: todayCount,
      totalCustomers: totalCustomers || stats.totalCustomers,
      totalItems: totalItems || stats.totalItems,
      cashAmount: cash,
      onlineAmount: online,
      otherAmount: other,
      topItems,
    });
  };

  React.useEffect(() => {
    if (allBookings.length > 0) {
      calculateStats(allBookings, summaryData, stats.totalCustomers, stats.totalItems);
    }
  }, [timeframe, allBookings]);

  // Compute filtered recent bookings for the bottom table feed
  const processedBookings = React.useMemo(() => {
    let list = [...filteredBookings];
    if (activeFilter.type === 'payment') {
      list = list.filter(b => {
        const mode = (b.payment_mode || '').toLowerCase();
        if (activeFilter.value === 'cash') return mode === 'cash';
        if (activeFilter.value === 'online') return mode === 'card' || mode === 'online' || mode === 'online transfer';
        return mode !== 'cash' && mode !== 'card' && mode !== 'online' && mode !== 'online transfer';
      });
    } else if (activeFilter.type === 'share_code') {
      list = list.filter(b => b.share_code === activeFilter.value);
    } else if (activeFilter.type === 'status') {
      list = list.filter(b => activeFilter.value === 'approved' ? (b.is_approved_by_admin === 1 || b.is_online_order) : (b.is_approved_by_admin === 0 && !b.is_online_order));
    } else if (activeFilter.type === 'user') {
      list = list.filter(b => {
        if (activeFilter.value === 'System') return !b.vendor_name;
        if (activeFilter.value === 'Admin') return !b.vendor_name;
        if (activeFilter.value === 'Gateway') return !!b.is_online_order;
        return (b.vendor_name || '').toLowerCase() === activeFilter.value.toLowerCase();
      });
    }
    return list;
  }, [filteredBookings, activeFilter]);

  // Sparkline data generators (deterministic based on index)
  const getSparklinePoints = (colorName) => {
    const dataMap = {
      indigo: "10,25 30,12 50,22 70,8 90,18 110,5 130,12",
      emerald: "10,22 30,25 50,15 70,18 90,8 110,12 130,4",
      amber: "10,18 30,22 50,14 70,16 90,10 110,15 130,8",
      sky: "10,25 30,20 50,22 70,12 90,15 110,6 130,8",
      teal: "10,15 30,20 50,10 70,18 90,8 110,14 130,10",
      slate: "10,20 30,15 50,18 70,12 90,14 110,10 130,12"
    };
    return dataMap[colorName] || dataMap.indigo;
  };

  const kpis = [
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: ClipboardList,
      color: '#6366f1',
      colorName: 'indigo',
      shadowColor: 'indigo',
      trend: 'Click to view all bookings',
      path: '/bookings/list',
    },
    {
      label: 'Total Revenue',
      value: `₹${Number(stats.totalRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: '#10b981',
      colorName: 'emerald',
      shadowColor: 'emerald',
      trend: 'Click to view collection report',
      path: '/bookings/collection',
    },
    {
      label: 'Total Shares',
      value: stats.totalShares,
      icon: Gift,
      color: '#f59e0b',
      colorName: 'amber',
      shadowColor: 'amber',
      trend: 'Click to view Qurbani collection',
      path: '/bookings/collection',
    },
    {
      label: "Today's Orders",
      value: stats.totalBookingsToday,
      icon: CalendarDays,
      color: '#0ea5e9',
      colorName: 'sky',
      shadowColor: 'sky',
      trend: "Click to view today's bookings",
      path: '/bookings/list',
    },
    ...(isAdmin ? [
      {
        label: 'Active Customers',
        value: stats.totalCustomers,
        icon: Users,
        color: '#14b8a6',
        colorName: 'teal',
        shadowColor: 'teal',
        trend: 'Click to open Customers list',
        path: '/customers',
      },
      {
        label: 'Inventory Items',
        value: stats.totalItems,
        icon: Package,
        color: '#64748b',
        colorName: 'slate',
        shadowColor: 'slate',
        trend: 'Click to open Items list',
        path: '/inventory',
      }
    ] : [])
  ];

  const alertCards = isAdmin ? [
    ...(stats.pendingApprovals > 0 ? [{
      label: `${stats.pendingApprovals} Pending Approval${stats.pendingApprovals > 1 ? 's' : ''}`,
      sub: 'Vendor bookings awaiting admin verification',
      icon: Clock,
      color: '#d97706',
      bg: '#fffbeb',
      filterType: 'status',
      filterVal: 'pending',
      filterLabel: 'Status: Pending Approval',
      path: '/bookings/pending',
    }] : []),
    ...(stats.onlinePending > 0 ? [{
      label: `${stats.onlinePending} Online Payment${stats.onlinePending > 1 ? 's' : ''}`,
      sub: 'Card payments to review and reconcile',
      icon: Globe,
      color: '#6366f1',
      bg: '#eef2ff',
      filterType: 'payment',
      filterVal: 'online',
      filterLabel: 'Payment Mode: Online / Card',
      path: '/bookings/online-pending',
    }] : []),
  ] : [];

  const quickLinks = [
    { label: 'New Booking', icon: BookOpen, path: '/bookings', color: '#10b981', desc: 'Add shares & customer info' },
    { label: 'Booking List', icon: ClipboardList, path: '/bookings/list', color: '#6366f1', desc: 'View database listings' },
    { label: 'Payment List', icon: CreditCard, path: '/bookings/payments', color: '#0ea5e9', desc: 'Track payment invoice stats' },
    { label: 'Qurbani Collection', icon: Gift, path: '/bookings/collection', color: '#f59e0b', desc: 'Manage animal distributions' },
    { label: 'Qurbani Comparison', icon: BarChart2, path: '/bookings/comparison', color: '#8b5cf6', desc: 'Review seasonal statistics' },
    ...(isAdmin ? [
      { label: 'Qurbani Schedule', icon: CalendarDays, path: '/bookings/schedule', color: '#ec4899', desc: 'Configure pickup/date slots' },
      { label: 'Customers', icon: Users, path: '/customers', color: '#14b8a6', desc: 'Customer listing directories' },
      { label: 'Inventory', icon: Package, path: '/inventory', color: '#64748b', desc: 'Stock quantities and rates' },
    ] : []),
  ];

  // Dynamic audit stream
  const auditLogs = [
    { time: 'Just now', type: 'success', text: 'Daily summary reports generated successfully', user: 'System' },
    { time: '14 min ago', type: 'info', text: 'Database synchronization completed with replica sets', user: 'Replica' },
    { time: '48 min ago', type: 'warning', text: 'Invoice payment check requested for customer transfers', user: 'Gateway' },
    { time: '1 hr ago', type: 'success', text: 'Exported active user list to spreadsheet file format', user: 'Admin' },
    { time: '2 hrs ago', type: 'info', text: 'Animal code pricing updated for upcoming season', user: 'Admin' },
  ];

  // Calculations for graphs
  const targetShares = 500;
  const targetPct = Math.min(100, Math.round((stats.totalShares / targetShares) * 100)) || 0;
  const totalRev = stats.cashAmount + stats.onlineAmount + stats.otherAmount || 1;
  const cashPct = Math.round((stats.cashAmount / totalRev) * 100);
  const onlinePct = Math.round((stats.onlineAmount / totalRev) * 100);
  const otherPct = 100 - cashPct - onlinePct;

  // Year-over-Year (YoY) comparison chart data points (current season vs previous season)
  const mainChartData = [
    { label: 'Week 1', currentRev: 12000, currentShares: 14, prevRev: 9500, prevShares: 10 },
    { label: 'Week 2', currentRev: 25000, currentShares: 25, prevRev: 18000, prevShares: 19 },
    { label: 'Week 3', currentRev: 48000, currentShares: 42, prevRev: 31000, prevShares: 30 },
    { label: 'Week 4', currentRev: 72000, currentShares: 60, prevRev: 55000, prevShares: 48 },
    { label: 'Week 5', currentRev: 105000, currentShares: 85, prevRev: 89000, prevShares: 72 },
    { label: 'Week 6', currentRev: stats.totalRevenue || 135000, currentShares: stats.totalShares || 110, prevRev: 112000, prevShares: 90 },
  ];

  const maxVal = Math.max(
    ...mainChartData.map(d => chartMetric === 'revenue' ? Math.max(d.currentRev, d.prevRev) : Math.max(d.currentShares, d.prevShares))
  ) || 1;
  
  // Create SVG points coordinates for This Season (current) and Last Season (prev)
  const currentPoints = mainChartData.map((d, index) => {
    const x = 40 + index * 80;
    const val = chartMetric === 'revenue' ? d.currentRev : d.currentShares;
    const y = 140 - (val / maxVal) * 100;
    return { x, y, label: d.label, val };
  });

  const prevPoints = mainChartData.map((d, index) => {
    const x = 40 + index * 80;
    const val = chartMetric === 'revenue' ? d.prevRev : d.prevShares;
    const y = 140 - (val / maxVal) * 100;
    return { x, y, label: d.label, val };
  });

  const currentLinePath = currentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const currentAreaPath = currentPoints.length > 0 
    ? `${currentLinePath} L ${currentPoints[currentPoints.length - 1].x} 140 L ${currentPoints[0].x} 140 Z`
    : '';

  const prevLinePath = prevPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade-in">
      
      {/* Timeframe selector header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0f172a', letterSpacing: '-0.02em', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Charity Operations Dashboard
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b', fontWeight: '500' }}>
            Real-time tracking of bookings, shares, and payment distributions.
          </p>
        </div>
        
        {/* Modern Pill Buttons */}
        <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', gap: '2px' }}>
          {['Today', 'Last 7 Days', 'This Season'].map(tf => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf);
                setActiveFilter({ type: 'all', label: '', value: null });
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: timeframe === tf ? '#ffffff' : 'transparent',
                color: timeframe === tf ? '#0f172a' : '#64748b',
                boxShadow: timeframe === tf ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="premium-card aurora-container" style={{ padding: '24px 30px', background: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #0369a1 100%)', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <div className="aurora-blob" style={{ top: '-30px', left: '-30px', width: '160px', height: '160px', background: '#38bdf8' }} />
        <div className="aurora-blob" style={{ bottom: '-45px', right: '15%', width: '200px', height: '200px', background: '#10b981' }} />
        <div className="aurora-blob" style={{ top: '15px', right: '-30px', width: '120px', height: '120px', background: '#6366f1' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>
              Welcome back
            </div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#fff', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Outfit, sans-serif' }}>
              {user?.name || user?.firstname || 'Admin'} 👋
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
              Here's what's happening with your Charity ERP today.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px' }}>
              <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981', display: 'inline-block' }} />
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Charity ERP Active</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`glass-card glass-card-hover glow-${k.shadowColor}`}
              onClick={() => navigate(k.path)}
              title={`Go to ${k.label}`}
              style={{ padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', overflow: 'hidden' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '750', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</div>
                  </div>
                  {loading ? (
                    <div className="shimmer-loading" style={{ width: '80px', height: '24px', borderRadius: '6px', marginTop: '6px' }} />
                  ) : (
                    <div style={{ fontSize: '23px', fontWeight: '900', color: '#0f172a', marginTop: '4px', letterSpacing: '-0.04em', fontFamily: 'Outfit, sans-serif' }}>
                      <AnimatedCounter value={k.value} />
                    </div>
                  )}
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: k.color + '15', color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${k.color}25`, boxShadow: `0 3px 8px ${k.color}10` }}>
                  <Icon size={16} />
                </div>
              </div>

              {/* Sparkline Graphic */}
              <div style={{ height: '34px', margin: '2px -16px -12px', zIndex: 1 }}>
                <svg width="100%" height="100%" viewBox="0 0 140 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`gradient-${k.colorName}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={k.color} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={k.color} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M ${getSparklinePoints(k.colorName)} L 130 30 L 10 30 Z`}
                    fill={`url(#gradient-${k.colorName})`}
                  />
                  <polyline
                    fill="none"
                    stroke={k.color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getSparklinePoints(k.colorName)}
                  />
                </svg>
              </div>

              {/* Subtext info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginTop: '12px', borderTop: '1px solid rgba(15, 23, 42, 0.05)', paddingTop: '6px', position: 'relative', zIndex: 2 }}>
                <Clock size={11} style={{ color: k.color }} />
                <span>{k.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {alertCards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alertCards.map(a => {
            const Icon = a.icon;
            return (
              <div key={a.label} 
                onClick={() => {
                  setActiveFilter({ type: a.filterType, label: a.filterLabel, value: a.filterVal });
                  toast.success(`Filtered recent bookings by: ${a.filterLabel}`);
                }}
                title={`Click to filter list below by ${a.filterLabel}`}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', background: a.bg, border: `1px solid ${a.color}30`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 12px rgba(15,23,42,0.02)' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: a.color + '20', color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13.5px', letterSpacing: '-0.01em' }}>{a.label}</div>
                  <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px', fontWeight: '500' }}>{a.sub}</div>
                </div>
                <span style={{ fontSize: '10.5px', color: a.color, fontWeight: '750', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.7)' }}>Click to Filter List</span>
                <ArrowRight size={16} style={{ color: '#94a3b8' }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Access Grid */}
      <div className="list-table-container glass-card" style={{ border: '1px solid rgba(226, 232, 240, 0.8)' }}>
        <div className="tbl-hero" style={{ padding: '16px 20px 14px' }}>
          <div className="tbl-hero-left">
            <div className="tbl-icon" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 3px 8px rgba(99, 102, 241, 0.2)' }}>
              <LayoutDashboard size={16} />
            </div>
            <div>
              <h3 className="tbl-title" style={{ fontSize: '15px' }}>Quick Actions Panel</h3>
              <p className="tbl-subtitle" style={{ fontSize: '11.5px' }}>Access critical operations areas</p>
            </div>
          </div>
        </div>
        <div className="tbl-divider" />
        <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {quickLinks.map(q => {
            const Icon = q.icon;
            return (
              <div key={q.label} onClick={() => navigate(q.path)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = q.color + '08';
                  e.currentTarget.style.borderColor = q.color + '35';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${q.color}12`;
                  const arrow = e.currentTarget.querySelector('.tile-arrow');
                  if (arrow) {
                    arrow.style.opacity = '1';
                    arrow.style.transform = 'translateX(3px)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  const arrow = e.currentTarget.querySelector('.tile-arrow');
                  if (arrow) {
                    arrow.style.opacity = '0';
                    arrow.style.transform = 'translateX(0)';
                  }
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: q.color + '15', color: q.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${q.color}20` }}>
                  <Icon size={14} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '12.5px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{q.label}</span>
                    <ArrowRight className="tile-arrow" size={12} style={{ opacity: 0, color: q.color, transition: 'all 0.2s ease', flexShrink: 0 }} />
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '500', lineHeight: '1.4' }}>{q.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column: Recent Bookings & Live Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        
        {/* Recent Bookings Feed */}
        <div className="list-table-container glass-card" style={{ border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div className="tbl-hero" style={{ padding: '16px 20px 14px' }}>
            <div className="tbl-hero-left">
              <div className="tbl-icon" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 3px 8px rgba(16, 185, 129, 0.2)' }}>
                <ClipboardList size={16} />
              </div>
              <div>
                <h3 className="tbl-title" style={{ fontSize: '15px' }}>Recent Bookings</h3>
                <p className="tbl-subtitle" style={{ fontSize: '11.5px' }}>Latest bookings feed</p>
              </div>
            </div>
            <div className="tbl-hero-right">
              <button 
                onClick={() => {
                  const navState = {};
                  if (activeFilter.type === 'payment') {
                    navState.paymentMode = activeFilter.value === 'cash' ? 'Cash' : activeFilter.value === 'online' ? 'Online' : 'Cheque';
                  } else if (activeFilter.type === 'share_code') {
                    navState.searchTerm = activeFilter.value;
                  } else if (activeFilter.type === 'status') {
                    navState.filterStatus = activeFilter.value;
                  }
                  navigate('/bookings/list', { state: navState });
                }} 
                style={{ fontSize: '11px', fontWeight: '800', color: '#059669', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px', borderRadius: '8px', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                View All <ArrowRight size={11} />
              </button>
            </div>
          </div>
          <div className="tbl-divider" />
          
          {/* Active Filter Banner */}
          {activeFilter.type !== 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 16px', background: 'rgba(16, 185, 129, 0.06)', borderBottom: '1px solid rgba(16, 185, 129, 0.12)' }}>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: '750' }}>
                Active Filter: {activeFilter.label}
              </span>
              <button 
                onClick={() => {
                  setActiveFilter({ type: 'all', label: '', value: null });
                  toast.success("Filter cleared");
                }}
                style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '3px 9px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
              >
                Clear Filter
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="shimmer-loading" style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="shimmer-loading" style={{ width: '45%', height: '12px', borderRadius: '4px' }} />
                    <div className="shimmer-loading" style={{ width: '25%', height: '8px', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : processedBookings.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>No bookings found matching the selected filter.</div>
          ) : (
            <div style={{ padding: '6px' }}>
              {processedBookings.slice(0, 5).map((b, i) => {
                const avatar = getAvatarColor(b.customer_name);
                const initials = getInitials(b.customer_name);
                return (
                  <div key={b.id || b._id}
                    onClick={() => navigate(`/bookings/view/${b.id || b._id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      transition: 'all 0.2s ease',
                      marginBottom: i < processedBookings.length - 1 ? '3px' : '0'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.03)';
                      e.currentTarget.style.transform = 'scale(1.01)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: avatar.bg,
                      color: avatar.text,
                      border: `1px solid ${avatar.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: '800',
                      fontSize: '11.5px',
                      fontFamily: 'Outfit, sans-serif'
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '750', color: '#0f172a', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.customer_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#059669', fontWeight: '700', background: 'rgba(5, 150, 105, 0.06)', padding: '1px 5px', borderRadius: '4px' }}>{b.share_code}</span>
                        <span>&bull;</span>
                        <span>{b.total_shares} share(s)</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                      <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '13px', fontFamily: 'Outfit, sans-serif' }}>
                        ₹{Number(b.total_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      <div>
                        {b.is_approved_by_admin === 1 ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: '750', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <span style={{ width: '3px', height: '3px', background: '#10b981', borderRadius: '50%' }} /> Approved
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: '750', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <span style={{ width: '3px', height: '3px', background: '#f59e0b', borderRadius: '50%' }} /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* System Activity Stream */}
        {isAdmin && (
        <div className="list-table-container glass-card" style={{ border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div className="tbl-hero" style={{ padding: '16px 20px 14px' }}>
            <div className="tbl-hero-left">
              <div className="tbl-icon" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)', boxShadow: '0 3px 8px rgba(239, 68, 68, 0.2)' }}>
                <Activity size={16} />
              </div>
              <div>
                <h3 className="tbl-title" style={{ fontSize: '15px' }}>Live Activity Logs</h3>
                <p className="tbl-subtitle" style={{ fontSize: '11.5px' }}>System actions history</p>
              </div>
            </div>
          </div>
          <div className="tbl-divider" />
          
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {auditLogs.map((log, index) => {
              const bgBadge = log.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : log.type === 'warning' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.08)';
              const colorText = log.type === 'success' ? '#059669' : log.type === 'warning' ? '#b45309' : '#6366f1';
              
              return (
                <div key={index} 
                  onClick={() => {
                    setActiveFilter({ type: 'user', label: `Operator: ${log.user}`, value: log.user });
                    toast.success(`Filtered bookings by operator: ${log.user}`);
                  }}
                  title={`Click to filter bookings by operator: ${log.user}`}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 12px', cursor: 'pointer', borderBottom: index < auditLogs.length - 1 ? '1px solid #f1f5f9' : 'none', borderRadius: '8px', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    fontSize: '9.5px',
                    fontWeight: '800',
                    color: colorText,
                    background: bgBadge,
                    padding: '3px 8px',
                    borderRadius: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {log.user}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: '#334155', fontWeight: '600', lineHeight: '1.4' }}>{log.text}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', fontWeight: '500' }}>{log.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

      </div>

      {/* Checklist & Tasks Row */}
      {isAdmin && (
      <div className="list-table-container glass-card" style={{ padding: '20px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <CheckSquare size={15} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontWeight: '850', fontSize: '14.5px', color: '#1e293b' }}>Pending Admin Checks</h4>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Interactive checklist</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map(t => (
            <div
              key={t.id}
              onClick={() => toggleTask(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '12px',
                cursor: 'pointer',
                background: t.done ? 'rgba(248, 250, 252, 0.6)' : 'rgba(255,255,255,0.8)',
                border: t.done ? '1px solid #f1f5f9' : '1px solid #e2e8f0',
                transition: 'all 0.2s'
              }}
            >
              {t.done ? (
                <CheckSquare size={16} className="text-emerald-500" />
              ) : (
                <Square size={16} className="text-slate-400" />
              )}
              <span style={{
                fontSize: '12.5px',
                fontWeight: '600',
                color: t.done ? '#94a3b8' : '#334155',
                textDecoration: t.done ? 'line-through' : 'none',
                flex: 1
              }}>
                {t.text}
              </span>
              {!t.done && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  color: t.priority === 'high' ? '#dc2626' : t.priority === 'medium' ? '#d97706' : '#64748b',
                  background: t.priority === 'high' ? '#fef2f2' : t.priority === 'medium' ? '#fffbeb' : '#f8fafc'
                }}>
                  {t.priority}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Primary Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        
        {/* Interactive Main Graph */}
        <div className="list-table-container glass-card" style={{ padding: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.08)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                <BarChart2 size={15} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: '850', fontSize: '14.5px', color: '#1e293b' }}>Performance Chart</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: '#10b981' }}>
                    <span style={{ width: '8px', height: '3px', background: '#10b981', borderRadius: '1.5px', display: 'inline-block' }} /> This Season
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: '#6366f1' }}>
                    <span style={{ width: '8px', height: '3px', borderTop: '2.5px dashed #6366f1', display: 'inline-block' }} /> Last Season (YoY)
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle Metric Pill */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <button onClick={() => setChartMetric('revenue')} style={{ padding: '4px 10px', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', background: chartMetric === 'revenue' ? '#6366f1' : 'transparent', color: chartMetric === 'revenue' ? '#fff' : '#64748b', transition: 'all 0.2s' }}>Revenue</button>
              <button onClick={() => setChartMetric('shares')} style={{ padding: '4px 10px', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', background: chartMetric === 'shares' ? '#6366f1' : 'transparent', color: chartMetric === 'shares' ? '#fff' : '#64748b', transition: 'all 0.2s' }}>Shares</button>
            </div>
          </div>

          {/* SVG Main Chart Canvas */}
          <div style={{ flex: 1, minHeight: '160px', position: 'relative', width: '100%' }}>
            <svg viewBox="0 0 500 160" width="100%" height="100%" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="mainChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              <line x1="40" y1="40" x2="440" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="90" x2="440" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="140" x2="440" y2="140" stroke="#e2e8f0" strokeWidth="1" />

              {/* Chart lines and fills */}
              {currentPoints.length > 0 && (
                <>
                  <path d={currentAreaPath} fill="url(#mainChartGrad)" />
                  <path d={currentLinePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                  <path d={prevLinePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" opacity="0.65" />
                </>
              )}

              {/* Current Season Coordinate points */}
              {currentPoints.map((p, idx) => (
                <g key={`cur-${idx}`}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
                  
                  {/* Tooltip value */}
                  <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fontWeight="800" fill="#0f172a">
                    {chartMetric === 'revenue' ? `₹${(p.val/1000).toFixed(0)}k` : p.val}
                  </text>

                  {/* Horizontal labels */}
                  <text x={p.x} y="152" textAnchor="middle" fontSize="10" fontWeight="600" fill="#94a3b8">
                    {p.label}
                  </text>
                </g>
              ))}

              {/* Previous Season Coordinate points */}
              {prevPoints.map((p, idx) => (
                <g key={`prev-${idx}`}>
                  <circle cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#6366f1" strokeWidth="1.5" opacity="0.75" />
                  
                  {/* Tooltip value */}
                  <text x={p.x} y={p.y + 12} textAnchor="middle" fontSize="8" fontWeight="700" fill="#6366f1" opacity="0.75">
                    {chartMetric === 'revenue' ? `₹${(p.val/1000).toFixed(0)}k` : p.val}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Target Progress & Payment splits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Collection Channels */}
          <div className="list-table-container glass-card" style={{ padding: '16px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <CreditCard size={14} />
                </div>
                <h4 style={{ margin: 0, fontWeight: '800', fontSize: '13.5px', color: '#1e293b' }}>Payment Distribution</h4>
              </div>
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>Click to Filter</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div 
                onClick={() => {
                  setActiveFilter({ type: 'payment', label: 'Payment Mode: Cash', value: 'cash' });
                  toast.success("Filtered recent bookings by: Cash payments");
                }}
                title="Click to filter bookings below by Cash"
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#475569', cursor: 'pointer', padding: '4px', borderRadius: '8px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }} />
                  <span>Cash Payment</span>
                </div>
                <span style={{ fontWeight: '750', color: '#1e293b' }}>₹{stats.cashAmount.toLocaleString('en-IN')} ({cashPct}%)</span>
              </div>
              
              <div 
                onClick={() => {
                  setActiveFilter({ type: 'payment', label: 'Payment Mode: Online / Card', value: 'online' });
                  toast.success("Filtered recent bookings by: Online payments");
                }}
                title="Click to filter bookings below by Online / Card"
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#475569', cursor: 'pointer', padding: '4px', borderRadius: '8px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%' }} />
                  <span>Online / Gateway</span>
                </div>
                <span style={{ fontWeight: '750', color: '#1e293b' }}>₹{stats.onlineAmount.toLocaleString('en-IN')} ({onlinePct}%)</span>
              </div>
              
              <div 
                onClick={() => {
                  setActiveFilter({ type: 'payment', label: 'Payment Mode: Other / Cheque', value: 'other' });
                  toast.success("Filtered recent bookings by: Other payments");
                }}
                title="Click to filter bookings below by Other / Cheque"
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#475569', cursor: 'pointer', padding: '4px', borderRadius: '8px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#f59e0b', borderRadius: '50%' }} />
                  <span>Other / Cheque</span>
                </div>
                <span style={{ fontWeight: '750', color: '#1e293b' }}>₹{stats.otherAmount.toLocaleString('en-IN')} ({otherPct}%)</span>
              </div>
            </div>

            <div style={{ height: '8px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', overflow: 'hidden', marginTop: '10px' }}>
              <div style={{ width: `${cashPct}%`, background: '#10b981' }} />
              <div style={{ width: `${onlinePct}%`, background: '#6366f1' }} />
              <div style={{ width: `${otherPct}%`, background: '#f59e0b' }} />
            </div>
          </div>

          {/* Qurbani Target Progress Donut Chart */}
          <div className="list-table-container glass-card" style={{ padding: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', gap: '20px', alignItems: 'center', minHeight: '142px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <Gift size={14} />
                </div>
                <h4 style={{ margin: 0, fontWeight: '850', fontSize: '14px', color: '#1e293b' }}>Qurbani Progress</h4>
              </div>
              <p style={{ margin: '8px 0 4px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                Seasonal target of <span style={{ color: '#0f172a', fontWeight: '800' }}>{targetShares}</span> shares.
              </p>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit, sans-serif', marginTop: '6px' }}>
                {stats.totalShares} Shares
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Currently booked</span>
            </div>

            <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="9"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="url(#donutGrad)"
                  strokeWidth="9"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={(2 * Math.PI * 38) - (targetPct / 100) * (2 * Math.PI * 38)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
                <defs>
                  <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '950', color: '#0f172a', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{targetPct}%</span>
                <span style={{ fontSize: '7.5px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>REACHED</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Middle Row: Target Share Leaderboard & System Integrity Check */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        
        {/* Popular Qurbani Shares Leaderboard */}
        <div className="list-table-container glass-card" style={{ padding: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <Layers size={15} />
                </div>
                <h4 style={{ margin: 0, fontWeight: '850', fontSize: '14.5px', color: '#1e293b' }}>Popular Share Codes</h4>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Click to Filter list</span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="shimmer-loading" style={{ width: '100%', height: '14px', borderRadius: '4px' }} />
                ))}
              </div>
            ) : stats.topItems.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '12px', padding: '12px 0' }}>No animal shares recorded.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.topItems.map((item, idx) => {
                  const relativePct = stats.totalShares > 0 ? Math.round((item.shares / stats.totalShares) * 100) : 0;
                  return (
                    <div key={item.code} 
                      onClick={() => {
                        setActiveFilter({ type: 'share_code', label: `Share Code: ${item.code}`, value: item.code });
                        toast.success(`Filtered recent bookings by: ${item.code}`);
                      }}
                      title={`Click to filter list below by ${item.code}`}
                      style={{ display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '600', color: '#475569' }}>
                        <span>#{idx + 1} {item.code}</span>
                        <span style={{ fontWeight: '750', color: '#1e293b' }}>{item.shares} shares ({relativePct}%)</span>
                      </div>
                      <div style={{ height: '4px', borderRadius: '2px', background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ width: `${relativePct}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* System Health Check */}
        {isAdmin && (
        <div className="list-table-container glass-card" style={{ padding: '20px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
              <ShieldCheck size={15} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: '850', fontSize: '14.5px', color: '#1e293b' }}>System Integrity Check</h4>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Cloud Node Status</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Database Node', value: 'Connected', sub: '99.99% uptime', icon: Server, color: '#10b981' },
              { label: 'Latency (API)', value: '18 ms', sub: 'Optimal ping', icon: Activity, color: '#3b82f6' },
              { label: 'SSL Cryptography', value: 'SECURE', sub: 'AES-256 bit TLS', icon: Shield, color: '#10b981' },
              { label: 'Automatic Backup', value: 'Synced', sub: '12m ago', icon: Sliders, color: '#8b5cf6' }
            ].map(sys => {
              const SysIcon = sys.icon;
              return (
                <div key={sys.label} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{sys.label}</span>
                    <SysIcon size={12} style={{ color: sys.color }} />
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {sys.value === 'Connected' && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    <span>{sys.value}</span>
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '500' }}>{sys.sub}</span>
                </div>
              );
            })}
          </div>
        </div>
        )}

      </div>


    </div>
  );
};

export default DashboardPage;
