import React, { useState, useEffect } from 'react';
import { Building2, Save, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { bookingService } from '../../services/api';
import { toast } from '../../components/common/Toast';

const CompanySettingsPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: ''
  });

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        setLoading(true);
        const res = await bookingService.getCompany();
        if (res.data.success && res.data.data) {
          const c = res.data.data;
          setFormData({
            company_name: c.company_name || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '',
            city: c.city || '',
            country: c.country || ''
          });
        }
      } catch (err) {
        console.error("Failed to load company settings:", err);
        toast.error("Failed to load company settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyInfo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await bookingService.updateCompany(formData);
      if (res.data.success) {
        toast.success("Company settings updated successfully!");
      } else {
        toast.error(res.data.message || "Failed to update company settings.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Error updating settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-4 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-sm">
          <Building2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-outfit text-slate-900 tracking-tight">Company Settings</h1>
          <p className="text-slate-500 text-xs mt-0.5">Configure organization identity, address details and contact information</p>
        </div>
      </div>

      <div className="premium-card p-6">
        <h3 className="text-base font-bold text-slate-800 font-outfit flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
          <Building2 size={18} className="text-primary" /> Profile & Identity
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Organization / Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Charity International"
                value={formData.company_name}
                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                className="premium-input w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Official Email *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="contact@organisation.org"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="premium-input w-full"
                  style={{ paddingLeft: '40px' }}
                />
                <Mail size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Phone Number</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="premium-input w-full" style={{ paddingLeft: '40px' }}
                />
                <Phone size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Country</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. India"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  className="premium-input w-full" style={{ paddingLeft: '40px' }}
                />
                <Globe size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Office Address</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Street No. 4, Block C"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="premium-input w-full" style={{ paddingLeft: '40px' }}
                />
                <MapPin size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">City / State</label>
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="premium-input w-full"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {loading ? "Saving changes..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySettingsPage;
