import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { creationMasterService } from '../../services/api';
import CreationMasterShell from './CreationMasterShell';
import CreationMasterTable from './CreationMasterTable';
import { batchColumns, batchInitial } from './creationMasterConfig';

const inputStyle = { width: '100%', padding: '11px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 7 };

const BatchCreationMasterPage = () => {
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(batchInitial);

  const loadLookups = async () => {
    const [animalRes, locationRes] = await Promise.all([
      creationMasterService.animals.list(),
      creationMasterService.locations.list()
    ]);
    setAnimals(animalRes.data?.data || []);
    setLocations(locationRes.data?.data || []);
  };

  const loadRecords = async () => {
    const res = await creationMasterService.batches.list();
    setRecords(res.data?.data || []);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(batchInitial);
    setShowForm(false);
  };

  useEffect(() => {
    loadLookups();
    loadRecords();
    resetForm();
  }, []);

  const updateBatchAnimal = (animalId) => {
    const animal = animals.find(a => String(a.id) === String(animalId));
    setForm({
      ...form,
      item_id: animalId,
      animal_name: animal?.item_name || '',
      animal_code: animal?.item_code || ''
    });
  };

  const updateBatchLocation = (locationId) => {
    const location = locations.find(l => String(l.id) === String(locationId));
    setForm({
      ...form,
      location_id: locationId,
      location_name: location?.locname || '',
      location_code: location?.loccode || ''
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await creationMasterService.batches.update(editingId, form);
    } else {
      await creationMasterService.batches.create(form);
    }
    await loadRecords();
    resetForm();
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setForm({ ...batchInitial, ...record });
    setShowForm(true);
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await creationMasterService.batches.delete(id);
    loadRecords();
  };

  const formPanel = (
    <section className="creation-panel">
      <div className="creation-panel-head">
        <div>
          <h3>{editingId ? 'Update Batch' : 'Add Batch'}</h3>
          <p>Fill the details and submit to save this master record.</p>
        </div>
        <button type="button" onClick={resetForm}><X size={14} /> Close</button>
      </div>
      <form onSubmit={submit} className="creation-form-grid batch-grid">
        <div>
          <label style={labelStyle}>Animal</label>
          <select style={inputStyle} value={form.item_id} onChange={e => updateBatchAnimal(e.target.value)} required>
            <option value="">Select animal</option>
            {animals.map(a => <option key={a.id} value={a.id}>{a.item_name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Batch Size</label>
          <input style={inputStyle} type="number" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} placeholder="Enter batch size" />
        </div>
        <div>
          <label style={labelStyle}>Animal Code</label>
          <input style={{ ...inputStyle, background: '#f1f5f9' }} value={form.animal_code} readOnly />
        </div>
        <div>
          <label style={labelStyle}>Location</label>
          <select style={inputStyle} value={form.location_id} onChange={e => updateBatchLocation(e.target.value)} required>
            <option value="">Select location</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.locname}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Locationcode</label>
          <input style={{ ...inputStyle, background: '#f1f5f9' }} value={form.location_code} readOnly />
        </div>
        <div>
          <label style={labelStyle}>Batchcode</label>
          <input style={inputStyle} value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} placeholder="Auto if empty" />
        </div>
        <div>
          <label style={labelStyle}>Rate INR</label>
          <input style={inputStyle} type="number" value={form.rate_inr} onChange={e => setForm({ ...form, rate_inr: e.target.value })} placeholder="Enter INR rate" />
        </div>
        <div>
          <label style={labelStyle}>Rate INRONLINE</label>
          <input style={inputStyle} type="number" value={form.rate_inronline} onChange={e => setForm({ ...form, rate_inronline: e.target.value })} placeholder="Enter online INR rate" />
        </div>
        <div>
          <label style={labelStyle}>Rate USD</label>
          <input style={inputStyle} type="number" value={form.rate_usd} onChange={e => setForm({ ...form, rate_usd: e.target.value })} placeholder="Enter USD rate" />
        </div>
        <div className="creation-actions">
          <button type="submit" className="creation-submit">{editingId ? 'Update' : 'Submit'}</button>
          <button type="button" className="creation-cancel" onClick={resetForm}>Cancel</button>
        </div>
      </form>
    </section>
  );

  return (
    <CreationMasterShell
      title="Createbatch"
      recordCount={records.length}
      addLabel="Add Batch"
      showForm={showForm}
      onAdd={() => setShowForm(true)}
      onHideForm={() => setShowForm(false)}
      tableName="addbatch"
      table={<CreationMasterTable columns={batchColumns} records={records} onEdit={startEdit} onDelete={deleteRecord} />}
    >
      {formPanel}
    </CreationMasterShell>
  );
};

export default BatchCreationMasterPage;
