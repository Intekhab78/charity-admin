import React, { useState, useEffect } from 'react';
import { Globe, CreditCard, CheckCircle, Search } from 'lucide-react';
import { bookingService } from '../services/api';

const OnlinePendingList = ({ user }) => {
  const isAdmin = user && user.role?.toLowerCase().includes('admin');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    if (window.confirm("Mark this online payment as cleared and fully verified?")) {
      try {
        await bookingService.approve(id);
        alert("Payment verified successfully!");
        fetchOnlineBookings();
      } catch (err) {
        alert("Verification failed: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const filtered = bookings.filter(b => 
    b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id?.toString().includes(searchTerm)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe style={{ color: '#059669' }} /> Online Debit Pending List ({bookings.length})
        </h2>
        <div style={{ position: 'relative', width: '280px' }}>
          <input 
            type="text" 
            placeholder="Search online bookings..." 
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
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading transactions...</div>
      ) : filtered.length === 0 ? (
        <div style={{ 
          padding: '50px 20px', 
          background: 'white', 
          borderRadius: '12px', 
          textAlign: 'center', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          color: '#64748b' 
        }}>
          <CreditCard size={40} style={{ color: '#059669', marginBottom: '15px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '5px' }}>No Pending Debit Cards</h3>
          <p style={{ fontSize: '14px' }}>All online card bookings are fully verified and settled!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '15px' }}>SNO.</th>
                <th style={{ padding: '15px' }}>CUSTOMER NAME</th>
                <th style={{ padding: '15px' }}>VENDOR</th>
                <th style={{ padding: '15px' }}>PAYMENT METHOD</th>
                <th style={{ padding: '15px' }}>AMOUNT</th>
                <th style={{ padding: '15px' }}>APPROVAL STATUS</th>
                {isAdmin && <th style={{ padding: '15px', textAlign: 'center' }}>ACTION</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, index) => (
                <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', color: '#64748b', fontWeight: '500' }}>#{b.id || index + 1}</td>
                  <td style={{ padding: '15px', fontWeight: '600', color: '#0f172a' }}>{b.customer_name}</td>
                  <td style={{ padding: '15px', color: '#475569' }}>{b.vendor_name || 'System Admin'}</td>
                  <td style={{ padding: '15px', color: '#0369a1', fontWeight: 'bold' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <CreditCard size={14} /> {b.payment_mode}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#059669' }}>{b.total_amount}(₹)</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '50px', 
                      fontSize: '11px', 
                      fontWeight: 'bold',
                      backgroundColor: b.is_approved_by_admin === 1 ? '#d1fae5' : '#fef9c3',
                      color: b.is_approved_by_admin === 1 ? '#065f46' : '#854d0e',
                      border: b.is_approved_by_admin === 1 ? '1px solid #a7f3d0' : '1px solid #fef08a'
                    }}>
                      {b.is_approved_by_admin === 1 ? 'Cleared' : 'Pending Clearance'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {b.is_approved_by_admin === 0 ? (
                        <button 
                          onClick={() => handleVerify(b.id || b._id)}
                          style={{ 
                            padding: '6px 12px', 
                            backgroundColor: '#0ea5e9', 
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
                          <CheckCircle size={14} /> Clear Payment
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>✓ Verified</span>
                      )}
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

export default OnlinePendingList;
