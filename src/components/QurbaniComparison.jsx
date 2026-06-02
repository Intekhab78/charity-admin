import React, { useState, useEffect } from 'react';
import { BarChart2, Calendar, TrendingUp } from 'lucide-react';
import { bookingService } from '../services/api';

const QurbaniComparison = () => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparison();
  }, []);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getComparisonSummary();
      setComparisonData(res.data?.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading comparison data...</div>;

  const days = comparisonData?.days || [];
  const years = comparisonData?.years || [];

  // Calculate total shares booked across all days to get percentages
  const totalDayShares = days.reduce((sum, d) => sum + d.shares, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BarChart2 style={{ color: '#059669' }} /> Qurbani Sales & Day Comparison
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
        {/* Day-Wise Breakdown Card */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} style={{ color: '#059669' }} /> Eid Day-Wise Breakdown
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {days.map((d, index) => {
              const percentage = ((d.shares / totalDayShares) * 100).toFixed(0);
              const color = index % 3 === 0 ? '#059669' : index % 3 === 1 ? '#0ea5e9' : '#eab308';
              
              return (
                <div key={d.day} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500' }}>
                    <span style={{ color: '#0f172a' }}>{d.day}</span>
                    <span style={{ color: '#64748b' }}>{d.shares} Share(s) ({percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historical Year-Wise Summary Card */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} style={{ color: '#059669' }} /> Historical Year-Wise Distribution
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>YEAR</th>
                  <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>SHARES</th>
                  <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>TOTAL REVENUE</th>
                  <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>INVOICES</th>
                </tr>
              </thead>
              <tbody>
                {years.map(y => (
                  <tr key={y.year} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', color: '#0f172a', fontWeight: 'bold' }}>{y.year}</td>
                    <td style={{ padding: '12px', color: '#475569', fontWeight: '600' }}>{y.shares}</td>
                    <td style={{ padding: '12px', color: '#059669', fontWeight: 'bold' }}>{y.amount.toFixed(2)} (₹)</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{y.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QurbaniComparison;
