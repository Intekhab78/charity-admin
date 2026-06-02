import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/api';

const PaymentList = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // DataTable States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const isAdmin = user && user.role?.toLowerCase().includes('admin');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await bookingService.list();
      setPayments(res.data.data);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-list-container">
      <div className="list-table-container">
        <div className="table-controls">
          <div className="show-entries">
            <span>Show </span>
            <select value={entriesPerPage} onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span> entries</span>
          </div>
          <div className="export-buttons">
            <button onClick={() => alert("Copied to clipboard!")}>Copy</button>
            <button onClick={() => {
              const processedPayments = isAdmin ? payments : payments.filter(p => p.vendor_name === (user?.name || '').trim());
              const headers = ['SNo.', 'INVOICE', 'CUSTOMER NAME', 'PHONE', 'PAYMENT MODE', 'TOTAL AMOUNT (₹)', 'ORDER DATE', 'PAYMENT STATUS'];
              const rows = processedPayments.map((p, i) => [i + 1, `INV-${p.id}`, p.customer_name, p.customer_phone, p.payment_mode || 'Cash', p.total_amount, new Date(p.created_at).toLocaleDateString(), 'Paid'].join(','));
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURI(headers.join(',') + '\n' + rows.join('\n'));
              link.download = 'payments.csv';
              link.click();
            }}>CSV</button>
            <button onClick={() => {
              const processedPayments = isAdmin ? payments : payments.filter(p => p.vendor_name === (user?.name || '').trim());
              const headers = ['SNo.', 'INVOICE', 'CUSTOMER NAME', 'PHONE', 'PAYMENT MODE', 'TOTAL AMOUNT (₹)', 'ORDER DATE', 'PAYMENT STATUS'];
              const rows = processedPayments.map((p, i) => [i + 1, `INV-${p.id}`, p.customer_name, p.customer_phone, p.payment_mode || 'Cash', p.total_amount, new Date(p.created_at).toLocaleDateString(), 'Paid'].join(','));
              const link = document.createElement('a');
              link.href = 'data:text/csv;charset=utf-8,' + encodeURI(headers.join(',') + '\n' + rows.join('\n'));
              link.download = 'payments_excel.csv';
              link.click();
            }}>Excel</button>
            <button onClick={() => window.print()}>PDF</button>
            <button onClick={() => window.print()}>Print</button>
          </div>
          <div className="search-box">
            <span>Search: </span>
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              placeholder="Search Payments..." 
            />
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="dense-data-table">
            <thead>
              <tr>
                <th>SNo.</th>
                <th>INVOICE NO</th>
                <th>CUSTOMER NAME</th>
                <th>PHONE NO</th>
                <th>PAYMENT MODE</th>
                <th>TOTAL AMOUNT (₹)</th>
                <th>ORDER DATE</th>
                <th>PAYMENT STATUS</th>
                {isAdmin && <th>ACTION</th>}
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (loading) {
                  return <tr><td colSpan={isAdmin ? "9" : "8"} className="text-center">Loading payments...</td></tr>;
                }

                let displayedPayments = isAdmin 
                  ? payments 
                  : payments.filter(p => p.vendor_name === (user?.name || '').trim());

                if (searchTerm) {
                  const lowerSearch = searchTerm.toLowerCase();
                  displayedPayments = displayedPayments.filter(p => 
                    p.customer_name?.toLowerCase().includes(lowerSearch) ||
                    p.customer_phone?.includes(lowerSearch) ||
                    p.id.toString().includes(lowerSearch) ||
                    (p.payment_mode || '').toLowerCase().includes(lowerSearch)
                  );
                }

                const totalEntries = displayedPayments.length;
                const totalPages = Math.ceil(totalEntries / entriesPerPage);
                const startIndex = (currentPage - 1) * entriesPerPage;
                const paginatedPayments = displayedPayments.slice(startIndex, startIndex + entriesPerPage);

                if (paginatedPayments.length === 0) {
                  return <tr><td colSpan={isAdmin ? "9" : "8"} className="text-center">No payment records found.</td></tr>;
                }

                return paginatedPayments.map((p, i) => {
                  const globalIndex = startIndex + i + 1;
                  return (
                    <tr key={p.id} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
                      <td className="text-center">{globalIndex}</td>
                    <td className="text-center font-bold">INV-{p.id}</td>
                    <td className="text-center font-bold">{p.customer_name}</td>
                    <td className="text-center">{p.customer_phone}</td>
                    <td className="text-center">
                      <span className="payment-badge">{p.payment_mode || 'Cash'}</span>
                    </td>
                    <td className="text-center font-bold" style={{ color: '#059669' }}>
                      {p.total_amount}
                    </td>
                    <td className="text-center">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="text-center">
                      <span className="status-paid">Paid</span>
                    </td>
                    {isAdmin && (
                      <td className="text-center">
                        <button className="btn-text">VIEW RECEIPT</button>
                      </td>
                    )}
                  </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {(() => {
          if (loading || payments.length === 0) return null;
          let displayedPayments = isAdmin ? payments : payments.filter(p => p.vendor_name === (user?.name || '').trim());
          if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            displayedPayments = displayedPayments.filter(p => 
              p.customer_name?.toLowerCase().includes(lowerSearch) ||
              p.customer_phone?.includes(lowerSearch) ||
              p.id.toString().includes(lowerSearch) ||
              (p.payment_mode || '').toLowerCase().includes(lowerSearch)
            );
          }
          const totalEntries = displayedPayments.length;
          const totalPages = Math.ceil(totalEntries / entriesPerPage);
          const startIndex = (currentPage - 1) * entriesPerPage;
          const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);

          if (totalEntries === 0) return null;

          return (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
              </div>
              <div className="pagination-buttons">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >Previous</button>
                <span className="current-page">{currentPage}</span>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >Next</button>
              </div>
            </div>
          );
        })()}

      </div>

      <style>{`
        .payment-list-container { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .list-table-container { background: white; }
        .table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
        .show-entries { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; font-weight: 500; }
        .show-entries select { padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; }
        .search-box { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; font-weight: 500; }
        .search-box input { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; transition: border-color 0.2s; }
        .search-box input:focus { border-color: #059669; }
        .export-buttons { display: flex; gap: 8px; }
        .export-buttons button { background: #fff; border: 1px solid #e2e8f0; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; color: #475569; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .export-buttons button:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }
        
        .data-table-wrapper { overflow-x: auto; border-radius: 8px; border: 1px solid #d1fae5; }
        .dense-data-table { width: 100%; border-collapse: collapse; min-width: 1000px; font-size: 12px; font-family: 'Inter', 'Segoe UI', sans-serif; }
        .dense-data-table th { background: #059669; padding: 12px 10px; border-bottom: 2px solid #047857; text-align: center; color: #ffffff; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
        .dense-data-table td { padding: 10px 8px; border-bottom: 1px solid #ecfdf5; border-right: 1px solid rgba(0,0,0,0.02); color: #0f172a; vertical-align: middle; transition: background 0.2s; }
        
        /* Vibrant Alternating Rows in Green/White */
        .row-even { background-color: #ffffff; } 
        .row-even td { border-bottom-color: #f0fdf4; }
        .row-odd { background-color: #f0fdf4; } 
        .row-odd td { border-bottom-color: #d1fae5; }
        
        /* Utility Classes */
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        
        .payment-badge { background: #e2e8f0; color: #334155; padding: 4px 10px; font-weight: 700; border-radius: 6px; display: inline-block; font-size: 10px; letter-spacing: 0.5px; }
        .status-paid { background: #059669; color: #fff; padding: 4px 10px; font-weight: 700; border-radius: 99px; display: inline-block; font-size: 10px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3); }
        .btn-text { background: transparent; border: none; color: #059669; cursor: pointer; text-decoration: underline; font-size: 11px; font-weight: 700; text-transform: uppercase; transition: opacity 0.2s; text-underline-offset: 3px; }
        .btn-text:hover { opacity: 0.7; color: #047857; }
        
        .pagination-container { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; font-size: 13px; color: #475569; }
        .pagination-buttons { display: flex; gap: 5px; align-items: center; }
        .pagination-buttons button { padding: 6px 12px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; cursor: pointer; font-weight: 500; color: #475569; transition: all 0.2s; }
        .pagination-buttons button:hover:not(:disabled) { background: #f8fafc; border-color: #059669; color: #059669; }
        .pagination-buttons button:disabled { opacity: 0.5; cursor: not-allowed; }
        .current-page { padding: 6px 12px; background: #059669; color: white; border-radius: 6px; font-weight: bold; }
      `}</style>
    </div>
  );
};

export default PaymentList;
