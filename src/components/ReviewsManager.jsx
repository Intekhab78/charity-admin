import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Plus, User } from 'lucide-react';
import { reviewService } from '../services/api';

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
      alert("Please fill in all fields!");
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
      alert("Feedback submitted successfully!");
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to submit feedback.");
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={15} fill={i < rating ? '#f59e0b' : 'none'} stroke={i < rating ? '#f59e0b' : '#cbd5e1'} />
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare style={{ color: '#059669' }} /> Customer & Vendor Feedback
        </h2>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{ 
              padding: '10px 18px', 
              backgroundColor: '#059669', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '13px', 
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} /> Submit Feedback
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '15px' }}>Submit Your Experience</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Your Name</label>
                <input 
                  type="text" 
                  value={newReview.name} 
                  onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                  placeholder="e.g. Mohit Kumar"
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Your Role</label>
                <select 
                  value={newReview.role} 
                  onChange={e => setNewReview({ ...newReview, role: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white' }}
                >
                  <option value="Customer">Customer</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Rating (Out of 5)</label>
                <select 
                  value={newReview.rating} 
                  onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white' }}
                >
                  <option value={5}>5 Stars (Excellent)</option>
                  <option value={4}>4 Stars (Good)</option>
                  <option value={3}>3 Stars (Average)</option>
                  <option value={2}>2 Stars (Poor)</option>
                  <option value={1}>1 Star (Very Bad)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Your Comments</label>
              <textarea 
                rows="3"
                value={newReview.comment} 
                onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="Share your experience here..."
                style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Submit</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {reviews.map(r => (
          <div key={r.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 35, height: 35, borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <User size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>{r.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{r.role}</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '2px' }}>
              {renderStars(r.rating)}
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: 0 }}>"{r.comment}"</p>
          </div>
        ))}
        {reviews.length === 0 && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', color: '#64748b', textAlign: 'center', gridColumn: '1 / -1' }}>
            No reviews found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsManager;
