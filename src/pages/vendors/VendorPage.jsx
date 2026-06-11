import React, { useState, useEffect } from 'react';
import { UserPlus, Pencil, Trash2, X, Plus, Eye, Users, ShieldCheck, PhoneCall, Globe, Save, Camera } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { vendorService, UPLOADS_BASE_URL } from '../../services/api';
import { toast } from '../../components/common/Toast';
import PageControlPanel from '../../components/common/PageControlPanel';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import TableSkeleton from '../../components/common/TableSkeleton';
import PremiumModal, { pmLabel, pmInput, CancelBtn, SaveBtn, DetailRow } from '../../components/common/PremiumModal';

const ACCENT = '#10b981';
const ACCENT_DARK = '#059669';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const InputField = ({ label, required, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
    <label style={pmLabel}>{label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}</label>
    {children}
    {error && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginTop: 5 }}>{error}</span>}
  </div>
);

const VendorManagement = ({ viewMode = 'list' }) => {
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [vendorData, setVendorData] = useState({ firstname: '', lastname: '', email: '', mobile: '', password: '', profile_image: null });
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', type: 'danger', onConfirm: () => {} });

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ provider: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [loading, setLoading] = useState(true);
  const [focusedField, setFocusedField] = useState('');

  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const triggerConfirm = (config) => {
    setConfirmConfig({ ...config, onConfirm: () => { config.onConfirm(); setConfirmOpen(false); } });
    setConfirmOpen(true);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await vendorService.list();
      setVendors(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

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
    if ((viewMode === 'form' || viewMode === 'view') && routeId && vendors.length > 0) {
      const v = vendors.find(x => x.id.toString() === routeId.toString());
      if (v) setVendorData({ firstname: v.firstname, lastname: v.lastname, email: v.email, mobile: v.mobile || '', password: '', profile_image: null });
    }
  }, [viewMode, routeId, vendors]);

  const validateForm = () => {
    const e = {};
    if (!vendorData.firstname.trim() || vendorData.firstname.length < 2) e.firstname = 'First Name must be at least 2 characters.';
    if (!vendorData.lastname.trim() || vendorData.lastname.length < 2) e.lastname = 'Last Name must be at least 2 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorData.email)) e.email = 'Please enter a valid email address.';
    if (!/^[0-9+() -]{10,20}$/.test(vendorData.mobile)) e.mobile = 'Please enter a valid mobile number (min 10 digits).';
    if (!isEditing && (!vendorData.password || vendorData.password.length < 6)) e.password = 'Password must be at least 6 characters.';
    else if (isEditing && vendorData.password && vendorData.password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateForm()) { toast.error('Please correct errors first.'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.keys(vendorData).forEach(k => { if (vendorData[k] !== null && vendorData[k] !== '') fd.append(k, vendorData[k]); });
      if (isEditing) { await vendorService.update(editId, fd); toast.success('Vendor Updated!'); }
      else { await vendorService.create(fd); toast.success('Vendor Created!'); }
      resetForm(); fetchVendors(); navigate('/vendors');
    } catch (err) { toast.error('Error: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const deleteVendor = (id) => {
    triggerConfirm({
      title: 'Delete Vendor', message: 'Are you sure you want to delete this vendor? This action is permanent.', confirmText: 'Delete', type: 'danger',
      onConfirm: async () => { try { await vendorService.delete(id); fetchVendors(); toast.success('Vendor deleted!'); } catch (err) { toast.error('Delete failed: ' + (err.response?.data?.message || err.message)); } }
    });
  };

  const resetForm = () => {
    setShowForm(false); setIsEditing(false); setEditId(null);
    setVendorData({ firstname: '', lastname: '', email: '', mobile: '', password: '', profile_image: null }); setErrors({});
  };

  const vendorStats = [
    { label: 'Total Vendors', value: vendors.length, icon: Users, color: '#6366f1', bg: '#eef2ff', border: 'rgba(99,102,241,0.15)' },
    { label: 'Active Accounts', value: vendors.length, icon: ShieldCheck, color: '#10b981', bg: '#ecfdf5', border: 'rgba(16,185,129,0.15)' },
    { label: 'Complete Profiles', value: vendors.filter(v => v.profile_image && v.mobile).length, icon: PhoneCall, color: '#3b82f6', bg: '#eff6ff', border: 'rgba(59,130,246,0.15)' },
    { label: 'Domains Linked', value: new Set(vendors.map(v => v.email?.split('@')[1]).filter(Boolean)).size, icon: Globe, color: '#f59e0b', bg: '#fffbeb', border: 'rgba(245,158,11,0.15)' },
  ];

  const getFilteredVendors = () => {
    let list = vendors.filter(v => {
      const lower = searchTerm.toLowerCase();
      const ms = (v.firstname || '').toLowerCase().includes(lower) || (v.lastname || '').toLowerCase().includes(lower) || (v.email || '').toLowerCase().includes(lower) || (v.mobile || '').toLowerCase().includes(lower) || String(v.id).includes(lower);
      const mp = !filters.provider || (v.email?.split('@')[1] || '').includes(filters.provider);
      return ms && mp;
    });
    if (sortConfig.key) {
      list.sort((a, b) => {
        let av = sortConfig.key === 'firstname' ? `${a.firstname} ${a.lastname}`.toLowerCase() : (a[sortConfig.key] || '');
        let bv = sortConfig.key === 'firstname' ? `${b.firstname} ${b.lastname}`.toLowerCase() : (b[sortConfig.key] || '');
        if (sortConfig.key === 'created_at') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
        if (av < bv) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (av > bv) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return list;
  };

  const filtered = getFilteredVendors();
  const paginated = filtered.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const viewVendor = viewMode === 'view' ? vendors.find(v => v.id.toString() === (routeId || '').toString()) : null;

  const fi = (f) => ({ ...pmInput(focusedField === f, ACCENT), onFocus: () => setFocusedField(f), onBlur: () => setFocusedField('') });

  return (
    <div className="flex flex-col gap-4">
      <PageControlPanel
        title="Vendor Directory" subtitle="Manage active vendor accounts and profile details" icon={Users} stats={vendorStats}
        searchTerm={searchTerm} onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
        filters={filters} onFilterChange={(f) => { setFilters(f); setCurrentPage(1); }}
        filterOptions={{ provider: [{ label: 'Gmail', value: 'gmail' }, { label: 'Charity Org', value: 'charity' }, { label: 'Others', value: '.' }] }}
        onAddClick={() => navigate('/vendors/add')} addLabel="New Vendor"
      />

      <div className="list-table-container">
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
              <button onClick={() => { const r = filtered.map((v, i) => [i + 1, v.id, `${v.firstname} ${v.lastname}`, v.email, v.mobile].join('\t')).join('\n'); navigator.clipboard.writeText('S.No\tVendor ID\tName\tEmail\tMobile\n' + r).then(() => toast.success('Copied!')).catch(() => toast.error('Failed.')); }} className="export-btn">Copy</button>
              <button onClick={() => { const h = ['SNo.', 'VENDOR ID', 'NAME', 'EMAIL', 'MOBILE']; const r = filtered.map((v, i) => [i + 1, v.id, `"${v.firstname} ${v.lastname}"`, v.email, v.mobile].join(',')); const c = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(h.join(',') + '\n' + r.join('\n')); const a = document.createElement('a'); a.href = c; a.download = 'vendors.csv'; a.click(); }} className="export-btn">CSV</button>
            </div>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="dense-data-table">
            <thead>
              <tr className="tbl-head-row">
                <th style={{ width: 60 }} className="text-center">Image</th>
                <th style={{ width: 100, cursor: 'pointer' }} onClick={() => handleSort('id')}>Vendor ID {sortConfig.key === 'id' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('firstname')}>Name {sortConfig.key === 'firstname' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('email')}>Email {sortConfig.key === 'email' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('mobile')}>Mobile</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')}>Created</th>
                <th className="text-right pr-6" style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton rows={5} cols={7} hasAvatar={true} /> : paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center gap-3"><div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border text-slate-300"><Users size={24} /></div><div><h4 className="font-bold text-sm text-slate-700">No Vendors Found</h4><p className="text-xs mt-1">Try adjusting filters or search.</p></div></div>
                </td></tr>
              ) : paginated.map(v => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="text-center py-3">
                    {v.profile_image
                      ? <img src={`${UPLOADS_BASE_URL}/uploads/${v.profile_image}`} alt={v.firstname} className="w-9 h-9 object-cover rounded-full mx-auto border border-slate-200/80" />
                      : <div className="w-9 h-9 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center mx-auto text-emerald-700 text-[11px] font-black">{getInitials(`${v.firstname} ${v.lastname}`)}</div>
                    }
                  </td>
                  <td className="py-3"><span className="bg-slate-100 text-slate-600 font-mono font-bold px-2.5 py-1 rounded-lg text-[11px] border border-slate-200">#{v.id}</span></td>
                  <td className="font-bold text-slate-800 py-3">{v.firstname} {v.lastname}</td>
                  <td className="text-slate-600 py-3 text-xs">{v.email}</td>
                  <td className="text-slate-600 py-3 text-xs">{v.mobile}</td>
                  <td className="text-slate-500 text-xs py-3">{v.created_at && !isNaN(new Date(v.created_at)) ? new Date(v.created_at).toLocaleDateString() : '-'}</td>
                  <td className="text-right pr-6 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => navigate(`/vendors/view/${v.id}`)} className="btn-view"><Eye size={13} /></button>
                      <button onClick={() => navigate(`/vendors/edit/${v.id}`)} className="btn-edit"><Pencil size={13} /></button>
                      <button onClick={() => deleteVendor(v.id)} className="btn-delete"><Trash2 size={13} /></button>
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
        onClose={() => navigate('/vendors')}
        title="Vendor Details"
        subtitle="Read-only profile overview"
        headerIcon={<Eye size={18} color="#fff" />}
        accentColor="#6366f1" accentDark="#4f46e5"
        maxWidth={540}
        footer={
          <>
            {viewVendor && <button onClick={() => navigate(`/vendors/edit/${viewVendor.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}><Pencil size={13} /> Edit Vendor</button>}
            <CancelBtn onClick={() => navigate('/vendors')}>Close</CancelBtn>
          </>
        }
      >
        {!viewVendor ? <p style={{ color: '#94a3b8' }}>Vendor not found.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', borderRadius: 16, border: '1px solid #d1fae5' }}>
              {viewVendor.profile_image
                ? <img src={`${UPLOADS_BASE_URL}/uploads/${viewVendor.profile_image}`} alt={viewVendor.firstname} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 16, border: '2px solid #10b981' }} />
                : <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800 }}>{getInitials(`${viewVendor.firstname} ${viewVendor.lastname}`)}</div>
              }
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit,sans-serif' }}>{viewVendor.firstname} {viewVendor.lastname}</div>
                <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600, marginTop: 2 }}>{viewVendor.email}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DetailRow label="Vendor ID" value={`#${viewVendor.id}`} />
              <DetailRow label="Mobile" value={viewVendor.mobile || 'N/A'} />
              <DetailRow label="First Name" value={viewVendor.firstname} />
              <DetailRow label="Last Name" value={viewVendor.lastname} />
              <DetailRow label="Created" value={viewVendor.created_at ? new Date(viewVendor.created_at).toLocaleDateString() : 'N/A'} span={true} />
            </div>
          </div>
        )}
      </PremiumModal>

      {/* ── CREATE / EDIT Modal ── */}
      <PremiumModal
        open={showForm}
        onClose={() => navigate('/vendors')}
        title={isEditing ? 'Update Vendor Profile' : 'Add New Vendor'}
        subtitle={isEditing ? 'Modify the vendor account details below' : 'Fill in details to create a vendor account'}
        headerIcon={isEditing ? <Pencil size={18} color="#fff" /> : <UserPlus size={18} color="#fff" />}
        accentColor={ACCENT} accentDark={ACCENT_DARK}
        maxWidth={620}
        footer={<><CancelBtn onClick={() => navigate('/vendors')} /><SaveBtn form="vendor-form" loading={saving} label={<><Save size={13} /> {isEditing ? 'Update Vendor' : 'Create Vendor'}</>} accent={ACCENT} accentDark={ACCENT_DARK} /></>}
      >
        <form id="vendor-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <InputField label="First Name" required error={errors.firstname}>
              <input value={vendorData.firstname} onChange={e => setVendorData({ ...vendorData, firstname: e.target.value })} placeholder="First Name" required style={{ ...fi('firstname'), borderColor: errors.firstname ? '#ef4444' : focusedField === 'firstname' ? ACCENT : '#e2e8f0' }} />
            </InputField>
            <InputField label="Last Name" required error={errors.lastname}>
              <input value={vendorData.lastname} onChange={e => setVendorData({ ...vendorData, lastname: e.target.value })} placeholder="Last Name" required style={{ ...fi('lastname'), borderColor: errors.lastname ? '#ef4444' : focusedField === 'lastname' ? ACCENT : '#e2e8f0' }} />
            </InputField>
            <InputField label="Email Address" required error={errors.email}>
              <input type="email" value={vendorData.email} onChange={e => setVendorData({ ...vendorData, email: e.target.value })} placeholder="name@company.com" required style={{ ...fi('email'), borderColor: errors.email ? '#ef4444' : focusedField === 'email' ? ACCENT : '#e2e8f0' }} />
            </InputField>
            <InputField label="Mobile Number" required error={errors.mobile}>
              <input value={vendorData.mobile} onChange={e => setVendorData({ ...vendorData, mobile: e.target.value })} placeholder="+91 98765 43210" required style={{ ...fi('mobile'), borderColor: errors.mobile ? '#ef4444' : focusedField === 'mobile' ? ACCENT : '#e2e8f0' }} />
            </InputField>
            <InputField label={isEditing ? 'Password (Optional)' : 'Password'} required={!isEditing} error={errors.password}>
              <input type="password" value={vendorData.password} onChange={e => setVendorData({ ...vendorData, password: e.target.value })} placeholder={isEditing ? 'Leave blank to keep current' : 'Min 6 characters'} required={!isEditing} style={{ ...fi('password'), borderColor: errors.password ? '#ef4444' : focusedField === 'password' ? ACCENT : '#e2e8f0' }} />
            </InputField>
            <InputField label="Profile Image">
              <div style={{ padding: '10px 14px', border: '1.5px dashed #d1d5db', borderRadius: 12, background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <Camera size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <input type="file" accept="image/*" onChange={e => setVendorData({ ...vendorData, profile_image: e.target.files[0] })} style={{ fontSize: 13, color: '#64748b', border: 'none', background: 'transparent', outline: 'none', width: '100%' }} />
              </div>
            </InputField>
          </div>
          {/* hidden submit trigger from footer */}
          <button type="submit" style={{ display: 'none' }} />
        </form>
      </PremiumModal>

      <ConfirmModal isOpen={confirmOpen} onCancel={() => setConfirmOpen(false)} {...confirmConfig} />
    </div>
  );
};

export default VendorManagement;
