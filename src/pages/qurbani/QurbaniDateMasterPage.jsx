import React, { useState, useEffect } from 'react';
import { CalendarDays, Pencil, Trash2, Plus, Eye, Save, Search, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { qurbaniDateService } from '../../services/api';
import { toast } from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import PremiumModal, { pmLabel, pmInput, CancelBtn, SaveBtn, DetailRow, pmSection } from '../../components/common/PremiumModal';

const ACCENT = '#6366f1';
const ACCENT_DARK = '#4f46e5';

const QurbaniDateMaster = ({ viewMode = 'list' }) => {
  const [dates, setDates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [formData, setFormData] = useState({ qurbani_date: '', actual_date: '', description: '', status: 1 });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', type: 'danger', onConfirm: () => {} });

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const triggerConfirm = (config) => {
    setConfirmConfig({ ...config, onConfirm: () => { config.onConfirm(); setConfirmOpen(false); } });
    setConfirmOpen(true);
  };

  useEffect(() => { fetchDates(); }, []);

  useEffect(() => {
    if (viewMode === 'form') {
      setShowForm(true);
      if (routeId) { setIsEditing(true); setEditId(routeId); }
      else { setIsEditing(false); setEditId(null); }
    } else {
      setShowForm(false); setIsEditing(false); setEditId(null);
    }
  }, [viewMode, routeId]);

  useEffect(() => {
    if ((viewMode === 'form' || viewMode === 'view') && routeId && dates.length > 0) {
      const d = dates.find(x => x.id.toString() === routeId.toString());
      if (d) setFormData({ qurbani_date: d.qurbani_date, actual_date: d.actual_date || '', description: d.description || '', status: d.status });
    }
  }, [viewMode, routeId, dates]);

  const fetchDates = async () => {
    try {
      const res = await qurbaniDateService.list();
      setDates(res.data.data || []);
    } catch (err) { console.error('Failed to load Qurbani dates:', err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) { await qurbaniDateService.update(editId, formData); toast.success('Qurbani Date updated!'); }
      else { await qurbaniDateService.create(formData); toast.success('Qurbani Date created!'); }
      resetForm(); navigate('/qurbani-dates');
    } catch (err) { toast.error('Error: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const deleteRecord = (id) => {
    triggerConfirm({
      title: 'Delete Qurbani Date', message: 'Are you sure? This action is permanent.', confirmText: 'Delete', type: 'danger',
      onConfirm: async () => {
        try { await qurbaniDateService.delete(id); fetchDates(); toast.success('Deleted!'); }
        catch (err) { toast.error('Delete failed: ' + (err.response?.data?.message || err.message)); }
      }
    });
  };

  const resetForm = () => {
    setShowForm(false); setIsEditing(false); setEditId(null);
    setFormData({ qurbani_date: '', actual_date: '', description: '', status: 1 });
  };

  const fi = (f) => ({ ...pmInput(focusedField === f, ACCENT), onFocus: () => setFocusedField(f), onBlur: () => setFocusedField('') });

  const filtered = dates.filter(d => {
    const lower = searchTerm.toLowerCase();
    return (d.qurbani_date || '').toLowerCase().includes(lower) || (d.description || '').toLowerCase().includes(lower) || String(d.id).includes(lower);
  });
  const paginated = filtered.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const viewDate = viewMode === 'view' ? dates.find(d => d.id.toString() === (routeId || '').toString()) : null;

  const activeCount = dates.filter(d => d.status === 1).length;

  return (
    <div className="flex flex-col gap-4">

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14 }}>
        {[
          { label: 'Total Dates', value: dates.length, color: '#6366f1' },
          { label: 'Active Dates', value: activeCount, color: '#10b981' },
          { label: 'Inactive', value: dates.length - activeCount, color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} className="premium-card p-4 flex items-center gap-3 bg-white" style={{ borderLeft: `4px solid ${c.color}` }}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{c.label}</span>
              <span className="text-xl font-black text-slate-900 font-outfit">{c.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* List Table */}
      <div className="list-table-container">
        <div className="tbl-hero">
          <div className="tbl-hero-left">
            <div className="tbl-icon"><CalendarDays size={20} /></div>
            <div>
              <h3 className="tbl-title">Qurbani Dates</h3>
              <p className="tbl-subtitle">{dates.length} total dates — configure available sacrifice dates</p>
            </div>
          </div>
          <div className="tbl-hero-right">
            <button onClick={() => navigate('/qurbani-dates/add')} className="tbl-new-btn"><Plus size={16} /> Add New Date</button>
          </div>
        </div>
        <div className="tbl-divider" />

        <div className="table-controls">
          <div className="table-controls-left">
            <div className="show-entries">
              <span>Show</span>
              <select value={entriesPerPage} onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>
            <div className="export-buttons">
              <button onClick={() => { const r = dates.map((d, i) => [i + 1, d.id, d.qurbani_date, d.actual_date || '', d.description || '', d.status === 1 ? 'Active' : 'Inactive'].join('\t')).join('\n'); navigator.clipboard.writeText('S.No\tID\tQurbani Date\tCalendar Date\tDescription\tStatus\n' + r).then(() => toast.success('Copied!')); }} className="export-btn">Copy</button>
              <button onClick={() => { const h = ['SNo.', 'ID', 'QURBANI DATE', 'CALENDAR DATE', 'DESCRIPTION', 'STATUS']; const r = dates.map((d, i) => [i + 1, d.id, `"${d.qurbani_date}"`, d.actual_date || '', `"${d.description || ''}"`, d.status === 1 ? 'Active' : 'Inactive'].join(',')); const c = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(h.join(',') + '\n' + r.join('\n')); const a = document.createElement('a'); a.href = c; a.download = 'qurbani_dates.csv'; a.click(); }} className="export-btn">CSV</button>
            </div>
          </div>
          <div className="search-box">
            <Search size={16} />
            <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Search dates..." />
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="dense-data-table">
            <thead>
              <tr className="tbl-head-row">
                <th style={{ width: 50 }} className="text-center">#</th>
                <th style={{ width: 80 }}>ID</th>
                <th>Qurbani Date / Day</th>
                <th>Calendar Date</th>
                <th>Description</th>
                <th className="text-center" style={{ width: 110 }}>Status</th>
                <th className="text-right pr-6" style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">No dates found.</td></tr>
              ) : paginated.map((d, idx) => (
                <tr key={d.id}>
                  <td className="text-center font-medium text-slate-400">{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                  <td className="font-mono text-xs font-bold text-slate-500">#{d.id}</td>
                  <td className="font-bold text-slate-800">{d.qurbani_date}</td>
                  <td className="font-semibold text-emerald-600">{d.actual_date ? new Date(d.actual_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                  <td className="text-slate-600">{d.description || '—'}</td>
                  <td className="text-center"><span className={d.status === 1 ? 'badge-approved' : 'badge-vendor-approved'}>{d.status === 1 ? 'Active' : 'Inactive'}</span></td>
                  <td className="text-right pr-6">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => navigate(`/qurbani-dates/view/${d.id}`)} className="btn-view"><Eye size={14} /></button>
                      <button onClick={() => navigate(`/qurbani-dates/edit/${d.id}`)} className="btn-edit"><Pencil size={14} /></button>
                      <button onClick={() => deleteRecord(d.id)} className="btn-delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length / entriesPerPage)} onPageChange={setCurrentPage} totalEntries={filtered.length} entriesPerPage={entriesPerPage} startIndex={(currentPage - 1) * entriesPerPage} />
        )}
      </div>

      {/* ── VIEW Modal ── */}
      <PremiumModal
        open={viewMode === 'view'}
        onClose={() => navigate('/qurbani-dates')}
        title="Qurbani Date Details"
        subtitle="Read-only record overview"
        headerIcon={<Eye size={18} color="#fff" />}
        accentColor={ACCENT} accentDark={ACCENT_DARK}
        maxWidth={520}
        footer={
          <>
            {viewDate && <button onClick={() => navigate(`/qurbani-dates/edit/${viewDate.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', borderRadius: 12, background: `linear-gradient(135deg,${ACCENT_DARK},${ACCENT})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}><Pencil size={13} /> Edit Record</button>}
            <CancelBtn onClick={() => navigate('/qurbani-dates')}>Close</CancelBtn>
          </>
        }
      >
        {!viewDate ? <p style={{ color: '#94a3b8' }}>Qurbani Date not found.</p> : (
          <div>
            {/* Hero badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', borderRadius: 16, border: '1px solid #c7d2fe', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit,sans-serif' }}>{viewDate.qurbani_date}</div>
                <div style={{ fontSize: 13, color: ACCENT, fontWeight: 600, marginTop: 2 }}>{viewDate.actual_date ? new Date(viewDate.actual_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'No calendar date set'}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                {viewDate.status === 1
                  ? <span className="badge-approved">Active</span>
                  : <span className="badge-vendor-approved">Inactive</span>
                }
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DetailRow label="Record ID" value={`#${viewDate.id}`} />
              <DetailRow label="Status" value={viewDate.status === 1 ? 'Active' : 'Inactive'} />
              <DetailRow label="Qurbani Day / Date" value={viewDate.qurbani_date} />
              <DetailRow label="Calendar Date" value={viewDate.actual_date ? new Date(viewDate.actual_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} />
              <DetailRow label="Description / Label" value={viewDate.description || 'N/A'} span={true} />
            </div>
          </div>
        )}
      </PremiumModal>

      {/* ── CREATE / EDIT Modal ── */}
      <PremiumModal
        open={showForm}
        onClose={() => navigate('/qurbani-dates')}
        title={isEditing ? 'Edit Qurbani Date' : 'Add New Qurbani Date'}
        subtitle={isEditing ? 'Update the sacrifice date record details' : 'Configure a new sacrifice date and schedule'}
        headerIcon={isEditing ? <Pencil size={18} color="#fff" /> : <Plus size={18} color="#fff" />}
        accentColor={ACCENT} accentDark={ACCENT_DARK}
        maxWidth={560}
        footer={<><CancelBtn onClick={() => navigate('/qurbani-dates')} /><SaveBtn form="qd-form" loading={saving} label={<><Save size={13} /> {isEditing ? 'Update Date' : 'Save Date'}</>} accent={ACCENT} accentDark={ACCENT_DARK} /></>}
      >
        <form id="qd-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={pmLabel}>Qurbani Date / Day Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={formData.qurbani_date} onChange={e => setFormData({ ...formData, qurbani_date: e.target.value })} placeholder="e.g. Eid Day 1, 10th Dhul Hijjah" required style={fi('qurbani_date')} />
            </div>
            <div>
              <label style={pmLabel}>Sacrifice Calendar Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" value={formData.actual_date} onChange={e => setFormData({ ...formData, actual_date: e.target.value })} required style={fi('actual_date')} />
            </div>
            <div>
              <label style={pmLabel}>Active Status</label>
              <div style={{ position: 'relative' }}>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: Number(e.target.value) })} style={{ ...pmInput(false, ACCENT), appearance: 'none', paddingRight: 36, cursor: 'pointer' }} onFocus={() => setFocusedField('status')} onBlur={() => setFocusedField('')}>
                  <option value={1}>✅ Active</option>
                  <option value={0}>⭕ Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={pmLabel}>Description / Label</label>
              <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. First Day of Eid Sacrifice" style={fi('description')} />
            </div>
          </div>
        </form>
      </PremiumModal>

      <ConfirmModal isOpen={confirmOpen} onCancel={() => setConfirmOpen(false)} {...confirmConfig} />
    </div>
  );
};

export default QurbaniDateMaster;
