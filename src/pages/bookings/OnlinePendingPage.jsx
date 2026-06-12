import React, { useState, useEffect, useMemo } from 'react';
import { Globe, CreditCard, CheckCircle, Search, Coins, Layers, TrendingUp, XCircle } from 'lucide-react';
import { bookingService } from '../../services/api';
import { toast } from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import TableSkeleton from '../../components/common/TableSkeleton';
import AnimatedCounter from '../../components/common/AnimatedCounter';

const OnlinePendingList = ({ user }) => {
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

  useEffect(() => {
    fetchOnlineBookings();
  }, []);

  const fetchOnlineBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.list();
      // Filter bookings where payment mode is Card/Online
      const onlineList = (res.data?.data || []).filter(b => 
        b.payment_mode?.toLowerCase() === 'card' || 
        b.payment_mode?.toLowerCase() === 'online'
      );
      setBookings(onlineList);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load online pending bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (id) => {
    triggerConfirm({
      title: 'Verify Online Payment',
      message: 'Mark this online payment as cleared and fully verified?',
      confirmText: 'Verify',
      type: 'success',
      onConfirm: async () => {
        try {
          await bookingService.approve(id);
          toast.success('Payment verified successfully!');
          fetchOnlineBookings();
        } catch (err) {
          toast.error('Verification failed: ' + (err.response?.data?.message || err.message));
        }
      }
    });
  };

  const handleReject = (id) => {
    triggerConfirm({
      title: 'Reject Online Payment',
      message: 'Are you sure you want to reject this online payment? This will mark it as Rejected.',
      confirmText: 'Reject',
      type: 'danger',
      onConfirm: async () => {
        try {
          await bookingService.reject(id);
          toast.success('Payment rejected successfully!');
          fetchOnlineBookings();
        } catch (err) {
          toast.error('Rejection failed: ' + (err.response?.data?.message || err.message));
        }
      }
    });
  };

  const filtered = useMemo(() => {
    return bookings.filter(b => 
      b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id?.toString().includes(searchTerm)
    );
  }, [bookings, searchTerm]);

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = useMemo(() => filtered.slice(startIndex, startIndex + entriesPerPage), [filtered, startIndex, entriesPerPage]);

  // Dynamic KPI Stats calculation
  const statsCards = useMemo(() => {
    const totalTransactions = bookings.length;
    const pendingAmount = bookings.filter(b => b.is_approved_by_admin === 0).reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const clearedAmount = bookings.filter(b => b.is_approved_by_admin === 1).reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const verifiedCount = bookings.filter(b => b.is_approved_by_admin === 1).length;

    const cards = [
      { label: 'Total Transactions', value: totalTransactions, icon: Layers, color: '#6366f1' },
      { label: 'Pending Settle', value: `₹${pendingAmount.toLocaleString('en-IN')}`, icon: Coins, color: '#f59e0b' },
      { label: 'Cleared Amount', value: `₹${clearedAmount.toLocaleString('en-IN')}`, icon: TrendingUp, color: '#10b981' },
      { label: 'Verified Payments', value: verifiedCount, icon: CheckCircle, color: '#8b5cf6' }
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
  }, [bookings]);

  const handleCopyClipboard = () => {
    const rows = filtered.map((b, i) => [i + 1, b.customer_name, b.vendor_name || 'System Admin', b.payment_mode, b.total_amount, b.is_approved_by_admin === 1 ? 'Cleared' : 'Pending'].join('\t')).join('\n');
    navigator.clipboard.writeText("S.No\tCustomer Name\tVendor\tMethod\tAmount\tStatus\n" + rows)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(() => toast.error('Failed to copy.'));
  };

  const handleCSVExport = () => {
    const headers = ['SNo.', 'CUSTOMER NAME', 'VENDOR', 'PAYMENT METHOD', 'AMOUNT', 'STATUS'];
    const rows = filtered.map((b, i) => [i + 1, `"${b.customer_name}"`, `"${b.vendor_name || 'System Admin'}"`, b.payment_mode, b.total_amount, b.is_approved_by_admin === 1 ? 'Cleared' : 'Pending'].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(headers.join(',') + '\n' + rows.join('\n'));
    const link = document.createElement('a');
    link.href = csvContent;
    link.download = 'online_pending.csv';
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
              <Globe size={20} />
            </div>
            <div>
              <h3 className="tbl-title">Online Debit Pending List</h3>
              <p className="tbl-subtitle">{bookings.length} total transaction{bookings.length !== 1 ? 's' : ''} &mdash; verify and settle digital payments</p>
            </div>
          </div>
          <div className="tbl-hero-right">
            <div className="export-buttons">
              <button className="export-btn font-semibold" onClick={handleCopyClipboard}>Copy</button>
              <button className="export-btn font-semibold" onClick={handleCSVExport}>CSV</button>
            </div>
          </div>
        </div>

        <div className="tbl-divider"></div>

        {/* Controls */}
        <div className="table-controls justify-end">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search online bookings..." 
            />
          </div>
        </div>

        {/* Table Wrapper */}
        <div className="data-table-wrapper">
          <table className="dense-data-table">
            <thead>
              <tr className="tbl-head-row">
                <th style={{ width: '60px' }} className="text-center">#</th>
                <th>Customer Name</th>
                <th>Vendor</th>
                <th style={{ width: '180px' }}>Payment Method</th>
                <th className="text-right" style={{ width: '150px' }}>Amount</th>
                <th className="text-center" style={{ width: '150px' }}>Approval Status</th>
                {isAdmin && <th className="text-right pr-6" style={{ width: '180px' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} cols={isAdmin ? 7 : 6} hasAvatar={false} />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-sm text-slate-300">
                        <Globe size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm">No Pending Transactions</h4>
                        <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or search terms.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((b, index) => {
                  return (
                    <tr key={b._id || b.id}>
                      <td className="text-center font-medium text-slate-400">{startIndex + index + 1}</td>
                      <td className="font-bold text-slate-800">{b.customer_name}</td>
                      <td className="text-slate-600">{b.vendor_name || 'System Admin'}</td>
                      <td>
                        <span className="flex items-center gap-1.5 font-bold text-sky-700">
                          <CreditCard size={14} className="text-sky-500" /> {b.payment_mode}
                        </span>
                      </td>
                      <td className="text-right font-extrabold text-slate-900 pr-4">₹{Number(b.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="text-center">
                        <span className={
                          b.is_approved_by_admin === 1 
                            ? 'badge-approved' 
                            : b.is_approved_by_admin === 2 
                            ? 'badge-rejected' 
                            : 'badge-vendor-approved'
                        }>
                          {
                            b.is_approved_by_admin === 1 
                              ? 'Cleared' 
                              : b.is_approved_by_admin === 2 
                              ? 'Rejected' 
                              : 'Pending'
                          }
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="text-right pr-6">
                          {b.is_approved_by_admin === 0 ? (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleVerify(b.id || b._id)}
                                className="btn-view"
                                data-tooltip="Clear Payment"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button 
                                onClick={() => handleReject(b.id || b._id)}
                                className="btn-delete"
                                data-tooltip="Reject Payment"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          ) : b.is_approved_by_admin === 1 ? (
                            <span className="text-slate-400 text-xs font-bold mr-3">✓ Verified</span>
                          ) : (
                            <span className="text-rose-500 text-xs font-bold mr-3">✗ Rejected</span>
                          )}
                        </td>
                      )}
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

      <ConfirmModal 
        isOpen={confirmOpen} 
        onCancel={() => setConfirmOpen(false)} 
        {...confirmConfig} 
      />
    </div>
  );
};

export default OnlinePendingList;
