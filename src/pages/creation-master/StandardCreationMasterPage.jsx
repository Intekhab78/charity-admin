import React, { useEffect, useMemo, useState } from 'react';
import { X, CheckSquare, Layers, Coins, Globe, MapPin, Tag, ShieldAlert, AlertCircle, Sparkles, Save, Plus, ChevronDown } from 'lucide-react';
import CreationMasterShell from './CreationMasterShell';
import CreationMasterTable from './CreationMasterTable';
import { toast } from '../../components/common/Toast';
import Pagination from '../../components/common/Pagination';

const StandardCreationMasterPage = ({ config }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(config.initial);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await config.service.list();
      setRecords(res.data?.data || []);
    } catch (err) {
      toast.error(`Failed to load ${config.title} records.`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(config.initial);
    setShowForm(false);
  };

  useEffect(() => {
    loadRecords();
    resetForm();
    setSearchTerm('');
    setCurrentPage(1);
  }, [config.tableName]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await config.service.update(editingId, form);
        toast.success('Record updated successfully.');
      } else {
        await config.service.create(form);
        toast.success('Record created successfully.');
      }
      await loadRecords();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setForm({ ...config.initial, ...record });
    setShowForm(true);
  };

  const confirmDelete = async (id) => {
    try {
      await config.service.delete(id);
      toast.success('Record deleted successfully.');
      setDeleteConfirmId(null);
      await loadRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete record.');
    }
  };

  // Dynamic Stats
  const dynamicStats = useMemo(() => {
    const total = records.length;
    const active = records.filter(r => Number(r.status) === 1).length;
    const inactive = total - active;
    let cards = [];

    if (config.tableName === 'animal') {
      const avgRate = total ? Math.round(records.reduce((s, r) => s + Number(r.itemprice || 0), 0) / total) : 0;
      cards = [
        { label: 'Total Animals', value: total, icon: Layers, color: '#6366f1' },
        { label: 'Active Species', value: active, icon: Sparkles, color: '#10b981' },
        { label: 'Inactive Species', value: inactive, icon: AlertCircle, color: '#f59e0b' },
        { label: 'Avg Rate INR', value: `₹${avgRate.toLocaleString('en-IN')}`, icon: Tag, color: '#8b5cf6' }
      ];
    } else if (config.tableName === 'location') {
      const uniqCurr = new Set(records.map(r => r.ccurrency).filter(Boolean)).size;
      cards = [
        { label: 'Total Locations', value: total, icon: MapPin, color: '#6366f1' },
        { label: 'Active Zones', value: active, icon: Sparkles, color: '#10b981' },
        { label: 'Inactive Zones', value: inactive, icon: AlertCircle, color: '#f59e0b' },
        { label: 'Local Currencies', value: uniqCurr, icon: Coins, color: '#8b5cf6' }
      ];
    } else if (config.tableName === 'currency') {
      const avgRate = total ? (records.reduce((s, r) => s + Number(r.rate_inr || 0), 0) / total).toFixed(2) : '0.00';
      cards = [
        { label: 'Total Currencies', value: total, icon: Coins, color: '#6366f1' },
        { label: 'Active Exchange', value: active, icon: Sparkles, color: '#10b981' },
        { label: 'Inactive Exchange', value: inactive, icon: AlertCircle, color: '#f59e0b' },
        { label: 'Avg Rate to INR', value: `₹${avgRate}`, icon: Globe, color: '#8b5cf6' }
      ];
    } else {
      cards = [
        { label: 'Total Records', value: total, icon: Layers, color: '#6366f1' },
        { label: 'Active', value: active, icon: Sparkles, color: '#10b981' },
        { label: 'Inactive', value: inactive, icon: AlertCircle, color: '#f59e0b' }
      ];
    }

    return (
      <>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="premium-card relative overflow-hidden p-4 flex items-center gap-4 group bg-white" style={{ borderLeft: `4px solid ${card.color}` }}>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-[0.03] group-hover:scale-125 transition-transform duration-500" style={{ backgroundColor: card.color }} />
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: card.color + '15', color: card.color, border: `1px solid ${card.color}25` }}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{card.label}</span>
                <span className="text-xl font-black text-slate-900 tracking-tight font-outfit">{card.value}</span>
              </div>
            </div>
          );
        })}
      </>
    );
  }, [records, config.tableName]);

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return records;
    return records.filter(rec =>
      Object.entries(rec).some(([key, val]) => {
        if (key === 'status') return (Number(val) === 1 ? 'active' : 'inactive').includes(search);
        return String(val || '').toLowerCase().includes(search);
      })
    );
  }, [records, searchTerm]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredRecords.slice(start, start + entriesPerPage);
  }, [filteredRecords, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / entriesPerPage) || 1;

  const handleExportCopy = () => {
    const headers = config.columns.map(([, l]) => l).join('\t');
    const rows = filteredRecords.map(r => config.columns.map(([k]) => k === 'status' ? (Number(r.status) === 1 ? 'Active' : 'Inactive') : r[k] ?? '').join('\t')).join('\n');
    navigator.clipboard.writeText(`${headers}\n${rows}`).then(() => toast.success('Copied!')).catch(() => toast.error('Failed to copy.'));
  };

  const handleExportCSV = () => {
    const headers = config.columns.map(([, l]) => `"${l}"`).join(',');
    const rows = filteredRecords.map(r => config.columns.map(([k]) => { const v = k === 'status' ? (Number(r.status) === 1 ? 'Active' : 'Inactive') : r[k] ?? ''; return `"${String(v).replace(/"/g, '""')}"` }).join(','));
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(headers + '\n' + rows.join('\n'));
    const a = document.createElement('a'); a.href = csv; a.download = `${config.tableName}_master.csv`; a.click();
    toast.success('Downloaded CSV.');
  };

  // Determine icon color per tableName for modal header
  const headerAccent = config.tableName === 'location' ? '#6366f1' : config.tableName === 'currency' ? '#f59e0b' : '#10b981';
  const headerAccentDark = config.tableName === 'location' ? '#4f46e5' : config.tableName === 'currency' ? '#d97706' : '#059669';

  /* ─── Premium Modal Form ─────────────────────────────────────────── */
  const formPanel = showForm && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(2,8,16,0.75)', backdropFilter: 'blur(8px)' }}>
      <div
        className="relative w-full mx-4 flex flex-col"
        style={{
          maxWidth: 580,
          maxHeight: '90vh',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(16,185,129,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
          overflow: 'hidden',
        }}
      >
        {/* Dark header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0c1a25 100%)', padding: '22px 28px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, ${headerAccent}33 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${headerAccent}, ${headerAccentDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${headerAccent}50` }}>
                {editingId ? <Save size={18} color="#fff" /> : <Plus size={18} color="#fff" />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
                  {editingId ? `Edit ${config.title}` : `Add ${config.title}`}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  Fill in the details below to {editingId ? 'update this' : 'create a new'} record
                </p>
              </div>
            </div>
            <button onClick={resetForm}
              style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${headerAccent}, ${headerAccentDark}, ${headerAccent})`, flexShrink: 0 }} />

        {/* Form Body */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {config.fields.map(([key, label, type]) => (
                <div key={key} style={{ gridColumn: (key.includes('description') || key.includes('locdesclong')) ? 'span 2' : 'span 1' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
                    {label} {(key.endsWith('name') || key.endsWith('code')) && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>

                  {type === 'select' ? (
                    <div style={{ position: 'relative' }}>
                      <select
                        value={form[key] ?? 1}
                        onChange={e => setForm({ ...form, [key]: Number(e.target.value) })}
                        style={{ width: '100%', padding: '12px 40px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', appearance: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = headerAccent; e.target.style.boxShadow = `0 0 0 4px ${headerAccent}18`; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      >
                        <option value={1}>✅ Active</option>
                        <option value={0}>⭕ Inactive</option>
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                    </div>
                  ) : (
                    <input
                      type={type}
                      value={form[key] ?? ''}
                      onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                      required={key.endsWith('name') || key.endsWith('code')}
                      placeholder={`Enter ${label.toLowerCase()}`}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = headerAccent; e.target.style.boxShadow = `0 0 0 4px ${headerAccent}18`; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', background: '#fcfcfd', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
            <button type="button" onClick={resetForm}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: '1.5px solid #e2e8f0', borderRadius: 12, background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <X size={14} /> Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', border: 'none', borderRadius: 12, background: saving ? '#a3e6c8' : `linear-gradient(135deg, ${headerAccentDark}, ${headerAccent})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: `0 4px 14px ${headerAccent}40`, transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {saving ? (
                <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'smSpin 0.6s linear infinite' }} /> Saving...</>
              ) : (
                <><Save size={14} /> {editingId ? 'Update Record' : 'Save Record'}</>
              )}
            </button>
          </div>
        </form>
        <style>{`@keyframes smSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <>
      <CreationMasterShell
        title={config.title}
        recordCount={filteredRecords.length}
        addLabel={config.addLabel}
        showForm={false}
        onAdd={() => setShowForm(true)}
        onHideForm={resetForm}
        tableName={config.tableName}
        stats={dynamicStats}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        entriesPerPage={entriesPerPage}
        setEntriesPerPage={setEntriesPerPage}
        onExportCSV={handleExportCSV}
        onExportCopy={handleExportCopy}
        table={
          <>
            <CreationMasterTable columns={config.columns} records={paginatedRecords} onEdit={startEdit} onDelete={id => setDeleteConfirmId(id)} />
            {filteredRecords.length > 0 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalEntries={filteredRecords.length} entriesPerPage={entriesPerPage} startIndex={(currentPage - 1) * entriesPerPage} />
            )}
          </>
        }
      />

      {/* Modal rendered at root level */}
      {formPanel}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,16,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 380, width: '90%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <ShieldAlert size={28} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Delete Record?</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>This {config.title} record will be permanently deleted. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, width: '100%' }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ flex: 1, padding: '11px 0', border: '1.5px solid #e2e8f0', borderRadius: 12, background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => confirmDelete(deleteConfirmId)} style={{ flex: 1, padding: '11px 0', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StandardCreationMasterPage;
