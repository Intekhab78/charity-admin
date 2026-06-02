import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import CreationMasterShell from './CreationMasterShell';
import CreationMasterTable from './CreationMasterTable';

const inputStyle = { width: '100%', padding: '11px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 7 };

const StandardCreationMasterPage = ({ config }) => {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(config.initial);

  const loadRecords = async () => {
    const res = await config.service.list();
    setRecords(res.data?.data || []);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(config.initial);
    setShowForm(false);
  };

  useEffect(() => {
    loadRecords();
    resetForm();
  }, [config.tableName]);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await config.service.update(editingId, form);
    } else {
      await config.service.create(form);
    }
    await loadRecords();
    resetForm();
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setForm({ ...config.initial, ...record });
    setShowForm(true);
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await config.service.delete(id);
    loadRecords();
  };

  const formPanel = (
    <section className="creation-panel">
      <div className="creation-panel-head">
        <div>
          <h3>{editingId ? `Update ${config.tableName}` : config.addLabel}</h3>
          <p>Fill the details and submit to save this master record.</p>
        </div>
        <button type="button" onClick={resetForm}><X size={14} /> Close</button>
      </div>
      <form onSubmit={submit} className="creation-form-grid">
        {config.fields.map(([key, label, type]) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            {type === 'select' ? (
              <select style={inputStyle} value={form[key]} onChange={e => setForm({ ...form, [key]: Number(e.target.value) })}>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            ) : (
              <input style={inputStyle} type={type} value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })} required={key.endsWith('name')} />
            )}
          </div>
        ))}
        <div className="creation-actions">
          <button type="submit" className="creation-submit">{editingId ? 'Update' : 'Submit'}</button>
          <button type="button" className="creation-cancel" onClick={resetForm}>Cancel</button>
        </div>
      </form>
    </section>
  );

  return (
    <CreationMasterShell
      title={config.title}
      recordCount={records.length}
      addLabel={config.addLabel}
      showForm={showForm}
      onAdd={() => setShowForm(true)}
      onHideForm={() => setShowForm(false)}
      tableName={config.tableName}
      table={<CreationMasterTable columns={config.columns} records={records} onEdit={startEdit} onDelete={deleteRecord} />}
    >
      {formPanel}
    </CreationMasterShell>
  );
};

export default StandardCreationMasterPage;
