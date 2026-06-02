import React from 'react';
import { Layers, Plus, Search, X } from 'lucide-react';

const CreationMasterShell = ({
  title,
  recordCount,
  addLabel,
  showForm,
  onAdd,
  onHideForm,
  tableName,
  children,
  table
}) => {
  return (
    <div className="creation-master">
      <div className="creation-hero">
        <div className="creation-title-block">
          <div className="creation-icon"><Layers size={20} /></div>
          <div>
            <h2>{title}</h2>
            <p>{recordCount} saved record{recordCount === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div className="creation-hero-actions">
          <span>Qurbani Totals</span>
          {!showForm && <button className="creation-add" onClick={onAdd}><Plus size={16} /> {addLabel}</button>}
        </div>
      </div>

      {showForm && children}

      <section className="creation-panel table-panel">
        <div className="table-title-row">
          <div>
            <h3>Table Name-{tableName}</h3>
            <p>Manage existing creation master entries.</p>
          </div>
          {showForm && <button className="creation-add small" onClick={onHideForm}><X size={14} /> Hide Form</button>}
        </div>
        <div className="creation-toolbar">
          <span>Show <select><option>10</option></select> entries</span>
          <div><button>Copy</button><button>CSV</button><button>Excel</button><button>PDF</button><button>Print</button></div>
          <label className="creation-search"><Search size={13} /> <input placeholder="Search..." /></label>
        </div>
        {table}
      </section>

      <style>{`
        .creation-master { color: #1e293b; }
        .creation-hero { background: #ffffff; border: 1px solid #d1fae5; border-radius: 12px; padding: 18px 20px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 10px 24px rgba(15,23,42,0.06); }
        .creation-title-block { display: flex; align-items: center; gap: 12px; }
        .creation-icon { width: 42px; height: 42px; border-radius: 10px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; }
        .creation-hero h2 { margin: 0; font-size: 21px; font-weight: 900; color: #0f172a; }
        .creation-hero p, .creation-panel-head p, .table-title-row p { margin: 3px 0 0; color: #64748b; font-size: 12px; font-weight: 500; }
        .creation-hero-actions { display: flex; align-items: center; gap: 12px; }
        .creation-hero-actions span { color: #15803d; font-weight: 800; white-space: nowrap; }
        .creation-panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 16px; box-shadow: 0 10px 24px rgba(15,23,42,0.05); }
        .creation-panel h3 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; }
        .creation-panel-head { display: flex; justify-content: space-between; align-items: center; }
        .creation-panel-head button, .creation-toolbar button, .creation-add, .creation-cancel { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 8px 12px; color: #334155; cursor: pointer; display: inline-flex; gap: 6px; align-items: center; font-weight: 700; }
        .creation-form-grid { display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 16px 18px; align-items: end; margin-top: 18px; }
        .batch-grid { grid-template-columns: repeat(3, minmax(190px, 1fr)); }
        .creation-actions { display: flex; align-items: end; gap: 8px; }
        .creation-submit { background: #059669; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 800; }
        .creation-cancel { background: #f8fafc; }
        .creation-add { background: #059669; color: white; border-color: #059669; }
        .creation-add.small { background: #fff; color: #64748b; border-color: #cbd5e1; }
        .table-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .creation-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; font-size: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; }
        .creation-toolbar button { padding: 6px 10px; margin: 0 2px; font-size: 11px; background: #fff; }
        .creation-toolbar input, .creation-toolbar select { border: 1px solid #cbd5e1; padding: 6px 8px; border-radius: 7px; outline: none; }
        .creation-search { display: inline-flex; align-items: center; gap: 6px; color: #475569; }
        .creation-table-wrap { overflow-x: auto; }
        .creation-table { width: 100%; border-collapse: collapse; min-width: 900px; font-size: 12px; border: 1px solid #e2e8f0; }
        .creation-table th { background: #ecfdf5; color: #065f46; padding: 12px 10px; border: 1px solid #d1fae5; text-align: center; font-weight: 900; }
        .creation-table td { padding: 11px 10px; border: 1px solid #f1f5f9; text-align: center; }
        .creation-table tr:nth-child(even) td { background: #f8fafc; }
        .table-actions { display: flex; align-items: center; justify-content: center; gap: 10px; white-space: nowrap; }
        .text-action { border: none; background: transparent; color: #0284c7; display: inline-flex; gap: 2px; align-items: center; cursor: pointer; font-size: 11px; }
        .text-action.danger { color: #dc2626; }
        @media (max-width: 900px) { .creation-hero, .creation-toolbar, .table-title-row { flex-direction: column; align-items: stretch; } .creation-form-grid, .batch-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default CreationMasterShell;
