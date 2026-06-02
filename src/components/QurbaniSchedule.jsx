import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, MapPin, Search, Users } from 'lucide-react';
import { bookingService, creationMasterService } from '../services/api';

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

const QurbaniSchedule = () => {
  const [bookings, setBookings] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activeLocation, setActiveLocation] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadSchedule();
  }, []);



  useEffect(() => {
    const handleLocationChange = (e) => {
      setActiveLocation(e.detail.location);
    };
    window.addEventListener('changeQurbaniLocation', handleLocationChange);
    return () => {
      window.removeEventListener('changeQurbaniLocation', handleLocationChange);
      window.dispatchEvent(new CustomEvent('qurbaniScheduleUpdated', { detail: null }));
    };
  }, []);

  const loadSchedule = async () => {
      const [bookingRes, batchRes] = await Promise.all([
        bookingService.list(),
        creationMasterService.batches.list()
      ]);
      setBookings(bookingRes.data?.data || []);
      setBatches(batchRes.data?.data || []);
  };

  const chunkRows = (rows, size = 7) => {
    const chunks = [];
    for (let index = 0; index < rows.length; index += size) {
      chunks.push(rows.slice(index, index + size));
    }
    return chunks;
  };

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
        if (share.qurbani_done) return;

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
          shareId: share._id,
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

  const locationSummary = useMemo(() => {
    const map = new Map();
    scheduleGroups.forEach(group => {
      const locationName = group.batch.location_name || '-';
      if (!map.has(locationName)) {
        map.set(locationName, { location: locationName, total: 0, batches: [] });
      }
      const item = map.get(locationName);
      item.total += group.rows.length;
      item.batches.push(group);
    });
    return [...map.values()];
  }, [scheduleGroups]);

  const visibleGroups = scheduleGroups.filter(group => {
    const locationMatches = activeLocation === 'all' || group.batch.location_name === activeLocation;
    const search = query.trim().toLowerCase();
    if (!locationMatches) return false;
    if (!search) return true;
    return [
      group.batch.batch_number,
      group.batch.location_name,
      group.batch.animal_name,
      ...group.rows.flatMap(row => [row.name, row.phone, row.reg, String(row.bookId)])
    ].filter(Boolean).some(value => String(value).toLowerCase().includes(search));
  });

  const totalShares = scheduleGroups.reduce((sum, group) => sum + group.rows.length, 0);
  const totalCapacity = batches.reduce((sum, batch) => sum + Number(batch.qty || 0), 0);

  useEffect(() => {
    const detail = {
      locationSummary,
      activeLocation,
      totalShares
    };
    const event = new CustomEvent('qurbaniScheduleUpdated', { detail });
    window.dispatchEvent(event);
  }, [locationSummary, activeLocation, totalShares]);

  const markGroupDone = async (rows) => {
    const shareIds = rows.map(row => row.shareId).filter(Boolean);
    if (shareIds.length === 0) return;

    if (!window.confirm(`Mark these ${rows.length} share person(s) as Qurbani done and send customer message?`)) {
      return;
    }

    try {
      await bookingService.markSharesQurbaniDone({ shareIds });
      await loadSchedule();
      alert(`Qurbani done. Message recorded for ${rows.length} share person(s).`);
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Failed to mark Qurbani done.');
    }
  };

  return (
    <div className="schedule-page">
      <div className="schedule-hero">
        <div>
          <span className="eyebrow">Qurbani Operations</span>
          <h2>Qurbani Schedule</h2>
          <p>Track booked shares by location, animal, and batch.</p>
        </div>
        <div className="schedule-stats">
          <div><strong>{totalShares}</strong><span>Booked Shares</span></div>
          <div><strong>{batches.length}</strong><span>Batches</span></div>
          <div><strong>{totalCapacity}</strong><span>Capacity</span></div>
        </div>
      </div>

      <div className="schedule-layout">


        <main className="schedule-main">
          <div className="schedule-toolbar">
            <div>
              <CalendarDays size={18} />
              <strong>Qurbani Schedule Details</strong>
            </div>
            <label><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search schedule..." /></label>
          </div>

          {visibleGroups.flatMap(group => chunkRows(group.rows).map((rows, chunkIndex) => ({ group, rows, chunkIndex }))).map(({ group, rows, chunkIndex }) => {
            const from = rows[0]?.bookId || '-';
            const to = rows[rows.length - 1]?.bookId || '-';
            const allDone = rows.length > 0 && rows.every(row => row.done);
            const isFull = rows.length === 7;
            return (
              <section className="batch-schedule" key={`${group.key}-${chunkIndex}`}>
                <div className="schedule-table-wrap">
                  <table className="schedule-table">
                    <thead>
                      <tr><th>S.No</th><th>BookId</th><th>Name</th><th>No</th><th>Reg</th><th>Date</th><th>Batch</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {rows.map(row => (
                        <tr key={`${row.bookId}-${row.reg}-${row.sno}`}>
                          <td>{row.sno}</td>
                          <td>{row.bookId}</td>
                          <td>{row.customerName}</td>
                          <td>{row.phone}</td>
                          <td>{row.reg}</td>
                          <td>{formatDate(row.date)}</td>
                          <td>{row.batch}</td>
                          <td><span className={row.done ? 'done-badge' : 'pending-badge'}>{row.done ? 'Done' : 'Pending'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="batch-head">
                  <div><span>From</span><strong>{from}</strong></div>
                  <div><span>To</span><strong>{to}</strong></div>
                  <div><span>BatchCode</span><strong>{group.batch.batch_number || '-'} / {chunkIndex + 1}</strong></div>
                  <div><span>Location</span><strong>{group.batch.location_name || '-'}</strong></div>
                  <div><span>Animal</span><strong>{group.batch.animal_name || '-'}</strong></div>
                  {isFull ? (
                    <button
                      className={`success-pill ${allDone ? 'done' : ''}`}
                      onClick={() => !allDone && markGroupDone(rows)}
                      disabled={allDone}
                      title={allDone ? 'Qurbani already done' : 'Mark Qurbani done and send customer message'}
                    >
                      <CheckCircle2 size={15} /> {rows.length} {allDone ? 'Done' : 'Success'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}>
                      {7 - rows.length} Slots Left
                    </div>
                  )}
                </div>
              </section>
            );
          })}

          {visibleGroups.length === 0 && (
            <div className="empty-schedule">
              <Users size={28} />
              <strong>No schedule records found.</strong>
              <span>Create bookings and batches to populate the schedule.</span>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .schedule-page { color: #0f172a; }
        .schedule-hero { background: #fff; border: 1px solid #d1fae5; border-radius: 14px; padding: 22px; display: flex; justify-content: space-between; gap: 18px; align-items: center; box-shadow: 0 16px 30px rgba(15,23,42,0.07); margin-bottom: 18px; }
        .eyebrow { color: #059669; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
        .schedule-hero h2 { margin: 4px 0; font-size: 26px; font-weight: 900; }
        .schedule-hero p { margin: 0; color: #64748b; }
        .schedule-stats { display: grid; grid-template-columns: repeat(3, minmax(110px, 1fr)); gap: 10px; }
        .schedule-stats div { background: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px; text-align: center; }
        .schedule-stats strong { display: block; font-size: 22px; color: #047857; }
        .schedule-stats span { font-size: 12px; color: #475569; font-weight: 700; }
        .schedule-layout { display: block; margin-top: 18px; }
        .schedule-side { display: none; }
        .schedule-main { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; box-shadow: 0 12px 24px rgba(15,23,42,0.05); }
        .schedule-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-bottom: 14px; }
        .schedule-toolbar div, .schedule-toolbar label { display: flex; align-items: center; gap: 8px; }
        .schedule-toolbar input { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; outline: none; min-width: 240px; }
        .batch-schedule { border: 1px solid #d1fae5; border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
        .batch-head { display: grid; grid-template-columns: repeat(5, 1fr) 150px; gap: 0; background: #fef9c3; border-bottom: 1px solid #fde68a; }
        .batch-head > div, .batch-head > button { padding: 11px; text-align: center; border-right: 1px solid rgba(180,83,9,.12); }
        .batch-head span { display: block; font-size: 11px; color: #64748b; font-weight: 800; }
        .batch-head strong { font-size: 13px; }
        .success-pill { background: #059669; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 900; }
        .success-pill:hover:not(:disabled) { background: #047857; }
        .success-pill.done { background: #16a34a; cursor: default; }
        .schedule-table-wrap { overflow-x: auto; }
        .schedule-table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 980px; }
        .schedule-table th { background: #0ea5e9; color: #fff; padding: 10px; text-align: center; }
        .schedule-table td { padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: center; }
        .schedule-table tr:nth-child(even) td { background: #f8fafc; }
        .done-badge, .pending-badge { display: inline-block; border-radius: 999px; padding: 3px 9px; font-size: 11px; font-weight: 800; }
        .done-badge { background: #dcfce7; color: #166534; }
        .pending-badge { background: #fef3c7; color: #92400e; }
        .empty-schedule { min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; gap: 8px; }
        @media (max-width: 1000px) { .schedule-hero, .schedule-toolbar { flex-direction: column; align-items: stretch; } .batch-head { grid-template-columns: repeat(2, 1fr); } .schedule-stats { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default QurbaniSchedule;
