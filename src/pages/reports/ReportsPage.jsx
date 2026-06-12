import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, 
  IndianRupee, 
  PieChart as PieChartIcon,
  Activity,
  CreditCard,
  Package,
  Calendar,
  AlertCircle,
  Store,
  Tag,
  Users,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { bookingService } from '../../services/api';
import ExportButtons from '../../components/common/ExportButtons';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e', '#3b82f6', '#f97316', '#84cc16'];

const ReportsPage = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  
  // Metrics
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    pendingPayments: 0,
    totalShares: 0,
    averageRevenue: 0,
    unapprovedBookings: 0,
    topShareCode: 'N/A',
    totalBeneficiaries: 0
  });

  // Chart Data
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [paymentModeData, setPaymentModeData] = useState([]);
  const [vendorData, setVendorData] = useState([]);
  const [shareCodeData, setShareCodeData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await bookingService.list();
      const allBookings = res.data.data || [];
      setBookings(allBookings);
      calculateMetrics(allBookings);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (allBookings) => {
    let totalRev = 0;
    let pendingRev = 0;
    let totalSharesCount = 0;
    let unapprovedCount = 0;
    let beneficiariesSet = new Set();
    
    const monthlyRev = {};
    const deptDistribution = {};
    const paymentModes = {};
    const vendorSales = {};
    const shareCodesMap = {};

    allBookings.forEach(booking => {
      // Metrics
      const amount = Number(booking.total_amount) || 0;
      totalRev += amount;
      
      if (booking.payment_status === 'Pending') {
        pendingRev += amount;
      }

      if (booking.is_approved_by_admin === 0) {
        unapprovedCount++;
      }

      totalSharesCount += Number(booking.total_shares) || 0;

      // Vendor Data
      const vendorName = booking.vendor_name || 'Direct / Online';
      vendorSales[vendorName] = (vendorSales[vendorName] || 0) + amount;

      // Share Code Popularity
      const code = booking.share_code || 'Unknown';
      shareCodesMap[code] = (shareCodesMap[code] || 0) + 1;

      // Monthly Trend (using booking_date)
      if (booking.booking_date) {
        const d = new Date(booking.booking_date);
        const monthYear = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyRev[monthYear] = (monthlyRev[monthYear] || 0) + amount;
      }

      // Payment Mode Distribution
      const mode = booking.payment_mode || 'Unknown';
      paymentModes[mode] = (paymentModes[mode] || 0) + amount;

      // Department & Beneficiaries
      if (booking.shares && Array.isArray(booking.shares)) {
        booking.shares.forEach(share => {
          const dept = share.objective || 'Unspecified';
          deptDistribution[dept] = (deptDistribution[dept] || 0) + 1;
          
          if (share.beneficiary_mobile) {
            beneficiariesSet.add(share.beneficiary_mobile.trim());
          }
        });
      }
    });

    // Calculate Top Share Code
    let topCode = 'N/A';
    let maxCodeCount = 0;
    for (const [code, count] of Object.entries(shareCodesMap)) {
      if (count > maxCodeCount) {
        maxCodeCount = count;
        topCode = code;
      }
    }

    setMetrics({
      totalRevenue: totalRev,
      totalBookings: allBookings.length,
      pendingPayments: pendingRev,
      totalShares: totalSharesCount,
      averageRevenue: allBookings.length > 0 ? (totalRev / allBookings.length) : 0,
      unapprovedBookings: unapprovedCount,
      topShareCode: topCode,
      totalBeneficiaries: beneficiariesSet.size
    });

    // Format Monthly Data
    const formattedMonthly = Object.keys(monthlyRev).map(key => ({
      name: key,
      Revenue: monthlyRev[key]
    }));
    setMonthlyRevenueData(formattedMonthly);

    // Format Department Data
    const formattedDept = Object.keys(deptDistribution).map(key => ({
      name: key,
      value: deptDistribution[key]
    })).sort((a,b) => b.value - a.value);
    setDepartmentData(formattedDept);

    // Format Payment Mode Data
    const formattedPaymentModes = Object.keys(paymentModes).map(key => ({
      name: key,
      value: paymentModes[key]
    }));
    setPaymentModeData(formattedPaymentModes);

    // Format Vendor Data
    const formattedVendors = Object.keys(vendorSales).map(key => ({
      name: key.length > 15 ? key.substring(0, 15) + '...' : key,
      revenue: vendorSales[key]
    })).sort((a,b) => b.revenue - a.revenue).slice(0, 5); // Top 5 vendors
    setVendorData(formattedVendors);

    // Format Share Code Data
    const formattedShareCodes = Object.keys(shareCodesMap).map(key => ({
      name: key,
      value: shareCodesMap[key]
    })).sort((a,b) => b.value - a.value);
    setShareCodeData(formattedShareCodes);

    // Recent Bookings (sort by created_at desc)
    const sortedBookings = [...allBookings].sort((a, b) => new Date(b.created_at || b.booking_date) - new Date(a.created_at || a.booking_date));
    setRecentBookings(sortedBookings.slice(0, 5));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-emerald-600 font-semibold text-sm animate-pulse">Analyzing Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-rose-500 min-h-[400px]">
        <AlertCircle size={48} className="mb-4 opacity-50" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-indigo-600/20 opacity-50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
              <Activity className="text-emerald-400" size={36} />
              Performance Dashboard
            </h1>
            <p className="text-slate-400 font-medium">Comprehensive overview of all charity operations, bookings, and financial metrics.</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="bg-emerald-500/20 p-3 rounded-xl">
                <Calendar className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Generated On</p>
                <p className="text-white font-semibold">{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-2 px-4 shadow-xl">
              <ExportButtons 
                filename="full_master_report" 
                title="Master Project Report" 
                columns={[
                  { header: 'ID', dataKey: 'id' },
                  { header: 'Customer', dataKey: 'customer_name' },
                  { header: 'Vendor', dataKey: 'vendor_name' },
                  { header: 'Date', dataKey: 'booking_date' },
                  { header: 'Shares', dataKey: 'total_shares' },
                  { header: 'Amount', dataKey: 'total_amount' },
                  { header: 'Payment Mode', dataKey: 'payment_mode' },
                  { header: 'Status', dataKey: 'payment_status' }
                ]}
                data={bookings.map(b => ({
                  ...b,
                  booking_date: b.booking_date ? new Date(b.booking_date).toLocaleDateString() : ''
                }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Revenue" 
          value={formatCurrency(metrics.totalRevenue)} 
          icon={<IndianRupee size={24} className="text-emerald-500" />}
          gradient="from-emerald-500/10 to-emerald-500/5"
          border="border-emerald-500/20"
        />
        <KpiCard 
          title="Total Bookings" 
          value={metrics.totalBookings.toLocaleString('en-IN')} 
          icon={<Package size={24} className="text-indigo-500" />}
          gradient="from-indigo-500/10 to-indigo-500/5"
          border="border-indigo-500/20"
        />
        <KpiCard 
          title="Pending Payments" 
          value={formatCurrency(metrics.pendingPayments)} 
          icon={<CreditCard size={24} className="text-amber-500" />}
          gradient="from-amber-500/10 to-amber-500/5"
          border="border-amber-500/20"
        />
        <KpiCard 
          title="Total Shares" 
          value={metrics.totalShares.toLocaleString('en-IN')} 
          icon={<PieChartIcon size={24} className="text-rose-500" />}
          gradient="from-rose-500/10 to-rose-500/5"
          border="border-rose-500/20"
        />
      </div>

      {/* Secondary KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Avg Revenue / Booking" 
          value={formatCurrency(metrics.averageRevenue)} 
          icon={<TrendingUp size={24} className="text-blue-500" />}
          gradient="from-blue-500/10 to-blue-500/5"
          border="border-blue-500/20"
        />
        <KpiCard 
          title="Unapproved Bookings" 
          value={metrics.unapprovedBookings.toLocaleString('en-IN')} 
          icon={<Clock size={24} className="text-orange-500" />}
          gradient="from-orange-500/10 to-orange-500/5"
          border="border-orange-500/20"
        />
        <KpiCard 
          title="Top Share Code" 
          value={metrics.topShareCode} 
          icon={<Tag size={24} className="text-purple-500" />}
          gradient="from-purple-500/10 to-purple-500/5"
          border="border-purple-500/20"
        />
        <KpiCard 
          title="Unique Beneficiaries" 
          value={metrics.totalBeneficiaries.toLocaleString('en-IN')} 
          icon={<Users size={24} className="text-teal-500" />}
          gradient="from-teal-500/10 to-teal-500/5"
          border="border-teal-500/20"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Revenue Growth</h3>
              <p className="text-sm text-slate-500 font-medium">Monthly collection trends over time</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Mode Distribution Pie Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Payment Modes</h3>
            <p className="text-sm text-slate-500 font-medium">Revenue by transaction type</p>
          </div>
          
          <div className="flex-1 h-[280px] w-full relative flex flex-col justify-center">
            {paymentModeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentModeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#475569' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium">No data available</div>
            )}
            
            {/* Center Text */}
            {paymentModeData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-8">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-lg font-extrabold text-slate-800">{formatCurrency(metrics.totalRevenue)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Vendors Bar Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Top Vendors</h3>
              <p className="text-sm text-slate-500 font-medium">Highest revenue generating vendors</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <Store size={20} className="text-indigo-500" />
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} fill="#6366f1" barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share Code Popularity Donut Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Share Code Popularity</h3>
            <p className="text-sm text-slate-500 font-medium">Distribution by product codes</p>
          </div>
          
          <div className="flex-1 h-[300px] w-full relative flex flex-col justify-center">
            {shareCodeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shareCodeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    labelLine={false}
                  >
                    {shareCodeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                    formatter={(value) => [value, 'Purchases']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#475569' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Distribution Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Department Overview</h3>
              <p className="text-sm text-slate-500 font-medium">Bookings by Department</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <LayoutDashboard size={20} className="text-rose-500" />
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} width={120} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [value, 'Bookings']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#f43f5e" barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Summary Info Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full" />
          <h3 className="text-2xl font-bold mb-4 font-outfit">Analytics Summary</h3>
          <p className="text-slate-300 leading-relaxed mb-6">
            The data demonstrates a robust performance with total revenue reaching <strong className="text-white">{formatCurrency(metrics.totalRevenue)}</strong> across <strong className="text-white">{metrics.totalBookings}</strong> overall bookings. The top performing vendor continues to drive significant volume. 
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-sm font-semibold text-slate-300">Share Code Leader</span>
              <span className="font-bold text-emerald-400">{metrics.topShareCode}</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-sm font-semibold text-slate-300">Active Beneficiaries</span>
              <span className="font-bold text-blue-400">{metrics.totalBeneficiaries}</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-sm font-semibold text-slate-300">Total Shares Handled</span>
              <span className="font-bold text-rose-400">{metrics.totalShares}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
            <p className="text-sm text-slate-500 font-medium">Latest bookings processed</p>
          </div>
          <ExportButtons 
            filename="charity_recent_activity" 
            title="Recent Activity Report" 
            columns={[
              { header: 'Date', dataKey: 'booking_date' },
              { header: 'Customer', dataKey: 'customer_name' },
              { header: 'Reg No', dataKey: 'reg_no' },
              { header: 'Shares', dataKey: 'total_shares' },
              { header: 'Amount', dataKey: 'total_amount' },
              { header: 'Status', dataKey: 'payment_status' },
            ]}
            data={recentBookings.map(b => ({
              ...b,
              booking_date: new Date(b.booking_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
            }))}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Reg No</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Shares</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length > 0 ? recentBookings.map((b, idx) => (
                <tr key={b._id || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 text-sm font-semibold text-slate-600">
                    {new Date(b.booking_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-4 text-sm font-bold text-slate-800">
                    {b.customer_name || 'N/A'}
                  </td>
                  <td className="py-4 px-4 text-sm font-mono text-emerald-600">
                    {b.reg_no}
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-slate-600">
                    {b.total_shares}
                  </td>
                  <td className="py-4 px-4 text-sm font-bold text-slate-800">
                    {formatCurrency(b.total_amount)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                      b.payment_status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {b.payment_status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 font-medium">No recent bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

// Sub-component for KPI Cards
const KpiCard = ({ title, value, icon, gradient, border, trend, trendUp }) => (
  <div className={`relative overflow-hidden bg-white rounded-3xl p-6 shadow-sm border ${border} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group`}>
    <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
    
    <div className="relative z-10 flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} border ${border} shadow-sm`}>
        {icon}
      </div>
    </div>
    
    <div className="relative z-10">
      <h4 className="text-slate-500 font-bold text-xs tracking-wider uppercase mb-1">{title}</h4>
      <div className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{value}</div>
      
      {trend && (
        <div className={`mt-3 text-xs font-semibold flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-rose-500'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </div>
      )}
    </div>
  </div>
);

export default ReportsPage;
