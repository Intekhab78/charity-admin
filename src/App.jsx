import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import InventoryTable from './components/InventoryTable';
import VendorManagement from './components/VendorManagement';
import CustomerManagement from './components/CustomerManagement';
import BookingManagement from './components/BookingManagement'; // FIXED: Ensure import is here
import PaymentList from './components/PaymentList';
import QurbaniDateMaster from './components/QurbaniDateMaster';
import DepartmentMaster from './components/DepartmentMaster';
import PendingCartList from './components/PendingCartList';
import QurbaniCollection from './components/QurbaniCollection';
import QurbaniComparison from './components/QurbaniComparison';
import OnlinePendingList from './components/OnlinePendingList';
import ReviewsManager from './components/ReviewsManager';
import CreationMaster from './components/CreationMaster';
import QurbaniSchedule from './components/QurbaniSchedule';
import { authService } from './services/api';

import TopNav from './components/TopNav';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.login(credentials);
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', res.data.token);
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) return <div className="loading">Loading...</div>;

  // Role check: Admin or System Administrator
  const isAdmin = user && (user.role?.toLowerCase().includes('admin'));

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="logo-large">
            <div className="avatar" style={{ width: 60, height: 60, fontSize: 24 }}>C</div>
            <h1>Charity ERP Portal</h1>
          </div>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" placeholder="Email address" value={credentials.email} onChange={e => setCredentials({...credentials, email: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={credentials.password} onChange={e => setCredentials({...credentials, password: e.target.value})} required />
            </div>
            <button type="submit">Sign In to Dashboard</button>
          </form>
          <div className="login-footer">Secure Charity Management System v2.0</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container" style={{ flexDirection: 'column' }}>
        <TopNav user={user} sidebarCollapsed={sidebarCollapsed} />
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar user={user} onLogout={handleLogout} isAdmin={isAdmin} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
          
          <main className="main-content" style={{ padding: '20px', backgroundColor: '#ecf0f5' }}>
            <Routes>
            <Route path="/" element={<Navigate to="/inventory" replace />} />
            
            <Route path="/inventory" element={
              <>
                <header><h1>Charity Items</h1></header>
                <InventoryTable user={user} />
              </>
            } />

            <Route path="/customers" element={
              <>
                <header><h1>Charity Customers</h1></header>
                <CustomerManagement user={user} />
              </>
            } />

            <Route path="/bookings" element={
              <>
                <header style={{ marginBottom: '10px' }}><h1>Start Booking</h1></header>
                <BookingManagement user={user} viewMode="form" />
              </>
            } />

            <Route path="/bookings/list" element={
              <>
                <header><h1>Booking List</h1></header>
                <BookingManagement user={user} viewMode="list" />
              </>
            } />

            <Route path="/bookings/payments" element={
              <>
                <header><h1>Payment List</h1></header>
                <PaymentList user={user} />
              </>
            } />

            <Route path="/bookings/pending" element={
              <>
                <header><h1>Pending Cart List</h1></header>
                <PendingCartList user={user} />
              </>
            } />

            <Route path="/bookings/collection" element={
              <>
                <header><h1>Qurbani Collection</h1></header>
                <QurbaniCollection />
              </>
            } />

            <Route path="/bookings/comparison" element={
              <>
                <header><h1>Qurbani Comparison</h1></header>
                <QurbaniComparison />
              </>
            } />

            <Route path="/bookings/schedule" element={
              <>
                <header><h1>Qurbani Schedule</h1></header>
                <QurbaniSchedule />
              </>
            } />

            <Route path="/bookings/full-list" element={
              <>
                <header><h1>Full Booking List</h1></header>
                <BookingManagement user={user} viewMode="list" />
              </>
            } />

            <Route path="/bookings/online-pending" element={
              <>
                <header><h1>Online Debit Pending List</h1></header>
                <OnlinePendingList user={user} />
              </>
            } />

            <Route path="/bookings/reviews" element={
              <>
                <header><h1>Reviews</h1></header>
                <ReviewsManager />
              </>
            } />

            <Route path="/bookings/year/:year" element={
              <>
                <header><h1>Bookings By Year</h1></header>
                <BookingManagement user={user} viewMode="list" />
              </>
            } />

            <Route path="/vendors" element={
              isAdmin ? (
                <>
                  <header><h1>Manage Vendors</h1></header>
                  <VendorManagement />
                </>
              ) : (
                <Navigate to="/inventory" replace />
              )
            } />

            <Route path="/creation-master/:mode" element={
              isAdmin ? (
                <>
                  <header><h1>Creation Master</h1></header>
                  <CreationMaster />
                </>
              ) : (
                <Navigate to="/inventory" replace />
              )
            } />

            <Route path="/qurbani-dates" element={
              isAdmin ? (
                <>
                  <header><h1>Qurbani Dates Master</h1></header>
                  <QurbaniDateMaster />
                </>
              ) : (
                <Navigate to="/inventory" replace />
              )
            } />

            <Route path="/departments-master" element={
              isAdmin ? (
                <>
                  <header><h1>Department Master</h1></header>
                  <DepartmentMaster />
                </>
              ) : (
                <Navigate to="/inventory" replace />
              )
            } />
          </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
