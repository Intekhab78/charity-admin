import React from 'react';
import { Download, FileText } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const ExportButtons = ({ filename, title, columns, data }) => {
  const handleCSV = () => {
    exportToCSV(filename, columns, data);
  };

  const handlePDF = () => {
    exportToPDF(filename, title, columns, data);
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCSV}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg border border-slate-200 hover:bg-slate-100 hover:text-emerald-600 transition-colors shadow-sm"
        title="Export to CSV"
      >
        <Download size={14} />
        CSV
      </button>
      <button
        onClick={handlePDF}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg border border-slate-200 hover:bg-slate-100 hover:text-rose-600 transition-colors shadow-sm"
        title="Export to PDF"
      >
        <FileText size={14} />
        PDF
      </button>
    </div>
  );
};

export default ExportButtons;
