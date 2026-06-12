import React from 'react';
import { Layers, Plus, Search, X } from 'lucide-react';
import ExportButtons from '../../components/common/ExportButtons';

const CreationMasterShell = ({
  title,
  recordCount,
  addLabel,
  showForm,
  onAdd,
  onHideForm,
  tableName,
  children,
  table,
  stats,
  searchTerm,
  setSearchTerm,
  entriesPerPage,
  setEntriesPerPage,
  exportConfig
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Dynamic Stats / Dashboard Panel */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {stats}
        </div>
      )}

      {/* Form modal overlay (if showForm is true, children handles modal layout) */}
      {showForm && children}

      {/* Table container card */}
      <div className="list-table-container">
        {/* Table Hero Header */}
        <div className="tbl-hero">
          <div className="tbl-hero-left">
            <div className="tbl-icon" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <Layers size={20} />
            </div>
            <div>
              <h3 className="tbl-title">{title}</h3>
              <p className="tbl-subtitle">
                {recordCount} total record{recordCount !== 1 ? 's' : ''} &mdash; manage and configure {tableName || 'creation master'} records
              </p>
            </div>
          </div>
          <div className="tbl-hero-right flex items-center gap-3">
            {exportConfig && (
              <div className="export-buttons flex gap-1.5 flex-wrap">
                <ExportButtons {...exportConfig} />
              </div>
            )}
            <button 
              onClick={onAdd} 
              className="tbl-new-btn"
            >
              <Plus size={16} />
              {addLabel}
            </button>
          </div>
        </div>

        <div className="tbl-divider"></div>

        {/* Controls */}
        <div className="table-controls justify-end">
          <div className="search-box">
            <Search size={16} />
            <input 
              value={searchTerm || ''} 
              onChange={e => setSearchTerm && setSearchTerm(e.target.value)} 
              placeholder="Search master records..." 
            />
          </div>
        </div>

        {/* Table wrapper */}
        {table}
      </div>

      <style>{`
        .creation-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.03), 0 1px 3px 0 rgba(0, 0, 0, 0.01), inset 0 1px 0 rgba(255, 255, 255, 0.6); border-radius: 24px; padding: 24px; margin-bottom: 8px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .creation-panel h3 { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
        .creation-panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
        .creation-panel-head p { margin: 3px 0 0; color: #94a3b8; font-size: 12px; font-weight: 500; }
        .creation-panel-head button, .creation-cancel { border: 1px solid #e2e8f0; background: #fff; border-radius: 10px; padding: 8px 14px; color: #475569; cursor: pointer; display: inline-flex; gap: 8px; align-items: center; font-weight: 600; font-size: 12px; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .creation-panel-head button:hover, .creation-cancel:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
        
        .creation-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px 20px; align-items: end; }
        .creation-actions { display: flex; align-items: center; gap: 12px; }
        .creation-submit { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; border: none; padding: 11px 22px; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 13px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(16,185,129,0.2); }
        .creation-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16,185,129,0.3); }
        .creation-cancel { background: #f8fafc; padding: 11px 22px; border-radius: 12px; }
        
        @media (max-width: 768px) {
          .creation-form-grid { grid-template-columns: 1fr; }
          .table-controls { flex-direction: column; align-items: stretch; gap: 12px; }
          .table-controls-left { flex-direction: column; align-items: stretch; gap: 12px; }
          .export-buttons { flex-wrap: wrap; }
          .export-buttons button { flex: 1; }
          .search-box { width: 100%; min-width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default CreationMasterShell;
