import React from 'react';
import './ResumeTemplates.css';

const BLOGGER = ({ data }) => {
  const { personalInfo, education, experience, skills } = data;

  return (
    <div className="resume-template template-blogger">
      <div className="left-col">
        <div className="header">
          <h1>{personalInfo.firstName} {personalInfo.lastName}</h1>
          <p className="summary">{personalInfo.professionalSummary}</p>
        </div>

        <div className="resume-section">
          <div className="section-title">💼 Work Experience</div>
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
          <div className="section-title">🎓 Education</div>
          {education.map((edu, i) => (
            <div key={i} className="education-card">
              <h4>{edu.degree}</h4>
              <div className="company">{edu.institution}</div>
              <p className="meta">{edu.endDate} | {edu.major}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="right-col">
        <div className="resume-section">
          <div className="section-title">👤 Profile</div>
          <div className="meta-info">
            {personalInfo.email && <div className="info-item">📧 {personalInfo.email}</div>}
            {personalInfo.phone && <div className="info-item">📞 {personalInfo.phone}</div>}
            {personalInfo.address && <div className="info-item">📍 {personalInfo.address}</div>}
            {personalInfo.linkedin && <div className="info-item">🔗 LinkedIn</div>}
          </div>
        </div>

        <div className="resume-section">
          <div className="section-title">🛠 Skills</div>
          <div className="tag-list">
            {skills.technical?.map((skill, i) => (
              <span key={i} className="tag">{skill}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BLOGGER;
