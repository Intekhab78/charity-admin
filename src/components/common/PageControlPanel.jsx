import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

const PageControlPanel = ({
  title,
  subtitle,
  icon: TitleIcon,
  stats = [],
  searchTerm,
  onSearchChange,
  filters = {},
  onFilterChange,
  filterOptions = {},
  onAddClick,
  addLabel = 'Create New',
  extraActions,
}) => {
  const hasActiveFilters =
    (searchTerm && searchTerm.trim() !== '') ||
    Object.values(filters).some(val => val !== null && val !== undefined && val !== '');

  const handleReset = () => {
    if (onSearchChange) onSearchChange('');
    if (onFilterChange) {
      const resetFilters = {};
      Object.keys(filters).forEach(key => { resetFilters[key] = ''; });
      onFilterChange(resetFilters);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full mb-4">

      {/* ── Page Title & Actions Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/50 backdrop-blur-md border border-slate-200/80 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          {TitleIcon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/10">
              <TitleIcon size={18} />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold font-outfit text-slate-900 tracking-tight leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-slate-400 font-medium mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {extraActions}
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* ── Micro Dashboard KPI Cards ── */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => {
            const StatIcon = stat.icon;
            const themeColor  = stat.color  || '#10b981';
            const themeBg     = stat.bg     || '#ecfdf5';
            const themeBorder = stat.border || 'rgba(16, 185, 129, 0.15)';
            return (
              <div
                key={stat.label || i}
                className="premium-card relative overflow-hidden p-3.5 flex items-center gap-3.5 group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md border border-slate-200/60 bg-white"
                style={{ borderLeft: `4px solid ${themeColor}` }}
              >
                <div
                  className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-[0.03] group-hover:scale-125 transition-transform duration-500"
                  style={{ backgroundColor: themeColor }}
                />
                {StatIcon && (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: themeBg, color: themeColor, border: `1px solid ${themeBorder}` }}
                  >
                    <StatIcon size={16} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                    {stat.label}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-lg font-black text-slate-900 tracking-tight font-outfit">
                      <AnimatedCounter value={stat.value} />
                    </span>
                    {stat.change && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          stat.changeType === 'increase'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-500'
                        }`}
                      >
                        {stat.change}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Unified Filter Panel ── */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-3 rounded-2xl shadow-sm flex flex-col md:flex-row gap-2.5 items-center flex-wrap">

        {/* Search Input */}
        {onSearchChange !== undefined && (
          <div className="relative w-full md:flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm || ''}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search database..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50/50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all shadow-inner placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {Object.keys(filterOptions).map(key => {
            const options     = filterOptions[key] || [];
            const value       = filters[key] || '';
            let placeholder = `All ${key.charAt(0).toUpperCase() + key.slice(1)}`;
            if (key === 'dateRange') placeholder = 'All Time';
            if (key === 'paymentMode') placeholder = 'All Payment Mode';
            
            return (
              <div key={key} className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                <select
                  value={value}
                  onChange={e => onFilterChange({ ...filters, [key]: e.target.value })}
                  className="w-full sm:w-auto min-w-[130px] px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 rounded-xl text-[11px] font-bold text-slate-600 outline-none cursor-pointer transition-all appearance-none pr-8"
                >
                  <option value="">{placeholder}</option>
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[9px]">▼</div>
              </div>
            );
          })}

          {/* Reset All Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 text-[11px] font-bold rounded-xl transition-all duration-300 cursor-pointer animate-fade-in"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageControlPanel;
