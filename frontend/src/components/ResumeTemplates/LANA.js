import React from 'react';
import './ResumeTemplates.css';

const LANA = ({ data }) => {
  const { personalInfo, education, experience, skills } = data;

  return (
    <div className="resume-template template-lana">
      <div className="header">
        <h1>{personalInfo.firstName} {personalInfo.lastName}</h1>
        <div className="contact-bar">
          {personalInfo.email && <span>📧 {personalInfo.email}</span>}
          {personalInfo.phone && <span>📞 {personalInfo.phone}</span>}
          {personalInfo.address && <span>📍 {personalInfo.address}</span>}
        </div>
      </div>

      <div className="summary">
        <h2>Summary</h2>
        <p>{personalInfo.professionalSummary}</p>
      </div>

      <div className="resume-section">
        <h2>Employment History</h2>
        {experience.map((exp, i) => (
          <div key={i} className="experience-card">
            <div className="item-header">
              <span>{exp.title}</span>
              <span className="duration">{exp.startDate} - {exp.endDate}</span>
            </div>
            <div className="company">{exp.company}</div>
            <p className="description">{exp.description}</p>
          </div>
        ))}
      </div>

      <div className="resume-section">
        <h2>Education</h2>
        {education.map((edu, i) => (
          <div key={i} className="education-card">
            <h4>{edu.degree}</h4>
            <div className="company">{edu.institution}</div>
            <p className="meta">{edu.endDate} | {edu.major}</p>
          </div>
        ))}
      </div>

      {skills?.technical?.length > 0 && (
        <div className="resume-section">
          <h2>Skills</h2>
          <div className="tag-list">
            {skills.technical.map((skill, i) => (
              <span key={i} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LANA;
