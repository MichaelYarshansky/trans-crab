import React, { useState, useRef, useEffect } from 'react';
import './Settings.css';

function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const settingsRef = useRef(null);

  // Close settings when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDownloadExtension = () => {
    // URL to the extension download file
    const extensionDownloadUrl = 'http://localhost:5001/api/download/extension';
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = extensionDownloadUrl;
    link.setAttribute('download', 'trans-crab-extension.zip');
    
    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const options = [
    { id: 'crm', label: 'Connect CRM', icon: '🔗' },
    { id: 'whatsapp', label: 'Connect WhatsApp', icon: '💬' },
    { id: 'model', label: 'Choose a Model', icon: '🧠' }
  ];

  return (
    <div className="settings-wrapper">
      <div className="download-extension-container">
        <button className="download-extension-button" onClick={handleDownloadExtension}>
          <span className="download-icon">⬇️</span>
          <span className="download-text">Download the Extension</span>
        </button>
      </div>
      
      <div className="settings-container" ref={settingsRef}>
        <div className="settings-button-group" onClick={() => setIsOpen(!isOpen)}>
          <span className="settings-icon">⚙️</span>
          <span className="settings-text">Settings</span>
        </div>
        
        {isOpen && (
          <div className="settings-popup">
            <div className="settings-content">
              {options.map(option => (
                <button key={option.id} className="settings-option">
                  <span style={{ marginRight: '12px', fontSize: '18px' }}>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;