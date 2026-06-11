import React, { useState, useEffect } from 'react';
import { Gift, TrendingUp, DollarSign, Percent, Info } from 'lucide-react';
import { bookingService } from '../../services/api';

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
    <div className="flex flex-col gap-6">
      <div className="premium-card p-6 flex justify-between gap-6 items-center flex-wrap">
        <div>
          <span className="eyebrow text-xs font-bold text-slate-400 uppercase tracking-wider">Qurbani Operations</span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Gift className="text-primary" size={24} /> Qurbani Collection & Operations
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Summary of booked shares, collections, and required animals.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Shares Booked', value: totalShares, icon: TrendingUp, color: '#10b981' },
          { label: 'Total Collection Value', value: `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: '#0ea5e9' },
          { label: 'Total Invoices / Bookings', value: totalBookings, icon: Gift, color: '#f59e0b' }
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} 
              className={`premium-card relative overflow-hidden p-5 flex items-center gap-4 group border border-slate-200/60 bg-white`}
              style={{
                borderLeft: `4px solid ${card.color}`
              }}
            >
              <div 
                className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-[0.03] group-hover:scale-125 transition-transform duration-500"
                style={{ backgroundColor: card.color }}
              />

              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{ 
                  backgroundColor: card.color + '15', 
                  color: card.color,
                  border: `1px solid ${card.color}25`
                }}
              >
                <Icon size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  {card.label}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-950 tracking-tight font-outfit">
                    {card.value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Animal Breakdown Section */}
      <div className="list-table-container">
        <div className="tbl-hero">
          <div className="tbl-hero-left">
            <div className="tbl-icon">
              <Gift size={20} />
            </div>
            <div>
              <h3 className="tbl-title">Animal Requirements Table</h3>
              <p className="tbl-subtitle">Operational breakdowns and complete animal targets</p>
            </div>
          </div>
        </div>

        <div className="tbl-divider"></div>

        <div className="data-table-wrapper">
          <table className="dense-data-table">
            <thead>
              <tr className="tbl-head-row">
                <th>Share Code</th>
                <th>Total Shares</th>
                <th>Total Amount Value</th>
                <th>Total Invoices</th>
                <th>Operational Requirement</th>
              </tr>
            </thead>
            <tbody>
              {summary.length > 0 ? summary.map((s, index) => (
                <tr key={index}>
                  <td><span className="reg-cell">{s.share_code}</span></td>
                  <td className="font-semibold text-slate-800">{s.shares}</td>
                  <td className="font-extrabold text-emerald-600">₹{Number(s.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="text-slate-500 font-medium">{s.bookings}</td>
                  <td>
                    <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                      <Info size={15} className="text-primary flex-shrink-0" />
                      {getAnimalRequirement(s.share_code, s.shares)}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400 font-medium">No active bookings found.</td>
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
