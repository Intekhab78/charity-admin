import React, { useState, useEffect } from 'react';
import { UserPlus, Pencil, Trash2, X, Plus } from 'lucide-react';
import { vendorService, UPLOADS_BASE_URL } from '../services/api';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false); // FIXED: Form hidden by default
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [vendorData, setVendorData] = useState({ 
    firstname: '', 
    lastname: '', 
    email: '', 
    mobile: '', 
    password: '',
    profile_image: null
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await vendorService.list();
      setVendors(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = new FormData();
      Object.keys(vendorData).forEach(key => {
        if (vendorData[key] !== null && vendorData[key] !== '') {
          dataToSend.append(key, vendorData[key]);
        }
      });
      if (isEditing) {
        await vendorService.update(editId, dataToSend);
        alert("Vendor Updated!");
      } else {
        await vendorService.create(dataToSend);
        alert("Vendor Created!");
      }
      resetForm();
      fetchVendors();
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.response?.data?.message || err.message));
    }
  };

  const deleteVendor = async (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await vendorService.delete(id);
        fetchVendors();
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  const startEdit = (v) => {
    setShowForm(true); // Open form for editing
    setIsEditing(true);
    setEditId(v.id);
    setVendorData({ 
      firstname: v.firstname, 
      lastname: v.lastname, 
      email: v.email, 
      mobile: v.mobile || '', 
      password: '',
      profile_image: null
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditId(null);
    setVendorData({ firstname: '', lastname: '', email: '', mobile: '', password: '', profile_image: null });
  };

  return (
    <div className="vendor-section">
      {/* Header with New Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Total Vendors ({vendors.length})</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="add-btn">
            <Plus size={20} /> New Vendor
          </button>
        )}
      </div>

      {/* Conditionally Rendered Form */}
      {showForm && (
        <div className="create-vendor-card animate-slide-down" style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isEditing ? <><Pencil size={20} /> Update Vendor</> : <><UserPlus size={20} /> Add New Vendor</>}
            </h2>
            <button onClick={resetForm} className="cancel-btn"><X size={16} /> Close Form</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input placeholder="First Name" value={vendorData.firstname} onChange={e => setVendorData({ ...vendorData, firstname: e.target.value })} required />
              <input placeholder="Last Name" value={vendorData.lastname} onChange={e => setVendorData({ ...vendorData, lastname: e.target.value })} required />
              <input type="email" placeholder="Email Address" value={vendorData.email} onChange={e => setVendorData({ ...vendorData, email: e.target.value })} required />
              <input placeholder="Mobile Number" value={vendorData.mobile} onChange={e => setVendorData({ ...vendorData, mobile: e.target.value })} required />
              <input type="password" placeholder={isEditing ? "New Password (Optional)" : "Password"} value={vendorData.password} onChange={e => setVendorData({ ...vendorData, password: e.target.value })} required={!isEditing} />
              <input type="file" accept="image/*" onChange={e => setVendorData({ ...vendorData, profile_image: e.target.files[0] })} />
            </div>
            <button type="submit" className="submit-btn">{isEditing ? "Update Vendor Account" : "Create Vendor Account"}</button>
          </form>
        </div>
      )}

      {/* Vendors Table */}
      <div className="data-table">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Image</th><th>Vendor ID</th><th>Name</th><th>Email</th><th>Mobile</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {vendors.length > 0 ? vendors.map(v => (
                <tr key={v.id}>
                  <td>
                    {v.profile_image ? (
                      <img src={`${UPLOADS_BASE_URL}/uploads/${v.profile_image}`} alt={v.firstname} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>No Img</span>
                      </div>
                    )}
                  </td>
                  <td style={{ color: '#64748b', fontWeight: '500' }}>#{v.id}</td>
                  <td>{v.firstname} {v.lastname}</td>
                  <td>{v.email}</td>
                  <td>{v.mobile}</td>
                  <td>{v.created_at && !isNaN(new Date(v.created_at).getTime()) ? new Date(v.created_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className="action-btns">
                      <button onClick={() => startEdit(v)} className="edit-icon" title="Edit Vendor"><Pencil size={16} /></button>
                      <button onClick={() => deleteVendor(v.id)} className="delete-icon" title="Delete Vendor"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No vendors found. Click "New Vendor" to add one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorManagement;
