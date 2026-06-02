import React, { useEffect, useState } from 'react';
import { itemService, UPLOADS_BASE_URL } from '../services/api';
import { Plus, Edit3, Trash2, X, Save, Package } from 'lucide-react';

const DEFAULT_COMPANY_ID = import.meta.env.VITE_DEFAULT_COMPANY_ID || '';

const emptyForm = {
  item_code: '',
  item_name: '',
  item_description: '',
  itemprice: '',
  itemcost: '',
  opening_stock: '',
  item_image: null,
};

const InventoryTable = ({ user }) => {
  const isAdmin = user && user.role?.toLowerCase().includes('admin');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await itemService.getCharityItems(DEFAULT_COMPANY_ID);
      setItems(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateForm = () => {
    const generatedCode = `ITM-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData({
      item_code: generatedCode,
      item_name: '',
      item_description: '',
      itemprice: '',
      itemcost: '',
      opening_stock: '',
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          dataToSend.append(key, formData[key]);
        }
      });
      
      if (!editingId) {
        if (DEFAULT_COMPANY_ID) {
          dataToSend.append('company_id', DEFAULT_COMPANY_ID);
        }
      }

      if (editingId) {
        await itemService.update(editingId, dataToSend);
      } else {
        await itemService.create(dataToSend);
      }
      setShowForm(false);
      setFormData(emptyForm);
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert('Error saving item: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      item_code: item.item_code || '',
      item_name: item.item_name || '',
      item_description: item.item_description || '',
      itemprice: item.itemprice || '',
      item_image: null,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await itemService.delete(id);
      setDeleteConfirmId(null);
      fetchData();
    } catch (err) {
      alert('Error deleting item: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData(emptyForm);
    setEditingId(null);
  };

  const filteredItems = items.filter(item =>
    (item.item_name || item.itemdesc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.item_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="inv-container">

      {/* ── Header Controls ── */}
      <div className="inv-controls">
        <div className="inv-search-box">
          <span>Search: </span>
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button className="inv-btn-add" onClick={handleOpenCreateForm}>
            <Plus size={16} /> Add New Item
          </button>
        )}
      </div>

      {/* ── Add / Edit Form (Admin Only) ── */}
      {isAdmin && showForm && (
        <div className="inv-form-card">
          <div className="inv-form-header">
            <h3>{editingId ? '✏️ Edit Item' : '➕ Add New Charity Item'}</h3>
            <button className="inv-icon-btn" onClick={handleCancel}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="inv-form-grid">
            <div className="inv-form-group">
              <label>Item Code</label>
              <input type="text" placeholder="e.g. IT101399" value={formData.item_code}
                onChange={e => setFormData({ ...formData, item_code: e.target.value })} />
            </div>
            <div className="inv-form-group">
              <label>Item Name *</label>
              <input type="text" placeholder="e.g. Goat - Big Size" required value={formData.item_name}
                onChange={e => setFormData({ ...formData, item_name: e.target.value })} />
            </div>
            <div className="inv-form-group">
              <label>Price (₹) *</label>
              <input type="number" step="0.01" min="0" placeholder="e.g. 1200" required value={formData.itemprice}
                onChange={e => setFormData({ ...formData, itemprice: e.target.value })} />
            </div>
            <div className="inv-form-group">
              <label>Description</label>
              <input type="text" placeholder="Optional description" value={formData.item_description}
                onChange={e => setFormData({ ...formData, item_description: e.target.value })} />
            </div>
            <div className="inv-form-group">
              <label>Image</label>
              <input type="file" accept="image/*" 
                onChange={e => setFormData({ ...formData, item_image: e.target.files[0] })} />
            </div>
            {!editingId && (
              <>
                <div className="inv-form-group">
                  <label>Cost Price (₹)</label>
                  <input type="number" step="0.01" min="0" placeholder="e.g. 1000" value={formData.itemcost}
                    onChange={e => setFormData({ ...formData, itemcost: e.target.value })} />
                </div>
                <div className="inv-form-group">
                  <label>Opening Stock Qty</label>
                  <input type="number" min="0" placeholder="e.g. 50" value={formData.opening_stock}
                    onChange={e => setFormData({ ...formData, opening_stock: e.target.value })} />
                </div>
              </>
            )}
            <div className="inv-form-actions">
              <button type="button" className="inv-btn-cancel" onClick={handleCancel}><X size={14} /> Cancel</button>
              <button type="submit" className="inv-btn-save" disabled={saving}>
                <Save size={14} /> {saving ? 'Saving...' : (editingId ? 'Update Item' : 'Create Item')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirmId && (
        <div className="inv-modal-overlay">
          <div className="inv-modal">
            <Trash2 size={36} color="#ef4444" />
            <h3>Delete Item?</h3>
            <p>This action cannot be undone. Are you sure?</p>
            <div className="inv-modal-actions">
              <button className="inv-btn-cancel" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="inv-btn-delete" onClick={() => handleDelete(deleteConfirmId)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <section className="data-table">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Code</th>
                <th>Description</th>
                <th>Price</th>
                <th>Status</th>
                {isAdmin && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 6 : 5} className="no-data">Loading Charity Items...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={isAdmin ? 6 : 5} className="no-data">No items found.</td></tr>
              ) : filteredItems.map(item => (
                <tr key={item.id}>
                  <td>
                    {item.item_image ? (
                      <img src={`${UPLOADS_BASE_URL}/uploads/${item.item_image}`} alt={item.item_name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>No Img</span>
                      </div>
                    )}
                  </td>
                  <td><span className="code-badge">{item.item_code}</span></td>
                  <td>{item.item_name || item.itemdesc}</td>
                  <td><strong style={{ color: '#059669' }}>{item.itemprice || '0.00'}</strong></td>
                  <td><span className="status-tag">Active</span></td>
                  {isAdmin && (
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button className="inv-action-btn inv-edit-btn" title="Edit" onClick={() => handleEdit(item)}>
                          <Edit3 size={14} /> Edit
                        </button>
                        <button className="inv-action-btn inv-del-btn" title="Delete" onClick={() => setDeleteConfirmId(item.id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && (
            <div className="inv-count">
              Showing {filteredItems.length} of {items.length} items
            </div>
          )}
        </div>
      </section>

      <style>{`
        .inv-container { display: flex; flex-direction: column; gap: 16px; }

        .inv-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 14px 20px;
          border-radius: 12px;
          border: 1px solid #d1fae5;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04);
          gap: 12px;
          flex-wrap: wrap;
        }
        .inv-search-box { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; }
        .inv-search-box input {
          padding: 7px 14px;
          border: 1px solid #d1fae5;
          border-radius: 8px;
          outline: none;
          font-size: 13px;
          min-width: 240px;
          transition: border-color 0.2s;
        }
        .inv-search-box input:focus { border-color: #059669; }

        .inv-btn-add {
          display: flex; align-items: center; gap: 6px;
          background: #059669; color: white;
          border: none; padding: 9px 18px; border-radius: 8px;
          cursor: pointer; font-size: 13px; font-weight: 600;
          transition: all 0.2s; box-shadow: 0 2px 8px rgba(5,150,105,0.3);
        }
        .inv-btn-add:hover { background: #047857; transform: translateY(-1px); }

        /* Form Card */
        .inv-form-card {
          background: white;
          border: 1px solid #d1fae5;
          border-radius: 14px;
          padding: 22px 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .inv-form-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 18px;
        }
        .inv-form-header h3 { font-size: 16px; font-weight: 700; color: #1e293b; }
        .inv-icon-btn {
          background: #f1f5f9; border: none; border-radius: 8px;
          padding: 6px; cursor: pointer; display: flex; align-items: center;
          transition: background 0.2s;
        }
        .inv-icon-btn:hover { background: #fee2e2; color: #ef4444; }

        .inv-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .inv-form-group { display: flex; flex-direction: column; gap: 5px; }
        .inv-form-group label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .inv-form-group input {
          padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
          font-size: 13px; outline: none; transition: all 0.2s;
        }
        .inv-form-group input:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }

        .inv-form-actions {
          grid-column: 1 / -1;
          display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px;
        }
        .inv-btn-cancel {
          display: flex; align-items: center; gap: 5px;
          background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569;
          padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;
        }
        .inv-btn-save {
          display: flex; align-items: center; gap: 5px;
          background: #059669; color: white; border: none;
          padding: 9px 20px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
          transition: background 0.2s;
        }
        .inv-btn-save:hover:not(:disabled) { background: #047857; }
        .inv-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Action Buttons */
        .inv-action-btn {
          display: inline-flex; align-items: center; gap: 4px;
          border: none; border-radius: 6px; padding: 5px 10px;
          font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s;
        }
        .inv-edit-btn { background: #eff6ff; color: #3b82f6; }
        .inv-edit-btn:hover { background: #dbeafe; }
        .inv-del-btn { background: #fef2f2; color: #ef4444; }
        .inv-del-btn:hover { background: #fee2e2; }

        /* Delete Modal */
        .inv-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          z-index: 9999; display: flex; align-items: center; justify-content: center;
        }
        .inv-modal {
          background: white; border-radius: 16px; padding: 36px 32px;
          text-align: center; max-width: 360px; width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .inv-modal h3 { font-size: 18px; font-weight: 700; color: #1e293b; }
        .inv-modal p { font-size: 14px; color: #64748b; }
        .inv-modal-actions { display: flex; gap: 12px; margin-top: 8px; }
        .inv-btn-delete {
          background: #ef4444; color: white; border: none; padding: 9px 20px;
          border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;
          transition: background 0.2s;
        }
        .inv-btn-delete:hover { background: #dc2626; }

        .inv-count {
          text-align: right; font-size: 12px; color: #94a3b8;
          padding: 10px 6px 2px;
        }
      `}</style>
    </div>
  );
};

export default InventoryTable;
