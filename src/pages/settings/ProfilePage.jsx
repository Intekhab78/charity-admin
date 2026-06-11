import React, { useState, useEffect } from 'react';
import { User, Lock, Save, Eye, EyeOff, Camera } from 'lucide-react';
import { authService, UPLOADS_BASE_URL } from '../../services/api';
import { toast } from '../../components/common/Toast';

const ProfilePage = ({ user, onUpdateUser }) => {
  const [currentUser, setCurrentUser] = useState(user || {});
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await authService.getMe();
        if (res.data.success && res.data.data) {
          setCurrentUser(res.data.data);
          if (onUpdateUser) {
            onUpdateUser(res.data.data);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };
    fetchMe();
  }, []);

  const handleAvatarChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      setUploadingAvatar(true);
      const res = await authService.uploadAvatar(formData);
      if (res.data.success) {
        toast.success("Profile photo updated!");
        const updatedUser = { ...currentUser, profile_image: res.data.profile_image };
        setCurrentUser(updatedUser);
        
        // Update user in local storage
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        savedUser.profile_image = res.data.profile_image;
        localStorage.setItem('user', JSON.stringify(savedUser));
        
        if (onUpdateUser) onUpdateUser(updatedUser);
        
        // Force reload page to ensure all components see the new image
        window.location.reload();
      }
    } catch (err) {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirm password do not match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (res.data.success) {
        toast.success("Password changed successfully!");
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(res.data.message || "Failed to change password.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Error changing password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-4 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-sm">
          <User size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-outfit text-slate-900 tracking-tight">Account Profile</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage your personal account profile details and security settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Sidebar card */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="premium-card p-6 flex flex-col items-center text-center">
            <div className="relative group w-24 h-24 mb-4">
              <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center text-3xl font-black shadow-lg shadow-primary/20 border-4 border-white overflow-hidden relative">
                {currentUser.profile_image ? (
                  <img src={`${UPLOADS_BASE_URL}/uploads/${currentUser.profile_image}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'
                )}
                
                <label className="absolute inset-0 bg-black/50 hidden group-hover:flex flex-col gap-1 items-center justify-center cursor-pointer transition-all z-10">
                  {uploadingAvatar ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                </label>
              </div>
            </div>
            <h2 className="text-lg font-bold text-slate-800 font-outfit">{currentUser.name || 'User'}</h2>
            <span className="bg-slate-100 text-slate-600 font-mono font-bold px-3 py-1 rounded-full text-xs mt-1 border border-slate-200 uppercase tracking-wider">
              {currentUser.role || 'Vendor'}
            </span>
            
            <div className="w-full border-t border-slate-100 mt-6 pt-4 text-left space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                <span className="text-sm font-semibold text-slate-700">{currentUser.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Status</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Password and Settings Card */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="premium-card p-6">
            <h3 className="text-base font-bold text-slate-800 font-outfit flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
              <Lock size={18} className="text-primary" /> Update Password
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="premium-input w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 6 characters"
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="premium-input w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Re-enter new password"
                      value={passwordData.confirmPassword}
                      onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="premium-input w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {loading ? "Saving changes..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
