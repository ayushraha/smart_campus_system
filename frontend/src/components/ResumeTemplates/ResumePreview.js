import React from 'react';
import MARK from './MARK';
import LANA from './LANA';
import BLOGGER from './BLOGGER';

const ResumePreview = ({ data, templateId }) => {
  const renderTemplate = () => {
    switch (templateId?.toLowerCase()) {
      case 'mark':
        return <MARK data={data} />;
      case 'lana':
        return <LANA data={data} />;
      case 'blogger':
        return <BLOGGER data={data} />;
      default:
        // Fallback to MARK if none selected or professional
        return <MARK data={data} />;
    }
  };

  return (
    <div className="resume-preview-container">
      {renderTemplate()}
    </div>
  );
};

export default ResumePreview;
