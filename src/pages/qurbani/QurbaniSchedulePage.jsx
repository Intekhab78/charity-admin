import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, MapPin, Search, Users, Clock, Layers, Package, Sliders, X, CheckSquare } from 'lucide-react';
import { bookingService, creationMasterService } from '../../services/api';
import { toast } from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

const QurbaniSchedule = () => {
  const [bookings, setBookings] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activeLocation, setActiveLocation] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'done'
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadSchedule();
  }, []);

  useEffect(() => {
    const handleLocationChange = (e) => {
      setActiveLocation(e.detail.location || 'all');
    };
    window.addEventListener('changeQurbaniLocation', handleLocationChange);
    return () => {
      window.removeEventListener('changeQurbaniLocation', handleLocationChange);
      window.dispatchEvent(new CustomEvent('qurbaniScheduleUpdated', { detail: null }));
    };
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const [bookingRes, batchRes] = await Promise.all([
        bookingService.list(),
        creationMasterService.batches.list()
      ]);
      setBookings(bookingRes.data?.data || []);
      setBatches(batchRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      toast.error('Failed to load Qurbani schedule. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const chunkRows = (rows, size = 7) => {
    const chunks = [];
    for (let index = 0; index < rows.length; index += size) {
      chunks.push(rows.slice(index, index + size));
    }
    return chunks;
  };

  // Memoizing all matched Qurbani shares (including both done and undone records)
  const scheduleGroups = useMemo(() => {
    const fallbackBatch = batches[0] || {
      id: 'default',
      batch_number: '',
      location_name: '',
      location_code: '-',
      animal_name: '',
      animal_code: '-',
      qty: 0,
      rate_inr: 0
    };

    const groups = new Map();
    let serial = 1;

    bookings.forEach((booking) => {
      (booking.shares || []).forEach((share) => {
        const matchedBatch = batches.find(batch => {
          const objective = String(share.objective || '').toLowerCase();
          const animal = String(batch.animal_name || '').toLowerCase();
          return objective.includes(animal) || Number(share.amount) === Number(batch.rate_inr);
        }) || fallbackBatch;

        const key = matchedBatch.batch_number || matchedBatch.id || 'UNASSIGNED';
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            batch: matchedBatch,
            rows: []
          });
        }

        groups.get(key).rows.push({
          sno: serial,
          shareId: share._id || share.id,
          bookId: booking.id,
          customerName: booking.customer_name || '-',
          name: share.beneficiary_name || booking.customer_name || '-',
          phone: share.beneficiary_mobile || booking.customer_phone || '-',
          reg: share.share_reg_no || '-',
          date: booking.booking_date || booking.created_at,
          batch: matchedBatch.batch_number || '-',
          done: Boolean(share.qurbani_done),
          messageStatus: share.message_status || ''
        });
        serial += 1;
      });
    });

    return [...groups.values()];
  }, [bookings, batches]);

  // Derived stats from all matched groups
  const scheduleStats = useMemo(() => {
    let booked = 0;
    let pending = 0;
    let completed = 0;

    scheduleGroups.forEach(group => {
      group.rows.forEach(row => {
        booked++;
        if (row.done) completed++;
        else pending++;
      });
    });

    const capacity = batches.reduce((sum, b) => sum + Number(b.qty || 0), 0);

    return {
      booked,
      pending,
      completed,
      batches: batches.length,
      capacity
    };
  }, [scheduleGroups, batches]);

  // Summary per location based on matched shares
  const locationSummary = useMemo(() => {
    const map = new Map();
    scheduleGroups.forEach(group => {
      const locationName = group.batch.location_name || '-';
      if (!map.has(locationName)) {
        map.set(locationName, { location: locationName, total: 0, completed: 0, pending: 0, batches: [] });
      }
      const item = map.get(locationName);
      item.batches.push(group);
      group.rows.forEach(row => {
        item.total++;
        if (row.done) item.completed++;
        else item.pending++;
      });
    });
    return [...map.values()];
  }, [scheduleGroups]);

  // Sync state update event for other UI sections
  useEffect(() => {
    const detail = {
      locationSummary,
      activeLocation,
      totalShares: scheduleStats.booked
    };
    const event = new CustomEvent('qurbaniScheduleUpdated', { detail });
    window.dispatchEvent(event);
  }, [locationSummary, activeLocation, scheduleStats.booked]);

  // Filtering visible groups below
  const visibleGroups = useMemo(() => {
    return scheduleGroups.map(group => {
      // Filter rows inside this group by statusFilter
      const filteredRows = group.rows.filter(row => {
        if (statusFilter === 'pending') return !row.done;
        if (statusFilter === 'done') return row.done;
        return true;
      });

      return {
        ...group,
        rows: filteredRows
      };
    }).filter(group => {
      // Group must match locationFilter and search query
      const locationMatches = activeLocation === 'all' || group.batch.location_name === activeLocation;
      if (!locationMatches) return false;

      // Group must contain rows after status filter
      if (group.rows.length === 0) return false;

      const search = query.trim().toLowerCase();
      if (!search) return true;

      return [
        group.batch.batch_number,
        group.batch.location_name,
        group.batch.animal_name,
        ...group.rows.flatMap(row => [row.name, row.phone, row.reg, String(row.bookId)])
      ].filter(Boolean).some(value => String(value).toLowerCase().includes(search));
    });
  }, [scheduleGroups, activeLocation, statusFilter, query]);

  const markGroupDone = (rows) => {
    const shareIds = rows.map(row => row.shareId).filter(Boolean);
    if (shareIds.length === 0) return;

    triggerConfirm({
      title: 'Complete Qurbani Batch',
      message: `Mark these ${rows.length} share person(s) as Qurbani done and send customer message notifications?`,
      confirmText: 'Mark Done',
      type: 'success',
      onConfirm: async () => {
        try {
          await bookingService.markSharesQurbaniDone({ shareIds });
          await loadSchedule();
          toast.success(`Qurbani marked as done! Notifications recorded.`);
        } catch (error) {
          toast.error(error.response?.data?.message || error.message || 'Failed to mark Qurbani done.');
        }
      }
    });
  };



  const kpis = [
    {
      label: 'Booked Shares',
      value: scheduleStats.booked,
      icon: Users,
      color: '#6366f1',
      colorName: 'indigo',
      shadowColor: 'indigo',
      trend: 'Reset filters & show all',
      action: () => { setStatusFilter('all'); toast.success("Showing all Booked records"); }
    },
    {
      label: 'Completed Sacrifices',
      value: scheduleStats.completed,
      icon: CheckCircle2,
      color: '#10b981',
      colorName: 'emerald',
      shadowColor: 'emerald',
      trend: 'Show completed allocations',
      action: () => { setStatusFilter('done'); toast.success("Filtered by Completed status"); }
    },
    {
      label: 'Pending Sacrifices',
      value: scheduleStats.pending,
      icon: Clock,
      color: '#f59e0b',
      colorName: 'amber',
      shadowColor: 'amber',
      trend: 'Show pending allocations',
      action: () => { setStatusFilter('pending'); toast.success("Filtered by Pending status"); }
    },
    {
      label: 'Total Batches',
      value: scheduleStats.batches,
      icon: Layers,
      color: '#8b5cf6',
      colorName: 'purple',
      shadowColor: 'purple',
      trend: 'Matched batch allocations',
      action: null
    },
    {
      label: 'Animal Capacity',
      value: scheduleStats.capacity,
      icon: Package,
      color: '#64748b',
      colorName: 'slate',
      shadowColor: 'slate',
      trend: 'Available batch slots',
      action: null
    }
  ];

  // SVG Bar Chart Data
  const batchChartData = useMemo(() => {
    return batches.map(batch => {
      const group = scheduleGroups.find(g => g.key === (batch.batch_number || batch.id));
      const booked = group ? group.rows.length : 0;
      const capacity = Number(batch.qty || 0) * 7; // Assuming 7 shares per animal limit
      return {
        batchCode: batch.batch_number || 'B-N/A',
        booked,
        capacity: capacity || 7
      };
    }).slice(0, 5); // display top 5 batches
  }, [batches, scheduleGroups]);

  return (
    <div className="schedule-page flex flex-col gap-6 animate-fade-in">
      
      {/* Dynamic Header & Operational Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0f172a', letterSpacing: '-0.02em', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Qurbani Sacrificial Operations Console
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b', fontWeight: '500' }}>
            Live scheduling dispatch dashboard, batch capacities, and execution statistics.
          </p>
        </div>

        {/* Status filtering selector */}
        <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', gap: '2px' }}>
          {[
            { label: 'All Records', val: 'all' },
            { label: 'Pending Sacrifice', val: 'pending' },
            { label: 'Completed', val: 'done' }
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setStatusFilter(opt.val)}
              style={{
                padding: '6px 14px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: statusFilter === opt.val ? '#ffffff' : 'transparent',
                color: statusFilter === opt.val ? '#0f172a' : '#64748b',
                boxShadow: statusFilter === opt.val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} 
              className={`premium-card relative overflow-hidden p-4 flex items-center gap-4 group border border-slate-200/60 bg-white ${k.action ? 'cursor-pointer' : ''}`}
              onClick={k.action ? k.action : null}
              style={{
                borderLeft: `4px solid ${k.color}`
              }}
            >
              {/* Background decorative blob */}
              <div 
                className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-[0.03] group-hover:scale-125 transition-transform duration-500"
                style={{ backgroundColor: k.color }}
              />

              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{ 
                  backgroundColor: k.color + '15', 
                  color: k.color,
                  border: `1px solid ${k.color}25`
                }}
              >
                <Icon size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                    {k.label}
                  </span>
                  {k.action && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: k.color }} title="Click to filter locally" />}
                </div>
                
                <div className="flex items-baseline gap-2 mt-0.5">
                  {loading ? (
                    <div className="shimmer-loading" style={{ width: '60px', height: '20px', borderRadius: '6px', marginTop: '4px' }} />
                  ) : (
                    <span className="text-xl font-black text-slate-900 tracking-tight font-outfit">
                      {k.value}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#94a3b8', fontWeight: '650', marginTop: '6px' }}>
                  <Clock size={10} style={{ color: k.color }} />
                  <span>{k.trend}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row: Interactive Locations & Batch Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        
        {/* Interactive Location Summary Cards */}
        <div className="list-table-container glass-card" style={{ padding: '20px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <MapPin size={15} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: '850', fontSize: '14.5px', color: '#1e293b' }}>Interactive Locations</h4>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Click to filter batches</span>
              </div>
            </div>
            {activeLocation !== 'all' && (
              <button 
                onClick={() => { setActiveLocation('all'); toast.success("Location filter cleared"); }}
                style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '3px 8px', fontSize: '10.5px', color: '#ef4444', fontWeight: '750', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                Clear <X size={10} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {locationSummary.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94a3b8', padding: '10px 0' }}>No locations found.</div>
            ) : (
              locationSummary.map(loc => {
                const isSelected = activeLocation === loc.location;
                const progressPct = loc.total > 0 ? Math.round((loc.completed / loc.total) * 100) : 0;
                
                return (
                  <div key={loc.location}
                    onClick={() => {
                      setActiveLocation(loc.location);
                      toast.success(`Filtered schedule by: ${loc.location}`);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #10b981' : '1px solid #e2e8f0',
                      background: isSelected ? 'rgba(16, 185, 129, 0.04)' : '#ffffff',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#ffffff'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', color: '#334155' }}>
                      <span>{loc.location}</span>
                      <span>{loc.completed} Completed / {loc.total} Booked</span>
                    </div>
                    <div style={{ height: '5px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SVG Batch Capacity Fill Rate Chart */}
        <div className="list-table-container glass-card" style={{ padding: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
              <Layers size={15} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: '850', fontSize: '14.5px', color: '#1e293b' }}>Batch Fill Rates</h4>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Booked shares vs limit</span>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '130px', display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 400 130" width="100%" height="100%" style={{ overflow: 'visible' }}>
              {batchChartData.map((d, index) => {
                const y = 10 + index * 24;
                const barMaxWidth = 260;
                
                const bookedWidth = Math.min(barMaxWidth, (d.booked / d.capacity) * barMaxWidth) || 0;
                const capWidth = barMaxWidth;
                const isOver = d.booked > d.capacity;

                return (
                  <g key={d.batchCode}>
                    {/* Label */}
                    <text x="5" y={y + 11} fontSize="10.5" fontWeight="800" fill="#475569">
                      {d.batchCode}
                    </text>
                    
                    {/* Capacity background bar */}
                    <rect x="80" y={y} width={capWidth} height="13" rx="3.5" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.5" />
                    
                    {/* Booked fill bar */}
                    {bookedWidth > 0 && (
                      <rect 
                        x="80" 
                        y={y} 
                        width={bookedWidth} 
                        height="13" 
                        rx="3.5" 
                        fill={isOver ? '#ef4444' : 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'} 
                        style={{ fill: isOver ? '#ef4444' : '#8b5cf6' }}
                      />
                    )}

                    {/* Numeric Indicators */}
                    <text x="350" y={y + 11} fontSize="10.5" fontWeight="800" fill="#1e293b" textAnchor="end">
                      {d.booked} / {d.capacity}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

      </div>

      {/* Main Table List */}
      <main className="list-table-container">
        
        {/* Table Hero Header */}
        <div className="tbl-hero">
          <div className="tbl-hero-left">
            <div className="tbl-icon" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' }}>
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="tbl-title">Sacrificial Slots Dispatch</h3>
              <p className="tbl-subtitle">Active schedule rows matching current filters</p>
            </div>
          </div>
          <div className="tbl-hero-right">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Active Filter Indicators */}
              {(activeLocation !== 'all' || statusFilter !== 'all') && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {activeLocation !== 'all' && (
                    <span className="badge-approved" style={{ padding: '4px 10px', fontSize: '10.5px', textTransform: 'capitalize' }}>
                      Loc: {activeLocation}
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="badge-approved" style={{ padding: '4px 10px', fontSize: '10.5px', textTransform: 'capitalize', background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
                      Status: {statusFilter}
                    </span>
                  )}
                  <button 
                    onClick={() => {
                      setActiveLocation('all');
                      setStatusFilter('all');
                      toast.success("Reset schedule filters");
                    }}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '2px 8px', fontSize: '10.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="tbl-divider"></div>

        {/* Controls */}
        <div className="table-controls">
          <div className="table-controls-left">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-primary" />
              <span className="font-bold text-slate-800 text-sm">Schedule Groups ({visibleGroups.length} Batches)</span>
            </div>
          </div>
          <div className="search-box">
            <Search size={16} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, phone, reg code..." />
          </div>
        </div>

        <div className="p-6">
          {visibleGroups.flatMap(group => chunkRows(group.rows).map((rows, chunkIndex) => ({ group, rows, chunkIndex }))).map(({ group, rows, chunkIndex }) => {
            const from = rows[0]?.bookId || '-';
            const to = rows[rows.length - 1]?.bookId || '-';
            const allDone = rows.length > 0 && rows.every(row => row.done);
            const isFull = rows.length === 7;
            
            return (
              <section className="batch-schedule animate-slide-down" key={`${group.key}-${chunkIndex}`} style={{ border: '1px solid #cbd5e1' }}>
                <div className="data-table-wrapper">
                  <table className="dense-data-table">
                    <thead>
                      <tr className="tbl-head-row">
                        <th style={{ width: '80px' }} className="text-center">S.No</th>
                        <th>BookId</th>
                        <th>Customer Name</th>
                        <th>Phone No</th>
                        <th>Reg No</th>
                        <th>Booking Date</th>
                        <th>Batch</th>
                        <th className="text-center" style={{ width: '150px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(row => (
                        <tr key={`${row.bookId}-${row.reg}-${row.sno}`} style={{ background: row.done ? 'rgba(16, 185, 129, 0.02)' : 'transparent' }}>
                          <td className="text-center font-medium text-slate-400">{row.sno}</td>
                          <td className="font-mono text-xs font-bold text-slate-500">#{row.bookId}</td>
                          <td className="font-bold text-slate-800">{row.customerName}</td>
                          <td className="text-slate-600">{row.phone}</td>
                          <td><span className="reg-cell" style={{ border: row.done ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #e2e8f0', color: row.done ? '#059669' : '#475569', background: row.done ? 'rgba(16, 185, 129, 0.06)' : '#f1f5f9' }}>{row.reg}</span></td>
                          <td className="text-slate-500 text-xs">{formatDate(row.date)}</td>
                          <td><span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-xs border border-slate-200">{row.batch}</span></td>
                          <td className="text-center">
                            <span className={row.done ? 'badge-approved' : 'badge-vendor-approved'} style={{
                              background: row.done ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                              color: row.done ? '#059669' : '#b45309',
                              borderColor: row.done ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'
                            }}>
                              {row.done ? 'Done' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="batch-head">
                  <div><span>From BookId</span><strong>#{from}</strong></div>
                  <div><span>To BookId</span><strong>#{to}</strong></div>
                  <div><span>BatchCode</span><strong>{group.batch.batch_number || '-'} / {chunkIndex + 1}</strong></div>
                  <div><span>Location</span><strong>{group.batch.location_name || '-'}</strong></div>
                  <div><span>Animal</span><strong>{group.batch.animal_name || '-'}</strong></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '10px' }}>
                    <button
                      className={`success-pill ${allDone ? 'done' : ''}`}
                      onClick={() => !allDone && markGroupDone(rows)}
                      disabled={allDone}
                      style={{ 
                        width: '100%', 
                        height: '36px', 
                        borderRadius: '10px', 
                        padding: '0 12px',
                        background: allDone ? 'rgba(16, 185, 129, 0.1)' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        color: allDone ? '#059669' : '#ffffff',
                        border: allDone ? '1px solid rgba(16, 185, 129, 0.2)' : 'none'
                      }}
                      title={allDone ? 'Qurbani already done' : 'Mark Qurbani done and send customer message'}
                    >
                      {allDone ? <CheckSquare size={15} /> : <CheckCircle2 size={15} />} 
                      {allDone ? 'Done' : `Mark ${rows.length} Done`}
                    </button>
                    {!isFull && !allDone && (
                      <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold' }}>
                        {7 - rows.length} Slots Left
                      </span>
                    )}
                  </div>
                </div>
              </section>
            );
          })}

          {visibleGroups.length === 0 && (
            <div className="empty-schedule">
              <Users size={28} className="text-slate-300" />
              <strong className="text-slate-800">No schedule records found.</strong>
              <span>Create bookings and batches matching current filters to populate the schedule.</span>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .batch-schedule { border: 1px solid #cbd5e1; border-radius: 20px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02); }
        .batch-head { display: grid; grid-template-columns: repeat(5, 1fr) 180px; gap: 0; background: #f8fafc; border-top: 1px solid #cbd5e1; }
        .batch-head > div, .batch-head > button { padding: 14px; text-align: center; border-right: 1px solid #cbd5e1; display: flex; flexDirection: column; justifyContent: center; alignItems: center; }
        .batch-head > :last-child { border-right: none; }
        .batch-head span { display: block; font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .batch-head strong { font-size: 13.5px; color: #0f172a; font-weight: 800; }
        .success-pill { color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; font-size: 12.5px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(16,185,129,0.2); }
        .success-pill:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(16,185,129,0.3); }
        .success-pill.done { cursor: default; box-shadow: none; }
        .empty-schedule { min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; gap: 12px; }
        @media (max-width: 1000px) { .batch-head { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <ConfirmModal 
        isOpen={confirmOpen} 
        onCancel={() => setConfirmOpen(false)} 
        {...confirmConfig} 
      />
    </div>
  );
};

export default QurbaniSchedule;
