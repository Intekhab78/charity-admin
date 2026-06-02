import React, { useState, useEffect } from 'react';
import { Gift, TrendingUp, DollarSign, Percent, Info } from 'lucide-react';
import { bookingService } from '../services/api';

const QurbaniCollection = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getCollectionSummary();
      setSummaryData(res.data?.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading summary metrics...</div>;

  const summary = summaryData?.summary || [];
  const totalShares = summaryData?.totalShares || 0;
  const totalAmount = summaryData?.totalAmount || 0;
  const totalBookings = summaryData?.totalBookings || 0;

  // Function to calculate exact animals required
  const getAnimalRequirement = (code, shares) => {
    if (code.toLowerCase().includes('goat')) {
      return `${shares} Goat(s) required (1 share = 1 Goat)`;
    } else if (code.toLowerCase().includes('cow') || code.toLowerCase().includes('buffalo')) {
      const animals = Math.floor(shares / 7);
      const remainder = shares % 7;
      if (remainder === 0) {
        return `${animals} Animal(s) required (7 shares = 1 Animal)`;
      } else {
        return `${animals} Animal(s) required + ${remainder} extra share(s) booked (${7 - remainder} more shares needed to complete next animal)`;
      }
    }
    return `${shares} Share(s) booked`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Gift style={{ color: '#059669' }} /> Qurbani Collection & Operations
      </h2>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: 45, height: 45, borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#065f46', justifyContent: 'center' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Total Shares Booked</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{totalShares}</div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: 45, height: 45, borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#0369a1', justifyContent: 'center' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Total Collection Value</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>{totalAmount.toFixed(2)} (₹)</div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: 45, height: 45, borderRadius: '50%', backgroundColor: '#fef9c3', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#854d0e', justifyContent: 'center' }}>
            <Gift size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Total Invoices / Bookings</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{totalBookings}</div>
          </div>
        </div>
      </div>

      {/* Animal Breakdown Section */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '15px' }}>Animal Requirements Table</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '12px 15px' }}>SHARE CODE</th>
                <th style={{ padding: '12px 15px' }}>TOTAL SHARES</th>
                <th style={{ padding: '12px 15px' }}>TOTAL AMOUNT VALUE</th>
                <th style={{ padding: '12px 15px' }}>TOTAL INVOICES</th>
                <th style={{ padding: '12px 15px' }}>OPERATIONAL REQUIREMENT</th>
              </tr>
            </thead>
            <tbody>
              {summary.length > 0 ? summary.map((s, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#0f172a' }}><code>{s.share_code}</code></td>
                  <td style={{ padding: '15px', color: '#0f172a', fontWeight: '600' }}>{s.shares}</td>
                  <td style={{ padding: '15px', color: '#059669', fontWeight: 'bold' }}>{s.amount.toFixed(2)} (₹)</td>
                  <td style={{ padding: '15px', color: '#475569' }}>{s.bookings}</td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontSize: '13px', fontWeight: '500' }}>
                      <Info size={14} style={{ color: '#059669', flexShrink: 0 }} />
                      {getAnimalRequirement(s.share_code, s.shares)}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No active bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QurbaniCollection;
