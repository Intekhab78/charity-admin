import React, { useState, useEffect } from 'react';
import { BarChart2, Calendar, TrendingUp } from 'lucide-react';
import { bookingService } from '../../services/api';

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
    <div className="flex flex-col gap-6">
      <div className="premium-card p-6 flex justify-between gap-6 items-center flex-wrap">
        <div>
          <span className="eyebrow text-xs font-bold text-slate-400 uppercase tracking-wider">Qurbani Operations</span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <BarChart2 className="text-primary" size={24} /> Qurbani Sales & Day Comparison
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Compare sales distribution day-wise and historical year-wise data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Day-Wise Breakdown Card */}
        <div className="premium-card p-6 flex flex-col gap-5">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar size={18} className="text-primary" /> Eid Day-Wise Breakdown
          </h3>
          
          <div className="flex flex-col gap-5">
            {days.map((d, index) => {
              const percentage = ((d.shares / totalDayShares) * 100).toFixed(0);
              const color = index % 3 === 0 ? '#10b981' : index % 3 === 1 ? '#0ea5e9' : '#f59e0b';
              
              return (
                <div key={d.day} className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{d.day}</span>
                    <span className="text-slate-400">{d.shares} Share(s) ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historical Year-Wise Summary Card */}
        <div className="list-table-container">
          <div className="tbl-hero !py-4 !px-6">
            <div className="tbl-hero-left !gap-3">
              <div className="tbl-icon !w-9 !h-9 !rounded-lg">
                <TrendingUp size={16} />
              </div>
              <div>
                <h3 className="tbl-title !text-sm">Historical Year-Wise Distribution</h3>
                <p className="tbl-subtitle !text-xs">Sales totals compared year-over-year</p>
              </div>
            </div>
          </div>

          <div className="tbl-divider"></div>

          <div className="data-table-wrapper">
            <table className="dense-data-table">
              <thead>
                <tr className="tbl-head-row">
                  <th style={{ padding: '10px 14px', fontSize: '10px' }}>Year</th>
                  <th style={{ padding: '10px 14px', fontSize: '10px' }}>Shares</th>
                  <th style={{ padding: '10px 14px', fontSize: '10px' }}>Total Revenue</th>
                  <th style={{ padding: '10px 14px', fontSize: '10px' }}>Invoices</th>
                </tr>
              </thead>
              <tbody>
                {years.map(y => (
                  <tr key={y.year}>
                    <td className="font-bold text-slate-800" style={{ padding: '12px 14px' }}>{y.year}</td>
                    <td className="font-semibold text-slate-700" style={{ padding: '12px 14px' }}>{y.shares}</td>
                    <td className="font-extrabold text-emerald-600" style={{ padding: '12px 14px' }}>₹{Number(y.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="text-slate-500 font-medium" style={{ padding: '12px 14px' }}>{y.bookings}</td>
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
