import React, { useEffect, useMemo, useState } from 'react';
import { X, Layers, Sparkles, MapPin, Tag, ShieldAlert, AlertCircle, Save, Plus, ChevronDown } from 'lucide-react';
import { creationMasterService } from '../../services/api';
import CreationMasterShell from './CreationMasterShell';
import CreationMasterTable from './CreationMasterTable';
import { batchColumns, batchInitial } from './creationMasterConfig';
import { toast } from '../../components/common/Toast';
import Pagination from '../../components/common/Pagination';

const BatchCreationMasterPage = () => {
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(batchInitial);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const loadLookups = async () => {
    try {
      const [animalRes, locationRes] = await Promise.all([
        creationMasterService.animals.list(),
        creationMasterService.locations.list()
      ]);
      setAnimals(animalRes.data?.data || []);
      setLocations(locationRes.data?.data || []);
    } catch (err) {
      toast.error('Failed to load animals or locations lookups.');
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await creationMasterService.batches.list();
      setRecords(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load batches records.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(batchInitial);
    setShowForm(false);
  };

  useEffect(() => {
    loadLookups();
    loadRecords();
    resetForm();
  }, []);

  const updateBatchAnimal = (animalId) => {
    const animal = animals.find(a => String(a.id) === String(animalId));
    setForm(prev => ({ ...prev, item_id: animalId, animal_name: animal?.item_name || '', animal_code: animal?.item_code || '' }));
  };

  const updateBatchLocation = (locationId) => {
    const location = locations.find(l => String(l.id) === String(locationId));
    setForm(prev => ({ ...prev, location_id: locationId, location_name: location?.locname || '', location_code: location?.loccode || '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await creationMasterService.batches.update(editingId, form);
        toast.success('Batch updated successfully.');
      } else {
        await creationMasterService.batches.create(form);
        toast.success('Batch created successfully.');
      }
      await loadRecords();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save batch.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setForm({ ...batchInitial, ...record });
    setShowForm(true);
  };

  const confirmDelete = async (id) => {
    try {
      await creationMasterService.batches.delete(id);
      toast.success('Batch deleted successfully.');
      setDeleteConfirmId(null);
      await loadRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete batch.');
    }
  };

  const dynamicStats = useMemo(() => {
    const totalBatches = records.length;
    const totalAnimals = records.reduce((sum, r) => sum + Number(r.qty || 0), 0);
    const uniqueLocations = new Set(records.map(r => r.location_name).filter(Boolean)).size;
    const avgRate = totalBatches ? Math.round(records.reduce((sum, r) => sum + Number(r.rate_inr || 0), 0) / totalBatches) : 0;
    const cards = [
      { label: 'Total Batches', value: totalBatches, icon: Layers, color: '#6366f1' },
      { label: 'Animals Quota', value: totalAnimals, icon: Sparkles, color: '#10b981' },
      { label: 'Active Locations', value: uniqueLocations, icon: MapPin, color: '#f59e0b' },
      { label: 'Avg Batch Rate', value: `₹${avgRate.toLocaleString('en-IN')}`, icon: Tag, color: '#8b5cf6' }
    ];
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
  }, [records]);

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return records;
    return records.filter(rec => Object.values(rec).some(v => String(v || '').toLowerCase().includes(search)));
  }, [records, searchTerm]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredRecords.slice(start, start + entriesPerPage);
  }, [filteredRecords, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / entriesPerPage) || 1;



  /* ─── Premium Modal Form ────────────────────────────────────────── */
  const formPanel = showForm && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(2,8,16,0.75)', backdropFilter: 'blur(8px)' }}>
      <div
        className="relative w-full mx-4 flex flex-col"
        style={{
          maxWidth: 680,
          maxHeight: '90vh',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #064e3b 100%)', padding: '22px 28px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          {/* Decorative orb */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: 100, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
                {editingId ? <Save size={18} color="#fff" /> : <Plus size={18} color="#fff" />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
                  {editingId ? 'Edit Batch' : 'Create New Batch'}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  Configure batch details, animal and location
                </p>
              </div>
            </div>
            <button onClick={resetForm} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Emerald accent bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #10b981, #6366f1, #059669)', flexShrink: 0 }} />

        {/* Form Body */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1 }}>

            {/* Section: Animal Info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #10b981, #059669)', borderRadius: 2 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Animal Details</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Animal <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={form.item_id || ''}
                      onChange={e => updateBatchAnimal(e.target.value)}
                      required
                      style={{ width: '100%', padding: '12px 40px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', appearance: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    >
                      <option value="">Select animal</option>
                      {animals.map(a => <option key={a.id} value={a.id}>{a.item_name}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Animal Code</label>
                  <input
                    value={form.animal_code || ''}
                    readOnly
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #f1f5f9', borderRadius: 12, fontSize: 14, color: '#64748b', background: '#f8fafc', fontFamily: 'Inter, sans-serif', cursor: 'not-allowed', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Batch Size (Qty)</label>
                  <input
                    type="number" value={form.qty || ''} onChange={e => setForm({ ...form, qty: e.target.value })}
                    placeholder="Enter batch size"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Batch Code</label>
                  <input
                    value={form.batch_number || ''} onChange={e => setForm({ ...form, batch_number: e.target.value })}
                    placeholder="Auto-generated if empty"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            </div>

            {/* Section: Location */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)', borderRadius: 2 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Location</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Location <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={form.location_id || ''}
                      onChange={e => updateBatchLocation(e.target.value)}
                      required
                      style={{ width: '100%', padding: '12px 40px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', appearance: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    >
                      <option value="">Select location</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.locname}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Location Code</label>
                  <input
                    value={form.location_code || ''}
                    readOnly
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #f1f5f9', borderRadius: 12, fontSize: 14, color: '#64748b', background: '#f8fafc', fontFamily: 'Inter, sans-serif', cursor: 'not-allowed', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>

            {/* Section: Rates */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #f59e0b, #d97706)', borderRadius: 2 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pricing Rates</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                {[
                  ['rate_inr', 'Rate INR', '₹'],
                  ['rate_inronline', 'Rate INR Online', '₹'],
                  ['rate_usd', 'Rate USD', '$'],
                ].map(([key, label, prefix]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>{prefix}</span>
                      <input
                        type="number" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
                        placeholder="0.00"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 28px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', background: '#fcfcfd', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
            <button type="button" onClick={resetForm}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: '1.5px solid #e2e8f0', borderRadius: 12, background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <X size={14} /> Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', border: 'none', borderRadius: 12, background: saving ? '#6ee7b7' : 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {saving ? (
                <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'cmSpin 0.6s linear infinite' }} /> Saving...</>
              ) : (
                <><Save size={14} /> {editingId ? 'Update Batch' : 'Create Batch'}</>
              )}
            </button>
          </div>
        </form>
        <style>{`@keyframes cmSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <>
      <CreationMasterShell
        title="Batch Master"
        recordCount={filteredRecords.length}
        addLabel="Add Batch"
        showForm={false}
        onAdd={() => setShowForm(true)}
        onHideForm={resetForm}
        tableName="addbatch"
        stats={dynamicStats}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        entriesPerPage={entriesPerPage}
        setEntriesPerPage={setEntriesPerPage}
        exportConfig={{
          filename: 'batches_master',
          title: 'Batch Master',
          columns: batchColumns.map(([dataKey, header]) => ({ header, dataKey })),
          data: filteredRecords.map(r => {
            const rowData = {};
            batchColumns.forEach(([k]) => {
              rowData[k] = r[k];
            });
            return rowData;
          })
        }}
        table={
          <>
            <CreationMasterTable columns={batchColumns} records={paginatedRecords} onEdit={startEdit} onDelete={id => setDeleteConfirmId(id)} />
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
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Delete Batch?</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>This batch and all its configurations will be permanently deleted. This action cannot be undone.</p>
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

export default BatchCreationMasterPage;
