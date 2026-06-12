import React, { useState, useEffect } from 'react';
import { Briefcase, Pencil, Trash2, Plus, Eye, Save, Search, Building2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { departmentMasterService, UPLOADS_BASE_URL } from '../../services/api';
import { toast } from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import PremiumModal, { pmLabel, pmInput, CancelBtn, SaveBtn, DetailRow } from '../../components/common/PremiumModal';

const ACCENT = '#f59e0b';
const ACCENT_DARK = '#d97706';

const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
};

const DepartmentMaster = ({ viewMode = 'list' }) => {
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [formData, setFormData] = useState({ deptcode: '', deptname: '', deptdesclong: '', status: 1, company_id: '', location_id: '', dept_image: null });

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

  useEffect(() => { fetchDepartments(); }, []);

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
    if ((viewMode === 'form' || viewMode === 'view') && routeId && departments.length > 0) {
      const d = departments.find(x => x.id.toString() === routeId.toString());
      if (d) setFormData({ deptcode: d.deptcode || '', deptname: d.deptname, deptdesclong: d.deptdesclong || '', status: d.status, company_id: d.company_id || '', location_id: d.location_id || '', dept_image: null });
    }
  }, [viewMode, routeId, departments]);

  const fetchDepartments = async () => {
    try { const res = await departmentMasterService.list(); setDepartments(res.data.data || []); }
    catch (err) { console.error('Failed to load departments:', err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.keys(formData).forEach(k => { if (formData[k] !== null && formData[k] !== '') fd.append(k, formData[k]); });
      if (isEditing) { await departmentMasterService.update(editId, fd); toast.success('Department updated!'); }
      else { await departmentMasterService.create(fd); toast.success('Department created!'); }
      resetForm(); navigate('/departments-master');
    } catch (err) { toast.error('Error: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const deleteRecord = (id) => {
    triggerConfirm({
      title: 'Delete Department', message: 'Are you sure? This action is permanent.', confirmText: 'Delete', type: 'danger',
      onConfirm: async () => {
        try { await departmentMasterService.delete(id); fetchDepartments(); toast.success('Deleted!'); }
        catch (err) { toast.error('Delete failed.'); }
      }
    });
  };

  const resetForm = () => {
    setShowForm(false); setIsEditing(false); setEditId(null);
    setFormData({ deptcode: '', deptname: '', deptdesclong: '', status: 1, company_id: '', location_id: '', dept_image: null });
  };

  const fi = (f) => ({ ...pmInput(focusedField === f, ACCENT), onFocus: () => setFocusedField(f), onBlur: () => setFocusedField('') });

  const filtered = departments.filter(d => {
    const lower = searchTerm.toLowerCase();
    return (d.deptname || '').toLowerCase().includes(lower) || (d.deptcode || '').toLowerCase().includes(lower) || (d.deptdesclong || '').toLowerCase().includes(lower);
  });
  const paginated = filtered.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const viewDept = viewMode === 'view' ? departments.find(d => d.id.toString() === (routeId || '').toString()) : null;

  const activeCount = departments.filter(d => d.status === 1).length;

  return (
    <div className="flex flex-col gap-4">

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14 }}>
        {[
          { label: 'Total Depts', value: departments.length, color: '#6366f1' },
          { label: 'Active', value: activeCount, color: '#10b981' },
          { label: 'Inactive', value: departments.length - activeCount, color: '#f59e0b' },
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
            <div className="tbl-icon"><Briefcase size={20} /></div>
            <div>
              <h3 className="tbl-title">Departments Master</h3>
              <p className="tbl-subtitle">{departments.length} total — manage internal divisions</p>
            </div>
          </div>
          <div className="tbl-hero-right flex items-center gap-3">
            <div className="export-buttons">
              <button onClick={() => { const r = departments.map((d, i) => [i + 1, d.deptcode, d.deptname, d.deptdesclong || '', d.status === 1 ? 'Active' : 'Inactive'].join('\t')).join('\n'); navigator.clipboard.writeText('S.No\tCode\tName\tDescription\tStatus\n' + r).then(() => toast.success('Copied!')); }} className="export-btn">Copy</button>
              <button onClick={() => { const h = ['SNo.', 'CODE', 'DEPARTMENT NAME', 'DESCRIPTION', 'STATUS']; const r = departments.map((d, i) => [i + 1, d.deptcode, `"${d.deptname}"`, `"${d.deptdesclong || ''}"`, d.status === 1 ? 'Active' : 'Inactive'].join(',')); const c = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(h.join(',') + '\n' + r.join('\n')); const a = document.createElement('a'); a.href = c; a.download = 'departments.csv'; a.click(); }} className="export-btn">CSV</button>
            </div>
            <button onClick={() => navigate('/departments-master/add')} className="tbl-new-btn"><Plus size={16} /> Add Department</button>
          </div>
        </div>
        <div className="tbl-divider" />

        <div className="table-controls justify-end">
          <div className="search-box">
            <Search size={16} />
            <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Search departments..." />
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="dense-data-table">
            <thead>
              <tr className="tbl-head-row">
                <th style={{ width: 60 }} className="text-center">Image</th>
                <th style={{ width: 120 }}>Code</th>
                <th>Department Name</th>
                <th>Description</th>
                <th className="text-center" style={{ width: 110 }}>Status</th>
                <th className="text-right pr-6" style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">No departments found.</td></tr>
              ) : paginated.map(d => (
                <tr key={d.id}>
                  <td className="text-center">
                    {d.dept_image
                      ? <img src={`${UPLOADS_BASE_URL}/uploads/${d.dept_image}`} alt={d.deptname} className="w-10 h-10 object-cover rounded-full mx-auto" />
                      : <div className="w-9 h-9 rounded-full border border-amber-100 bg-amber-50 flex items-center justify-center mx-auto text-amber-700 text-[11px] font-black">{getInitials(d.deptname)}</div>
                    }
                  </td>
                  <td><code className="font-mono text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 border border-slate-200 rounded">{d.deptcode || '—'}</code></td>
                  <td className="font-bold text-slate-800">{d.deptname}</td>
                  <td className="text-slate-600">{d.deptdesclong || '—'}</td>
                  <td className="text-center"><span className={d.status === 1 ? 'badge-approved' : 'badge-vendor-approved'}>{d.status === 1 ? 'Active' : 'Inactive'}</span></td>
                  <td className="text-right pr-6">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => navigate(`/departments-master/view/${d.id}`)} className="btn-view"><Eye size={14} /></button>
                      <button onClick={() => navigate(`/departments-master/edit/${d.id}`)} className="btn-edit"><Pencil size={14} /></button>
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
        onClose={() => navigate('/departments-master')}
        title="Department Details"
        subtitle="Read-only department overview"
        headerIcon={<Eye size={18} color="#fff" />}
        accentColor={ACCENT} accentDark={ACCENT_DARK}
        maxWidth={520}
        footer={
          <>
            {viewDept && <button onClick={() => navigate(`/departments-master/edit/${viewDept.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', borderRadius: 12, background: `linear-gradient(135deg,${ACCENT_DARK},${ACCENT})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}><Pencil size={13} /> Edit Department</button>}
            <CancelBtn onClick={() => navigate('/departments-master')}>Close</CancelBtn>
          </>
        }
      >
        {!viewDept ? <p style={{ color: '#94a3b8' }}>Department not found.</p> : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', borderRadius: 16, border: '1px solid #fde68a', marginBottom: 20 }}>
              {viewDept.dept_image
                ? <img src={`${UPLOADS_BASE_URL}/uploads/${viewDept.dept_image}`} alt={viewDept.deptname} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 14, border: '2px solid #f59e0b' }} />
                : <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Briefcase size={22} color="#fff" /></div>
              }
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit,sans-serif' }}>{viewDept.deptname}</div>
                <div style={{ fontSize: 12, color: ACCENT_DARK, fontWeight: 700, marginTop: 2, fontFamily: 'monospace' }}>{viewDept.deptcode || 'No code assigned'}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className={viewDept.status === 1 ? 'badge-approved' : 'badge-vendor-approved'}>{viewDept.status === 1 ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DetailRow label="Department Code" value={viewDept.deptcode || 'N/A'} />
              <DetailRow label="Status" value={viewDept.status === 1 ? 'Active' : 'Inactive'} />
              <DetailRow label="Department Name" value={viewDept.deptname} span={true} />
              <DetailRow label="Description" value={viewDept.deptdesclong || 'N/A'} span={true} />
            </div>
          </div>
        )}
      </PremiumModal>

      {/* ── CREATE / EDIT Modal ── */}
      <PremiumModal
        open={showForm}
        onClose={() => navigate('/departments-master')}
        title={isEditing ? 'Edit Department' : 'Add New Department'}
        subtitle={isEditing ? 'Update department details below' : 'Configure a new department for your organisation'}
        headerIcon={isEditing ? <Pencil size={18} color="#fff" /> : <Plus size={18} color="#fff" />}
        accentColor={ACCENT} accentDark={ACCENT_DARK}
        maxWidth={560}
        footer={<><CancelBtn onClick={() => navigate('/departments-master')} /><SaveBtn form="dept-form" loading={saving} label={<><Save size={13} /> {isEditing ? 'Update Dept' : 'Save Dept'}</>} accent={ACCENT} accentDark={ACCENT_DARK} /></>}
      >
        <form id="dept-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={pmLabel}>Department Code</label>
              <input value={formData.deptcode} onChange={e => setFormData({ ...formData, deptcode: e.target.value })} placeholder="e.g. DEPT-QG (auto if empty)" style={fi('deptcode')} />
            </div>
            <div>
              <label style={pmLabel}>Department Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={formData.deptname} onChange={e => setFormData({ ...formData, deptname: e.target.value })} placeholder="e.g. Qurbani Goats" required style={fi('deptname')} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={pmLabel}>Detailed Description</label>
              <input value={formData.deptdesclong} onChange={e => setFormData({ ...formData, deptdesclong: e.target.value })} placeholder="e.g. Large sacrificial animal department" style={fi('deptdesclong')} />
            </div>
            <div>
              <label style={pmLabel}>Active Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: Number(e.target.value) })} style={{ ...pmInput(false, ACCENT), appearance: 'none', cursor: 'pointer' }} onFocus={() => setFocusedField('status')} onBlur={() => setFocusedField('')}>
                <option value={1}>✅ Active</option>
                <option value={0}>⭕ Inactive</option>
              </select>
            </div>
            <div>
              <label style={pmLabel}>Department Image</label>
              <div style={{ padding: '10px 14px', border: '1.5px dashed #e2e8f0', borderRadius: 12, background: '#fafafa' }}>
                <input type="file" accept="image/*" onChange={e => setFormData({ ...formData, dept_image: e.target.files[0] })} style={{ fontSize: 13, color: '#64748b', width: '100%', border: 'none', background: 'transparent', outline: 'none' }} />
              </div>
            </div>
          </div>
        </form>
      </PremiumModal>

      <ConfirmModal isOpen={confirmOpen} onCancel={() => setConfirmOpen(false)} {...confirmConfig} />
    </div>
  );
};

export default DepartmentMaster;
