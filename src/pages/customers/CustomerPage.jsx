import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Pencil, Trash2, Phone, MapPin, Eye, Shield, Map, Compass, Save, Camera } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService, UPLOADS_BASE_URL } from '../../services/api';
import { toast } from '../../components/common/Toast';
import PageControlPanel from '../../components/common/PageControlPanel';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import TableSkeleton from '../../components/common/TableSkeleton';
import PremiumModal, { pmLabel, pmInput, CancelBtn, SaveBtn, DetailRow } from '../../components/common/PremiumModal';
import ExportButtons from '../../components/common/ExportButtons';

const ACCENT      = '#3b82f6';
const ACCENT_DARK = '#2563eb';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
};

const CustomerManagement = ({ user, viewMode = 'list' }) => {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [customerData, setCustomerData] = useState({ trn_name: '', customer_code: '', customer_phone: '', customer_email: '', customer_address_1: '', customer_city: '', profile_image: null });
  const [errors, setErrors] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', type: 'danger', onConfirm: () => {} });

  const isAdmin = user && user.role && user.role.toLowerCase().includes('admin');

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ city: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [loading, setLoading] = useState(true);

  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const triggerConfirm = (config) => {
    setConfirmConfig({ ...config, onConfirm: () => { config.onConfirm(); setConfirmOpen(false); } });
    setConfirmOpen(true);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try { setLoading(true); const res = await customerService.list(); setCustomers(res.data.data || []); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (viewMode === 'form') {
      setShowForm(true);
      if (routeId) { setIsEditing(true); setEditId(routeId); }
      else {
        setIsEditing(false); setEditId(null);
        let nextNum = 1000;
        if (customers.length > 0) {
          const codes = customers.map(c => c.customer_code).filter(code => code && (code.startsWith('CUST-') || code.startsWith('CUS-'))).map(code => parseInt(code.replace(/^CUST?-/, ''), 10)).filter(n => !isNaN(n));
          if (codes.length > 0) nextNum = Math.max(...codes) + 1;
        }
        setCustomerData(prev => ({ ...prev, customer_code: `CUST-${nextNum}` }));
      }
    } else { setShowForm(false); setIsEditing(false); setEditId(null); }
  }, [viewMode, routeId, customers]);

  useEffect(() => {
    if ((viewMode === 'form' || viewMode === 'view') && routeId && customers.length > 0) {
      const c = customers.find(x => (x._id || x.id).toString() === routeId.toString());
      if (c) setCustomerData({ trn_name: c.trn_name || '', customer_code: c.customer_code || '', customer_phone: c.customer_phone || '', customer_email: c.customer_email || '', customer_address_1: c.customer_address_1 || '', customer_city: c.customer_city || '', profile_image: null });
    }
  }, [customers, viewMode, routeId]);

  const validateForm = () => {
    const e = {};
    if (!customerData.trn_name.trim() || customerData.trn_name.length < 3) e.trn_name = 'Customer Name must be at least 3 characters.';
    if (!customerData.customer_code.trim()) e.customer_code = 'Customer Code is required.';
    if (!/^[0-9+() -]{10,20}$/.test(customerData.customer_phone)) e.customer_phone = 'Please enter a valid mobile number (min 10 digits).';
    if (customerData.customer_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.customer_email)) e.customer_email = 'Please enter a valid email address.';
    if (!customerData.customer_city.trim()) e.customer_city = 'City is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateForm()) { toast.error('Please correct errors first.'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.keys(customerData).forEach(k => { if (customerData[k] !== null && customerData[k] !== '') fd.append(k, customerData[k]); });
      if (user && user.id) fd.append('user_id', user.id);
      if (isEditing) { await customerService.update(editId, fd); toast.success('Customer Updated!'); }
      else { await customerService.create(fd); toast.success('Customer Created!'); }
      resetForm(); fetchCustomers(); navigate('/customers');
    } catch (err) { toast.error('Error: ' + (err.response?.data?.detail || err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const deleteCustomer = (id) => {
    triggerConfirm({
      title: 'Delete Customer', message: 'Are you sure? This action is permanent.', confirmText: 'Delete', type: 'danger',
      onConfirm: async () => {
        try { await customerService.delete(id); fetchCustomers(); toast.success('Customer deleted!'); }
        catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
      }
    });
  };

  const resetForm = () => {
    setShowForm(false); setIsEditing(false); setEditId(null);
    setCustomerData({ trn_name: '', customer_code: '', customer_phone: '', customer_email: '', customer_address_1: '', customer_city: '', profile_image: null }); setErrors({});
  };

  const uniqueCities     = new Set(customers.map(c => c.customer_city).filter(Boolean)).size;
  const activeContacts   = customers.filter(c => c.customer_phone).length;
  const completeProfiles = customers.filter(c => c.customer_email && c.profile_image).length;

  const customerStats = [
    { label: 'Total Customers',   value: customers.length, icon: Users,   color: '#6366f1', bg: '#eef2ff', border: 'rgba(99,102,241,0.15)' },
    { label: 'Unique Cities',     value: uniqueCities,     icon: Map,     color: '#10b981', bg: '#ecfdf5', border: 'rgba(16,185,129,0.15)' },
    { label: 'Active Contacts',   value: activeContacts,   icon: Compass, color: '#3b82f6', bg: '#eff6ff', border: 'rgba(59,130,246,0.15)' },
    { label: 'Complete Profiles', value: completeProfiles, icon: Shield,  color: '#f59e0b', bg: '#fffbeb', border: 'rgba(245,158,11,0.15)' },
  ];

  const cityOptions = Array.from(new Set(customers.map(c => c.customer_city).filter(Boolean))).map(city => ({ label: city, value: city }));

  const getFilteredCustomers = () => {
    let list = customers.filter(c => {
      const lower = searchTerm.toLowerCase();
      const ms = (c.trn_name || '').toLowerCase().includes(lower) || (c.customer_phone || '').toLowerCase().includes(lower) || (c.customer_email || '').toLowerCase().includes(lower) || (c.customer_city || '').toLowerCase().includes(lower) || (c.customer_code || '').toLowerCase().includes(lower);
      return ms && (!filters.city || c.customer_city === filters.city);
    });
    if (sortConfig.key) {
      list.sort((a, b) => {
        let av = (a[sortConfig.key] || '').toString().toLowerCase();
        let bv = (b[sortConfig.key] || '').toString().toLowerCase();
        if (av < bv) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (av > bv) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return list;
  };

  const filtered  = getFilteredCustomers();
  const paginated = filtered.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const viewCust  = viewMode === 'view' ? customers.find(c => (c._id || c.id).toString() === (routeId || '').toString()) : null;

  const fi = (f, hasError = false) => ({
    ...pmInput(focusedField === f, ACCENT),
    borderColor: hasError ? '#ef4444' : focusedField === f ? ACCENT : '#e2e8f0',
    onFocus: () => setFocusedField(f),
    onBlur:  () => setFocusedField(''),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageControlPanel
        title="Customer Database" subtitle="View details, search, and manage profiles" icon={Users}
        stats={customerStats} searchTerm={searchTerm}
        onSearchChange={val => { setSearchTerm(val); setCurrentPage(1); }}
        filters={filters} onFilterChange={f => { setFilters(f); setCurrentPage(1); }}
        filterOptions={{ city: cityOptions }}
        onAddClick={() => navigate('/customers/add')} addLabel="New Customer"
        extraActions={
          <ExportButtons 
            filename="customers_database" 
            title="Customers" 
            columns={[
              { header: 'SNo.', dataKey: 'sno' },
              { header: 'CODE', dataKey: 'code' },
              { header: 'CUSTOMER NAME', dataKey: 'name' },
              { header: 'PHONE', dataKey: 'phone' },
              { header: 'EMAIL', dataKey: 'email' },
              { header: 'CITY', dataKey: 'city' }
            ]}
            data={customers.map((c, i) => ({
              sno: i + 1,
              code: c.customer_code,
              name: c.trn_name,
              phone: c.customer_phone,
              email: c.customer_email || '',
              city: c.customer_city || ''
            }))}
          />
        }
      />

      <div className="list-table-container">

        <div className="data-table-wrapper">
          <table className="dense-data-table">
            <thead>
              <tr className="tbl-head-row">
                <th style={{ width: 60 }} className="text-center">Image</th>
                <th style={{ width: 120, cursor: 'pointer' }} onClick={() => handleSort('customer_code')}>Code {sortConfig.key === 'customer_code' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('trn_name')}>Customer Name {sortConfig.key === 'trn_name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customer_phone')}>Contact {sortConfig.key === 'customer_phone' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customer_email')}>Email {sortConfig.key === 'customer_email' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customer_city')}>Location {sortConfig.key === 'customer_city' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</th>
                <th className="text-right pr-6" style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton rows={5} cols={7} hasAvatar={true} /> : paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center gap-3"><div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border text-slate-300"><Users size={24} /></div><div><h4 className="font-bold text-sm text-slate-700">No Customers Found</h4><p className="text-xs mt-1">Try adjusting filters or search.</p></div></div>
                </td></tr>
              ) : paginated.map(c => (
                <tr key={c.id || c._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="text-center py-3">
                    {c.profile_image
                      ? <img src={`${UPLOADS_BASE_URL}/uploads/${c.profile_image}`} alt={c.trn_name} className="w-9 h-9 object-cover rounded-full mx-auto border border-slate-200/80" />
                      : <div className="w-9 h-9 bg-blue-50 rounded-full border border-blue-100 flex items-center justify-center mx-auto text-blue-700 text-[11px] font-black">{getInitials(c.trn_name)}</div>
                    }
                  </td>
                  <td className="py-3"><span className="bg-slate-100 text-slate-600 font-mono font-bold px-2.5 py-1 rounded-lg text-[11px] border border-slate-200">{c.customer_code}</span></td>
                  <td className="font-bold text-slate-800 py-3">{c.trn_name}</td>
                  <td className="py-3"><div className="flex items-center gap-1.5 text-xs text-slate-600"><Phone size={13} className="text-slate-400" /> {c.customer_phone}</div></td>
                  <td className="text-slate-600 py-3 text-xs">{c.customer_email || 'N/A'}</td>
                  <td className="py-3"><div className="flex items-center gap-1.5 text-xs text-slate-600"><MapPin size={13} className="text-slate-400" /> {c.customer_city || 'N/A'}</div></td>
                  <td className="text-right pr-6 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => navigate(`/customers/view/${c._id || c.id}`)} className="btn-view"><Eye size={13} /></button>
                      <button onClick={() => navigate(`/customers/edit/${c._id || c.id}`)} className="btn-edit"><Pencil size={13} /></button>
                      {isAdmin && <button onClick={() => deleteCustomer(c.id)} className="btn-delete"><Trash2 size={13} /></button>}
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
        onClose={() => navigate('/customers')}
        title="Customer Details"
        subtitle="Read-only profile overview"
        headerIcon={<Eye size={18} color="#fff" />}
        accentColor={ACCENT} accentDark={ACCENT_DARK}
        maxWidth={560}
        footer={
          <>
            {viewCust && <button onClick={() => navigate(`/customers/edit/${viewCust._id || viewCust.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', borderRadius: 12, background: `linear-gradient(135deg,${ACCENT_DARK},${ACCENT})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}><Pencil size={13} /> Edit Customer</button>}
            <CancelBtn onClick={() => navigate('/customers')}>Close</CancelBtn>
          </>
        }
      >
        {!viewCust ? <p style={{ color: '#94a3b8' }}>Customer not found.</p> : (
          <div>
            {/* Avatar hero */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 16, border: '1px solid #bfdbfe', marginBottom: 20 }}>
              {viewCust.profile_image
                ? <img src={`${UPLOADS_BASE_URL}/uploads/${viewCust.profile_image}`} alt={viewCust.trn_name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 16, border: `2px solid ${ACCENT}` }} />
                : <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800 }}>{getInitials(viewCust.trn_name)}</div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit,sans-serif' }}>{viewCust.trn_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <code style={{ fontSize: 12, fontFamily: 'monospace', color: ACCENT_DARK, fontWeight: 700, background: '#dbeafe', padding: '2px 8px', borderRadius: 6 }}>{viewCust.customer_code}</code>
                  {viewCust.customer_city && <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {viewCust.customer_city}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DetailRow label="Customer Code" value={viewCust.customer_code} />
              <DetailRow label="City" value={viewCust.customer_city || 'N/A'} />
              <DetailRow label="Phone Number" value={viewCust.customer_phone} />
              <DetailRow label="Email Address" value={viewCust.customer_email || 'N/A'} />
              <DetailRow label="Full Name" value={viewCust.trn_name} span={true} />
              <DetailRow label="Address" value={viewCust.customer_address_1 || 'N/A'} span={true} />
            </div>
          </div>
        )}
      </PremiumModal>

      {/* ── CREATE / EDIT Modal ── */}
      <PremiumModal
        open={showForm}
        onClose={() => navigate('/customers')}
        title={isEditing ? 'Update Customer Profile' : 'Add New Customer'}
        subtitle={isEditing ? 'Modify the customer details below' : 'Fill in details to register a new customer'}
        headerIcon={isEditing ? <Pencil size={18} color="#fff" /> : <UserPlus size={18} color="#fff" />}
        accentColor={ACCENT} accentDark={ACCENT_DARK}
        maxWidth={660}
        footer={<><CancelBtn onClick={() => navigate('/customers')} /><SaveBtn form="customer-form" loading={saving} label={<><Save size={13} /> {isEditing ? 'Update Customer' : 'Create Customer'}</>} accent={ACCENT} accentDark={ACCENT_DARK} /></>}
      >
        <form id="customer-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Customer Code', key: 'customer_code', placeholder: 'Auto-generated', type: 'text', req: true, err: errors.customer_code },
              { label: 'Customer Name', key: 'trn_name', placeholder: 'Customer / Company Name', type: 'text', req: true, err: errors.trn_name },
              { label: 'Phone Number', key: 'customer_phone', placeholder: '+91 98765 43210', type: 'text', req: true, err: errors.customer_phone },
              { label: 'Email Address', key: 'customer_email', placeholder: 'name@email.com (Optional)', type: 'email', req: false, err: errors.customer_email },
              { label: 'City', key: 'customer_city', placeholder: 'City / Town', type: 'text', req: true, err: errors.customer_city },
              { label: 'Full Address', key: 'customer_address_1', placeholder: 'Street / Area / Locality', type: 'text', req: false, err: null },
            ].map(f => (
              <div key={f.key}>
                <label style={pmLabel}>{f.label}{f.req && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}</label>
                <input type={f.type} placeholder={f.placeholder} value={customerData[f.key] || ''}
                  onChange={e => { setCustomerData({ ...customerData, [f.key]: e.target.value }); if (errors[f.key]) setErrors(p => ({ ...p, [f.key]: null })); }}
                  style={fi(f.key, !!f.err)}
                />
                {f.err && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginTop: 4, display: 'block' }}>{f.err}</span>}
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={pmLabel}>Profile Image</label>
              <div style={{ padding: '10px 14px', border: '1.5px dashed #d1d5db', borderRadius: 12, background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Camera size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <input type="file" accept="image/*" onChange={e => setCustomerData({ ...customerData, profile_image: e.target.files[0] })} style={{ fontSize: 13, color: '#64748b', border: 'none', background: 'transparent', outline: 'none', width: '100%' }} />
              </div>
            </div>
          </div>
        </form>
      </PremiumModal>

      <ConfirmModal isOpen={confirmOpen} onCancel={() => setConfirmOpen(false)} {...confirmConfig} />
    </div>
  );
};

export default CustomerManagement;
