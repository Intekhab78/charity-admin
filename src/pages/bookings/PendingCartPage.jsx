import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle, Search, Layers, Coins, Users, TrendingUp } from 'lucide-react';
import { bookingService } from '../../services/api';
import { toast } from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';

const PendingCartList = ({ user }) => {
  const isAdmin = user && user.role?.toLowerCase().includes('admin');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', type: 'danger', onConfirm: () => {} });

  const triggerConfirm = (config) => {
    setConfirmConfig({
      ...config,
      onConfirm: () => {
        config.onConfirm();
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => { fetchPendingBookings(); }, []);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.list();
      setBookings((res.data?.data || []).filter(b => b.is_approved_by_admin === 0));
    } catch (err) { 
      console.error(err); 
      toast.error('Failed to load pending approvals.');
    } finally { 
      setLoading(false); 
    }
  };

  const handleApprove = (id) => {
    triggerConfirm({
      title: 'Approve Booking',
      message: 'Approve this booking now? It will instantly turn green and be fully verified.',
      confirmText: 'Approve',
      type: 'success',
      onConfirm: async () => {
        try {
          await bookingService.approve(id);
          toast.success('Booking successfully approved!');
          fetchPendingBookings();
        } catch (err) { 
          toast.error('Approval failed: ' + (err.response?.data?.message || err.message)); 
        }
      }
    });
  };

  const filtered = useMemo(() => {
    return bookings.filter(b =>
      b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.share_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id?.toString().includes(searchTerm)
    );
  }, [bookings, searchTerm]);

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = useMemo(() => filtered.slice(startIndex, startIndex + entriesPerPage), [filtered, startIndex, entriesPerPage]);

  // Dynamic KPI Stats calculation
  const statsCards = useMemo(() => {
    const totalPending = bookings.length;
    const pendingAmount = bookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const pendingShares = bookings.reduce((sum, b) => sum + Number(b.total_shares || 0), 0);
    const avgAmount = totalPending ? Math.round(pendingAmount / totalPending) : 0;

    const cards = [
      { label: 'Total Pending', value: totalPending, icon: Layers, color: '#6366f1' },
      { label: 'Outstanding Balance', value: `₹${pendingAmount.toLocaleString('en-IN')}`, icon: Coins, color: '#f59e0b' },
      { label: 'Pending Shares', value: pendingShares, icon: Users, color: '#8b5cf6' },
      { label: 'Avg Order Value', value: `₹${avgAmount.toLocaleString('en-IN')}`, icon: TrendingUp, color: '#10b981' }
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
                    {card.value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [bookings]);

  const handleCopyClipboard = () => {
    const rows = filtered.map((b, i) => [i + 1, b.vendor_name || 'System Admin', b.customer_name, b.share_code, b.total_shares, b.total_amount, new Date(b.booking_date || b.created_at).toLocaleDateString()].join('\t')).join('\n');
    navigator.clipboard.writeText("S.No\tVendor\tCustomer\tAnimal Share\tShares\tAmount\tDate\n" + rows)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(() => toast.error('Failed to copy.'));
  };

  const handleCSVExport = () => {
    const headers = ['SNo.', 'VENDOR', 'CUSTOMER', 'ANIMAL SHARE', 'SHARES', 'AMOUNT', 'DATE'];
    const rows = filtered.map((b, i) => [i + 1, `"${b.vendor_name || 'System Admin'}"`, `"${b.customer_name}"`, b.share_code, b.total_shares, b.total_amount, new Date(b.booking_date || b.created_at).toLocaleDateString()].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(headers.join(',') + '\n' + rows.join('\n'));
    const link = document.createElement('a');
    link.href = csvContent;
    link.download = 'pending_approvals.csv';
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
              <Clock size={20} />
            </div>
            <div>
              <h3 className="tbl-title">Pending Approvals & Carts</h3>
              <p className="tbl-subtitle">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''} &mdash; verify and approve vendor bookings</p>
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
              placeholder="Search pending..." 
            />
          </div>
        </div>

        {/* Table Wrapper */}
        <div className="data-table-wrapper">
          <table className="dense-data-table">
            <thead>
              <tr className="tbl-head-row">
                <th style={{ width: '60px' }} className="text-center">#</th>
                <th style={{ width: '150px' }} className="text-center">Status</th>
                <th>Vendor</th>
                <th>Customer</th>
                <th style={{ width: '140px' }}>Animal Share</th>
                <th className="text-center" style={{ width: '100px' }}>Shares</th>
                <th className="text-right" style={{ width: '140px' }}>Amount</th>
                <th>Date</th>
                {isAdmin && <th className="text-right pr-6" style={{ width: '160px' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 9 : 8} className="text-center py-10 text-slate-500 font-medium">Loading bookings...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={isAdmin ? 9 : 8} className="text-center py-10 text-slate-400">No pending bookings found.</td></tr>
              ) : paginated.map((b, index) => (
                <tr key={b._id || b.id}>
                  <td className="text-center font-medium text-slate-400">{startIndex + index + 1}</td>
                  <td className="text-center">
                    <span className="badge-vendor-approved flex items-center justify-center gap-1 mx-auto w-fit">
                      Pending Approval
                    </span>
                  </td>
                  <td className="text-slate-600">{b.vendor_name || 'System Admin'}</td>
                  <td className="font-bold text-slate-800">{b.customer_name}</td>
                  <td>
                    <span className="reg-cell">
                      {b.share_code}
                    </span>
                  </td>
                  <td className="text-center font-semibold text-slate-700">{b.total_shares}</td>
                  <td className="text-right font-extrabold text-slate-900 pr-4">₹{Number(b.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="text-slate-500 text-xs">{new Date(b.booking_date || b.created_at).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td className="text-right pr-6">
                      <button 
                        onClick={() => handleApprove(b.id || b._id)}
                        className="btn-view flex items-center justify-center ml-auto"
                        title="Approve"
                      >
                        <CheckCircle size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
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

      <ConfirmModal 
        isOpen={confirmOpen} 
        onCancel={() => setConfirmOpen(false)} 
        {...confirmConfig} 
      />
    </div>
  );
};

export default PendingCartList;
