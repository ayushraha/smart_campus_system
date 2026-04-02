// frontend/src/pages/Student/AIMockInterview.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Camera, CameraOff, Mic, MicOff, Send,
  Play, StopCircle, CheckCircle, AlertTriangle,
  RotateCcw, Zap, BrainCircuit, MessageSquare
} from 'lucide-react';
import './AIMockInterview.css';

// ─── Interview type metadata ───────────────────────────────────────────────────
const INTERVIEW_TYPES = [
  {
    id: 'Technical',
    icon: '💻',
    label: 'Technical',
    desc: 'Concepts & DSA',
  },
  {
    id: 'Behavioral',
    icon: '🎯',
    label: 'Behavioral',
    desc: 'STAR & Soft Skills',
  },
  {
    id: 'System Design',
    icon: '🏗️',
    label: 'System Design',
    desc: 'Architecture & Scale',
  },
];

const EXPERIENCE_LEVELS = ['Internship', 'Entry-Level', 'Mid-Level', 'Senior'];

// ─── Timer Hook ────────────────────────────────────────────────────────────────
function useTimer(running) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const reset = () => setSeconds(0);
  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };
  return { seconds, fmt: fmt(seconds), reset };
}

// ─── Waveform bars ─────────────────────────────────────────────────────────────
const WaveformBars = ({ active }) => (
  <div className="ai-waveform">
    {Array.from({ length: 9 }).map((_, i) => (
      <div
        key={i}
        className="waveform-bar"
        style={active
          ? {
              background: 'var(--gold)',
              animation: `wave-anim ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.07}s`,
              height: `${10 + Math.random() * 30}px`,
            }
          : {}}
      />
    ))}
  </div>
);

// ─── Score Arc SVG ─────────────────────────────────────────────────────────────
const ScoreArc = ({ score }) => {
  const radius = 54;
  const circ = 2 * Math.PI * radius; // ~339
  const offset = circ - (score / 100) * circ;

  return (
    <div className="score-circle-svg">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c9a227" />
            <stop offset="100%" stopColor="#e8c44a" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={radius} className="score-circle-bg" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          className="score-circle-fill"
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="score-value-overlay">
        <div className="score-number">{score}</div>
        <div className="score-denom">/ 100</div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const AIMockInterview = () => {
  // Phase management
  const [phase, setPhase] = useState('setup');  // 'setup' | 'interview' | 'feedback'
  const [loading, setLoading] = useState(false);

  // Setup config
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Entry-Level');
  const [interviewType, setInterviewType] = useState('Technical');

  // Interview state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'speaking' | 'listening' | 'thinking'
  const [questionCount, setQuestionCount] = useState(0);
  const MAX_QUESTIONS = 8;

  // STT / TTS
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Media
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const videoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Feedback
  const [evaluation, setEvaluation] = useState(null);

  // Timer
  const timer = useTimer(phase === 'interview');

  // Speech API refs (stable across renders)
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // ── Setup Recognition once ────────────────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    recognitionRef.current = rec;
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Webcam ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'interview' && cameraOn && !stream) startMedia();
    // eslint-disable-next-line
  }, [phase]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => () => stopMedia(), []); // eslint-disable-line

  const startMedia = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
    } catch {
      toast.warning('Camera/Mic access denied. You can still type your answers.');
      setCameraOn(false);
      setMicOn(false);
    }
  };

  const stopMedia = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    stream?.getVideoTracks().forEach(t => (t.enabled = !cameraOn));
    setCameraOn(p => !p);
  };

  const toggleMic = () => {
    stream?.getAudioTracks().forEach(t => (t.enabled = !micOn));
    setMicOn(p => !p);
  };

  // ── TTS ───────────────────────────────────────────────────────────────────
  const speak = useCallback((text, onDone) => {
    const synth = synthRef.current;
    if (!ttsEnabled || !synth) { onDone?.(); return; }

    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);

    const loadVoice = () => {
      const voices = synth.getVoices();
      const en = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'))
        || voices.find(v => v.lang.startsWith('en'))
        || voices[0];
      if (en) utter.voice = en;
    };

    loadVoice();
    if (synth.getVoices().length === 0) {
      synth.onvoiceschanged = loadVoice;
    }

    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.onstart = () => setStatus('speaking');
    utter.onend = () => { setStatus('listening'); onDone?.(); };
    utter.onerror = () => { setStatus('idle'); onDone?.(); };

    synth.speak(utter);
  }, [ttsEnabled]);

  // ── STT ────────────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) { toast.error('Speech recognition not supported in this browser.'); return; }

    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setInputMessage(t);
      setIsListening(false);
      setTimeout(() => sendMessage(null, t), 300);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);

    try {
      rec.start();
      setIsListening(true);
    } catch (err) {
      console.error(err);
    }
  }, []); // eslint-disable-line

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleMicToggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // ── API calls ──────────────────────────────────────────────────────────────
  const apiPost = async (endpoint, data) => {
    const token = localStorage.getItem('token');
    return axios.post(endpoint, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await apiPost('/api/mock-interview/chat', {
        jobRole,
        interviewType,
        experienceLevel,
        conversationHistory: [],
      });

      if (res.data.success) {
        const firstMsg = { role: 'ai', content: res.data.response };
        setMessages([firstMsg]);
        setQuestionCount(1);
        setPhase('interview');
        speak(res.data.response, startListening);
      }
    } catch {
      toast.error('Failed to start the interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e, voiceText = null) => {
    if (e) e.preventDefault();
    const userInput = (voiceText ?? inputMessage).trim();
    if (!userInput || loading) return;

    setInputMessage('');
    setStatus('thinking');

    const newHistory = [...messages, { role: 'user', content: userInput }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await apiPost('/api/mock-interview/chat', {
        jobRole,
        interviewType,
        experienceLevel,
        conversationHistory: newHistory,
        questionNumber: questionCount,
        maxQuestions: MAX_QUESTIONS,
      });

      if (res.data.success) {
        const aiMsg = { role: 'ai', content: res.data.response };
        setMessages(h => [...h, aiMsg]);
        setQuestionCount(q => q + 1);

        // If AI signals end or we've hit max questions, end automatically
        if (
          questionCount >= MAX_QUESTIONS ||
          res.data.response.toLowerCase().includes('interview is now complete') ||
          res.data.response.toLowerCase().includes('thank you for your time')
        ) {
          speak(res.data.response, () => endInterview([...newHistory, aiMsg]));
        } else {
          speak(res.data.response, startListening);
        }
      }
    } catch {
      toast.error('Failed to get response. Please try again.');
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const endInterview = async (finalHistory = null) => {
    const historyToEval = finalHistory || messages;
    if (historyToEval.filter(m => m.role === 'user').length < 2) {
      toast.warning('Interview too short to evaluate. Please answer at least 2 questions.');
      return;
    }

    synthRef.current?.cancel();
    setLoading(true);
    toast.info('Generating your performance report…', { autoClose: false, toastId: 'eval' });

    try {
      const res = await apiPost('/api/mock-interview/evaluate', {
        jobRole,
        interviewType,
        experienceLevel,
        conversationHistory: historyToEval,
      });

      if (res.data.success) {
        setEvaluation(res.data.evaluation);
        stopMedia();
        setPhase('feedback');
        toast.dismiss('eval');
        toast.success('Evaluation complete!');
      }
    } catch {
      toast.error('Failed to generate report.');
      toast.dismiss('eval');
    } finally {
      setLoading(false);
    }
  };

  // ── Last AI question for display ──────────────────────────────────────────
  const lastAiMessage = [...messages].reverse().find(m => m.role === 'ai');

  // ── Keyboard shortcut ─────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: SETUP
  // ═══════════════════════════════════════════════════════════════════════════
  const renderSetup = () => (
    <div className="setup-wrapper">
      <div className="setup-brand">
        <div className="setup-brand-badge">
          <Zap size={12} /> AI-Powered Interview Simulator
        </div>
        <h1>
          Ace Your Next <span>Interview</span>
        </h1>
        <p>
          Practice with a real-time AI interviewer that adapts to your profile,
          asks deep follow-up questions, and provides comprehensive performance feedback.
        </p>
      </div>

      <div className="setup-card">
        <div className="setup-section-title">Position Details</div>

        <div className="form-grid">
          <div className="form-field full-width">
            <label>Target Role</label>
            <input
              type="text"
              value={jobRole}
              onChange={e => setJobRole(e.target.value)}
              placeholder="e.g. Frontend Developer, Data Analyst, ML Engineer"
            />
          </div>

          <div className="form-field">
            <label>Experience Level</label>
            <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
              {EXPERIENCE_LEVELS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Duration</label>
            <select disabled>
              <option>~{MAX_QUESTIONS} Questions</option>
            </select>
          </div>
        </div>

        <div className="setup-divider" />

        <div className="setup-section-title">Interview Focus</div>

        <div className="interview-type-grid">
          {INTERVIEW_TYPES.map(t => (
            <div
              key={t.id}
              className={`type-card ${interviewType === t.id ? 'selected' : ''}`}
              onClick={() => setInterviewType(t.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setInterviewType(t.id)}
            >
              <div className="type-icon">{t.icon}</div>
              <div className="type-label">{t.label}</div>
              <div className="type-desc">{t.desc}</div>
            </div>
          ))}
        </div>

        <button
          className="btn-start-interview"
          onClick={startInterview}
          disabled={loading || !jobRole.trim()}
          id="start-interview-btn"
        >
          {loading ? (
            <><div className="spinner" /> Initializing AI Engine…</>
          ) : (
            <><Play size={16} /> Begin Interview</>
          )}
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: INTERVIEW ROOM
  // ═══════════════════════════════════════════════════════════════════════════
  const renderInterviewRoom = () => (
    <div className="interview-room">
      {/* Top progress bar */}
      <div className="interview-progress-bar">
        <div
          className="interview-progress-fill"
          style={{ width: `${(questionCount / MAX_QUESTIONS) * 100}%` }}
        />
      </div>

      {/* ── LEFT: Stage ─────────────────────────────────── */}
      <div className="interview-stage">
        {/* Header */}
        <div className="interview-header">
          <div className="interview-meta">
            <div className="meta-chip">{interviewType}</div>
            <div className="meta-chip">{experienceLevel}</div>
            <div className="meta-chip">{jobRole}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="live-dot">Live</div>
            <div className="interview-timer">{timer.fmt}</div>
          </div>
        </div>

        {/* AI Avatar */}
        <div className="ai-presenter">
          <div className={`ai-avatar-shell ${status === 'speaking' ? 'speaking' : ''}`}>
            <div className="ai-ring ai-ring-1" />
            <div className="ai-ring ai-ring-2" />
            <div className="ai-ring ai-ring-3" />
            <div className="ai-avatar-core">🧠</div>
          </div>

          <WaveformBars active={status === 'speaking'} />

          <div className="ai-status-display">
            <div className="ai-name">Aurelian · AI Interviewer</div>
            <div className={`ai-status-pill ${status}`}>
              {status === 'speaking' && '🗣 Speaking'}
              {status === 'thinking' && '⚙ Analyzing Response'}
              {status === 'listening' && '🎙 Awaiting Your Answer'}
              {status === 'idle' && '◉ Ready'}
            </div>
          </div>
        </div>

        {/* Current question card */}
        <div className="current-question-card">
          <div className="cq-label">
            <BrainCircuit size={12} />
            Question {questionCount} of {MAX_QUESTIONS}
          </div>
          {status === 'thinking' ? (
            <div className="cq-thinking">
              <div className="cq-thinking-dot" />
              <div className="cq-thinking-dot" />
              <div className="cq-thinking-dot" />
              Formulating next question…
            </div>
          ) : (
            <div className="cq-text">
              {lastAiMessage?.content || 'Waiting for the interviewer…'}
            </div>
          )}
        </div>

        {/* Candidate video */}
        <div className="candidate-video-panel">
          {cameraOn && stream ? (
            <video ref={videoRef} autoPlay muted playsInline />
          ) : (
            <div className="video-off-placeholder">
              <CameraOff size={24} />
              <span>Camera Off</span>
            </div>
          )}
          <div className="candidate-video-controls">
            <button className={`vid-btn ${!micOn ? 'danger' : ''}`} onClick={toggleMic} title="Toggle Mic">
              {micOn ? <Mic size={14} /> : <MicOff size={14} />}
            </button>
            <button className={`vid-btn ${!cameraOn ? 'danger' : ''}`} onClick={toggleCamera} title="Toggle Camera">
              {cameraOn ? <Camera size={14} /> : <CameraOff size={14} />}
            </button>
          </div>
        </div>

        {/* Voice listening indicator */}
        <div className={`user-voice-indicator ${isListening ? 'active' : ''}`}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`voice-bar ${isListening ? 'active' : ''}`} />
          ))}
        </div>
      </div>

      {/* ── RIGHT: Transcript Panel ──────────────────────── */}
      <div className="transcript-panel">
        <div className="transcript-header">
          <div className="transcript-title-row">
            <div className="transcript-title">Interview Log</div>
            <div className="transcript-count">{messages.length} msgs</div>
          </div>
          <div className="q-progress-container">
            <div
              className="q-progress-bar"
              style={{ width: `${(questionCount / MAX_QUESTIONS) * 100}%` }}
            />
          </div>
        </div>

        <div className="transcript-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-entry ${msg.role}`}>
              <div className="msg-sender">
                {msg.role === 'ai' ? '🧠 Aurelian' : '👤 You'}
              </div>
              <div className="msg-bubble">{msg.content}</div>
            </div>
          ))}
          {loading && status === 'thinking' && (
            <div className="msg-entry ai">
              <div className="msg-sender">🧠 Aurelian</div>
              <div className="msg-bubble">
                <div className="cq-thinking" style={{ padding: 0 }}>
                  <div className="cq-thinking-dot" />
                  <div className="cq-thinking-dot" />
                  <div className="cq-thinking-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              className="answer-input"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
              disabled={loading}
              rows={2}
            />
            <button
              className={`btn-mic ${isListening ? 'active' : ''}`}
              onClick={handleMicToggle}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              className="btn-send"
              onClick={sendMessage}
              disabled={!inputMessage.trim() || loading}
              title="Send Answer"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="input-actions">
            <span className="input-hint">⌨ Enter to send · Shift+Enter for new line</span>
            <button
              className="btn-end-interview"
              onClick={() => endInterview()}
              disabled={loading}
            >
              <StopCircle size={12} /> End & Evaluate
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: FEEDBACK
  // ═══════════════════════════════════════════════════════════════════════════
  const renderFeedback = () => {
    if (!evaluation) return null;
    const { overallScore, communicationScore, technicalScore, strengths, weaknesses, feedback } = evaluation;

    return (
      <div className="feedback-wrapper">
        <div className="feedback-hero">
          <div className="feedback-badge">
            <CheckCircle size={12} /> Report Ready
          </div>
          <h1>Interview Performance Report</h1>
          <p>{experienceLevel} {jobRole} — {interviewType} · {timer.fmt} session</p>
        </div>

        {/* Scores */}
        <div className="score-arc-section">
          <div className="score-main-card">
            <ScoreArc score={overallScore} />
            <div className="score-label-main">Overall Score</div>
          </div>

          <div className="score-main-card" style={{ flex: 2 }}>
            <div className="sub-scores">
              <div className="sub-score-item">
                <div className="sub-score-row">
                  <span className="sub-score-label">Communication</span>
                  <span className="sub-score-val">{communicationScore}<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/100</span></span>
                </div>
                <div className="sub-score-track">
                  <div className="sub-score-fill comm" style={{ width: `${communicationScore}%` }} />
                </div>
              </div>

              <div className="sub-score-item">
                <div className="sub-score-row">
                  <span className="sub-score-label">Technical Depth</span>
                  <span className="sub-score-val">{technicalScore}<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/100</span></span>
                </div>
                <div className="sub-score-track">
                  <div className="sub-score-fill tech" style={{ width: `${technicalScore}%` }} />
                </div>
              </div>

              <div className="sub-score-item">
                <div className="sub-score-row">
                  <span className="sub-score-label">Problem-Solving</span>
                  <span className="sub-score-val">
                    {Math.round((communicationScore + technicalScore) / 2)}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
                  </span>
                </div>
                <div className="sub-score-track">
                  <div
                    className="sub-score-fill prob"
                    style={{ width: `${Math.round((communicationScore + technicalScore) / 2)}%` }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 8, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Hire Likelihood
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: overallScore >= 75 ? 'var(--success)' : overallScore >= 55 ? 'var(--warn)' : 'var(--danger)'
                }}>
                  {overallScore >= 75 ? '✅ Strong Candidate' : overallScore >= 55 ? '⚠ Borderline — Needs Improvement' : '❌ Not Ready Yet'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="feedback-summary-card">
          <h3>📋 Recruiter's Summary</h3>
          <p>{feedback}</p>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="feedback-grid">
          <div className="feedback-card fc-strengths">
            <h3><CheckCircle size={14} /> Strengths</h3>
            <ul>
              {strengths?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="feedback-card fc-weaknesses">
            <h3><AlertTriangle size={14} /> Areas to Improve</h3>
            <ul>
              {weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>

        {/* Retry */}
        <button
          className="btn-restart"
          onClick={() => {
            setPhase('setup');
            setMessages([]);
            setEvaluation(null);
            setQuestionCount(0);
            setStatus('idle');
            timer.reset();
          }}
        >
          <RotateCcw size={16} /> Try Another Interview
        </button>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  ROOT
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mock-interview-container">
      {phase === 'setup' && renderSetup()}
      {phase === 'interview' && renderInterviewRoom()}
      {phase === 'feedback' && renderFeedback()}
    </div>
  );
};

export default AIMockInterview;
