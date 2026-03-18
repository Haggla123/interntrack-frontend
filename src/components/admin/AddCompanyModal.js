import React, { useState } from 'react';
import { X, MapPin, Building2, User, Mail, Phone } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  category: 'Engineering',
  location: '',
  lat: '',
  long: '',
  radius: '150',
  slots: 5,
  supervisorName: '',
  supervisorEmail: '',
  supervisorPhone: '',
};

const AddCompanyModal = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState(EMPTY_FORM);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({
      name:            form.name.trim(),
      category:        form.category,
      location:        form.location.trim(),
      lat:             form.lat,
      long:            form.long,
      radius:          form.radius,
      slots:           Number(form.slots),
      supervisorName:  form.supervisorName.trim(),
      supervisorEmail: form.supervisorEmail.trim(),
      supervisorPhone: form.supervisorPhone.trim(),
    });
    setForm(EMPTY_FORM);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content scale-in" style={{ maxWidth: '540px' }}>
        <div className="modal-header" style={{ padding: '15px 20px' }}>
          <div className="header-title-flex">
            <Building2 className="text-blue" size={20} />
            <h3 style={{ fontSize: '18px' }}>Register Partner Company</h3>
          </div>
          <button className="close-x" onClick={onClose}><X size={18} /></button>
        </div>

        <form className="modal-body-pushed" style={{ padding: '15px 20px', maxHeight: '75vh', overflowY: 'auto' }} onSubmit={handleSubmit}>

          {/* ── Company Info ── */}
          <div className="form-grid-2">
            <div className="input-group">
              <label>Company Name</label>
              <input type="text" name="name" placeholder="GRIDCo" className="admin-input-select-sm"
                value={form.name} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Category</label>
              <select name="category" className="admin-input-select-sm" value={form.category} onChange={handleChange}>
                <option>Engineering</option>
                <option>Software/IT</option>
                <option>Business</option>
                <option>Electrical</option>
                <option>Network Eng.</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2" style={{ marginTop: '10px' }}>
            <div className="input-group">
              <label>City / Address</label>
              <input type="text" name="location" placeholder="Tema Industrial Area" className="admin-input-select-sm"
                value={form.location} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Internship Slots</label>
              <input type="number" name="slots" className="admin-input-select-sm"
                value={form.slots} onChange={handleChange} min="0" />
            </div>
          </div>

          {/* ── GPS Geofence ── */}
          <div className="geofence-setup-box-slim" style={{ marginTop: '12px' }}>
            <div className="setup-header-sm">
              <MapPin size={14} className="text-amber" />
              <span>GPS Security (Geofence)</span>
            </div>
            <div className="form-row-three">
              <div className="input-group">
                <label>Latitude</label>
                <input type="number" step="any" name="lat" placeholder="5.60"
                  className="admin-input-select-sm" value={form.lat} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Longitude</label>
                <input type="number" step="any" name="long" placeholder="-0.18"
                  className="admin-input-select-sm" value={form.long} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Radius</label>
                <select name="radius" className="admin-input-select-sm" value={form.radius} onChange={handleChange}>
                  <option value="50">50m</option>
                  <option value="150">150m</option>
                  <option value="500">500m</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Industrial Supervisor ── */}
          <div style={{
            marginTop: '14px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <User size={14} style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Industrial Supervisor
              </span>
            </div>
            <div className="form-grid-2" style={{ marginBottom: '8px' }}>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" name="supervisorName" placeholder="Mr. Kofi Mensah"
                  className="admin-input-select-sm" value={form.supervisorName} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="tel" name="supervisorPhone" placeholder="024XXXXXXX"
                    className="admin-input-select-sm" style={{ paddingLeft: '26px' }}
                    value={form.supervisorPhone} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="input-group">
              <label>Email Address <span style={{ color: '#64748b', fontWeight: 400 }}>(notification will be sent)</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="email" name="supervisorEmail" placeholder="supervisor@company.com"
                  className="admin-input-select-sm" style={{ paddingLeft: '26px' }}
                  value={form.supervisorEmail} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
            <button type="button" className="cancel-btn" onClick={onClose}>Discard</button>
            <button type="submit" className="primary-btn">Save Partner</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCompanyModal;
