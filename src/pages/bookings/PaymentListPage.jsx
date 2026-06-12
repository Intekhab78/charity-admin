import React, { useState, useEffect, useMemo } from 'react';
import { bookingService } from '../../services/api';
import { Search, CreditCard, Eye, Coins, TrendingUp, ShieldCheck, Layers } from 'lucide-react';
import { toast } from '../../components/common/Toast';
import Pagination from '../../components/common/Pagination';
import TableSkeleton from '../../components/common/TableSkeleton';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import PageControlPanel from '../../components/common/PageControlPanel';
import ExportButtons from '../../components/common/ExportButtons';

const PaymentList = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
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
    
    if (filters.paymentMode) {
      list = list.filter(p => (p.payment_mode || 'Cash').toLowerCase() === filters.paymentMode.toLowerCase());
    }
    
    if (filters.status) {
      if (filters.status === 'Paid') list = list.filter(p => p.is_approved_by_admin === 1);
      if (filters.status === 'Pending') list = list.filter(p => p.is_approved_by_admin === 0);
    }

    if (filters.dateRange) {
      const now = new Date();
      list = list.filter(p => {
        const pDate = new Date(p.created_at || p.booking_date).getTime();
        if (filters.dateRange === 'today') {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          return pDate >= startOfToday;
        } else if (filters.dateRange === 'week') {
          const s = new Date(now);
          s.setDate(now.getDate() - now.getDay());
          const startOfWeek = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
          return pDate >= startOfWeek;
        } else if (filters.dateRange === 'month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          return pDate >= startOfMonth;
        } else if (filters.dateRange === 'year') {
          const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
          return pDate >= startOfYear;
        }
        return true;
      });
    }

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

    return [
      { label: 'Total Payments', value: totalPayments, icon: Layers, color: '#6366f1', bg: '#eef2ff', border: 'rgba(99,102,241,0.15)' },
      { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: Coins, color: '#10b981', bg: '#ecfdf5', border: 'rgba(16,185,129,0.15)' },
      { label: 'Average Payment', value: `₹${avgAmount.toLocaleString('en-IN')}`, icon: TrendingUp, color: '#8b5cf6', bg: '#f5f3ff', border: 'rgba(139,92,246,0.15)' },
      { label: 'Digital Payments', value: onlinePaymentsCount, icon: CreditCard, color: '#f59e0b', bg: '#fffbeb', border: 'rgba(245,158,11,0.15)' }
    ];
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
      
      <PageControlPanel
        title="Payment Transactions" 
        subtitle={`${payments.length} total transaction${payments.length !== 1 ? 's' : ''} — track and verify invoice payments`} 
        icon={CreditCard}
        stats={statsCards} 
        searchTerm={searchTerm}
        onSearchChange={val => { setSearchTerm(val); setCurrentPage(1); }}
        filters={filters} 
        onFilterChange={f => { setFilters(f); setCurrentPage(1); }}
        filterOptions={{ 
          dateRange: [
            { label: 'Today', value: 'today' },
            { label: 'This Week', value: 'week' },
            { label: 'This Month', value: 'month' },
            { label: 'This Year', value: 'year' }
          ],
          paymentMode: [
            { label: 'Cash', value: 'Cash' },
            { label: 'Online Transfer', value: 'Online Transfer' },
            { label: 'Cheque', value: 'Cheque' }
          ],
          status: [
            { label: 'Paid', value: 'Paid' },
            { label: 'Pending', value: 'Pending' }
          ]
        }}
        extraActions={
          <ExportButtons 
            filename="payment_transactions" 
            title="Payment Transactions" 
            columns={[
              { header: 'SNo.', dataKey: 'sno' },
              { header: 'INVOICE', dataKey: 'invoice' },
              { header: 'CUSTOMER NAME', dataKey: 'customer_name' },
              { header: 'PHONE', dataKey: 'customer_phone' },
              { header: 'PAYMENT MODE', dataKey: 'payment_mode' },
              { header: 'TOTAL AMOUNT (₹)', dataKey: 'total_amount' },
              { header: 'ORDER DATE', dataKey: 'order_date' },
              { header: 'PAYMENT STATUS', dataKey: 'payment_status' }
            ]}
            data={displayedPayments.map((p, i) => ({
              sno: i + 1,
              invoice: `INV-${p.id}`,
              customer_name: p.customer_name,
              customer_phone: p.customer_phone,
              payment_mode: p.payment_mode || 'Cash',
              total_amount: p.total_amount,
              order_date: new Date(p.created_at).toLocaleDateString(),
              payment_status: p.is_approved_by_admin === 1 ? 'Paid' : 'Pending'
            }))}
          />
        }
      />

      <div className="list-table-container">
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
