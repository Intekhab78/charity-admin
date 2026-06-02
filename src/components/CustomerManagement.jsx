import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Pencil, Trash2, X, Plus, Phone, MapPin } from 'lucide-react';
import { customerService, UPLOADS_BASE_URL } from '../services/api';

const CustomerManagement = ({ user }) => {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [customerData, setCustomerData] = useState({
    trn_name: '',
    customer_code: '',
    customer_phone: '',
    customer_email: '',
    customer_address_1: '',
    customer_city: '',
    profile_image: null
  });

  // Role Check
  const isAdmin = user && user.role && user.role.toLowerCase().includes('admin');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await customerService.list();
      setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Include the current user's ID for the ERP database
      const dataToSend = new FormData();
      Object.keys(customerData).forEach(key => {
        if (customerData[key] !== null && customerData[key] !== '') {
          dataToSend.append(key, customerData[key]);
        }
      });
      if (user && user.id) {
        dataToSend.append('user_id', user.id);
      }

      if (isEditing) {
        await customerService.update(editId, dataToSend);
        alert("Customer Updated!");
      } else {
        await customerService.create(dataToSend);
        alert("Customer Created!");
      }
      resetForm();
      fetchCustomers();
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.response?.data?.message || err.message));
    }
  };

  const deleteCustomer = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await customerService.delete(id);
        fetchCustomers();
      } catch (err) {
        alert(err.response?.data?.message || "Delete failed");
      }
    }
  };

  const startEdit = (c) => {
    setShowForm(true);
    setIsEditing(true);
    setEditId(c.id);
    setCustomerData({
      trn_name: c.trn_name,
      customer_code: c.customer_code,
      customer_phone: c.customer_phone || '',
      customer_email: c.customer_email || '',
      customer_address_1: c.customer_address_1 || '',
      customer_city: c.customer_city || '',
      profile_image: null
    });
  };

  const handleOpenCreateForm = () => {
    let nextNum = 1000;
    if (customers && customers.length > 0) {
      const codes = customers
        .map(c => c.customer_code)
        .filter(code => code && (code.startsWith('CUST-') || code.startsWith('CUS-')))
        .map(code => parseInt(code.replace('CUST-', '').replace('CUS-', ''), 10))
        .filter(num => !isNaN(num));
      
      if (codes.length > 0) {
        nextNum = Math.max(...codes) + 1;
      }
    }
    const generatedCode = `CUST-${nextNum}`;
    setCustomerData({
      trn_name: '',
      customer_code: generatedCode,
      customer_phone: '',
      customer_email: '',
      customer_address_1: '',
      customer_city: '',
      profile_image: null
    });
    setEditId(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditId(null);
    setCustomerData({ trn_name: '', customer_code: '', customer_phone: '', customer_email: '', customer_address_1: '', customer_city: '', profile_image: null });
  };

  return (
    <div className="customer-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Total Customers ({customers.length})</h2>
        {!showForm && (
          <button onClick={handleOpenCreateForm} className="add-btn">
            <Plus size={20} /> New Customer
          </button>
        )}
      </div>

      {showForm && (
        <div className="create-vendor-card animate-slide-down" style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isEditing ? <><Pencil size={20} /> Update Customer</> : <><UserPlus size={20} /> Add New Customer</>}
            </h2>
            <button onClick={resetForm} className="cancel-btn"><X size={16} /> Close Form</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input placeholder="Customer Code (Auto-Gen)" value={customerData.customer_code} onChange={e => setCustomerData({ ...customerData, customer_code: e.target.value })} />
              <input placeholder="Customer/Company Name" value={customerData.trn_name} onChange={e => setCustomerData({ ...customerData, trn_name: e.target.value })} required />
              <input placeholder="Phone Number" value={customerData.customer_phone} onChange={e => setCustomerData({ ...customerData, customer_phone: e.target.value })} required />
              <input type="email" placeholder="Email Address" value={customerData.customer_email} onChange={e => setCustomerData({ ...customerData, customer_email: e.target.value })} />
              <input placeholder="City" value={customerData.customer_city} onChange={e => setCustomerData({ ...customerData, customer_city: e.target.value })} />
              <div style={{ gridColumn: 'span 2' }}>
                <input placeholder="Full Address" value={customerData.customer_address_1} onChange={e => setCustomerData({ ...customerData, customer_address_1: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <input type="file" accept="image/*" onChange={e => setCustomerData({ ...customerData, profile_image: e.target.files[0] })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
              </div>
            </div>
            <button type="submit" className="submit-btn">{isEditing ? "Update Customer" : "Save Customer"}</button>
          </form>
        </div>
      )}

      <div className="data-table">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Image</th><th>Code</th><th>Customer Name</th><th>Contact</th><th>Email</th><th>Location</th><th>Actions</th></tr></thead>
            <tbody>
              {customers.length > 0 ? customers.map(c => (
                <tr key={c.id}>
                  <td>
                    {c.profile_image ? (
                      <img src={`${UPLOADS_BASE_URL}/uploads/${c.profile_image}`} alt={c.trn_name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>No Img</span>
                      </div>
                    )}
                  </td>
                  <td><span className="code-badge">{c.customer_code}</span></td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{c.trn_name}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <Phone size={14} color="#64748b" /> {c.customer_phone}
                    </div>
                  </td>
                  <td>{c.customer_email || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <MapPin size={14} color="#64748b" /> {c.customer_city || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button onClick={() => startEdit(c)} className="edit-icon" title="Edit Customer"><Pencil size={16} /></button>
                      {isAdmin && (
                        <button onClick={() => deleteCustomer(c.id)} className="delete-icon" title="Delete Customer"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
