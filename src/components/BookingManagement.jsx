import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Users, CreditCard, Calendar, CheckCircle, Search, Edit3, MoreVertical, Eye, FileText } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { bookingService, customerService, qurbaniDateService, UPLOADS_BASE_URL } from '../services/api';

const BookingManagement = ({ user, viewMode = 'form' }) => {
  const { year } = useParams();
  const isAdmin = user && user.role?.toLowerCase().includes('admin');
  const [bookings, setBookings] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [shareCodes, setShareCodes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [qurbaniDates, setQurbaniDates] = useState([]);
  const [companyInfo, setCompanyInfo] = useState({ company_name: 'Charity Organisation', address: '', phone: '', email: '' });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(viewMode === 'form');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // DataTable States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    total_shares: 1,
    share_code: '',
    payment_mode: 'Cash',
    booking_date: new Date().toISOString().split('T')[0],
    qurbani_date: ''
  });

  const [shares, setShares] = useState([{ beneficiary_name: '', beneficiary_mobile: '', objective: '', amount: 0, share_reg_no: '' }]);

  useEffect(() => {
    const migrate = async () => {
      try { await bookingService.migrateQurbani(); } catch (e) {}
    };
    migrate();
    fetchCustomers();
    fetchShareCodes();
    fetchDepartments();
    fetchQurbaniDates();
    fetchCompany();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [year]);

  const fetchQurbaniDates = async () => {
    try {
      const res = await qurbaniDateService.list();
      const activeDates = (res.data?.data || []).filter(d => d.status === 1);
      setQurbaniDates(activeDates);
      if (activeDates.length > 0 && !editingId) {
        setFormData(prev => ({ ...prev, qurbani_date: activeDates[0].qurbani_date }));
      }
    } catch (err) {
      console.error("Failed to load Qurbani Dates:", err);
    }
  };

  useEffect(() => {
    // Keep showForm state synced with viewMode
    setShowForm(viewMode === 'form' || editingId !== null);
  }, [viewMode, editingId]);

  // Sync shares table with total_shares count and selected share code price
  useEffect(() => {
    if (editingId) return; 
    const count = parseInt(formData.total_shares) || 0;
    const selectedShare = shareCodes.find(s => s.code === formData.share_code);
    const defaultPrice = selectedShare ? parseFloat(selectedShare.price) : 0;
    const defaultDept = departments.length > 0 ? departments[0].dept_name : '';

    const currentShares = [...shares];
    if (count > currentShares.length) {
      for (let i = currentShares.length; i < count; i++) {
        currentShares.push({ 
          share_reg_no: `REG/${new Date().getFullYear()}/${Math.floor(Math.random()*10000)}/${i+1}`,
          beneficiary_name: formData.customer_name, 
          beneficiary_mobile: formData.customer_phone, 
          objective: defaultDept, 
          amount: defaultPrice 
        });
      }
    } else if (count < currentShares.length) {
      currentShares.splice(count);
    }
    
    // Update amount for ALL rows if share_code changed
    currentShares.forEach(s => {
      s.amount = defaultPrice;
    });

    setShares(currentShares);
  }, [formData.total_shares, formData.customer_name, formData.customer_phone, formData.share_code, shareCodes, editingId, departments]);

  const fetchBookings = async () => {
    try {
      const res = await bookingService.list();
      let data = res.data?.data || [];
      if (year) {
        data = data.filter(b => {
          const bYear = new Date(b.booking_date || b.created_at).getFullYear();
          return bYear.toString() === year;
        });
      }
      setBookings(data);
    } catch (err) { console.error(err); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await customerService.list();
      setAllCustomers(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchShareCodes = async () => {
    try {
      const res = await bookingService.getShareCodes();
      const codes = res.data.data;
      setShareCodes(codes);
      if (codes.length > 0 && !editingId) {
        setFormData(prev => ({ ...prev, share_code: codes[0].code }));
      }
    } catch (err) { console.error(err); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await bookingService.getDepartments();
      setDepartments(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchCompany = async () => {
    try {
      const res = await bookingService.getCompany();
      if (res.data?.data) setCompanyInfo(res.data.data);
    } catch (err) { console.error('Company fetch failed:', err); }
  };

  const getBookingSourceType = (booking) => {
    const sourceText = [
      booking.source,
      booking.booking_type,
      booking.order_type,
      booking.customer_country,
      booking.country
    ].filter(Boolean).join(' ').toLowerCase();

    if (sourceText.includes('international') || (booking.customer_country && booking.customer_country.toLowerCase() !== 'india')) {
      return 'international';
    }

    if (booking.is_online_order || booking.source === 'website_order' || booking.vendor_name === 'Online Website') {
      return 'online';
    }

    if (booking.vendor_name) {
      return 'vendor';
    }

    return 'admin';
  };

  const handleNameChange = (val) => {
    setFormData({ ...formData, customer_name: val });
    if (val.length > 0) {
      const filtered = allCustomers.filter(c => 
        c.trn_name.toLowerCase().includes(val.toLowerCase()) ||
        c.customer_phone.includes(val)
      );
      setFilteredCustomers(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCustomer = (c) => {
    setFormData({
      ...formData,
      customer_name: c.trn_name,
      customer_phone: c.customer_phone,
      customer_email: c.email || ''
    });
    setShowSuggestions(false);
  };

  const handleShareChange = (index, field, value) => {
    const newShares = [...shares];
    newShares[index][field] = value;
    setShares(newShares);
  };

  const calculateTotal = () => shares.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

  const generateReceiptPDF = async (bookingData) => {
    const loadScript = (src) => new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      document.head.appendChild(script);
    });

    if (!window.jspdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const co = bookingData.companyInfo || companyInfo;

    // ── HEADER BAND ──────────────────────────────────────────────
    doc.setFillColor(99, 102, 241);          // indigo
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(co.company_name || 'Charity Organisation', 15, 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const addrLine = [co.address, co.city, co.country].filter(Boolean).join(', ');
    if (addrLine) doc.text(addrLine, 15, 23);
    const contactLine = [co.phone && `Ph: ${co.phone}`, co.email && `Email: ${co.email}`].filter(Boolean).join('   |   ');
    if (contactLine) doc.text(contactLine, 15, 29);

    // Order ID top-right
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const orderId = bookingData.id ? `Order #${bookingData.id}` : `Order #NEW`;
    doc.text(orderId, 195, 16, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Date: ${bookingData.booking_date || new Date().toLocaleDateString()}`, 195, 23, { align: 'right' });
    doc.text(`Payment: ${bookingData.payment_mode}`, 195, 29, { align: 'right' });

    // ── CUSTOMER BOX ─────────────────────────────────────────────
    doc.setTextColor(0);
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 44, 180, 24, 'FD');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer & Sacrificial Details', 20, 51);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Name: ${bookingData.customer_name}`, 20, 57);
    doc.text(`Phone: ${bookingData.customer_phone}`, 110, 57);
    doc.text(`Email: ${bookingData.customer_email || 'N/A'}`, 20, 63);
    doc.text(`Qurbani Date: ${bookingData.qurbani_date || '-'}`, 110, 63);

    // ── SHARES TABLE ─────────────────────────────────────────────
    const tableData = (bookingData.shares || []).map((s, i) => [
      i + 1,
      s.share_reg_no || 'Auto-Gen',
      s.beneficiary_name,
      s.objective,
      `Rs. ${s.amount}`
    ]);

    doc.autoTable({
      startY: 72,
      head: [['Sno.', 'Reg No.', 'Beneficiary', 'Objective', 'Amount (Rs.)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: { 4: { halign: 'right' } }
    });

    // ── TOTALS ───────────────────────────────────────────────────
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.rect(120, finalY - 6, 75, 12, 'FD');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(`Total: Rs. ${bookingData.total_amount || calculateTotal()}`, 193, finalY + 2, { align: 'right' });

    // ── FOOTER ───────────────────────────────────────────────────
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('This is a computer generated receipt. Thank you for your generous donation.', 105, 285, { align: 'center' });
    doc.text(`${co.company_name || 'Charity Organisation'} | ${co.address || ''}`, 105, 290, { align: 'center' });

    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  };

  const handleEdit = (booking) => {
    setEditingId(booking.id);
    setFormData({
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      customer_email: booking.customer_email || '',
      total_shares: booking.total_shares,
      share_code: booking.share_code,
      payment_mode: booking.payment_mode || 'Cash',
      qurbani_date: booking.qurbani_date || ''
    });
    setShares(booking.shares.map(s => ({
      share_reg_no: s.share_reg_no,
      beneficiary_name: s.beneficiary_name,
      beneficiary_mobile: s.beneficiary_mobile,
      objective: s.objective,
      amount: s.amount
    })));
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await bookingService.delete(id);
      fetchBookings();
    } catch (err) { alert("Delete failed"); }
  };

  const handleApprove = async (id) => {
    if (window.confirm("Are you sure you want to approve this booking as Admin?")) {
      try {
        await bookingService.approve(id);
        alert("Booking approved successfully!");
        fetchBookings();
      } catch (err) {
        alert("Approval failed: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        total_amount: calculateTotal(),
        vendor_name: !isAdmin ? (user?.name || '').trim() : null,
        is_approved_by_admin: isAdmin ? 1 : 0,
        shares
      };
      
      let res;
      if (editingId) {
        res = await bookingService.update(editingId, payload);
        alert('Booking Updated!');
      } else {
        res = await bookingService.create(payload);
      }
      // Attach id + companyInfo for PDF
      payload.id = res?.data?.data?.id || editingId || '';
      payload.companyInfo = companyInfo;
      
      // Generate PDF after successful save
      await generateReceiptPDF(payload);
      
      // Reset form states
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        total_shares: 1,
        share_code: shareCodes.length > 0 ? shareCodes[0].code : '',
        payment_mode: 'Cash',
        booking_date: new Date().toISOString().split('T')[0],
        qurbani_date: qurbaniDates.length > 0 ? qurbaniDates[0].qurbani_date : ''
      });
      setShares([{ beneficiary_name: '', beneficiary_mobile: '', objective: departments[0]?.dept_name || '', amount: 0, share_reg_no: '' }]);
      
      setEditingId(null);
      if (viewMode === 'list') setShowForm(false);
      fetchBookings();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="qurbani-booking" style={{ padding: 0 }}>

      {showForm && (
        <div className="booking-card animate-slide-down">
          <div className="card-header-main">
            <h3><Calendar size={18} /> {editingId ? 'Edit Booking' : 'Booking Header'}</h3>
            {editingId && <button onClick={() => { setShowForm(false); setEditingId(null); }} className="close-link"><X size={16} /> Cancel Edit</button>}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="header-inputs">
              <div className="input-field" style={{ position: 'relative' }}>
                <label>Customer Name</label>
                <div className="search-input-wrapper">
                  <input placeholder="Search or Enter Name" value={formData.customer_name} onChange={e => handleNameChange(e.target.value)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} required />
                  <Search size={16} className="search-icon" />
                </div>
                {showSuggestions && filteredCustomers.length > 0 && (
                  <div className="suggestions-dropdown">
                    {filteredCustomers.map(c => (
                      <div key={c.id} className="suggestion-item" onClick={() => selectCustomer(c)}>
                        <div className="s-name">{c.trn_name}</div>
                        <div className="s-phone">{c.customer_phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="input-field">
                <label>Phone No.</label>
                <input placeholder="Enter Mobile" value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})} required />
              </div>
              <div className="input-field">
                <label>Email</label>
                <input type="email" placeholder="Optional" value={formData.customer_email} onChange={e => setFormData({...formData, customer_email: e.target.value})} />
              </div>
              <div className="input-field">
                <label>Total Shares</label>
                <input type="number" min="1" max="7" value={formData.total_shares} onChange={e => setFormData({...formData, total_shares: e.target.value})} required />
              </div>
              <div className="input-field">
                <label>Share Code</label>
                <select value={formData.share_code} onChange={e => setFormData({...formData, share_code: e.target.value})}>
                  {shareCodes.map(s => (
                    <option key={`${s.id}-${s.code}`} value={s.code}>{s.display}</option>
                  ))}
                </select>
              </div>
              <div className="input-field">
                <label>Qurbani Date / Day</label>
                <select value={formData.qurbani_date} onChange={e => setFormData({...formData, qurbani_date: e.target.value})} required>
                  {qurbaniDates.length > 0 ? (
                    qurbaniDates.map(d => {
                      const dateStr = d.actual_date ? ` (${new Date(d.actual_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})` : '';
                      const descStr = d.description ? ` - ${d.description}` : '';
                      return (
                        <option key={d.id} value={d.qurbani_date}>
                          {d.qurbani_date}{dateStr}{descStr}
                        </option>
                      );
                    })
                  ) : (
                    <option value="">No active dates</option>
                  )}
                </select>
              </div>
            </div>

            {/* Elegant Item Image preview placed OUTSIDE the grid to prevent overlaps */}
            {shareCodes.find(s => s.code === formData.share_code)?.image && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                <img 
                  src={`${UPLOADS_BASE_URL}/uploads/${shareCodes.find(s => s.code === formData.share_code).image}`} 
                  alt="Selected Item" 
                  style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }} 
                />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Selected Item Preview</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{shareCodes.find(s => s.code === formData.share_code)?.name}</div>
                </div>
              </div>
            )}

            <div className="share-table-section">
              <div className="table-header-row">
                <h4>Table Name - booking</h4>
                <div className="date-picker-wrapper">
                  <label>Date:</label>
                  <input 
                    type="date" 
                    className="date-input" 
                    value={formData.booking_date} 
                    onChange={e => setFormData({...formData, booking_date: e.target.value})} 
                  />
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Sno.</th>
                      <th style={{ width: '180px' }}>ShareRegNo.</th>
                      <th>Name*</th>
                      <th>Mobile (Required)</th>
                      <th>Objective (Department)</th>
                      <th>Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shares.map((s, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          <input 
                            className="readonly-input"
                            value={s.share_reg_no} 
                            onChange={e => handleShareChange(i, 'share_reg_no', e.target.value)} 
                            placeholder="Auto-Gen"
                          />
                        </td>
                        <td><input value={s.beneficiary_name} onChange={e => handleShareChange(i, 'beneficiary_name', e.target.value)} required /></td>
                        <td><input value={s.beneficiary_mobile} onChange={e => handleShareChange(i, 'beneficiary_mobile', e.target.value)} required /></td>
                        <td>
                          <select value={s.objective} onChange={e => handleShareChange(i, 'objective', e.target.value)}>
                            {departments.length > 0 ? (
                              departments.map(d => (
                                <option key={d.id} value={d.dept_name}>{d.dept_name}</option>
                              ))
                            ) : (
                              <option disabled>Loading Departments...</option>
                            )}
                          </select>
                        </td>
                        <td><input type="number" value={s.amount} onChange={e => handleShareChange(i, 'amount', e.target.value)} required /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="footer-actions">
              <div className="totals">
                <span>Total Bill:</span>
                <strong className="price-text">Rs. {calculateTotal()}</strong>
              </div>
              <div className="payment-select">
                <select value={formData.payment_mode} onChange={e => setFormData({...formData, payment_mode: e.target.value})}>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
                <button type="submit" className="submit-booking-btn">
                  {editingId ? 'Update Booking' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* List Section */}
      {viewMode === 'list' && !editingId && (
        <div className="list-table-container">
          <div className="table-controls">
            <div className="show-entries">
              <span>Show </span>
              <select value={entriesPerPage} onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span> entries</span>
            </div>
            <div className="export-buttons">
              <button onClick={() => alert("Copied to clipboard!")}>Copy</button>
              <button onClick={() => {
                const processedBookings = isAdmin ? bookings : bookings.filter(b => b.vendor_name === (user?.name || '').trim());
                const headers = ['SNo.', 'INVOICE', 'VENDOR', 'RATE', 'AMOUNT', 'CUSTOMER NAME', 'PHONE'];
                const rows = processedBookings.map((b, i) => [i + 1, `INV-${b.id}`, b.vendor_name || 'Vendor', b.total_amount/b.total_shares||0, b.total_amount, b.customer_name, b.customer_phone].join(','));
                const link = document.createElement('a');
                link.href = 'data:text/csv;charset=utf-8,' + encodeURI(headers.join(',') + '\n' + rows.join('\n'));
                link.download = 'bookings.csv';
                link.click();
              }}>CSV</button>
              <button onClick={() => {
                const processedBookings = isAdmin ? bookings : bookings.filter(b => b.vendor_name === (user?.name || '').trim());
                const headers = ['SNo.', 'INVOICE', 'VENDOR', 'RATE', 'AMOUNT', 'CUSTOMER NAME', 'PHONE'];
                const rows = processedBookings.map((b, i) => [i + 1, `INV-${b.id}`, b.vendor_name || 'Vendor', b.total_amount/b.total_shares||0, b.total_amount, b.customer_name, b.customer_phone].join(','));
                const link = document.createElement('a');
                link.href = 'data:text/csv;charset=utf-8,' + encodeURI(headers.join(',') + '\n' + rows.join('\n'));
                link.download = 'bookings_excel.csv';
                link.click();
              }}>Excel</button>
              <button onClick={() => window.print()}>PDF</button>
              <button onClick={() => window.print()}>Print</button>
            </div>
            <div className="search-box">
              <span>Search: </span>
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                placeholder="Search..." 
              />
            </div>
          </div>
          <div className="data-table-wrapper">
            <table className="dense-data-table">
              <thead>
                <tr>
                  <th>SNo.</th>
                  <th>ACTION</th>
                  <th>INVOICE</th>
                  <th>VENDOR</th>
                  <th>REG.NO</th>
                  <th>RATE</th>
                  <th>AMOUNT</th>
                  <th>CUSTOMER NAME</th>
                  <th>PHONE</th>
                  <th>QURBANI DATE</th>
                  <th>ORDER DATE</th>
                  <th>ORDER STATUS</th>
                  {isAdmin && <th>UPDATE DETAILS</th>}
                  {isAdmin && <th>DELETE</th>}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let displayedBookings = isAdmin 
                    ? bookings 
                    : bookings.filter(b => b.vendor_name === (user?.name || '').trim());
                  
                  if (searchTerm) {
                    const lowerSearch = searchTerm.toLowerCase();
                    displayedBookings = displayedBookings.filter(b => 
                      b.customer_name?.toLowerCase().includes(lowerSearch) ||
                      b.customer_phone?.includes(lowerSearch) ||
                      b.vendor_name?.toLowerCase().includes(lowerSearch) ||
                      String(b.id || '').toLowerCase().includes(lowerSearch)
                    );
                  }

                  const totalEntries = displayedBookings.length;
                  const totalPages = Math.ceil(totalEntries / entriesPerPage);
                  const startIndex = (currentPage - 1) * entriesPerPage;
                  const paginatedBookings = displayedBookings.slice(startIndex, startIndex + entriesPerPage);
                  
                  if (paginatedBookings.length === 0) {
                    return <tr><td colSpan={isAdmin ? "14" : "12"} className="text-center">No bookings found.</td></tr>;
                  }

                  return paginatedBookings.map((b, i) => {
                    const globalIndex = startIndex + i + 1;
                    const rate = b.total_shares > 0 ? (b.total_amount / b.total_shares).toFixed(2) : 0;
                    const orderStatus = (b.is_online_order || b.is_approved_by_admin === 1) ? 'Confirmed' : 'Pending';
                    const sourceType = getBookingSourceType(b);
                    return (
                      <tr key={b._id || b.id} className={`source-row source-${sourceType}`}>
                      <td className="text-center">{globalIndex}</td>
                      <td className="text-center">
                        {b.is_online_order ? (
                          <span className="badge-approved" title="Website order">Website</span>
                        ) : b.is_approved_by_admin === 1 ? (
                          <span className="badge-approved" title="Approved by Admin">Approved</span>
                        ) : (
                          <span 
                            className="badge-vendor-approved" 
                            title={isAdmin ? "Click to Approve as Admin" : "Approved by Vendor (Pending Admin Approval)"}
                            onClick={() => isAdmin && handleApprove(b.id)}
                            style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                          >
                            Approved
                          </span>
                        )}
                      </td>
                      <td className="text-center"><button onClick={() => generateReceiptPDF({ ...b, companyInfo })} className="btn-text">PRINT</button></td>
                      <td className="text-center">{b.vendor_name || companyInfo.company_name || 'Vendor'}</td>
                      <td className="text-center reg-cell">
                        {b.shares && b.shares.length > 0 ? (
                          <>
                            {b.shares[0].share_reg_no}
                            {b.shares.length > 1 && <><br />{b.shares[b.shares.length - 1].share_reg_no}</>}
                          </>
                        ) : 'N/A'}
                      </td>
                      <td className="text-center">{rate}(₹)</td>
                      <td className="text-center">{b.total_amount}(₹)</td>
                      <td className="text-center font-bold">{b.customer_name}</td>
                      <td className="text-center">{b.customer_phone}</td>
                      <td className="text-center font-bold" style={{ color: '#059669' }}>{b.qurbani_date || '-'}</td>
                      <td className="text-center">{new Date(b.booking_date || b.created_at).toLocaleDateString()}</td>
                      <td className={`text-center ${orderStatus === 'Confirmed' ? 'status-confirmed' : 'status-pending'}`}>{orderStatus}</td>
                      {isAdmin && (
                        <td className="text-center">
                          {b.is_online_order ? <span className="text-muted">Website Order</span> : <button onClick={() => handleEdit(b)} className="btn-text">UPDATE DETAILS</button>}
                        </td>
                      )}
                      {isAdmin && (
                        <td className="text-center">
                          {b.is_online_order ? <span className="text-muted">-</span> : <button onClick={() => handleDelete(b.id)} className="btn-text">DELETE</button>}
                        </td>
                      )}
                    </tr>
                  );
                });
              })()}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {(() => {
            let displayedBookings = isAdmin ? bookings : bookings.filter(b => b.vendor_name === (user?.name || '').trim());
            if (searchTerm) {
              const lowerSearch = searchTerm.toLowerCase();
              displayedBookings = displayedBookings.filter(b => 
                b.customer_name?.toLowerCase().includes(lowerSearch) ||
                b.customer_phone?.includes(lowerSearch) ||
                b.vendor_name?.toLowerCase().includes(lowerSearch) ||
                String(b.id || '').toLowerCase().includes(lowerSearch)
              );
            }
            const totalEntries = displayedBookings.length;
            const totalPages = Math.ceil(totalEntries / entriesPerPage);
            const startIndex = (currentPage - 1) * entriesPerPage;
            const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);

            if (totalEntries === 0) return null;

            return (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
                </div>
                <div className="pagination-buttons">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >Previous</button>
                  <span className="current-page">{currentPage}</span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >Next</button>
                </div>
              </div>
            );
          })()}
          
        </div>
      )}

      <style>{`
        .qurbani-booking { padding: 20px; color: #1e293b; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: 800; color: #0f172a; }
        
        .add-btn { background: #6366f1; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.2s; }
        .add-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }

        .booking-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); margin-bottom: 40px; }
        .card-header-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
        .card-header-main h3 { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
        .close-link { background: none; border: none; color: #ef4444; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }

        .header-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; align-items: flex-end; }
        .input-field label { display: block; font-size: 13px; font-weight: 700; color: #64748b; margin-bottom: 8px; }
        .search-input-wrapper { position: relative; }
        .search-icon { position: absolute; right: 12px; top: 12px; color: #94a3b8; }
        .input-field input, .input-field select { width: 100%; padding: 12px 15px; border: 2px solid #f1f5f9; border-radius: 12px; font-size: 14px; transition: border-color 0.2s; outline: none; }
        .input-field input:focus { border-color: #6366f1; }

        .table-header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; }
        .date-picker-wrapper { display: flex; align-items: center; gap: 10px; }
        .date-picker-wrapper label { font-size: 13px; font-weight: 700; color: #64748b; }
        .date-input { padding: 8px 12px; border: 2px solid #f1f5f9; border-radius: 10px; font-size: 14px; outline: none; }
        .date-input:focus { border-color: #6366f1; }

        .table-wrapper { border: 1px solid #f1f5f9; border-radius: 16px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; min-width: 800px; }
        th { background: #f8fafc; padding: 15px; text-align: left; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; white-space: nowrap; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
        td input, td select { padding: 8px 12px !important; border-width: 1px !important; width: 100%; box-sizing: border-box; }
        .readonly-input { background: #f8fafc; border-color: #e2e8f0 !important; color: #64748b; }

        .footer-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid #f1f5f9; }
        .price-text { font-size: 28px; color: #0f172a; margin-left: 10px; }
        .payment-select { display: flex; gap: 15px; }
        .submit-booking-btn { background: #0f172a; color: white; border: none; padding: 15px 30px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
        .submit-booking-btn:hover { opacity: 0.9; }

        .bookings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
        .booking-summary-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 25px; transition: all 0.3s; }
        .booking-summary-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.05); }
        .summary-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .cust-name { font-size: 18px; font-weight: 800; margin: 0 0 5px 0; }
        .date-pill { font-size: 12px; background: #f1f5f9; padding: 4px 10px; border-radius: 99px; color: #64748b; display: inline-block; }
        
        .amount-badge { font-weight: 900; color: #059669; font-size: 18px; text-align: right; margin-bottom: 10px; }
        .action-buttons { display: flex; gap: 8px; justify-content: flex-end; }
        .action-btn { width: 32px; height: 32px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
        .action-btn.edit { background: #eff6ff; color: #2563eb; }
        .action-btn.delete { background: #fef2f2; color: #dc2626; }
        .action-btn.pdf { background: #f0fdf4; color: #16a34a; }
        .action-btn:hover { opacity: 0.8; }

        .shares-list { display: flex; flex-wrap: wrap; gap: 10px; padding-top: 15px; border-top: 1px dashed #e2e8f0; }
        .share-pill { background: #f8fafc; border: 1px solid #f1f5f9; padding: 6px 12px; border-radius: 10px; font-size: 12px; display: flex; align-items: center; gap: 8px; }
        .check-icon { color: #059669; }
        .reg-no { color: #94a3b8; font-weight: 600; }
        .b-name { font-weight: 700; color: #334155; }
        .dept-pill { font-size: 10px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 700; }

        .suggestions-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 12px; z-index: 1000; box-shadow: 0 10px 25px rgba(0,0,0,0.1); margin-top: 5px; overflow: hidden; }
        .suggestion-item { padding: 12px 15px; cursor: pointer; border-bottom: 1px solid #f8fafc; transition: background 0.2s; }
        .suggestion-item:hover { background: #f1f5f9; }

        /* Modernized Legacy Table Styles */
        .list-table-container { background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 13px; color: #475569; font-weight: 500; }
        
        .show-entries select, .search-box input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 13px; outline: none; transition: border-color 0.2s; }
        .show-entries select:focus, .search-box input:focus { border-color: #6366f1; }
        
        .export-buttons { display: flex; gap: 8px; }
        .export-buttons button { background: #fff; border: 1px solid #e2e8f0; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; color: #475569; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .export-buttons button:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }
        
        .data-table-wrapper { overflow-x: auto; border-radius: 8px; border: 1px solid #d1fae5; }
        .dense-data-table { width: 100%; border-collapse: collapse; min-width: 1000px; font-size: 12px; font-family: 'Inter', 'Segoe UI', sans-serif; }
        .dense-data-table th { background: #059669; padding: 12px 10px; border-bottom: 2px solid #047857; text-align: center; color: #ffffff; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
        .dense-data-table td { padding: 10px 8px; border-bottom: 1px solid #ecfdf5; border-right: 1px solid rgba(0,0,0,0.02); color: #0f172a; vertical-align: middle; transition: background 0.2s; }
        
        /* Source-Based Row Colors */
        .source-row td { border-bottom-color: rgba(15, 23, 42, 0.06); }
        .source-row:hover td { filter: brightness(0.97); }
        .source-online td { background-color: #dbeafe !important; }
        .source-vendor td { background-color: #dcfce7 !important; }
        .source-international td { background-color: #fed7aa !important; }
        .source-admin td { background-color: #e2e8f0 !important; }
        
        /* Utility Classes */
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .text-muted { color: #64748b; font-size: 11px; font-weight: 600; }
        .reg-cell { line-height: 1.5; white-space: pre-wrap; font-family: monospace; font-size: 11px; }
        
        .badge-approved { background: #059669; color: #fff; padding: 4px 10px; font-weight: 700; border-radius: 99px; display: inline-block; font-size: 10px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3); }
        .badge-vendor-approved { background: #eab308; color: #fff; padding: 4px 10px; font-weight: 700; border-radius: 99px; display: inline-block; font-size: 10px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(234, 179, 8, 0.3); transition: all 0.2s ease; }
        .badge-vendor-approved:hover { background: #ca8a04; transform: scale(1.05); }
        .btn-text { background: transparent; border: none; color: #059669; cursor: pointer; text-decoration: underline; font-size: 11px; font-weight: 700; text-transform: uppercase; transition: opacity 0.2s; text-underline-offset: 3px; }
        .btn-text:hover { opacity: 0.7; color: #047857; }
        
        .pagination-container { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; font-size: 13px; color: #475569; }
        .pagination-buttons { display: flex; gap: 5px; align-items: center; }
        .pagination-buttons button { padding: 6px 12px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; cursor: pointer; font-weight: 500; color: #475569; transition: all 0.2s; }
        .pagination-buttons button:hover:not(:disabled) { background: #f8fafc; border-color: #059669; color: #059669; }
        .pagination-buttons button:disabled { opacity: 0.5; cursor: not-allowed; }
        .current-page { padding: 6px 12px; background: #059669; color: white; border-radius: 6px; font-weight: bold; }
        .status-confirmed { font-weight: 800; color: #059669; }
        .status-pending { font-weight: 800; color: #ca8a04; }
      `}</style>
    </div>
  );
};

export default BookingManagement;
