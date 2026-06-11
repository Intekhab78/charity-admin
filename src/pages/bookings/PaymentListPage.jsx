import React, { useState, useEffect, useMemo } from 'react';
import { bookingService } from '../../services/api';
import { Search, CreditCard, Eye, Coins, TrendingUp, ShieldCheck, Layers } from 'lucide-react';
import { toast } from '../../components/common/Toast';
import Pagination from '../../components/common/Pagination';
import TableSkeleton from '../../components/common/TableSkeleton';
import AnimatedCounter from '../../components/common/AnimatedCounter';

const PaymentList = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const isAdmin = user && user.role?.toLowerCase().includes('admin');

  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await bookingService.list();
      setPayments(res.data.data || []);
    } catch (err) { 
      console.error("Error fetching payments:", err);
      toast.error('Failed to fetch payment records.');
    } finally { 
      setLoading(false); 
    }
  };

  const displayedPayments = useMemo(() => {
    let list = isAdmin ? payments : payments.filter(p => p.vendor_name === (user?.name || '').trim());
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.customer_name?.toLowerCase().includes(lowerSearch) ||
        p.customer_phone?.includes(lowerSearch) ||
        p.id?.toString().includes(lowerSearch) ||
        (p.payment_mode || '').toLowerCase().includes(lowerSearch)
      );
    }

    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        } else if (typeof aVal === 'number') {
          aVal = aVal || 0;
          bVal = bVal || 0;
        } else if (sortConfig.key === 'created_at') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [payments, searchTerm, isAdmin, user, sortConfig]);

  const totalEntries = displayedPayments.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedPayments = useMemo(() => displayedPayments.slice(startIndex, startIndex + entriesPerPage), [displayedPayments, startIndex, entriesPerPage]);

  // Dynamic KPI Stats calculation
  const statsCards = useMemo(() => {
    const totalPayments = displayedPayments.length;
    const totalRevenue = displayedPayments.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
    const avgAmount = totalPayments ? Math.round(totalRevenue / totalPayments) : 0;
    const onlinePaymentsCount = displayedPayments.filter(p => 
      p.payment_mode?.toLowerCase() === 'online' || 
      p.payment_mode?.toLowerCase() === 'card'
    ).length;

    const cards = [
      { label: 'Total Payments', value: totalPayments, icon: Layers, color: '#6366f1' },
      { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: Coins, color: '#10b981' },
      { label: 'Average Payment', value: `₹${avgAmount.toLocaleString('en-IN')}`, icon: TrendingUp, color: '#8b5cf6' },
      { label: 'Digital Payments', value: onlinePaymentsCount, icon: CreditCard, color: '#f59e0b' }
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} 
              className={`premium-card relative overflow-hidden p-4 flex items-center gap-4 group border border-slate-200/60 bg-white`}
              style={{
                borderLeft: `4px solid ${card.color}`
              }}
            >
              <div 
                className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-[0.03] group-hover:scale-125 transition-transform duration-500"
                style={{ backgroundColor: card.color }}
              />

              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{ 
                  backgroundColor: card.color + '15', 
                  color: card.color,
                  border: `1px solid ${card.color}25`
                }}
              >
                <Icon size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  {card.label}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-black text-slate-900 tracking-tight font-outfit">
                    <AnimatedCounter value={card.value} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [displayedPayments]);

  const handleCopyClipboard = () => {
    const rows = displayedPayments.map((p, i) => [i + 1, `INV-${p.id}`, p.customer_name, p.customer_phone, p.payment_mode || 'Cash', p.total_amount, new Date(p.created_at).toLocaleDateString(), p.is_approved_by_admin === 1 ? 'Paid' : 'Pending'].join('\t')).join('\n');
    navigator.clipboard.writeText("S.No\tInvoice\tCustomer\tPhone\tPayment Mode\tAmount\tDate\tStatus\n" + rows)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(() => toast.error('Failed to copy.'));
  };

  const handleCSVExport = () => {
    const headers = ['SNo.', 'INVOICE', 'CUSTOMER NAME', 'PHONE', 'PAYMENT MODE', 'TOTAL AMOUNT (₹)', 'ORDER DATE', 'PAYMENT STATUS'];
    const rows = displayedPayments.map((p, i) => [i + 1, `INV-${p.id}`, `"${p.customer_name}"`, p.customer_phone, p.payment_mode || 'Cash', p.total_amount, new Date(p.created_at).toLocaleDateString(), p.is_approved_by_admin === 1 ? 'Paid' : 'Pending'].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(headers.join(',') + '\n' + rows.join('\n'));
    const link = document.createElement('a');
    link.href = csvContent;
    link.download = 'payments.csv';
    link.click();
    toast.success('Downloaded CSV successfully.');
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      
      {/* Premium Stats Grid */}
      {statsCards}

      <div className="list-table-container">
        {/* Table Hero Header */}
        <div className="tbl-hero">
          <div className="tbl-hero-left">
            <div className="tbl-icon" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="tbl-title">Payment Transactions</h3>
              <p className="tbl-subtitle">{payments.length} total transaction{payments.length !== 1 ? 's' : ''} &mdash; track and verify invoice payments</p>
            </div>
          </div>
        </div>

        <div className="tbl-divider"></div>

        {/* Controls */}
        <div className="table-controls">
          <div className="table-controls-left">
            <div className="show-entries">
              <span>Show</span>
              <select 
                value={entriesPerPage} 
                onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-slate-200 rounded-lg p-1 text-xs font-bold text-slate-700 bg-white"
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>
            <div className="export-buttons">
              <button className="export-btn font-semibold" onClick={handleCopyClipboard}>Copy</button>
              <button className="export-btn font-semibold" onClick={handleCSVExport}>CSV</button>
            </div>
          </div>
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search payments..." 
            />
          </div>
        </div>

        {/* Table Wrapper */}
        <div className="data-table-wrapper">
          <table className="dense-data-table">
            <thead>
              <tr className="tbl-head-row">
                <th style={{ width: '60px' }} className="text-center">#</th>
                <th style={{ width: '120px', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                  Invoice No {sortConfig.key === 'id' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customer_name')}>
                  Customer Name {sortConfig.key === 'customer_name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customer_phone')}>
                  Phone No {sortConfig.key === 'customer_phone' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th className="text-center" style={{ width: '150px', cursor: 'pointer' }} onClick={() => handleSort('payment_mode')}>
                  Payment Mode {sortConfig.key === 'payment_mode' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th className="text-right" style={{ width: '150px', cursor: 'pointer' }} onClick={() => handleSort('total_amount')}>
                  Total Amount {sortConfig.key === 'total_amount' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                  Order Date {sortConfig.key === 'created_at' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th className="text-center" style={{ width: '120px', cursor: 'pointer' }} onClick={() => handleSort('is_approved_by_admin')}>
                  Status {sortConfig.key === 'is_approved_by_admin' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} cols={8} hasAvatar={false} />
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-sm text-slate-300">
                        <Coins size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm">No Payment Records</h4>
                        <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or search terms.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p, i) => {
                  return (
                    <tr key={p.id || p._id}>
                      <td className="text-center font-medium text-slate-400">{startIndex + i + 1}</td>
                      <td className="font-mono text-xs font-bold text-slate-500">INV-{p.id}</td>
                      <td className="font-bold text-slate-800">{p.customer_name}</td>
                      <td className="text-slate-600">{p.customer_phone}</td>
                      <td className="text-center">
                        <span className="bg-slate-100 text-slate-600 font-mono font-bold px-2.5 py-1 rounded-lg text-xs border border-slate-200">{p.payment_mode || 'Cash'}</span>
                      </td>
                      <td className="text-right font-extrabold text-slate-900 pr-4">₹{Number(p.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="text-slate-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="text-center">
                        {p.is_approved_by_admin === 1 ? (
                          <span className="badge-approved" title="Verified payment">Paid</span>
                        ) : (
                          <span className="badge-vendor-approved" title="Pending verification">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalEntries > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalEntries={totalEntries}
            entriesPerPage={entriesPerPage}
            startIndex={startIndex}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentList;
