import React, { useState, useEffect } from 'react';
import { Briefcase, Pencil, Trash2, X, Plus } from 'lucide-react';
import { departmentMasterService, UPLOADS_BASE_URL } from '../services/api';

const DepartmentMaster = () => {
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    deptcode: '',
    deptname: '',
    deptdesclong: '',
    status: 1,
    company_id: '',
    location_id: '',
    dept_image: null
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await departmentMasterService.list();
      setDepartments(res.data.data);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          dataToSend.append(key, formData[key]);
        }
      });
      
      if (isEditing) {
        await departmentMasterService.update(editId, dataToSend);
        alert("Department updated successfully!");
      } else {
        await departmentMasterService.create(dataToSend);
        alert("Department created successfully!");
      }
      resetForm();
      fetchDepartments();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const startEdit = (dept) => {
    setShowForm(true);
    setIsEditing(true);
    setEditId(dept.id);
    setFormData({
      deptcode: dept.deptcode || '',
      deptname: dept.deptname,
      deptdesclong: dept.deptdesclong || '',
      status: dept.status,
      company_id: dept.company_id || '',
      location_id: dept.location_id || '',
      dept_image: null
    });
  };

  const deleteRecord = async (id) => {
    if (window.confirm("Are you sure you want to delete this Department?")) {
      try {
        await departmentMasterService.delete(id);
        fetchDepartments();
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditId(null);
    setFormData({ deptcode: '', deptname: '', deptdesclong: '', status: 1, company_id: '', location_id: '', dept_image: null });
  };

  return (
    <div className="vendor-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
          Department Master ({departments.length})
        </h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="add-btn">
            <Plus size={20} /> Add Department
          </button>
        )}
      </div>

      {showForm && (
        <div className="create-vendor-card animate-slide-down" style={{ marginBottom: '30px', padding: '25px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
              <Briefcase size={20} style={{ color: '#059669' }} /> 
              {isEditing ? "Update Department" : "Add New Department"}
            </h2>
            <button onClick={resetForm} className="cancel-btn" style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <X size={16} /> Close
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div className="input-group">
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Department Code</label>
                <input 
                  placeholder="e.g. DEPT-QG (Auto-Gen if empty)" 
                  value={formData.deptcode} 
                  onChange={e => setFormData({ ...formData, deptcode: e.target.value })} 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Department Name</label>
                <input 
                  placeholder="e.g. Qurbani Goats" 
                  value={formData.deptname} 
                  onChange={e => setFormData({ ...formData, deptname: e.target.value })} 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
                  required 
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Detailed Description</label>
                <input 
                  placeholder="e.g. Large sacrificial animal department" 
                  value={formData.deptdesclong} 
                  onChange={e => setFormData({ ...formData, deptdesclong: e.target.value })} 
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

              <div className="input-group">
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Department Image</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={e => setFormData({ ...formData, dept_image: e.target.files[0] })} 
                  style={{ width: '100%', padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
            </div>
            <button type="submit" className="submit-btn" style={{ padding: '12px 24px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {isEditing ? "Update Department Record" : "Save Department Record"}
            </button>
          </form>
        </div>
      )}

      <div className="data-table">
        <div className="table-wrapper" style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '15px' }}>Image</th>
                <th style={{ padding: '15px' }}>Code</th>
                <th style={{ padding: '15px' }}>Department Name</th>
                <th style={{ padding: '15px' }}>Description</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length > 0 ? departments.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px' }}>
                    {d.dept_image ? (
                      <img src={`${UPLOADS_BASE_URL}/uploads/${d.dept_image}`} alt={d.deptname} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>No Img</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '15px', color: '#0f172a', fontWeight: '500' }}><code>{d.deptcode}</code></td>
                  <td style={{ padding: '15px', fontWeight: '600', color: '#0f172a' }}>{d.deptname}</td>
                  <td style={{ padding: '15px', color: '#475569' }}>{d.deptdesclong || '-'}</td>
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
                      <button onClick={() => startEdit(d)} className="edit-icon" title="Edit Department"><Pencil size={15} /></button>
                      <button onClick={() => deleteRecord(d.id)} className="delete-icon" title="Delete Department"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No departments found. Click "Add Department" to create one.
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

export default DepartmentMaster;
