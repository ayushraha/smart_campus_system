import React, { useState } from 'react';
import { X, Search, Zap, Star, User } from 'lucide-react';
import './ResumeTemplates.css';

const TemplateSelector = ({ selectedTemplate, onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState('Free Template');
  const [searchTerm, setSearchTerm] = useState('');

  const templates = [
    { id: 'mark', name: 'MARK', description: 'Minimalist & Clean', icon: <User size={40} /> },
    { id: 'lana', name: 'LANA', description: 'Modern & Bold', icon: <Zap size={40} /> },
    { id: 'blogger', name: 'BLOGGER', description: 'Professional & Iconic', icon: <Star size={40} /> }
  ];

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="template-selector-overlay">
      <div className="template-selector-modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}><X /></button>
          <h1>Choose a Resume Template</h1>
          <p>This Template will be used for your personal resume.</p>
        </div>

        <div className="modal-tabs">
          {['Free Template', 'Premium Template', 'My Template'].map(tab => (
            <button 
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="search-container">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="template-grid">
          {filteredTemplates.map(template => (
            <div 
              key={template.id} 
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              onClick={() => onSelect(template.id)}
            >
              <div className="template-preview-box">
                {template.icon}
                <div className="template-overlay">
                  <button className="btn-use">Use Template</button>
                </div>
              </div>
              <div className="template-info">
                <h3>{template.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx="true">{`
        .template-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          backdrop-filter: blur(5px);
        }
        .template-selector-modal {
          background: white;
          width: 90%;
          max-width: 1000px;
          max-height: 90vh;
          border-radius: 20px;
          overflow-y: auto;
          padding: 40px;
          position: relative;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }
        .modal-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .modal-header h1 {
          font-size: 36px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 10px;
        }
        .modal-header p {
          color: #64748b;
          font-size: 18px;
        }
        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.3s;
        }
        .close-btn:hover { color: #1e293b; }
        
        .modal-tabs {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-bottom: 30px;
          border-bottom: 1px solid #f1f5f9;
        }
        .tab-btn {
          padding: 15px 5px;
          background: none;
          border: none;
          font-size: 18px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          position: relative;
        }
        .tab-btn.active {
          color: #4f46e5;
        }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: #4f46e5;
          border-radius: 3px;
        }

        .search-container {
          margin-bottom: 40px;
        }
        .search-box {
          position: relative;
          max-width: 600px;
          margin: 0 auto;
        }
        .search-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .search-box input {
          width: 100%;
          padding: 15px 15px 15px 55px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s;
        }
        .search-box input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
          outline: none;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 30px;
        }
        .template-card {
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        .template-card:hover { transform: translateY(-5px); }
        .template-preview-box {
          aspect-ratio: 3/4;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #cbd5e1;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }
        .template-card:hover .template-preview-box {
          border-color: #4f46e5;
        }
        .template-card.selected .template-preview-box {
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
        }
        .template-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(79, 70, 229, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .template-card:hover .template-overlay { opacity: 1; }
        .btn-use {
          padding: 12px 24px;
          background: white;
          color: #4f46e5;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }
        .template-info {
          text-align: center;
          margin-top: 15px;
        }
        .template-info h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }
      `}</style>
    </div>
  );
};

export default TemplateSelector;
