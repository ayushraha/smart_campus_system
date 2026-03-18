import React from 'react';
import './ResumeTemplates.css';

const MARK = ({ data }) => {
  const { personalInfo, education, experience, skills, projects } = data;

  return (
    <div className="resume-template template-mark">
      <div className="header">
        <h1>{personalInfo.firstName} {personalInfo.lastName}</h1>
        <div className="header-meta">
          <span>{personalInfo.email} | {personalInfo.phone}</span>
          <span>{personalInfo.address}</span>
        </div>
        {personalInfo.professionalSummary && (
          <div className="summary">
            <h2>Summary</h2>
            <p>{personalInfo.professionalSummary}</p>
          </div>
        )}
      </div>

      {experience?.length > 0 && (
        <div className="resume-section">
          <h2>Employment History</h2>
          {experience.map((exp, i) => (
            <div key={i} className="resume-item">
              <div className="item-header">
                <span>{exp.title} - {exp.company}</span>
                <span className="item-meta">{exp.startDate} - {exp.endDate}</span>
              </div>
              <p className="description">{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {education?.length > 0 && (
        <div className="resume-section">
          <h2>Education</h2>
          {education.map((edu, i) => (
            <div key={i} className="resume-item">
              <div className="item-header">
                <span>{edu.degree}, {edu.institution}</span>
                <span className="item-meta">{edu.endDate}</span>
              </div>
              <p className="item-meta">{edu.major} {edu.cgpa && `| CGPA: ${edu.cgpa}`}</p>
            </div>
          ))}
        </div>
      )}

      {skills?.technical?.length > 0 && (
        <div className="resume-section">
          <h2>Skills</h2>
          <div className="tag-list">
            {skills.technical.map((skill, i) => (
              <span key={i} className="tag">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MARK;
