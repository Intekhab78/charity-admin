import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Plus, User, X, Save } from 'lucide-react';
import { reviewService } from '../../services/api';
import { toast } from '../../components/common/Toast';

const ReviewsManager = () => {
  const [reviews, setReviews] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', role: 'Customer', rating: 5, comment: '' });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    const res = await reviewService.list();
    setReviews(res.data?.data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) {
      toast.warning('Please fill in all fields!');
      return;
    }
    try {
      await reviewService.create({
        name: newReview.name,
        role: newReview.role,
        rating: Number(newReview.rating),
        comment: newReview.comment
      });
      setNewReview({ name: '', role: 'Customer', rating: 5, comment: '' });
      setShowForm(false);
      await loadReviews();
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to submit feedback.');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={15} fill={i < rating ? '#f59e0b' : 'none'} stroke={i < rating ? '#f59e0b' : '#cbd5e1'} />
    ));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="list-table-container">
        <div className="tbl-hero">
          <div className="tbl-hero-left">
            <div className="tbl-icon">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="tbl-title">Customer & Vendor Feedback</h3>
              <p className="tbl-subtitle">Read reviews or submit your experience with our services.</p>
            </div>
          </div>
          <div className="tbl-hero-right">
            {!showForm && (
              <button 
                onClick={() => setShowForm(true)}
                className="tbl-new-btn"
              >
                <Plus size={16} /> Submit Feedback
              </button>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content max-w-xl">
            <div className="premium-modal-header">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" /> Submit Your Experience
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
              <div className="premium-modal-body flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Your Name</label>
                    <input 
                      type="text" 
                      value={newReview.name} 
                      onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                      placeholder="e.g. Mohit Kumar"
                      className="premium-input w-full"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Your Role</label>
                    <select 
                      value={newReview.role} 
                      onChange={e => setNewReview({ ...newReview, role: e.target.value })}
                      className="premium-input w-full bg-white"
                    >
                      <option value="Customer">Customer</option>
                      <option value="Vendor">Vendor</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Rating (Out of 5)</label>
                  <select 
                    value={newReview.rating} 
                    onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                    className="premium-input w-full bg-white"
                  >
                    <option value={5}>5 Stars (Excellent)</option>
                    <option value={4}>4 Stars (Good)</option>
                    <option value={3}>3 Stars (Average)</option>
                    <option value={2}>2 Stars (Poor)</option>
                    <option value={1}>1 Star (Very Bad)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Your Comments</label>
                  <textarea 
                    rows="3"
                    value={newReview.comment} 
                    onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Share your experience here..."
                    className="premium-input w-full resize-y"
                    required
                  />
                </div>
              </div>
              <div className="premium-modal-footer">
                <button type="button" onClick={() => setShowForm(false)} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
                  <X size={14} /> Cancel
                </button>
                <button type="submit" className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors">
                  <Save size={14} /> Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {reviews.map(r => (
          <div key={r.id} className="premium-card premium-card-hover p-6 flex flex-col gap-4 justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 flex-shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 leading-tight">{r.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{r.role}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                </div>
              </div>
              <p className="text-sm text-slate-600 italic leading-relaxed margin-0">"{r.comment}"</p>
            </div>
            <div className="flex gap-0.5 border-t border-slate-100 pt-3">
              {renderStars(r.rating)}
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="premium-card p-8 text-center text-slate-400 font-medium col-span-full">
            No reviews found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsManager;
