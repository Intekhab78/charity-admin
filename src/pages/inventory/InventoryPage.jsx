import React, { useEffect, useState } from 'react';
import { itemService, UPLOADS_BASE_URL } from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit3, Trash2, Save, Package, Eye, Coins, Tag, BarChart3, Camera, ShieldAlert } from 'lucide-react';
import { toast } from '../../components/common/Toast';
import PageControlPanel from '../../components/common/PageControlPanel';
import Pagination from '../../components/common/Pagination';
import TableSkeleton from '../../components/common/TableSkeleton';
import PremiumModal, { pmLabel, pmInput, CancelBtn, SaveBtn, DetailRow } from '../../components/common/PremiumModal';

const DEFAULT_COMPANY_ID = import.meta.env.VITE_DEFAULT_COMPANY_ID || '';

const emptyForm = { item_code: '', item_name: '', item_description: '', itemprice: '', item_image: null };

const ACCENT  = '#10b981';
const ACCENT_DARK = '#059669';

const InventoryTable = ({ user, viewMode = 'list' }) => {
  const isAdmin = user && user.role?.toLowerCase().includes('admin');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ priceRange: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });

  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (viewMode === 'form') {
      setShowForm(true); setErrors({});
      if (routeId) { setEditingId(routeId); }
      else {
        setEditingId(null);
        const code = `ITM-${Math.floor(100000 + Math.random() * 900000)}`;
        setFormData(prev => ({ ...emptyForm, item_code: prev.item_code || code }));
      }
    } else { setShowForm(false); setEditingId(null); setErrors({}); }
  }, [viewMode, routeId]);

  useEffect(() => {
    if ((viewMode === 'form' || viewMode === 'view') && routeId && items.length > 0) {
      const item = items.find(i => i.id.toString() === routeId.toString());
      if (item) setFormData({ item_code: item.item_code || '', item_name: item.item_name || '', item_description: item.item_description || '', itemprice: item.itemprice || '', item_image: null });
    }
  }, [viewMode, routeId, items]);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await itemService.getCharityItems(DEFAULT_COMPANY_ID); setItems(res.data.data || []); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const validateForm = () => {
    const e = {};
    if (!formData.item_code?.trim()) e.item_code = 'Item Code is required.';
    if (!formData.item_name?.trim() || formData.item_name.trim().length < 3) e.item_name = 'Item Name must be at least 3 characters.';
    const price = parseFloat(formData.itemprice);
    if (isNaN(price) || price <= 0) e.itemprice = 'Price must be a positive number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateForm()) { toast.error('Please correct inline validation errors first.'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.keys(formData).forEach(k => { if (formData[k] !== null && formData[k] !== '') fd.append(k, formData[k]); });
      if (!editingId && DEFAULT_COMPANY_ID) fd.append('company_id', DEFAULT_COMPANY_ID);
      if (editingId) await itemService.update(editingId, fd);
      else await itemService.create(fd);
      setShowForm(false); setFormData(emptyForm); setEditingId(null); setErrors({});
      fetchData(); navigate('/inventory');
    } catch (err) { toast.error('Error saving item: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await itemService.delete(id); setDeleteConfirmId(null); fetchData(); toast.success('Item deleted.'); }
    catch (err) { toast.error('Error deleting item: ' + (err.response?.data?.message || err.message)); }
  };

  const totalValue = items.reduce((a, i) => a + Number(i.itemprice || 0), 0);
  const avgPrice  = items.length ? Math.round(totalValue / items.length) : 0;
  const maxPrice  = items.length ? Math.max(...items.map(i => Number(i.itemprice || 0))) : 0;

  const inventoryStats = [
    { label: 'Total Items',      value: items.length,                                        icon: Package,  color: '#6366f1', bg: '#eef2ff', border: 'rgba(99,102,241,0.15)' },
    { label: 'Inventory Value',  value: `₹${totalValue.toLocaleString('en-IN')}`,           icon: Coins,    color: '#10b981', bg: '#ecfdf5', border: 'rgba(16,185,129,0.15)' },
    { label: 'Average Price',    value: `₹${avgPrice.toLocaleString('en-IN')}`,             icon: Tag,      color: '#3b82f6', bg: '#eff6ff', border: 'rgba(59,130,246,0.15)' },
    { label: 'Max Price',        value: `₹${maxPrice.toLocaleString('en-IN')}`,             icon: BarChart3, color: '#f59e0b', bg: '#fffbeb', border: 'rgba(245,158,11,0.15)' },
  ];

  const getFilteredItems = () => {
    let list = items.filter(item => {
      const ms = (item.item_name || item.itemdesc || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.item_code || '').toLowerCase().includes(searchTerm.toLowerCase());
      const price = Number(item.itemprice || 0);
      const mp = !filters.priceRange || (filters.priceRange === 'low' ? price < 5000 : filters.priceRange === 'mid' ? price >= 5000 && price < 15000 : price >= 15000);
      return ms && mp;
    });
    if (sortConfig.key) {
      list.sort((a, b) => {
        let av = sortConfig.key === 'item_name' ? (a.item_name || a.itemdesc || '').toLowerCase() : (sortConfig.key === 'itemprice' ? Number(a.itemprice || 0) : (a[sortConfig.key] || '').toString().toLowerCase());
        let bv = sortConfig.key === 'item_name' ? (b.item_name || b.itemdesc || '').toLowerCase() : (sortConfig.key === 'itemprice' ? Number(b.itemprice || 0) : (b[sortConfig.key] || '').toString().toLowerCase());
        if (av < bv) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (av > bv) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return list;
  };

  const filtered = getFilteredItems();
  const paginated = filtered.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const viewItem  = viewMode === 'view' ? items.find(i => i.id.toString() === (routeId || '').toString()) : null;

  const fi = (f) => ({
    ...pmInput(focusedField === f, ACCENT),
    onFocus: () => setFocusedField(f),
    onBlur: () => setFocusedField(''),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageControlPanel
        title="Inventory Items" subtitle="View pricing, details, and manage stock items" icon={Package}
        stats={inventoryStats} searchTerm={searchTerm}
        onSearchChange={val => { setSearchTerm(val); setCurrentPage(1); }}
        filters={filters} onFilterChange={f => { setFilters(f); setCurrentPage(1); }}
        filterOptions={{ priceRange: [{ label: 'Under ₹5,000', value: 'low' }, { label: '₹5,000 - ₹15,000', value: 'mid' }, { label: '₹15,000 & Above', value: 'high' }] }}
        onAddClick={isAdmin ? () => navigate('/inventory/add') : null} addLabel="New Item"
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
              <button onClick={() => { const r = items.map((i, idx) => [idx + 1, i.item_code, i.item_name || i.itemdesc, i.itemprice].join('\t')).join('\n'); navigator.clipboard.writeText('S.No\tItem Code\tName\tPrice\n' + r).then(() => toast.success('Copied!')).catch(() => toast.error('Failed.')); }} className="export-btn">Copy</button>
              <button onClick={() => { const h = ['SNo.', 'ITEM CODE', 'ITEM NAME', 'PRICE']; const r = items.map((i, idx) => [idx + 1, i.item_code, `"${i.item_name || i.itemdesc}"`, i.itemprice].join(',')); const c = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(h.join(',') + '\n' + r.join('\n')); const a = document.createElement('a'); a.href = c; a.download = 'inventory.csv'; a.click(); }} className="export-btn">CSV</button>
            </div>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="dense-data-table">
            <thead>
              <tr className="tbl-head-row">
                <th style={{ width: 60 }} className="text-center">Image</th>
                <th style={{ width: 130, cursor: 'pointer' }} onClick={() => handleSort('item_code')}>Code {sortConfig.key === 'item_code' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('item_name')}>Item Name {sortConfig.key === 'item_name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</th>
                <th className="text-right" style={{ width: 150, cursor: 'pointer' }} onClick={() => handleSort('itemprice')}>Price {sortConfig.key === 'itemprice' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}</th>
                <th className="text-center" style={{ width: 110 }}>Status</th>
                {isAdmin && <th className="text-right pr-6" style={{ width: 160 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton rows={5} cols={isAdmin ? 6 : 5} hasAvatar={true} /> : paginated.length === 0 ? (
                <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center gap-3"><div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border text-slate-300"><Package size={24} /></div><div><h4 className="font-bold text-sm text-slate-700">No Inventory Items</h4><p className="text-xs mt-1">Try adjusting your filters or search.</p></div></div>
                </td></tr>
              ) : paginated.map(item => (
                <tr key={item.id}>
                  <td className="text-center">
                    {item.item_image
                      ? <img src={`${UPLOADS_BASE_URL}/uploads/${item.item_image}`} alt={item.item_name} className="w-9 h-9 object-cover rounded-full mx-auto border border-slate-200/60" />
                      : <div className="w-9 h-9 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center mx-auto"><Package size={16} className="text-slate-300" /></div>
                    }
                  </td>
                  <td className="font-mono text-xs font-bold text-slate-500">{item.item_code}</td>
                  <td className="font-bold text-slate-800">{item.item_name || item.itemdesc}</td>
                  <td className="text-right font-semibold text-slate-700">₹{Number(item.itemprice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="text-center"><span className="badge-approved">Active</span></td>
                  {isAdmin && (
                    <td className="text-right pr-6">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => navigate(`/inventory/view/${item.id}`)} className="btn-view"><Eye size={14} /></button>
                        <button onClick={() => navigate(`/inventory/edit/${item.id}`)} className="btn-edit"><Edit3 size={14} /></button>
                        <button onClick={() => setDeleteConfirmId(item.id)} className="btn-delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length / entriesPerPage)} onPageChange={setCurrentPage} totalEntries={filtered.length} entriesPerPage={entriesPerPage} startIndex={(currentPage - 1) * entriesPerPage} />
        )}
      </div>

      {/* ── VIEW Modal ── */}
      <PremiumModal
        open={viewMode === 'view'}
        onClose={() => navigate('/inventory')}
        title="Item Details"
        subtitle="Read-only inventory record"
        headerIcon={<Eye size={18} color="#fff" />}
        accentColor={ACCENT} accentDark={ACCENT_DARK}
        maxWidth={540}
        footer={
          <>
            {isAdmin && viewItem && <button onClick={() => navigate(`/inventory/edit/${viewItem.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', borderRadius: 12, background: `linear-gradient(135deg,${ACCENT_DARK},${ACCENT})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}><Edit3 size={13} /> Edit Item</button>}
            <CancelBtn onClick={() => navigate('/inventory')}>Close</CancelBtn>
          </>
        }
      >
        {!viewItem ? <p style={{ color: '#94a3b8' }}>Item not found.</p> : (
          <div>
            {/* Hero card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', borderRadius: 16, border: '1px solid #d1fae5', marginBottom: 20 }}>
              {viewItem.item_image
                ? <img src={`${UPLOADS_BASE_URL}/uploads/${viewItem.item_image}`} alt={viewItem.item_name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 14, border: `2px solid ${ACCENT}` }} />
                : <div style={{ width: 64, height: 64, borderRadius: 14, background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={26} color="#fff" /></div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit,sans-serif' }}>{viewItem.item_name || viewItem.itemdesc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <code style={{ fontSize: 12, fontFamily: 'monospace', color: ACCENT_DARK, fontWeight: 700, background: '#d1fae5', padding: '2px 8px', borderRadius: 6 }}>{viewItem.item_code}</code>
                  <span className="badge-approved">Active</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Price</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit,sans-serif' }}>₹{Number(viewItem.itemprice || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DetailRow label="Item Code" value={viewItem.item_code} />
              <DetailRow label="Price (INR)" value={`₹${Number(viewItem.itemprice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
              <DetailRow label="Item Name" value={viewItem.item_name || viewItem.itemdesc} span={true} />
              <DetailRow label="Description" value={viewItem.item_description || 'N/A'} span={true} />
            </div>
          </div>
        )}
      </PremiumModal>

      {/* ── CREATE / EDIT Modal ── */}
      <PremiumModal
        open={isAdmin && showForm}
        onClose={() => navigate('/inventory')}
        title={editingId ? 'Edit Charity Item' : 'Add New Charity Item'}
        subtitle={editingId ? 'Update item details and pricing' : 'Fill in details to add a new inventory item'}
        headerIcon={editingId ? <Edit3 size={18} color="#fff" /> : <Package size={18} color="#fff" />}
        accentColor={ACCENT} accentDark={ACCENT_DARK}
        maxWidth={620}
        footer={<><CancelBtn onClick={() => navigate('/inventory')} /><SaveBtn form="inventory-form" loading={saving} label={<><Save size={13} /> {editingId ? 'Update Item' : 'Create Item'}</>} accent={ACCENT} accentDark={ACCENT_DARK} /></>}
      >
        <form id="inventory-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Item Code', key: 'item_code', placeholder: 'e.g. ITM-100001', type: 'text', req: true },
              { label: 'Item Name', key: 'item_name', placeholder: 'e.g. Goat — Big Size', type: 'text', req: true },
              { label: 'Price (₹)', key: 'itemprice', placeholder: 'e.g. 1200', type: 'number', req: true },
              { label: 'Description', key: 'item_description', placeholder: 'Optional description', type: 'text', req: false },
            ].map(f => (
              <div key={f.key}>
                <label style={pmLabel}>{f.label}{f.req && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}</label>
                <input type={f.type} placeholder={f.placeholder} value={formData[f.key] || ''}
                  onChange={e => { setFormData({ ...formData, [f.key]: e.target.value }); if (errors[f.key]) setErrors(p => ({ ...p, [f.key]: null })); }}
                  style={{ ...fi(f.key), borderColor: errors[f.key] ? '#ef4444' : focusedField === f.key ? ACCENT : '#e2e8f0' }}
                />
                {errors[f.key] && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginTop: 4, display: 'block' }}>{errors[f.key]}</span>}
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={pmLabel}>Item Image</label>
              <div style={{ padding: '10px 14px', border: '1.5px dashed #d1d5db', borderRadius: 12, background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Camera size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <input type="file" accept="image/*" onChange={e => setFormData({ ...formData, item_image: e.target.files[0] })} style={{ fontSize: 13, color: '#64748b', border: 'none', background: 'transparent', outline: 'none', width: '100%' }} />
              </div>
            </div>
          </div>
        </form>
      </PremiumModal>

      {/* ── Delete Confirm ── */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,16,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 380, width: '90%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#fef2f2,#fee2e2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldAlert size={28} style={{ color: '#ef4444' }} /></div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Delete Item?</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>This action cannot be undone. Are you sure?</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, width: '100%' }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ flex: 1, padding: '11px 0', border: '1.5px solid #e2e8f0', borderRadius: 12, background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} style={{ flex: 1, padding: '11px 0', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
