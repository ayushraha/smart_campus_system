import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiDownload, FiRefreshCw } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Interview.css';

const InterviewAnalysis = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [decision, setDecision] = useState({
    result: 'pending',
    finalFeedback: '',
    rating: 3
  });

  useEffect(() => {
    fetchInterviewAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const fetchInterviewAnalysis = async () => {
    try {
      const response = await axios.get(`/api/interview/${interviewId}`);
      setInterview(response.data);

      if (response.data.result) {
        setDecision({
          result: response.data.result,
          finalFeedback: response.data.finalFeedback || '',
          rating: response.data.rating || 3
        });
      }
    } catch (error) {
      toast.error('Error fetching interview analysis');
    } finally {
      setLoading(false);
    }
  };

  const generateAIAnalysis = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`/api/interview/${interviewId}/generate-analysis`);
      setInterview({ ...interview, analysis: response.data.analysis });
      toast.success('AI analysis generated successfully');
    } catch (error) {
      toast.error('Error generating analysis');
    } finally {
      setGenerating(false);
    }
  };

  const submitDecision = async () => {
    try {
      await axios.put(`/api/interview/${interviewId}/decision`, decision);
      toast.success('Decision submitted successfully');
      navigate('/recruiter/applications');
    } catch (error) {
      toast.error('Error submitting decision');
    }
  };

  // ─── Download: generate a print-ready sheet ───
  const downloadReport = () => {
    const a = interview?.analysis;
    const candidate = interview?.studentId?.name || 'Candidate';
    const position = interview?.jobId?.title || 'N/A';
    const company = interview?.jobId?.company || 'N/A';
    const date = interview?.scheduledDate
      ? new Date(interview.scheduledDate).toLocaleDateString()
      : 'N/A';

    // Score rows removed — scores are not shown in the public report

    const listItems = (arr) =>
      (arr || []).map(item => `<li style="margin:4px 0;">${item}</li>`).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Interview Report — ${candidate}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; background: #fff; }
          .page { max-width: 800px; margin: 0 auto; padding: 40px; }
          .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 10px; margin-bottom: 25px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { opacity: 0.85; font-size: 14px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
          .meta-box { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
          .meta-box label { font-size: 11px; text-transform: uppercase; color: #888; }
          .meta-box strong { display: block; font-size: 15px; color: #333; margin-top: 2px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: 700; color: #444; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #667eea; }
          table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; }
          th { background: #667eea; color: white; padding: 10px 12px; text-align: left; }
          ul { padding-left: 20px; }
          li { margin: 5px 0; font-size: 14px; }
          .summary-box { background: #f0f4ff; padding: 15px; border-radius: 8px; font-size: 14px; line-height: 1.7; }
          .decision-badge { display: inline-block; padding: 6px 20px; border-radius: 20px; font-weight: 700; font-size: 16px;
            background: ${ decision.result === 'selected' ? '#d1fae5' : decision.result === 'rejected' ? '#fee2e2' : '#fef3c7' };
            color: ${ decision.result === 'selected' ? '#065f46' : decision.result === 'rejected' ? '#991b1b' : '#92400e' }; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #aaa; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
      <div class="page">
        <div class="header">
          <h1>🎙️ Interview Performance Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="meta-grid">
          <div class="meta-box"><label>Candidate</label><strong>${candidate}</strong></div>
          <div class="meta-box"><label>Position</label><strong>${position}</strong></div>
          <div class="meta-box"><label>Company</label><strong>${company}</strong></div>
          <div class="meta-box"><label>Interview Date</label><strong>${date}</strong></div>
          <div class="meta-box"><label>Duration</label><strong>${interview?.duration || 30} minutes</strong></div>
          <div class="meta-box"><label>Mode</label><strong>${interview?.mode || 'Online'}</strong></div>
        </div>

        ${a ? `

        ${a.strengths?.length ? `
        <div class="section">
          <div class="section-title">✅ Strengths</div>
          <ul>${listItems(a.strengths)}</ul>
        </div>` : ''}

        ${a.weaknesses?.length ? `
        <div class="section">
          <div class="section-title">⚠️ Areas for Improvement</div>
          <ul>${listItems(a.weaknesses)}</ul>
        </div>` : ''}

        ${a.recommendations?.length ? `
        <div class="section">
          <div class="section-title">💡 Recommendations</div>
          <ul>${listItems(a.recommendations)}</ul>
        </div>` : ''}

        ${a.aiSummary ? `
        <div class="section">
          <div class="section-title">📝 Summary</div>
          <div class="summary-box">${a.aiSummary}</div>
        </div>` : ''}

        ${a.detailedFeedback ? `
        <div class="section">
          <div class="section-title">📋 Detailed Feedback</div>
          <div class="summary-box">${a.detailedFeedback}</div>
        </div>` : ''}
        ` : '<p style="color:#888;text-align:center;padding:20px;">No analysis data available. Generate AI analysis first.</p>'}

        ${interview?.questionsAsked?.length ? `
        <div class="section">
          <div class="section-title">❓ Questions Asked (${interview.questionsAsked.length})</div>
          <table>
            <thead><tr><th>#</th><th>Question</th><th>Category</th></tr></thead>
            <tbody>
              ${interview.questionsAsked.map((q, i) => `
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i + 1}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #eee;">${q.question}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #eee;text-transform:capitalize;">${q.category}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}

        <div class="section">
          <div class="section-title">🏆 Final Decision</div>
          <p style="margin-bottom:10px;">Decision: <span class="decision-badge">${decision.result.toUpperCase()}</span></p>
          <p style="font-size:14px;margin-bottom:8px;"><strong>Rating:</strong> ${'★'.repeat(decision.rating)}${'☆'.repeat(5 - decision.rating)}</p>
          ${decision.finalFeedback ? `<div class="summary-box">${decision.finalFeedback}</div>` : ''}
        </div>

        ${interview?.recruiterNotes ? `
        <div class="section">
          <div class="section-title">🗒️ Recruiter Notes</div>
          <div class="summary-box">${interview.recruiterNotes}</div>
        </div>` : ''}

        <div class="footer">JSPM Hadapsar Smart Campus — Recruitment Portal • Confidential Interview Report</div>
      </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // ScoreCircle and getScoreColor removed — performance scores not shown

  if (loading) return <div className="loading">Loading analysis...</div>;

  const analysis = interview?.analysis;
  // Show analysis sections whenever any meaningful content exists (scores removed)
  const hasAnalysis = analysis && (
    analysis.strengths?.length > 0 ||
    analysis.weaknesses?.length > 0 ||
    analysis.recommendations?.length > 0 ||
    analysis.aiSummary ||
    analysis.detailedFeedback
  );

  return (
    <div className="interview-analysis">
      <div className="analysis-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          <FiArrowLeft /> Back
        </button>
        <h1>Interview Analysis</h1>
        <div className="header-actions">
          <button
            onClick={generateAIAnalysis}
            disabled={generating}
            className="btn-generate"
          >
            <FiRefreshCw className={generating ? 'spinning' : ''} />
            {generating ? 'Generating...' : hasAnalysis ? 'Refresh AI Insights' : 'Generate AI Analysis'}
          </button>
          <button onClick={downloadReport} className="btn-download">
            <FiDownload /> Download Report
          </button>
        </div>
      </div>

      <div className="candidate-info">
        <h2>{interview?.studentId?.name}</h2>
        <p><strong>Position:</strong> {interview?.jobId?.title}</p>
        <p><strong>Company:</strong> {interview?.jobId?.company}</p>
        <p><strong>Date:</strong> {new Date(interview?.scheduledDate).toLocaleDateString()}</p>
        <p><strong>Duration:</strong> {interview?.duration} minutes</p>
        <p><strong>Status:</strong> <span className={`status-pill ${interview?.status}`}>{interview?.status}</span></p>
      </div>

      {hasAnalysis ? (
        <>
          {(analysis.strengths?.length > 0 || analysis.weaknesses?.length > 0) && (
            <div className="analysis-grid">
              {analysis.strengths?.length > 0 && (
                <div className="analysis-card">
                  <h3>✅ Strengths</h3>
                  <ul className="feedback-list strengths">
                    {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {analysis.weaknesses?.length > 0 && (
                <div className="analysis-card">
                  <h3>⚠️ Areas for Improvement</h3>
                  <ul className="feedback-list weaknesses">
                    {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {analysis.recommendations?.length > 0 && (
            <div className="analysis-card full-width">
              <h3>💡 Recommendations</h3>
              <ul className="feedback-list recommendations">
                {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {analysis.aiSummary && (
            <div className="analysis-card full-width">
              <h3>AI Summary</h3>
              <div className="ai-summary markdown-container">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analysis.aiSummary}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {analysis.detailedFeedback && (
            <div className="analysis-card full-width">
              <h3>Detailed Feedback</h3>
              <div className="detailed-feedback markdown-container">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analysis.detailedFeedback}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="no-analysis">
          <div className="no-analysis-icon">📊</div>
          <h3>No Analysis Data Yet</h3>
          <p>
            {interview?.status === 'completed'
              ? 'The interview is complete. Click "Generate AI Analysis" to build a report based on the recruiter\'s live scoring.'
              : 'Interview has not been completed yet. Analysis will be available after the interview ends.'}
          </p>
          {interview?.status === 'completed' && (
            <button onClick={generateAIAnalysis} disabled={generating} className="btn-generate-center">
              <FiRefreshCw className={generating ? 'spinning' : ''} />
              {generating ? 'Generating...' : 'Generate AI Analysis'}
            </button>
          )}
        </div>
      )}

      {interview?.questionsAsked?.length > 0 && (
        <div className="questions-section">
          <h3>Questions Asked ({interview.questionsAsked.length})</h3>
          <div className="questions-list">
            {interview.questionsAsked.map((q, index) => (
              <div key={index} className="question-card">
                <span className={`category-badge ${q.category}`}>{q.category}</span>
                <p>{q.question}</p>
                <small>{new Date(q.askedAt).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="decision-section">
        <h2>Final Decision</h2>
        <div className="decision-form">
          <div className="form-group">
            <label>Decision</label>
            <select
              value={decision.result}
              onChange={(e) => setDecision({ ...decision, result: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="selected">Selected ✅</option>
              <option value="rejected">Rejected ❌</option>
              <option value="on-hold">On Hold ⏸</option>
            </select>
          </div>

          <div className="form-group">
            <label>Rating</label>
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${decision.rating >= star ? 'filled' : ''}`}
                  onClick={() => setDecision({ ...decision, rating: star })}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Final Feedback (sent to candidate)</label>
            <textarea
              value={decision.finalFeedback}
              onChange={(e) => setDecision({ ...decision, finalFeedback: e.target.value })}
              rows="5"
              placeholder="Provide detailed feedback to the candidate..."
            />
          </div>

          <button onClick={submitDecision} className="btn-submit">
            Submit Decision
          </button>
        </div>
      </div>

      {interview?.recruiterNotes && (
        <div className="analysis-card full-width">
          <h3>🗒️ Recruiter Notes</h3>
          <p className="interviewer-notes">{interview.recruiterNotes}</p>
        </div>
      )}
    </div>
  );
};

export default InterviewAnalysis;