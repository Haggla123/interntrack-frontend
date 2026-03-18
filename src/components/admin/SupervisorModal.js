import React from 'react';
import { X } from 'lucide-react';

const SupervisorModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content scale-in">
        <div className="modal-header">
          <h3>Register New Supervisor</h3>
          <button className="close-x" onClick={onClose}><X /></button>
        </div>
        
        <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" placeholder="e.g. Dr. Robert Smith" required />
          </div>
          <div className="input-group">
            <label>Supervisor Type</label>
            <select className="admin-input-select">
              <option value="academic">Academic (Lecturer)</option>
              <option value="industrial">Industrial (Company)</option>
            </select>
          </div>
          <div className="input-group">
            <label>Institution / Company</label>
            <input type="text" placeholder="e.g. Vodafone or CS Dept" required />
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Register</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupervisorModal;