import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Users, CreditCard, Calendar, CheckCircle, Search, Edit3, MoreVertical, Eye, FileText, ArrowLeft, Coins, ShieldCheck, ClipboardList, RefreshCw, Save } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { bookingService, customerService, qurbaniDateService, UPLOADS_BASE_URL } from '../../services/api';
import { toast } from '../../components/common/Toast';
import PageControlPanel from '../../components/common/PageControlPanel';
import ConfirmModal from '../../components/common/ConfirmModal';
import TableSkeleton from '../../components/common/TableSkeleton';
import AnimatedCounter from '../../components/common/AnimatedCounter';

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
  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', type: 'danger', onConfirm: () => {} });

  const triggerConfirm = (config) => {
    setConfirmConfig({
      ...config,
      onConfirm: () => {
        config.onConfirm();
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  // DataTable States
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '', year: '', paymentMode: '', startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleBulkApprove = () => {
    triggerConfirm({
      title: 'Bulk Approve Bookings',
      message: `Are you sure you want to approve ${selectedBookingIds.length} selected booking(s)?`,
      confirmText: 'Approve All',
      type: 'success',
      onConfirm: async () => {
        try {
          await bookingService.bulkApprove(selectedBookingIds);
          toast.success(`Approved ${selectedBookingIds.length} bookings successfully!`);
          setSelectedBookingIds([]);
          fetchBookings();
        } catch (err) {
          toast.error('Bulk approval failed: ' + (err.response?.data?.message || err.message));
        }
      }
    });
  };

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    total_shares: 1,
    share_code: '',
    payment_mode: 'Cash',
    booking_date: '',
    qurbani_date: ''
  });

  const [shares, setShares] = useState([{ beneficiary_name: '', beneficiary_mobile: '', objective: '', amount: 0, share_reg_no: '' }]);

  useEffect(() => {
    const migrate = async () => {
      try { await bookingService.migrateQurbani(); } catch (e) { }
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
    } catch (err) {
      console.error("Failed to load Qurbani Dates:", err);
    }
  };

  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      const { filterStatus, paymentMode, searchTerm: passedSearch } = location.state;
      if (filterStatus !== undefined) {
        setFilters(prev => ({ ...prev, status: filterStatus }));
      }
      if (paymentMode !== undefined) {
        setFilters(prev => ({ ...prev, paymentMode: paymentMode }));
      }
      if (passedSearch !== undefined) {
        setSearchTerm(passedSearch);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (viewMode === 'form') {
      setShowForm(true);
      setErrors({});
      if (routeId) {
        setEditingId(routeId);
      } else {
        setEditingId(null);
        setFormData(prev => ({
          ...prev,
          booking_date: new Date().toISOString().split('T')[0]
        }));
      }
    } else {
      setShowForm(false);
      setEditingId(null);
      setErrors({});
    }
  }, [viewMode, routeId]);

  useEffect(() => {
    if (!editingId && formData.customer_phone) {
      const cleanPhone = String(formData.customer_phone).replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        const dupBooking = bookings.find(b => {
          const matchPhone = String(b.customer_phone || '').replace(/\D/g, '') === cleanPhone;
          const matchBookingDate = formData.booking_date && b.booking_date &&
            new Date(b.booking_date).toISOString().split('T')[0] === new Date(formData.booking_date).toISOString().split('T')[0];
          const matchQurbaniDate = formData.qurbani_date && b.qurbani_date === formData.qurbani_date;
          return matchPhone && (matchBookingDate || matchQurbaniDate);
        });

        if (dupBooking) {
          setDuplicateWarning(`⚠️ A booking for ${formData.customer_name || 'this customer'} (${formData.customer_phone}) already exists on the selected date (Order #${dupBooking.id || dupBooking._id}). Please double check to avoid double entries!`);
        } else {
          setDuplicateWarning(null);
        }
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.customer_phone, formData.customer_name, formData.booking_date, formData.qurbani_date, bookings, editingId]);

  useEffect(() => {
    if ((viewMode === 'form' || viewMode === 'view') && routeId && bookings.length > 0) {
      const booking = bookings.find(b => (b.id?.toString() === routeId.toString() || b._id?.toString() === routeId.toString()));
      if (booking && viewMode === 'form') {
        setFormData({
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          customer_email: booking.customer_email || '',
          total_shares: booking.total_shares,
          share_code: booking.share_code,
          payment_mode: booking.payment_mode || 'Cash',
          booking_date: booking.booking_date ? (() => { const d = new Date(booking.booking_date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : '',
          qurbani_date: booking.qurbani_date || ''
        });
        setShares((booking.shares || []).map(s => ({
          share_reg_no: s.share_reg_no || '',
          beneficiary_name: s.beneficiary_name || '',
          beneficiary_mobile: s.beneficiary_mobile || '',
          objective: s.objective || '',
          amount: s.amount || 0
        })));
      }
    }
  }, [viewMode, routeId, bookings]);

  // Sync shares table with total_shares count and selected share code price
  useEffect(() => {
    // If in edit mode and shares haven't been loaded from database yet, do not sync
    if (editingId && shares.length === 0) {
      return;
    }

    const count = parseInt(formData.total_shares) || 0;
    const selectedShare = shareCodes.find(s => s.code === formData.share_code);
    const defaultPrice = selectedShare ? parseFloat(selectedShare.price) : 0;
    const defaultDept = '';

    let hasChanges = false;
    const currentShares = [...shares];

    if (count > currentShares.length) {
      // Add new rows when total_shares is increased
      for (let i = currentShares.length; i < count; i++) {
        currentShares.push({
          share_reg_no: `REG/${new Date().getFullYear()}/${Math.floor(Math.random() * 10000)}/${i + 1}`,
          beneficiary_name: formData.customer_name || '',
          beneficiary_mobile: formData.customer_phone || '',
          objective: defaultDept,
          amount: defaultPrice
        });
      }
      hasChanges = true;
    } else if (count < currentShares.length) {
      // Remove extra rows when total_shares is decreased
      currentShares.splice(count);
      hasChanges = true;
    }

    // Only auto-update amounts when NOT editing
    if (!editingId) {
      currentShares.forEach(s => {
        if (s.amount !== defaultPrice) {
          s.amount = defaultPrice;
          hasChanges = true;
        }
      });
    }

    if (hasChanges) {
      setShares(currentShares);
    }
  }, [formData.total_shares, formData.customer_name, formData.customer_phone, formData.share_code, shareCodes, departments, editingId, shares]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.list();
      let data = res.data?.data || [];
      if (year) {
        data = data.filter(b => {
          const bYear = new Date(b.booking_date || b.created_at).getFullYear();
          return bYear.toString() === year;
        });
      }
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    if (errors.customer_name) {
      setErrors(prev => ({ ...prev, customer_name: null }));
    }
    if (val.length > 0) {
      const lowerVal = val.toLowerCase();
      const cleanSearch = val.replace(/\D/g, '');

      // Combine dedicated customers and past booking customers for broader search
      const customerCandidates = allCustomers.map(c => ({
        id: c.id || c._id,
        trn_name: c.trn_name || '',
        customer_phone: c.customer_phone || '',
        customer_email: c.customer_email || '',
        isFormal: true
      }));

      const bookingCandidates = bookings.map((b, i) => ({
        id: `b-${b.id || b._id || i}`,
        trn_name: b.customer_name || '',
        customer_phone: b.customer_phone || '',
        customer_email: b.customer_email || '',
        isFormal: false
      }));

      const allPossible = [...customerCandidates, ...bookingCandidates];

      const filtered = allPossible.filter((c, index, self) => {
        const name = (c.trn_name || '').toLowerCase();
        const rawPhone = String(c.customer_phone || '');
        const cleanPhone = rawPhone.replace(/\D/g, '');

        const matchesName = name.includes(lowerVal);
        const matchesPhone = (cleanPhone && cleanSearch && (cleanPhone.includes(cleanSearch) || cleanSearch.includes(cleanPhone))) || rawPhone.includes(val);

        if (!(matchesName || matchesPhone)) return false;

        // Deduplicate by Name + Phone
        return index === self.findIndex(t => (
          (t.trn_name || '').toLowerCase() === name && 
          String(t.customer_phone || '').replace(/\D/g, '') === cleanPhone
        ));
      });

      setFilteredCustomers(filtered.slice(0, 50));
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
      customer_email: c.customer_email || ''
    });
    setShowSuggestions(false);
  };

  const handleShareChange = (index, field, value) => {
    const newShares = [...shares];
    newShares[index][field] = value;
    setShares(newShares);
    // Clear validation error for this row cell if it exists
    if (errors.shares?.[index]?.[field]) {
      const newSharesErrors = [...(errors.shares || [])];
      if (newSharesErrors[index]) {
        const rowErrors = { ...newSharesErrors[index] };
        delete rowErrors[field];
        if (Object.keys(rowErrors).length === 0) {
          newSharesErrors[index] = undefined;
        } else {
          newSharesErrors[index] = rowErrors;
        }
        // Clean up entire shares errors array if no errors remain
        if (newSharesErrors.every(item => item === undefined)) {
          setErrors(prev => {
            const nextErrors = { ...prev };
            delete nextErrors.shares;
            return nextErrors;
          });
        } else {
          setErrors(prev => ({
            ...prev,
            shares: newSharesErrors
          }));
        }
      }
    }
  };

  const calculateTotal = () => shares.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

  const getQRCodeDataUrl = (data) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve(null);
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
  });

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

    // HEADER BAND
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

    // CUSTOMER BOX
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

    // SHARES TABLE
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

    // TOTALS
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.rect(120, finalY - 6, 75, 12, 'FD');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(`Total: Rs. ${bookingData.total_amount || calculateTotal()}`, 193, finalY + 2, { align: 'right' });

    // Render QR Code (Booking Verification details)
    try {
      const qrText = [
        `Charity ERP Booking Receipt`,
        `Order: ${bookingData.id || 'NEW'}`,
        `Customer: ${bookingData.customer_name}`,
        `Phone: ${bookingData.customer_phone}`,
        `Date: ${bookingData.booking_date || new Date().toLocaleDateString()}`,
        `Shares: ${bookingData.total_shares}`,
        `Total Amount: Rs. ${bookingData.total_amount || calculateTotal()}`,
        `Status: Verified`
      ].join('\n');
      
      const qrDataUrl = await getQRCodeDataUrl(qrText);
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'JPEG', 15, finalY - 6, 30, 30);
      }
    } catch (e) {
      console.error('QR code generation failed:', e);
    }

    // FOOTER
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('This is a computer generated receipt. Thank you for your generous donation.', 105, 285, { align: 'center' });
    doc.text(`${co.company_name || 'Charity Organisation'} | ${co.address || ''}`, 105, 290, { align: 'center' });

    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  };

  const handleEdit = (booking) => {
    navigate(`/bookings/edit/${booking.id || booking._id}`);
  };

  const handleDelete = (id) => {
    triggerConfirm({
      title: 'Delete Booking',
      message: 'Are you sure you want to delete this booking? This action is permanent.',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: async () => {
        try {
          await bookingService.delete(id);
          fetchBookings();
          toast.success('Booking deleted successfully!');
        } catch (err) { 
          toast.error('Delete failed: ' + (err.response?.data?.message || err.message)); 
        }
      }
    });
  };

  const handleApprove = (id) => {
    triggerConfirm({
      title: 'Approve Booking',
      message: 'Are you sure you want to approve this booking as Admin?',
      confirmText: 'Approve',
      type: 'success',
      onConfirm: async () => {
        try {
          await bookingService.approve(id);
          toast.success('Booking approved successfully!');
          fetchBookings();
        } catch (err) {
          toast.error('Approval failed: ' + (err.response?.data?.message || err.message));
        }
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customer_name || formData.customer_name.trim().length < 3) {
      newErrors.customer_name = "Customer Name must be at least 3 characters.";
    }
    const mobileRegex = /^[0-9+() -]{10,20}$/;
    if (!formData.customer_phone || !mobileRegex.test(formData.customer_phone.trim())) {
      newErrors.customer_phone = "Please enter a valid mobile number (min 10 digits).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.customer_email && formData.customer_email.trim() && !emailRegex.test(formData.customer_email.trim())) {
      newErrors.customer_email = "Please enter a valid email address.";
    }
    const totalSharesNum = parseInt(formData.total_shares);
    if (isNaN(totalSharesNum) || totalSharesNum < 1 || totalSharesNum > 7) {
      newErrors.total_shares = "Total shares must be between 1 and 7.";
    }
    if (!formData.share_code) {
      newErrors.share_code = "Share Code is required.";
    }
    if (!formData.qurbani_date) {
      newErrors.qurbani_date = "Qurbani Date is required.";
    }
    if (!formData.booking_date) {
      newErrors.booking_date = "Booking Date is required.";
    }

    // Validate shares array
    const sharesErrors = [];
    shares.forEach((s, idx) => {
      const sErr = {};
      if (!s.beneficiary_name || s.beneficiary_name.trim().length < 3) {
        sErr.beneficiary_name = "Name must be at least 3 chars.";
      }
      if (!s.beneficiary_mobile || !mobileRegex.test(s.beneficiary_mobile.trim())) {
        sErr.beneficiary_mobile = "Enter valid mobile.";
      }
      if (!s.objective) {
        sErr.objective = "Department is required.";
      }
      const amt = parseFloat(s.amount);
      if (isNaN(amt) || amt <= 0) {
        sErr.amount = "Amount must be > 0.";
      }
      if (Object.keys(sErr).length > 0) {
        sharesErrors[idx] = sErr;
      }
    });

    if (sharesErrors.length > 0) {
      newErrors.shares = sharesErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please correct inline validation errors first.');
      return;
    }
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
        toast.success('Booking Updated!');
      } else {
        res = await bookingService.create(payload);
        toast.success('Booking Created!');
      }
      payload.id = res?.data?.data?.id || editingId || '';
      payload.companyInfo = companyInfo;

      await generateReceiptPDF(payload);

      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        total_shares: 1,
        share_code: '',
        payment_mode: 'Cash',
        booking_date: '',
        qurbani_date: ''
      });
      setShares([{ beneficiary_name: '', beneficiary_mobile: '', objective: '', amount: 0, share_reg_no: '' }]);

      setEditingId(null);
      setErrors({});
      fetchBookings();
      navigate('/bookings/list');
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const displayedBookings = isAdmin
    ? bookings
    : bookings.filter(b => b.vendor_name === (user?.name || '').trim());

  const totalRevenue = displayedBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const totalShares = displayedBookings.reduce((sum, b) => sum + Number(b.total_shares || 0), 0);
  const pendingApprovals = displayedBookings.filter(b => b.is_approved_by_admin === 0 && !b.is_online_order).length;

  const bookingStats = [
    {
      label: 'Total Bookings',
      value: displayedBookings.length,
      icon: ClipboardList,
      color: '#6366f1',
      bg: '#eef2ff',
      border: 'rgba(99, 102, 241, 0.15)',
    },
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: Coins,
      color: '#10b981',
      bg: '#ecfdf5',
      border: 'rgba(16, 185, 129, 0.15)',
    },
    {
      label: 'Total Shares',
      value: totalShares,
      icon: Users,
      color: '#f59e0b',
      bg: '#fffbeb',
      border: 'rgba(245, 158, 11, 0.15)',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals,
      icon: RefreshCw,
      color: '#ef4444',
      bg: '#fef2f2',
      border: 'rgba(239, 68, 68, 0.15)',
    },
  ];

  const yearsList = Array.from(new Set(bookings.map(b => new Date(b.booking_date || b.created_at).getFullYear().toString()))).sort().reverse();
  const yearOptions = yearsList.map(y => ({ label: y, value: y }));

  const getFilteredBookings = () => {
    let list = displayedBookings.filter(b => {
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (b.customer_name || '').toLowerCase().includes(lowerSearch) ||
        String(b.customer_phone || '').includes(lowerSearch) ||
        (b.vendor_name || '').toLowerCase().includes(lowerSearch) ||
        String(b.id || '').toLowerCase().includes(lowerSearch);

      const matchesStatus = !filters.status || (() => {
        if (filters.status === 'confirmed') return b.is_approved_by_admin === 1 || b.is_online_order;
        if (filters.status === 'pending') return b.is_approved_by_admin === 0 && !b.is_online_order;
        if (filters.status === 'online') return !!b.is_online_order;
        return true;
      })();

      const bYear = new Date(b.booking_date || b.created_at).getFullYear().toString();
      const matchesYear = !filters.year || bYear === filters.year;

      const matchesPayment = !filters.paymentMode || b.payment_mode === filters.paymentMode;

      const bDate = new Date(b.booking_date || b.created_at);
      const bDateTime = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate()).getTime();

      let matchesStartDate = true;
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
        matchesStartDate = bDateTime >= startTime;
      }

      let matchesEndDate = true;
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
        matchesEndDate = bDateTime <= endTime;
      }

      return matchesSearch && matchesStatus && matchesYear && matchesPayment && matchesStartDate && matchesEndDate;
    });

    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'booking_date') {
          aVal = new Date(a.booking_date || a.created_at).getTime();
          bVal = new Date(b.booking_date || b.created_at).getTime();
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        } else if (typeof aVal === 'number') {
          aVal = aVal || 0;
          bVal = bVal || 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return list;
  };

  const filtered = getFilteredBookings();
  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedBookings = filtered.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="qurbani-booking" style={{ padding: 0 }}>

      {/* Main List Section is ALWAYS rendered in background */}
      <PageControlPanel
        title="Booking Database"
        subtitle="Manage and track all customer donation orders"
        icon={ClipboardList}
        stats={bookingStats}
        searchTerm={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
        filters={filters}
        onFilterChange={(f) => { setFilters(f); setCurrentPage(1); }}
        filterOptions={{
          status: [
            { label: 'Confirmed / Approved', value: 'confirmed' },
            { label: 'Pending Approval', value: 'pending' },
            { label: 'Website Orders', value: 'online' }
          ],
          year: yearOptions,
          paymentMode: [
            { label: 'Cash', value: 'Cash' },
            { label: 'Online Transfer', value: 'Online' },
            { label: 'Cheque', value: 'Cheque' }
          ]
        }}
        onAddClick={() => navigate('/bookings/add')}
        addLabel="New Booking"
      />

      <div className="list-table-container border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm bg-white">
        <div className="table-controls border-b border-slate-100 p-6 flex justify-between items-center flex-wrap gap-4">
          <div className="table-controls-left flex items-center gap-4 flex-wrap">
            <div className="show-entries flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <span>Show</span>
              <select value={entriesPerPage} onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-1.5 outline-none cursor-pointer font-bold text-slate-600">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="ml-2">From:</span>
              <input 
                type="date" 
                value={filters.startDate || ''} 
                onChange={e => {
                  setFilters(prev => ({ ...prev, startDate: e.target.value }));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 outline-none text-xs font-semibold"
              />
              <span>To:</span>
              <input 
                type="date" 
                value={filters.endDate || ''} 
                onChange={e => {
                  setFilters(prev => ({ ...prev, endDate: e.target.value }));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 outline-none text-xs font-semibold"
              />
              {(filters.startDate || filters.endDate) && (
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, startDate: '', endDate: '' }))}
                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  title="Clear Date Filters"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="export-buttons flex gap-1.5 flex-wrap">
              <button onClick={() => {
                const text = filtered.map((b, i) => [
                  i + 1,
                  `INV-${b.id || b._id}`,
                  b.customer_name,
                  b.customer_phone,
                  b.vendor_name || companyInfo.company_name || 'Vendor',
                  b.shares ? b.shares.map(s => s.share_reg_no).join('; ') : '',
                  b.total_shares,
                  b.total_shares ? (b.total_amount / b.total_shares) : 0,
                  b.total_amount,
                  b.qurbani_date || '—',
                  new Date(b.booking_date || b.created_at).toLocaleDateString()
                ].join('\t')).join('\n');
                navigator.clipboard.writeText("S.No\tInvoice\tCustomer Name\tPhone\tVendor\tReg. No\tShares\tRate\tTotal Amount\tQurbani Day\tOrder Date\n" + text)
                  .then(() => toast.success("Copied to clipboard!"))
                  .catch(() => toast.error("Failed to copy data."));
              }} className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-500 hover:text-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 transition-all cursor-pointer">Copy</button>
              <button onClick={() => {
                const headers = ['SNo.', 'INVOICE', 'CUSTOMER NAME', 'PHONE', 'VENDOR', 'REG. NO', 'SHARES', 'RATE', 'TOTAL AMOUNT', 'QURBANI DAY', 'ORDER DATE'];
                const rows = filtered.map((b, i) => [
                  i + 1,
                  `INV-${b.id || b._id}`,
                  `"${(b.customer_name || '').replace(/"/g, '""')}"`,
                  `"${(b.customer_phone || '').replace(/"/g, '""')}"`,
                  `"${(b.vendor_name || companyInfo.company_name || 'Vendor').replace(/"/g, '""')}"`,
                  `"${(b.shares ? b.shares.map(s => s.share_reg_no).join('; ') : '').replace(/"/g, '""')}"`,
                  b.total_shares,
                  b.total_shares ? (b.total_amount / b.total_shares) : 0,
                  b.total_amount,
                  `"${(b.qurbani_date || '—').replace(/"/g, '""')}"`,
                  new Date(b.booking_date || b.created_at).toLocaleDateString()
                ].map(val => String(val)).join(','));
                const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(headers.join(',') + '\n' + rows.join('\n'));
                const link = document.createElement('a');
                link.href = csvContent;
                link.download = 'bookings.csv';
                link.click();
              }} className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-500 hover:text-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 transition-all cursor-pointer">CSV</button>
              {isAdmin && selectedBookingIds.length > 0 && (
                <button onClick={handleBulkApprove} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm">
                  Approve Selected ({selectedBookingIds.length})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="dense-data-table">
            <thead>
              <tr className="tbl-head-row">
                {isAdmin && (
                  <th style={{ width: '40px' }} className="text-center">
                    <input 
                      type="checkbox" 
                      checked={
                        paginatedBookings.filter(b => b.is_approved_by_admin === 0 && !b.is_online_order).length > 0 &&
                        paginatedBookings.filter(b => b.is_approved_by_admin === 0 && !b.is_online_order).every(b => selectedBookingIds.includes(b._id || b.id))
                      }
                      onChange={() => {
                        const checkable = paginatedBookings.filter(b => b.is_approved_by_admin === 0 && !b.is_online_order);
                        const allSelected = checkable.length > 0 && checkable.every(b => selectedBookingIds.includes(b._id || b.id));
                        if (allSelected) {
                          const idsToRemove = checkable.map(b => b._id || b.id);
                          setSelectedBookingIds(prev => prev.filter(id => !idsToRemove.includes(id)));
                        } else {
                          const idsToAdd = checkable.map(b => b._id || b.id).filter(id => !selectedBookingIds.includes(id));
                          setSelectedBookingIds(prev => [...prev, ...idsToAdd]);
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </th>
                )}
                <th style={{ width: '48px' }} className="text-center">#</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                  Invoice {sortConfig.key === 'id' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customer_name')}>
                  Customer {sortConfig.key === 'customer_name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('vendor_name')}>
                  Vendor {sortConfig.key === 'vendor_name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th>Reg. No</th>
                <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('total_shares')}>
                  Shares {sortConfig.key === 'total_shares' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th className="text-right">Rate</th>
                <th className="text-right" style={{ cursor: 'pointer' }} onClick={() => handleSort('total_amount')}>
                  Total Amount {sortConfig.key === 'total_amount' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('qurbani_date')}>
                  Qurbani Day {sortConfig.key === 'qurbani_date' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('booking_date')}>
                  Order Date {sortConfig.key === 'booking_date' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('is_approved_by_admin')}>
                  Status {sortConfig.key === 'is_approved_by_admin' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                </th>
                <th className="text-right pr-6" style={{ width: isAdmin ? '240px' : '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} cols={isAdmin ? 13 : 12} hasAvatar={false} />
              ) : paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 13 : 12} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-sm text-slate-300">
                        <ClipboardList size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm">No Bookings Found</h4>
                        <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or search terms.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((b, i) => {
                  const globalIndex = startIndex + i + 1;
                  const sourceType = getBookingSourceType(b);
                  const rate = b.total_shares ? (b.total_amount / b.total_shares) : 0;
                  return (
                    <tr key={b._id || b.id} className={`source-row source-${sourceType}`}>
                      {isAdmin && (
                        <td className="text-center">
                          {b.is_approved_by_admin === 0 && !b.is_online_order ? (
                            <input 
                              type="checkbox"
                              checked={selectedBookingIds.includes(b._id || b.id)}
                              onChange={() => {
                                const bId = b._id || b.id;
                                setSelectedBookingIds(prev => 
                                  prev.includes(bId) ? prev.filter(id => id !== bId) : [...prev, bId]
                                );
                              }}
                              className="cursor-pointer"
                            />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      )}
                      <td className="text-center font-medium text-slate-400">{globalIndex}</td>
                      <td className="font-mono text-xs font-bold text-slate-500">INV-{b.id || b._id}</td>
                      <td>
                        <div className="font-bold text-slate-800">{b.customer_name}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">{b.customer_phone}</div>
                      </td>
                      <td>
                        <div className="font-medium text-slate-600">{b.vendor_name || companyInfo.company_name || 'Vendor'}</div>
                      </td>
                      <td>
                        {b.shares && b.shares.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="reg-cell">{b.shares[0].share_reg_no}</span>
                            {b.shares.length > 1 && (
                              <span className="text-[10px] text-slate-400 font-medium italic mt-0.5">
                                + {b.shares.length - 1} more share(s)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="text-center font-semibold text-slate-700">{b.total_shares}</td>
                      <td className="text-right font-semibold text-slate-600">
                        ₹{Number(rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-right font-extrabold text-slate-900 pr-4">₹{Number(b.total_amount).toLocaleString('en-IN')}</td>
                      <td className="font-bold text-emerald-600">{b.qurbani_date || '—'}</td>
                      <td className="text-slate-500 text-xs">{new Date(b.booking_date || b.created_at).toLocaleDateString()}</td>
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
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => navigate(`/bookings/view/${b.id || b._id}`)} className="btn-view" data-tooltip="View Details"><Eye size={13} /></button>
                          <button onClick={() => generateReceiptPDF({ ...b, companyInfo })} className="btn-print" data-tooltip="Print Receipt"><FileText size={13} /></button>
                          {isAdmin && !b.is_online_order && (
                            <button onClick={() => handleEdit(b)} className="btn-edit" data-tooltip="Edit Booking"><Edit3 size={13} /></button>
                          )}
                          {isAdmin && !b.is_online_order && (
                            <button onClick={() => handleDelete(b.id)} className="btn-delete" data-tooltip="Delete Booking"><Trash2 size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalEntries > 0 && (() => {
          const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
          return (
            <div className="pagination-container px-6 py-4 flex justify-between items-center border-t border-slate-100">
              <div className="pagination-info text-xs text-slate-400 font-medium">
                Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
              </div>
              <div className="pagination-buttons flex gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >Previous</button>
                <span className="current-page px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold">{currentPage}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >Next</button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* VIEW (Read-Only) Modal overlay — Premium Redesign */}
      {viewMode === 'view' && (() => {
        const b = bookings.find(bk => (bk.id?.toString() === (routeId || '').toString() || bk._id?.toString() === (routeId || '').toString()));
        const statusBadge = b?.is_online_order ? { label: 'Website Order', color: '#3b82f6', bg: '#eff6ff' } : b?.is_approved_by_admin === 1 ? { label: 'Approved', color: '#059669', bg: '#ecfdf5' } : { label: 'Pending', color: '#d97706', bg: '#fffbeb' };
        return (
          <div className="premium-modal-overlay">
            <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '860px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.2)' }}>

              {/* Gradient Header */}
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f4c35 100%)', padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', background: 'rgba(16,185,129,0.12)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '120px', height: '120px', background: 'rgba(99,102,241,0.08)', borderRadius: '50%' }} />
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '40px', height: '40px', background: 'rgba(16,185,129,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Eye size={20} color="#10b981" />
                      </div>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Booking Order</p>
                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>INV-{b?.id || b?._id || '—'}</h2>
                      </div>
                    </div>
                    {b && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: statusBadge.bg, color: statusBadge.color, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{statusBadge.label}</span>}
                  </div>
                  <button onClick={() => navigate('/bookings/list')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ overflowY: 'auto', padding: '28px 32px', flex: 1 }}>
                {!b ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Booking not found.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Customer Info Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      {[
                        { icon: '👤', label: 'Customer Name', val: b.customer_name, accent: '#6366f1' },
                        { icon: '📞', label: 'Phone', val: b.customer_phone, accent: '#10b981' },
                        { icon: '✉️', label: 'Email', val: b.customer_email || 'N/A', accent: '#3b82f6' },
                        { icon: '🏷️', label: 'Share Code', val: b.share_code, accent: '#f59e0b' },
                        { icon: '🗓️', label: 'Booking Date', val: new Date(b.booking_date || b.created_at).toLocaleDateString(), accent: '#8b5cf6' },
                        { icon: '📅', label: 'Qurbani Date', val: b.qurbani_date || 'N/A', accent: '#059669' },
                        { icon: '💳', label: 'Payment Mode', val: b.payment_mode || 'Cash', accent: '#ef4444' },
                        { icon: '🏢', label: 'Vendor', val: b.vendor_name || companyInfo.company_name || 'Admin', accent: '#64748b' },
                      ].map(({ icon, label, val, accent }) => (
                        <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', borderLeft: `3px solid ${accent}` }}>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>{icon} {label}</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', wordBreak: 'break-word' }}>{val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Amount Summary Strip */}
                    <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1px solid #a7f3d0', borderRadius: '16px', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Shares</div>
                          <div style={{ fontSize: '24px', fontWeight: '900', color: '#065f46', fontFamily: 'Outfit, sans-serif' }}>{b.total_shares}</div>
                        </div>
                        <div style={{ width: '1px', background: '#a7f3d0' }} />
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Total</div>
                          <div style={{ fontSize: '28px', fontWeight: '900', color: '#065f46', fontFamily: 'Outfit, sans-serif' }}>₹{Number(b.total_amount || 0).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600', textAlign: 'right' }}>Per Share: ₹{b.total_shares ? Number((b.total_amount || 0) / b.total_shares).toLocaleString('en-IN') : '0'}</div>
                    </div>

                    {/* Shares Table */}
                    {b.shares && b.shares.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <div style={{ width: '4px', height: '18px', background: 'linear-gradient(180deg, #6366f1, #8b5cf6)', borderRadius: '4px' }} />
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Sacrificial Share Allocations</h3>
                          <span style={{ marginLeft: 'auto', background: '#eef2ff', color: '#6366f1', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{b.shares.length} share{b.shares.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
                            <thead>
                              <tr style={{ background: 'linear-gradient(90deg, #0f172a, #1e293b)', color: 'rgba(255,255,255,0.7)' }}>
                                {['#', 'Reg No.', 'Beneficiary', 'Mobile', 'Objective', 'Amount'].map((h, hi) => (
                                  <th key={h} style={{ padding: '12px 14px', textAlign: hi === 5 ? 'right' : 'left', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {b.shares.map((s, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                                  <td style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: '600' }}>{i + 1}</td>
                                  <td style={{ padding: '12px 14px' }}><span style={{ background: '#eef2ff', color: '#6366f1', fontFamily: 'monospace', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #c7d2fe' }}>{s.share_reg_no}</span></td>
                                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>{s.beneficiary_name}</td>
                                  <td style={{ padding: '12px 14px', color: '#475569', fontSize: '12px' }}>{s.beneficiary_mobile}</td>
                                  <td style={{ padding: '12px 14px' }}><span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>{s.objective}</span></td>
                                  <td style={{ padding: '12px 14px', fontWeight: '800', color: '#059669', textAlign: 'right' }}>₹{Number(s.amount || 0).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                {b && (
                  <button onClick={() => generateReceiptPDF({ ...b, companyInfo })} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.25)' }}>
                    <FileText size={15} /> Print Receipt
                  </button>
                )}
                {isAdmin && b && !b.is_online_order && (
                  <button onClick={() => navigate(`/bookings/edit/${b.id || b._id}`)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
                    <Edit3 size={15} /> Edit Booking
                  </button>
                )}
                <button onClick={() => navigate('/bookings/list')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                  <X size={15} /> Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CREATE / EDIT Form modal overlay — Premium Redesign */}
      {showForm && viewMode !== 'view' && (
        <div className="premium-modal-overlay">
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '960px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)' }}>

            {/* Gradient Header */}
            <div style={{ background: editingId ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)' : 'linear-gradient(135deg, #0f172a 0%, #064e3b 60%, #059669 100%)', padding: '26px 32px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: '-50px', left: '20%', width: '140px', height: '140px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '46px', height: '46px', background: 'rgba(255,255,255,0.12)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                    {editingId ? <Edit3 size={22} color="#fff" /> : <Plus size={22} color="#fff" />}
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{editingId ? 'Edit Record' : 'New Record'}</p>
                    <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>{editingId ? 'Update Booking Order' : 'Create New Booking Order'}</h2>
                  </div>
                </div>
                <button onClick={() => navigate('/bookings/list')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Scrollable Body */}
              <div style={{ overflowY: 'auto', padding: '28px 32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Section: Customer Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '4px', height: '18px', background: 'linear-gradient(180deg, #10b981, #059669)', borderRadius: '4px' }} />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Customer Information</span>
                  </div>
                  {duplicateWarning && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', padding: '12px 16px', borderRadius: '12px', fontSize: '12.5px', fontWeight: '600', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.05)' }}>
                      {duplicateWarning}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    {/* Customer Name with autocomplete */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Customer Name *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          placeholder="Search or Enter Name"
                          value={formData.customer_name}
                          onChange={e => handleNameChange(e.target.value)}
                          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; setTimeout(() => setShowSuggestions(false), 200); }}
                          required
                          style={{ width: '100%', padding: '11px 40px 11px 14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.2s' }}
                          onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)'; }}
                        />
                        <Search size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      </div>
                      {errors.customer_name && <span style={{ display: 'block', color: '#f43f5e', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>{errors.customer_name}</span>}
                      {showSuggestions && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', marginTop: '4px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                          {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                            <div key={c.id || c._id} onClick={() => selectCustomer(c)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                              <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{c.trn_name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{c.customer_phone}</div>
                            </div>
                          )) : (
                            <div style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>No matching customers found</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Phone No. *</label>
                      <input placeholder="Enter Mobile" value={formData.customer_phone} onChange={e => { setFormData({ ...formData, customer_phone: e.target.value }); if (errors.customer_phone) setErrors(prev => ({ ...prev, customer_phone: null })); }} required
                        style={{ width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                      />
                      {errors.customer_phone && <span style={{ display: 'block', color: '#f43f5e', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>{errors.customer_phone}</span>}
                    </div>

                    {/* Email */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Email Address</label>
                      <input type="email" placeholder="Optional email" value={formData.customer_email} onChange={e => { setFormData({ ...formData, customer_email: e.target.value }); if (errors.customer_email) setErrors(prev => ({ ...prev, customer_email: null })); }}
                        style={{ width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                      />
                      {errors.customer_email && <span style={{ display: 'block', color: '#f43f5e', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>{errors.customer_email}</span>}
                    </div>
                  </div>
                </div>

                {/* Section: Order Configuration */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '4px', height: '18px', background: 'linear-gradient(180deg, #6366f1, #8b5cf6)', borderRadius: '4px' }} />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Order Configuration</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    {/* Total Shares */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Total Shares *</label>
                      <input type="number" min="1" max="7" value={formData.total_shares} onChange={e => { setFormData({ ...formData, total_shares: e.target.value }); if (errors.total_shares) setErrors(prev => ({ ...prev, total_shares: null })); }} required
                        style={{ width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                      />
                      {errors.total_shares && <span style={{ display: 'block', color: '#f43f5e', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>{errors.total_shares}</span>}
                    </div>

                    {/* Share Code */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Share Code *</label>
                      <select value={formData.share_code} onChange={e => { setFormData({ ...formData, share_code: e.target.value }); if (errors.share_code) setErrors(prev => ({ ...prev, share_code: null })); }} required
                        style={{ width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}>
                        <option value="" disabled>Select Share Code</option>
                        {shareCodes.map(s => <option key={`${s.id}-${s.code}`} value={s.code}>{s.display}</option>)}
                      </select>
                      {errors.share_code && <span style={{ display: 'block', color: '#f43f5e', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>{errors.share_code}</span>}
                    </div>

                    {/* Qurbani Date */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Qurbani Date / Day *</label>
                      <select value={formData.qurbani_date} onChange={e => { setFormData({ ...formData, qurbani_date: e.target.value }); if (errors.qurbani_date) setErrors(prev => ({ ...prev, qurbani_date: null })); }} required
                        style={{ width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}>
                        <option value="" disabled>Select Qurbani Date / Day</option>
                        {qurbaniDates.length > 0 ? qurbaniDates.map(d => {
                          const dateStr = d.actual_date ? ` (${new Date(d.actual_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})` : '';
                          const descStr = d.description ? ` — ${d.description}` : '';
                          return <option key={d.id} value={d.qurbani_date}>{d.qurbani_date}{dateStr}{descStr}</option>;
                        }) : <option value="">No active dates</option>}
                      </select>
                      {errors.qurbani_date && <span style={{ display: 'block', color: '#f43f5e', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>{errors.qurbani_date}</span>}
                    </div>
                  </div>

                  {/* Selected Share Image Preview */}
                  {shareCodes.find(s => s.code === formData.share_code)?.image && (
                    <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1px solid #a7f3d0', borderRadius: '14px', width: 'fit-content' }}>
                      <img src={`${UPLOADS_BASE_URL}/uploads/${shareCodes.find(s => s.code === formData.share_code).image}`} alt="Item Preview" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '2px solid #6ee7b7' }} />
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Selected Item Preview</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#065f46' }}>{shareCodes.find(s => s.code === formData.share_code)?.name}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Share Allocations */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '4px', height: '18px', background: 'linear-gradient(180deg, #f59e0b, #d97706)', borderRadius: '4px' }} />
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sacrificial Share Allocations</span>
                      <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{shares.length} row{shares.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Booking Date:</label>
                      <input type="date" value={formData.booking_date} onChange={e => { setFormData({ ...formData, booking_date: e.target.value }); if (errors.booking_date) setErrors(prev => ({ ...prev, booking_date: null })); }}
                        style={{ padding: '7px 12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: '#f8fafc', fontFamily: 'inherit', transition: 'all 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      />
                      {errors.booking_date && <span style={{ display: 'block', color: '#f43f5e', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>{errors.booking_date}</span>}
                    </div>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
                        <thead>
                          <tr style={{ background: 'linear-gradient(90deg, #1e293b, #334155)' }}>
                            {['#', 'Reg No. (Auto)', 'Beneficiary Name *', 'Mobile *', 'Department', 'Amount (₹) *'].map((h, hi) => (
                              <th key={h} style={{ padding: '12px 14px', textAlign: hi === 5 ? 'right' : 'left', color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {shares.map((s, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                              <td style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: '700', fontSize: '13px' }}>{i + 1}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <input value={s.share_reg_no} onChange={e => handleShareChange(i, 'share_reg_no', e.target.value)} placeholder="Auto-Gen" readOnly
                                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', background: '#f8fafc', color: '#64748b', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }} />
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <input value={s.beneficiary_name} onChange={e => handleShareChange(i, 'beneficiary_name', e.target.value)} required placeholder="Full Name"
                                  style={{ width: '100%', padding: '8px 10px', border: errors.shares?.[i]?.beneficiary_name ? '1px solid #f43f5e' : '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                                  onFocus={e => e.target.style.borderColor = errors.shares?.[i]?.beneficiary_name ? '#f43f5e' : '#10b981'}
                                  onBlur={e => e.target.style.borderColor = errors.shares?.[i]?.beneficiary_name ? '#f43f5e' : '#e2e8f0'} />
                                {errors.shares?.[i]?.beneficiary_name && <span style={{ display: 'block', color: '#f43f5e', fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }}>{errors.shares[i].beneficiary_name}</span>}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <input value={s.beneficiary_mobile} onChange={e => handleShareChange(i, 'beneficiary_mobile', e.target.value)} required placeholder="Mobile"
                                  style={{ width: '100%', padding: '8px 10px', border: errors.shares?.[i]?.beneficiary_mobile ? '1px solid #f43f5e' : '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                                  onFocus={e => e.target.style.borderColor = errors.shares?.[i]?.beneficiary_mobile ? '#f43f5e' : '#10b981'}
                                  onBlur={e => e.target.style.borderColor = errors.shares?.[i]?.beneficiary_mobile ? '#f43f5e' : '#e2e8f0'} />
                                {errors.shares?.[i]?.beneficiary_mobile && <span style={{ display: 'block', color: '#f43f5e', fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }}>{errors.shares[i].beneficiary_mobile}</span>}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <select value={s.objective} onChange={e => handleShareChange(i, 'objective', e.target.value)}
                                  style={{ width: '100%', padding: '8px 10px', border: errors.shares?.[i]?.objective ? '1px solid #f43f5e' : '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', boxSizing: 'border-box', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                                  onFocus={e => e.target.style.borderColor = errors.shares?.[i]?.objective ? '#f43f5e' : '#6366f1'}
                                  onBlur={e => e.target.style.borderColor = errors.shares?.[i]?.objective ? '#f43f5e' : '#e2e8f0'}>
                                  <option value="">Select Department</option>
                                  {departments.length > 0 ? departments.map(d => <option key={d.id} value={d.dept_name}>{d.dept_name}</option>) : <option disabled>Loading...</option>}
                                </select>
                                {errors.shares?.[i]?.objective && <span style={{ display: 'block', color: '#f43f5e', fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }}>{errors.shares[i].objective}</span>}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <input type="number" value={s.amount} onChange={e => handleShareChange(i, 'amount', e.target.value)} required
                                  style={{ width: '100%', padding: '8px 10px', border: errors.shares?.[i]?.amount ? '1px solid #f43f5e' : '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textAlign: 'right', background: '#fff', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                                  onFocus={e => e.target.style.borderColor = errors.shares?.[i]?.amount ? '#f43f5e' : '#059669'}
                                  onBlur={e => e.target.style.borderColor = errors.shares?.[i]?.amount ? '#f43f5e' : '#e2e8f0'} />
                                {errors.shares?.[i]?.amount && <span style={{ display: 'block', color: '#f43f5e', fontSize: '9px', fontWeight: 'bold', marginTop: '2px', textAlign: 'right' }}>{errors.shares[i].amount}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div style={{ borderTop: '2px solid #f1f5f9', padding: '18px 32px', background: '#fafafa', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                {/* Total Amount */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1px solid #a7f3d0', borderRadius: '14px', padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Invoice Amount</span>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#065f46', fontFamily: 'Outfit, sans-serif', lineHeight: 1.2 }}>₹{calculateTotal().toLocaleString('en-IN')}</span>
                  </div>
                  {/* Payment Mode */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>Payment Mode</label>
                    <select value={formData.payment_mode} onChange={e => setFormData({ ...formData, payment_mode: e.target.value })}
                      style={{ padding: '9px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '700', background: '#fff', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => { e.target.style.borderColor = '#6366f1'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}>
                      <option value="Cash">💵 Cash</option>
                      <option value="Online">🌐 Online Transfer</option>
                      <option value="Cheque">📑 Cheque</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button type="button" onClick={() => navigate('/bookings/list')}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                    <X size={14} /> Cancel
                  </button>
                  <button type="submit"
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 24px', background: editingId ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: editingId ? '0 4px 14px rgba(99,102,241,0.35)' : '0 4px 14px rgba(5,150,105,0.35)', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = editingId ? '0 8px 20px rgba(99,102,241,0.4)' : '0 8px 20px rgba(5,150,105,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = editingId ? '0 4px 14px rgba(99,102,241,0.35)' : '0 4px 14px rgba(5,150,105,0.35)'; }}>
                    <Save size={15} /> {editingId ? 'Update Booking' : 'Submit Booking'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .qurbani-booking { padding: 0px; color: #0f172a; font-family: 'Inter', sans-serif; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
        .title { font-size: 24px; font-weight: 800; color: #0f172a; }
        
        .add-btn { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        .add-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); }

        .booking-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); border-radius: 24px; border: 1px solid rgba(226, 232, 240, 0.8); padding: 30px; box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.05); margin-bottom: 40px; }
        .card-header-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
        .card-header-main h3 { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px; color: #0f172a; }
        .close-link { background: none; border: none; color: #ef4444; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }

        .header-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; align-items: flex-end; }
        .input-field label { display: block; font-size: 11.5px; font-weight: 800; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.02em; }
        .search-input-wrapper { position: relative; }
        .search-icon { position: absolute; right: 12px; top: 12px; color: #94a3b8; }
        .input-field input, .input-field select { width: 100%; padding: 12px 15px; border: 2px solid #f1f5f9; border-radius: 12px; font-size: 14px; transition: all 0.2s; outline: none; background: #f8fafc; }
        .input-field input:focus, .input-field select:focus { border-color: #10b981; background: #ffffff; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12); }

        .table-header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; }
        .date-picker-wrapper { display: flex; align-items: center; gap: 10px; }
        .date-picker-wrapper label { font-size: 13px; font-weight: 700; color: #64748b; }
        .date-input { padding: 8px 12px; border: 2px solid #f1f5f9; border-radius: 10px; font-size: 14px; outline: none; background: #f8fafc; transition: all 0.2s; }
        .date-input:focus { border-color: #10b981; background: #ffffff; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12); }

        .table-wrapper { border: 1px solid #f1f5f9; border-radius: 16px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; min-width: 800px; }
        th { background: #f8fafc; padding: 15px; text-align: left; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; white-space: nowrap; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
        td input, td select { padding: 8px 12px !important; border-width: 1px !important; width: 100%; box-sizing: border-box; border-radius: 8px; border: 1px solid #e2e8f0 !important; outline: none; transition: all 0.2s; }
        td input:focus, td select:focus { border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12); }
        .readonly-input { background: #f8fafc; border-color: #e2e8f0 !important; color: #64748b; }

        .footer-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid #f1f5f9; flex-wrap: wrap; gap: 20px; }
        .price-text { font-size: 28px; color: #0f172a; margin-left: 10px; font-weight: 800; }
        .payment-select { display: flex; gap: 15px; flex-wrap: wrap; }
        .submit-booking-btn { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; border: none; padding: 15px 30px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        .submit-booking-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); }

        @media (max-width: 640px) {
          .footer-actions { flex-direction: column; align-items: stretch; text-align: center; }
          .payment-select { flex-direction: column; align-items: stretch; width: 100%; }
        }

        .bookings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
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

        /* ── Premium Booking List Table ── */
        .list-table-container { background: #fff; padding: 0; border-radius: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 10px 30px -5px rgba(15,23,42,0.05); border: 1px solid #e2e8f0; overflow: hidden; }

        /* Hero header */
        .tbl-hero { display: flex; justify-content: space-between; align-items: center; padding: 24px 28px; gap: 16px; flex-wrap: wrap; }
        .tbl-hero-left { display: flex; align-items: center; gap: 16px; }
        .tbl-icon { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(16,185,129,0.25); }
        .tbl-title { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
        .tbl-subtitle { margin: 3px 0 0; font-size: 13px; color: #94a3b8; font-weight: 500; }
        .tbl-hero-right { display: flex; align-items: center; gap: 10px; }
        .tbl-new-btn { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(16,185,129,0.2); }
        .tbl-new-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16,185,129,0.3); }
        .tbl-divider { height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent); margin: 0; }

        /* Controls bar */
        .table-controls { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 28px; margin-bottom: 0; flex-wrap: wrap; border-bottom: 1px solid #f1f5f9; }
        .table-controls-left { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .show-entries { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; font-weight: 500; }
        .show-entries select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 32px 8px 12px; font-size: 13px; color: #334155; outline: none; background: #f8fafc; cursor: pointer; transition: all 0.2s; font-weight: 600; appearance: auto; }
        .show-entries select:focus { border-color: #10b981; background: #fff; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }

        /* Export pill buttons */
        .export-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
        .export-buttons button { background: #f8fafc; border: 1px solid #e2e8f0; padding: 7px 14px; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: 600; color: #64748b; transition: all 0.2s; letter-spacing: 0.01em; }
        .export-buttons button:hover { background: #10b981; border-color: #10b981; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(16,185,129,0.15); }

        /* Search box */
        .search-box { display: flex; align-items: center; gap: 10px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 16px; background: #f8fafc; transition: all 0.2s; min-width: 260px; }
        .search-box svg { color: #94a3b8; flex-shrink: 0; }
        .search-box input { border: none; outline: none; background: transparent; font-size: 13px; color: #334155; width: 100%; font-family: 'Inter', sans-serif; }
        .search-box input::placeholder { color: #94a3b8; }
        .search-box:focus-within { border-color: #10b981; background: #fff; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }

        /* Data Table */
        .data-table-wrapper { overflow-x: auto; border-radius: 0; border: none; margin: 0; }
        .dense-data-table { width: 100%; border-collapse: collapse; min-width: 1060px; font-size: 13px; font-family: 'Inter', sans-serif; }
        .dense-data-table thead { position: sticky; top: 0; z-index: 1; }
        .tbl-head-row th { background: #0f172a; padding: 14px 20px; border-bottom: none; text-align: left; color: rgba(255,255,255,0.7); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.09em; white-space: nowrap; }
        .tbl-head-row th:first-child { border-radius: 0; }
        .dense-data-table td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; transition: background 0.15s; font-size: 13px; }
        .dense-data-table tbody tr:last-child td { border-bottom: none; }

        /* Source row accent */
        .source-row:hover td { background-color: #f8fafc !important; }
        .source-online td:first-child { border-left: 3px solid #3b82f6; padding-left: 17px; }
        .source-vendor td:first-child { border-left: 3px solid #10b981; padding-left: 17px; }
        .source-international td:first-child { border-left: 3px solid #f59e0b; padding-left: 17px; }
        .source-admin td:first-child { border-left: 3px solid #8b5cf6; padding-left: 17px; }

        /* Utility */
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; color: #0f172a; }
        .text-muted { color: #94a3b8; font-size: 12px; }
        .reg-cell { line-height: 1.6; font-family: monospace; font-size: 11.5px; color: #475569; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; display: inline-block; letter-spacing: 0.03em; }

        /* Badges */
        .badge-approved { background: #ecfdf5; color: #059669; border: 1px solid #bbf7d0; padding: 5px 12px; font-weight: 700; border-radius: 20px; display: inline-block; font-size: 11px; letter-spacing: 0.02em; }
        .badge-vendor-approved { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 5px 12px; font-weight: 700; border-radius: 20px; display: inline-block; font-size: 11px; cursor: pointer; transition: all 0.2s; }
        .badge-vendor-approved:hover { background: #fef3c7; }

        /* Action buttons */
        .btn-view, .btn-print, .btn-edit, .btn-delete { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
        .btn-view { background: #ecfdf5; color: #059669; border: 1px solid #6ee7b7; }
        .btn-view:hover { background: #059669; color: #fff; border-color: #059669; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(5,150,105,0.25); }
        .btn-print { background: #eff6ff; color: #2563eb; border: 1px solid #93c5fd; }
        .btn-print:hover { background: #2563eb; color: #fff; border-color: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(37,99,235,0.25); }
        .btn-edit { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }
        .btn-edit:hover { background: #d97706; color: #fff; border-color: #d97706; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(217,119,6,0.25); }
        .btn-delete { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
        .btn-delete:hover { background: #dc2626; color: #fff; border-color: #dc2626; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(220,38,38,0.25); }

        /* Status text */
        .status-confirmed { font-weight: 700; color: #059669; font-size: 12px; }
        .status-pending { font-weight: 700; color: #d97706; font-size: 12px; }

        /* Pagination */
        .pagination-container { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b; font-weight: 500; }
        .pagination-info { color: #94a3b8; font-size: 13px; }
        .pagination-buttons { display: flex; gap: 6px; align-items: center; }
        .pagination-buttons button { padding: 8px 16px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; color: #475569; transition: all 0.2s; }
        .pagination-buttons button:hover:not(:disabled) { background: #10b981; border-color: #10b981; color: #fff; }
        .pagination-buttons button:disabled { opacity: 0.4; cursor: not-allowed; }
        .current-page { padding: 8px 16px; background: #10b981; color: #fff; border-radius: 8px; font-weight: 700; font-size: 13px; }
      `}</style>

      <ConfirmModal 
        isOpen={confirmOpen} 
        onCancel={() => setConfirmOpen(false)} 
        {...confirmConfig} 
      />
    </div>
  );
};

export default BookingManagement;
