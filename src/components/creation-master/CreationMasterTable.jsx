import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const CreationMasterTable = ({ columns, records, onEdit, onDelete }) => {
  const renderValue = (record, key) => {
    if (key === 'status') return Number(record.status) === 1 ? 'Active' : 'Inactive';
    return record[key] === undefined || record[key] === null || record[key] === '' ? '-' : record[key];
  };

  return (
    <div className="creation-table-wrap">
      <table className="creation-table">
        <thead>
          <tr>
            {columns.map(([, label]) => <th key={label}>{label}</th>)}
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record.id}>
              {columns.map(([key]) => <td key={key}>{renderValue(record, key)}</td>)}
              <td>
                <div className="table-actions">
                  <button className="text-action" onClick={() => onEdit(record)}><Pencil size={12} />EDIT</button>
                  <button className="text-action danger" onClick={() => onDelete(record.id)}><Trash2 size={12} />DELETE</button>
                </div>
              </td>
            </tr>
          ))}
          {records.length === 0 && <tr><td colSpan={columns.length + 1}>No records found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

export default CreationMasterTable;
