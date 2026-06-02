import React, { useState, useEffect } from 'react';
import { CalendarDays, Pencil, Trash2, X, Plus } from 'lucide-react';
import { qurbaniDateService } from '../services/api';

const QurbaniDateMaster = () => {
  const [dates, setDates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    qurbani_date: '',
    actual_date: '',
    description: '',
    status: 1
  });

  useEffect(() => {
    fetchDates();
  }, []);

  const fetchDates = async () => {
    try {
      const res = await qurbaniDateService.list();
      setDates(res.data.data);
    } catch (err) {
      console.error("Failed to load Qurbani dates:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await qurbaniDateService.update(editId, formData);
        alert("Qurbani Date updated successfully!");
      } else {
        await qurbaniDateService.create(formData);
        alert("Qurbani Date created successfully!");
      }
      resetForm();
      fetchDates();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const startEdit = (d) => {
    setShowForm(true);
    setIsEditing(true);
    setEditId(d.id);
    setFormData({
      qurbani_date: d.qurbani_date,
      actual_date: d.actual_date || '',
      description: d.description || '',
      status: d.status
    });
  };

  const deleteRecord = async (id) => {
    if (window.confirm("Are you sure you want to delete this Qurbani Date?")) {
      try {
        await qurbaniDateService.delete(id);
        fetchDates();
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditId(null);
    setFormData({ qurbani_date: '', actual_date: '', description: '', status: 1 });
  };

  return (
    <div className="vendor-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
          Qurbani Date Master ({dates.length})
        </h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="add-btn">
            <Plus size={20} /> Add New Date
          </button>
        )}
      </div>

      {showForm && (
        <div className="create-vendor-card animate-slide-down" style={{ marginBottom: '30px', padding: '25px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
              <CalendarDays size={20} style={{ color: '#059669' }} /> 
              {isEditing ? "Update Qurbani Date" : "Add New Qurbani Date"}
            </h2>
            <button onClick={resetForm} className="cancel-btn" style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <X size={16} /> Close
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div className="input-group">
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Qurbani Date / Day Name</label>
                <input 
                  placeholder="e.g. Eid Day 1" 
                  value={formData.qurbani_date} 
                  onChange={e => setFormData({ ...formData, qurbani_date: e.target.value })} 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
                  required 
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Sacrifice Calendar Date</label>
                <input 
                  type="date"
                  value={formData.actual_date} 
                  onChange={e => setFormData({ ...formData, actual_date: e.target.value })} 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
                  required 
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Description / Label</label>
                <input 
                  placeholder="e.g. First Day of Eid Sacrifice" 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Active Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({ ...formData, status: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white' }}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>
            <button type="submit" className="submit-btn" style={{ padding: '12px 24px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {isEditing ? "Update Qurbani Date Record" : "Save Qurbani Date Record"}
            </button>
          </form>
        </div>
      )}

      <div className="data-table">
        <div className="table-wrapper" style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '15px' }}>ID</th>
                <th style={{ padding: '15px' }}>Qurbani Date / Day</th>
                <th style={{ padding: '15px' }}>Calendar Date</th>
                <th style={{ padding: '15px' }}>Description</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dates.length > 0 ? dates.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', color: '#64748b' }}>#{d.id}</td>
                  <td style={{ padding: '15px', fontWeight: '600', color: '#0f172a' }}>{d.qurbani_date}</td>
                  <td style={{ padding: '15px', fontWeight: '600', color: '#059669' }}>{d.actual_date ? new Date(d.actual_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                  <td style={{ padding: '15px', color: '#475569' }}>{d.description || '-'}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '50px', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      backgroundColor: d.status === 1 ? '#d1fae5' : '#fee2e2',
                      color: d.status === 1 ? '#065f46' : '#991b1b'
                    }}>
                      {d.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div className="action-btns" style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEdit(d)} className="edit-icon" title="Edit Date"><Pencil size={15} /></button>
                      <button onClick={() => deleteRecord(d.id)} className="delete-icon" title="Delete Date"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No Qurbani dates configured. Click "Add New Date" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QurbaniDateMaster;
