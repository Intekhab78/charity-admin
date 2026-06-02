import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Search, Edit3, Trash2 } from 'lucide-react';
import { bookingService } from '../services/api';

const PendingCartList = ({ user }) => {
  const isAdmin = user && user.role?.toLowerCase().includes('admin');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.list();
      // Filter only pending approval
      const pendingList = (res.data?.data || []).filter(b => b.is_approved_by_admin === 0);
      setBookings(pendingList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm("Approve this booking now? It will instantly turn green and be fully verified.")) {
      try {
        await bookingService.approve(id);
        alert("Booking successfully approved!");
        fetchPendingBookings();
      } catch (err) {
        alert("Approval failed: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const filtered = bookings.filter(b => 
    b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.share_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id?.toString().includes(searchTerm)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
          Pending Approvals & Carts ({bookings.length})
        </h2>
        <div style={{ position: 'relative', width: '280px' }}>
          <input 
            type="text" 
            placeholder="Search pending bookings..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 12px 10px 35px', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              fontSize: '13px' 
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div style={{ 
          padding: '50px 20px', 
          background: 'white', 
          borderRadius: '12px', 
          textAlign: 'center', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          color: '#64748b' 
        }}>
          <Clock size={40} style={{ color: '#eab308', marginBottom: '15px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '5px' }}>No Pending Bookings</h3>
          <p style={{ fontSize: '14px' }}>All vendor bookings are fully approved and active!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '15px' }}>SNO.</th>
                <th style={{ padding: '15px' }}>STATUS</th>
                <th style={{ padding: '15px' }}>VENDOR</th>
                <th style={{ padding: '15px' }}>CUSTOMER</th>
                <th style={{ padding: '15px' }}>ANIMAL SHARE</th>
                <th style={{ padding: '15px' }}>SHARES</th>
                <th style={{ padding: '15px' }}>AMOUNT</th>
                <th style={{ padding: '15px' }}>DATE</th>
                {isAdmin && <th style={{ padding: '15px', textAlign: 'center' }}>ACTION</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, index) => (
                <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', color: '#64748b', fontWeight: '500' }}>#{b.id || index + 1}</td>
                  <td style={{ padding: '15px' }}>
                    <span 
                      onClick={() => isAdmin && handleApprove(b.id || b._id)}
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: '50px', 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        backgroundColor: '#fef9c3', 
                        color: '#854d0e',
                        cursor: isAdmin ? 'pointer' : 'default',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        border: '1px solid #fef08a',
                        transition: 'transform 0.15s'
                      }}
                      onMouseEnter={e => { if(isAdmin) e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={e => { if(isAdmin) e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <Clock size={12} /> Pending Approval
                    </span>
                  </td>
                  <td style={{ padding: '15px', color: '#475569' }}>{b.vendor_name || 'System Admin'}</td>
                  <td style={{ padding: '15px', fontWeight: '600', color: '#0f172a' }}>{b.customer_name}</td>
                  <td style={{ padding: '15px', color: '#0f172a', fontWeight: '500' }}><code>{b.share_code}</code></td>
                  <td style={{ padding: '15px', color: '#475569' }}>{b.total_shares}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#059669' }}>{b.total_amount}(₹)</td>
                  <td style={{ padding: '15px', color: '#64748b' }}>{new Date(b.booking_date || b.created_at).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleApprove(b.id || b._id)}
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: '#059669', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          fontSize: '12px', 
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingCartList;
