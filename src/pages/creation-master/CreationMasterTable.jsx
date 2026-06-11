import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const CreationMasterTable = ({ columns, records, onEdit, onDelete }) => {
  const renderValue = (record, key) => {
    const value = record[key];
    if (key === 'status') {
      return (
        <span className={Number(value) === 1 ? 'badge-approved' : 'badge-vendor-approved'}>
          {Number(value) === 1 ? 'Active' : 'Inactive'}
        </span>
      );
    }
    if (key.includes('rate') || key === 'itemprice') {
      const numVal = Number(value || 0);
      return (
        <span className="font-bold text-slate-700">
          {key.includes('usd') ? `$${numVal.toFixed(2)}` : `₹${numVal.toLocaleString('en-IN')}`}
        </span>
      );
    }
    if (key.endsWith('code') || key === 'batch_number' || key === 'symbol') {
      return (
        <span className="bg-slate-100 text-slate-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200">
          {value || '—'}
        </span>
      );
    }
    return value === undefined || value === null || value === '' ? '—' : <span className="font-bold text-slate-800">{value}</span>;
  };

  return (
    <div className="data-table-wrapper">
      <table className="dense-data-table">
        <thead>
          <tr className="tbl-head-row">
            {columns.map(([key, label]) => {
              const isNumeric = key.includes('rate') || key === 'itemprice';
              const alignClass = key === 'status' ? 'text-center' : (isNumeric ? 'text-right' : 'text-left');
              return (
                <th key={label} className={alignClass}>
                  {label}
                </th>
              );
            })}
            <th className="text-right pr-6" style={{ width: '160px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record.id}>
              {columns.map(([key]) => {
                const isNumeric = key.includes('rate') || key === 'itemprice';
                const alignClass = key === 'status' ? 'text-center' : (isNumeric ? 'text-right' : 'text-left');
                return (
                  <td key={key} className={alignClass}>
                    {renderValue(record, key)}
                  </td>
                );
              })}
              <td className="text-right pr-6">
                <div className="flex justify-end gap-1.5">
                  <button className="btn-edit" onClick={() => onEdit(record)} title="Edit"><Pencil size={14} /></button>
                  <button className="btn-delete" onClick={() => onDelete(record.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-10 text-slate-400">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CreationMasterTable;
