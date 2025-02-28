import React, { useState } from 'react';
import './Settings.css';

function Settings() {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { id: 'agent', label: 'Download Agent' },
    { id: 'crm', label: 'Connect CRM' },
    { id: 'whatsapp', label: 'Connect WhatsApp' },
    { id: 'model', label: 'Choose a Model' }
  ];

  return (
    <div className="settings-container">
      <button className="settings-icon" onClick={() => setIsOpen(!isOpen)}>
        ⚙️
      </button>
      
      {isOpen && (
        <div className="settings-popup">
          <div className="settings-content">
            {options.map(option => (
              <button key={option.id} className="settings-option">
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;