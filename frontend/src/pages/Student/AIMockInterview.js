// frontend/src/pages/Student/AIMockInterview.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Camera, CameraOff, Mic, MicOff, Send,
  Play, StopCircle, CheckCircle, AlertTriangle,
  RotateCcw, Zap, BrainCircuit, TrendingUp,
  BookOpen, Target, Star, ArrowRight, Clock
} from 'lucide-react';
import './AIMockInterview.css';

// ─── Config ───────────────────────────────────────────────────────────────────
const INTERVIEW_TYPES = [
  { id: 'Technical',     icon: '💻', label: 'Technical',     desc: 'Concepts & DSA'         },
  { id: 'Behavioral',   icon: '🎯', label: 'Behavioral',   desc: 'STAR & Soft Skills'      },
  { id: 'System Design',icon: '🏗️', label: 'System Design',desc: 'Architecture & Scale'    },
];
const EXPERIENCE_LEVELS = ['Internship', 'Entry-Level', 'Mid-Level', 'Senior'];
const MAX_QUESTIONS = 8;

const VERDICT_CONFIG = {
  'Strong Hire': { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  icon: '🏆', label: 'Strong Hire'    },
  'Hire':        { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', icon: '✅', label: 'Hire'           },
  'No Hire':     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⚠️', label: 'No Hire'        },
  'Strong No Hire': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '❌', label: 'Strong No Hire'},
};

// ─── Timer Hook ───────────────────────────────────────────────────────────────
function useTimer(running) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  return { seconds, fmt: fmt(seconds), reset: () => setSeconds(0) };
}

// ─── Radar Chart (pure CSS/SVG) ───────────────────────────────────────────────
const RadarChart = ({ scores }) => {
  const labels  = ['Technical', 'Communication', 'Problem Solving', 'Confidence', 'Overall'];
  const values  = [
    scores.technicalScore, scores.communicationScore,
    scores.problemSolvingScore, scores.confidenceScore, scores.overallScore
  ];
  const cx = 110, cy = 110, r = 80;
  const N  = labels.length;

  const angleFn = i => (Math.PI * 2 * i) / N - Math.PI / 2;

  const toXY = (i, val) => {
    const ratio = val / 100;
    return {
      x: cx + r * ratio * Math.cos(angleFn(i)),
      y: cy + r * ratio * Math.sin(angleFn(i)),
    };
  };

  const outerPoints = Array.from({ length: N }, (_, i) => ({
    x: cx + r * Math.cos(angleFn(i)),
    y: cy + r * Math.sin(angleFn(i)),
  }));

  const dataPoints = values.map((v, i) => toXY(i, v));
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  const grid    = outerPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="radar-wrapper">
      <svg width="220" height="220" viewBox="0 0 220 220">
        <defs>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a227" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#c9a227" stopOpacity="0.1"/>
          </linearGradient>
        </defs>
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map(scale => (
          <polygon
            key={scale}
            points={outerPoints.map(p => `${cx + (p.x - cx)*scale},${cy + (p.y - cy)*scale}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
        {/* Spokes */}
        {outerPoints.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {/* Data polygon */}
        <polygon points={polygon} fill="url(#radarFill)" stroke="#c9a227" strokeWidth="1.5"/>
        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#c9a227" />
        ))}
        {/* Labels */}
        {outerPoints.map((p, i) => {
          const dx = p.x - cx, dy = p.y - cy;
          const lx = cx + dx * 1.22, ly = cy + dy * 1.22;
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fill="rgba(255,255,255,0.5)" fontFamily="Inter,sans-serif">
              {labels[i]}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

// ─── Score Arc SVG ────────────────────────────────────────────────────────────
const ScoreArc = ({ score, size = 140, label = 'Overall' }) => {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  return (
    <div className="score-arc-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`sg-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c9a227"/>
            <stop offset="100%" stopColor="#e8c44a"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={`url(#sg-${label})`} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (score / 100) * circ}
          style={{ transform: `rotate(-90deg)`, transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="score-arc-inner">
        <span className="score-arc-num">{score}</span>
        <span className="score-arc-label">{label}</span>
      </div>
    </div>
  );
};

// ─── Waveform ────────────────────────────────────────────────────────────────
const WaveformBars = ({ active }) => (
  <div className="ai-waveform">
    {Array.from({ length: 9 }, (_, i) => (
      <div key={i} className="waveform-bar"
        style={active ? {
          background: 'var(--gold)',
          animation: `wave-anim ${0.5 + (i % 3) * 0.15}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.07}s`,
          height: `${12 + (i % 4) * 8}px`,
        } : {}} />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════════
const AIMockInterview = () => {
  const [phase, setPhase]             = useState('setup');
  const [loading, setLoading]         = useState(false);
  const [jobRole, setJobRole]         = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Entry-Level');
  const [interviewType, setInterviewType]    = useState('Technical');
  const [messages, setMessages]       = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [status, setStatus]           = useState('idle');
  const [questionCount, setQuestionCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled]                  = useState(true);
  const [stream, setStream]           = useState(null);
  const [cameraOn, setCameraOn]       = useState(true);
  const [micOn, setMicOn]             = useState(true);
  const [evaluation, setEvaluation]   = useState(null);
  const [activeReportTab, setActiveReportTab] = useState('overview');
  const [sessionTime, setSessionTime] = useState('00:00');

  const videoRef       = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef       = useRef(window.speechSynthesis);
  const timer          = useTimer(phase === 'interview');

  // Keep session time when interview ends
  useEffect(() => { if (phase === 'feedback') setSessionTime(timer.fmt); }, [phase]); // eslint-disable-line

  // STT setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    recognitionRef.current = rec;
  }, []);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Webcam
  useEffect(() => { if (phase === 'interview' && cameraOn && !stream) startMedia(); }, [phase]); // eslint-disable-line
  useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream; }, [stream]);
  useEffect(() => () => stopMedia(), []); // eslint-disable-line

  const startMedia = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
    } catch {
      toast.warning('Camera/Mic access denied. You can still type your answers.');
      setCameraOn(false); setMicOn(false);
    }
  };

  const stopMedia = () => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
  };

  const toggleCamera = () => {
    stream?.getVideoTracks().forEach(t => (t.enabled = !cameraOn));
    setCameraOn(p => !p);
  };
  const toggleMic = () => {
    stream?.getAudioTracks().forEach(t => (t.enabled = !micOn));
    setMicOn(p => !p);
  };

  // TTS
  const speak = useCallback((text, onDone) => {
    const synth = synthRef.current;
    if (!ttsEnabled || !synth) { onDone?.(); return; }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const loadVoice = () => {
      const voices = synth.getVoices();
      const en = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'))
              || voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (en) utter.voice = en;
    };
    loadVoice();
    if (!synth.getVoices().length) synth.onvoiceschanged = loadVoice;
    utter.rate = 0.95; utter.pitch = 1.0;
    utter.onstart = () => setStatus('speaking');
    utter.onend   = () => { setStatus('listening'); onDone?.(); };
    utter.onerror = () => { setStatus('idle'); onDone?.(); };
    synth.speak(utter);
  }, [ttsEnabled]);

  // STT
  const startListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    rec.onresult = e => {
      const t = e.results[0][0].transcript;
      setInputMessage(t);
      setIsListening(false);
      setTimeout(() => sendMessage(null, t), 300);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    try { rec.start(); setIsListening(true); } catch {}
  }, []); // eslint-disable-line

  const stopListening  = () => { recognitionRef.current?.stop(); setIsListening(false); };
  const handleMicClick = () => isListening ? stopListening() : startListening();

  // API
  const apiPost = (endpoint, data) => {
    const token = localStorage.getItem('token');
    return axios.post(endpoint, data, { headers: { Authorization: `Bearer ${token}` } });
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await apiPost('/api/mock-interview/chat', {
        jobRole, interviewType, experienceLevel, conversationHistory: [],
      });
      if (res.data.success) {
        const first = { role: 'ai', content: res.data.response };
        setMessages([first]);
        setQuestionCount(1);
        setPhase('interview');
        speak(res.data.response, startListening);
      }
    } catch { toast.error('Failed to start interview. Please try again.'); }
    finally { setLoading(false); }
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
        jobRole, interviewType, experienceLevel,
        conversationHistory: newHistory,
        questionNumber: questionCount,
        maxQuestions: MAX_QUESTIONS,
      });
      if (res.data.success) {
        const aiMsg = { role: 'ai', content: res.data.response };
        const fullHistory = [...newHistory, aiMsg];
        setMessages(fullHistory);
        setQuestionCount(q => q + 1);
        const isEnd = questionCount >= MAX_QUESTIONS ||
          res.data.response.toLowerCase().includes('interview is now complete') ||
          res.data.response.toLowerCase().includes('thank you for your time');
        if (isEnd) speak(res.data.response, () => endInterview(fullHistory));
        else speak(res.data.response, startListening);
      }
    } catch { toast.error('Failed to get AI response.'); setStatus('idle'); }
    finally  { setLoading(false); }
  };

  const endInterview = async (finalHistory = null) => {
    const hist = finalHistory || messages;
    if (!hist.filter(m => m.role === 'user').length) {
      toast.warning('Answer at least one question before ending.');
      return;
    }
    synthRef.current?.cancel();
    setLoading(true);
    toast.info('Generating your performance report…', { autoClose: false, toastId: 'eval' });
    try {
      const res = await apiPost('/api/mock-interview/evaluate', {
        jobRole, interviewType, experienceLevel, conversationHistory: hist,
      });
      if (res.data.success) {
        setEvaluation(res.data.evaluation);
        stopMedia();
        setPhase('feedback');
        toast.dismiss('eval');
        toast.success('Report ready!');
      }
    } catch { toast.error('Evaluation failed.'); toast.dismiss('eval'); }
    finally  { setLoading(false); }
  };

  const resetAll = () => {
    setPhase('setup'); setMessages([]); setEvaluation(null);
    setQuestionCount(0); setStatus('idle'); setActiveReportTab('overview');
    timer.reset();
  };

  const lastAiMessage = [...messages].reverse().find(m => m.role === 'ai');

  /* ─────────────────────────────────────────────────────────────────────────
     SETUP
  ───────────────────────────────────────────────────────────────────────── */
  const renderSetup = () => (
    <div className="setup-wrapper">
      <div className="setup-brand">
        <div className="setup-brand-badge"><Zap size={12}/> AI-Powered Interview Simulator</div>
        <h1>Ace Your Next <span>Interview</span></h1>
        <p>Practice with a real-time AI interviewer that adapts to your profile, asks deep personalised follow-ups, and delivers a FAANG-quality performance report.</p>
      </div>

      <div className="setup-card">
        <div className="setup-section-title">Position Details</div>

        <div className="form-grid">
          <div className="form-field full-width">
            <label>Target Role</label>
            <input type="text" value={jobRole} onChange={e => setJobRole(e.target.value)}
              placeholder="e.g. Frontend Developer, Data Analyst, ML Engineer"/>
          </div>
          <div className="form-field">
            <label>Experience Level</label>
            <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
              {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Session Length</label>
            <select disabled><option>~{MAX_QUESTIONS} Questions</option></select>
          </div>
        </div>

        <div className="setup-divider"/>
        <div className="setup-section-title">Interview Focus</div>

        <div className="interview-type-grid">
          {INTERVIEW_TYPES.map(t => (
            <div key={t.id}
              className={`type-card ${interviewType === t.id ? 'selected' : ''}`}
              onClick={() => setInterviewType(t.id)} role="button" tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setInterviewType(t.id)}>
              <div className="type-icon">{t.icon}</div>
              <div className="type-label">{t.label}</div>
              <div className="type-desc">{t.desc}</div>
            </div>
          ))}
        </div>

        <button className="btn-start-interview" onClick={startInterview}
          disabled={loading || !jobRole.trim()} id="start-interview-btn">
          {loading ? <><div className="spinner"/> Initializing AI Engine…</>
                   : <><Play size={16}/> Begin Interview</>}
        </button>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     INTERVIEW ROOM
  ───────────────────────────────────────────────────────────────────────── */
  const renderInterviewRoom = () => (
    <div className="interview-room">
      <div className="interview-progress-bar">
        <div className="interview-progress-fill"
          style={{ width: `${(questionCount/MAX_QUESTIONS)*100}%` }}/>
      </div>

      {/* Stage */}
      <div className="interview-stage">
        <div className="interview-header">
          <div className="interview-meta">
            <div className="meta-chip">{interviewType}</div>
            <div className="meta-chip">{experienceLevel}</div>
            <div className="meta-chip">{jobRole}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div className="live-dot">Live</div>
            <div className="interview-timer">{timer.fmt}</div>
          </div>
        </div>

        <div className="ai-presenter">
          <div className={`ai-avatar-shell ${status === 'speaking' ? 'speaking' : ''}`}>
            <div className="ai-ring ai-ring-1"/><div className="ai-ring ai-ring-2"/><div className="ai-ring ai-ring-3"/>
            <div className="ai-avatar-core">🧠</div>
          </div>
          <WaveformBars active={status === 'speaking'}/>
          <div className="ai-status-display">
            <div className="ai-name">Aurelian · AI Interviewer</div>
            <div className={`ai-status-pill ${status}`}>
              {status === 'speaking'  && '🗣 Speaking'}
              {status === 'thinking'  && '⚙ Analyzing Response'}
              {status === 'listening' && '🎙 Awaiting Your Answer'}
              {status === 'idle'      && '◉ Ready'}
            </div>
          </div>
        </div>

        <div className="current-question-card">
          <div className="cq-label">
            <BrainCircuit size={12}/>
            Question {questionCount} of {MAX_QUESTIONS}
          </div>
          {status === 'thinking' ? (
            <div className="cq-thinking">
              <div className="cq-thinking-dot"/><div className="cq-thinking-dot"/><div className="cq-thinking-dot"/>
              Formulating next question…
            </div>
          ) : (
            <div className="cq-text">{lastAiMessage?.content || 'Waiting for the interviewer…'}</div>
          )}
        </div>

        {/* Camera */}
        <div className="candidate-video-panel">
          {cameraOn && stream
            ? <video ref={videoRef} autoPlay muted playsInline/>
            : <div className="video-off-placeholder"><CameraOff size={24}/><span>Camera Off</span></div>}
          <div className="candidate-video-controls">
            <button className={`vid-btn ${!micOn ? 'danger' : ''}`} onClick={toggleMic}>
              {micOn ? <Mic size={14}/> : <MicOff size={14}/>}
            </button>
            <button className={`vid-btn ${!cameraOn ? 'danger' : ''}`} onClick={toggleCamera}>
              {cameraOn ? <Camera size={14}/> : <CameraOff size={14}/>}
            </button>
          </div>
        </div>

        {/* Voice indicator */}
        <div className={`user-voice-indicator ${isListening ? 'active' : ''}`}>
          {[...Array(5)].map((_,i) => <div key={i} className={`voice-bar ${isListening?'active':''}`}/>)}
        </div>
      </div>

      {/* Transcript Sidebar */}
      <div className="transcript-panel">
        <div className="transcript-header">
          <div className="transcript-title-row">
            <div className="transcript-title">Interview Log</div>
            <div className="transcript-count">{messages.length} msgs</div>
          </div>
          <div className="q-progress-container">
            <div className="q-progress-bar" style={{ width: `${(questionCount/MAX_QUESTIONS)*100}%` }}/>
          </div>
        </div>

        <div className="transcript-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-entry ${msg.role}`}>
              <div className="msg-sender">{msg.role === 'ai' ? '🧠 Aurelian' : '👤 You'}</div>
              <div className="msg-bubble">{msg.content}</div>
            </div>
          ))}
          {loading && status === 'thinking' && (
            <div className="msg-entry ai">
              <div className="msg-sender">🧠 Aurelian</div>
              <div className="msg-bubble">
                <div className="cq-thinking" style={{padding:0}}>
                  <div className="cq-thinking-dot"/><div className="cq-thinking-dot"/><div className="cq-thinking-dot"/>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        <div className="input-area">
          <div className="input-row">
            <textarea className="answer-input" value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }}}
              placeholder="Type your answer… (Enter to send)" disabled={loading} rows={2}/>
            <button className={`btn-mic ${isListening ? 'active' : ''}`} onClick={handleMicClick}>
              {isListening ? <MicOff size={16}/> : <Mic size={16}/>}
            </button>
            <button className="btn-send" onClick={sendMessage}
              disabled={!inputMessage.trim() || loading}><Send size={16}/></button>
          </div>
          <div className="input-actions">
            <span className="input-hint">⌨ Enter to send · Shift+Enter for new line</span>
            <button className="btn-end-interview" onClick={() => endInterview()} disabled={loading}>
              <StopCircle size={12}/> End & Evaluate
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     FEEDBACK — Premium Report
  ───────────────────────────────────────────────────────────────────────── */
  const renderFeedback = () => {
    if (!evaluation) return null;
    const ev = evaluation;
    const verdict = VERDICT_CONFIG[ev.hiringVerdict] || VERDICT_CONFIG['No Hire'];
    const userAnswerCount = messages.filter(m => m.role === 'user').length;

    const tabs = [
      { id: 'overview',  label: '📊 Overview'         },
      { id: 'projects',  label: '🔬 Project Insights'  },
      { id: 'moments',   label: '⚡ Key Moments'        },
      { id: 'growth',    label: '🚀 Growth Plan'        },
    ];

    return (
      <div className="report-wrapper">
        {/* ── Hero Header ────────────────────────────────── */}
        <div className="report-hero">
          <div className="report-hero-left">
            <div className="report-badge">
              <CheckCircle size={12}/> Interview Report Ready
            </div>
            <h1 className="report-title">Performance Analysis</h1>
            <p className="report-subtitle">
              {experienceLevel} {jobRole} &nbsp;·&nbsp; {interviewType} &nbsp;·&nbsp;
              <Clock size={12} style={{display:'inline', verticalAlign:'middle'}}/> {sessionTime} session &nbsp;·&nbsp;
              {userAnswerCount} answer{userAnswerCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="verdict-badge-large" style={{ background: verdict.bg, borderColor: verdict.color }}>
            <span className="verdict-icon">{verdict.icon}</span>
            <div>
              <div className="verdict-label" style={{ color: verdict.color }}>Hiring Verdict</div>
              <div className="verdict-text"  style={{ color: verdict.color }}>{verdict.label}</div>
            </div>
          </div>
        </div>

        {/* ── Score Row ──────────────────────────────────── */}
        <div className="score-row">
          <ScoreArc score={ev.overallScore}        label="Overall"       size={120}/>
          <ScoreArc score={ev.technicalScore}      label="Technical"     size={100}/>
          <ScoreArc score={ev.communicationScore}  label="Comms"         size={100}/>
          <ScoreArc score={ev.problemSolvingScore || 50} label="Problem Solving"  size={100}/>
          <ScoreArc score={ev.confidenceScore || 50}     label="Confidence"  size={100}/>
        </div>

        {/* ── Percentile Banner ─────────────────────────── */}
        {ev.industryPercentile && (
          <div className="percentile-banner">
            <TrendingUp size={16}/>
            You performed better than&nbsp;
            <strong style={{ color: 'var(--gold)' }}>{ev.industryPercentile}%</strong>
            &nbsp;of candidates applying for {level || experienceLevel} {jobRole} roles.
          </div>
        )}

        {/* ── Tab Navigation ────────────────────────────── */}
        <div className="report-tabs">
          {tabs.map(t => (
            <button key={t.id}
              className={`report-tab ${activeReportTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveReportTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ─────────────────────────────── */}
        {activeReportTab === 'overview' && (
          <div className="report-section">
            <div className="report-two-col">
              {/* Radar chart */}
              <div className="report-card radar-card">
                <div className="card-title"><Star size={14}/> Performance Radar</div>
                <RadarChart scores={{
                  overallScore: ev.overallScore,
                  technicalScore: ev.technicalScore,
                  communicationScore: ev.communicationScore,
                  problemSolvingScore: ev.problemSolvingScore || 50,
                  confidenceScore: ev.confidenceScore || 50,
                }}/>
              </div>

              {/* Summary */}
              <div className="report-card">
                <div className="card-title"><BrainCircuit size={14}/> Recruiter's Summary</div>
                <p className="report-summary-text">{ev.feedback}</p>

                <div className="mini-scores-grid">
                  {[
                    { label:'Technical',       val: ev.technicalScore,            color:'var(--gold)'    },
                    { label:'Communication',   val: ev.communicationScore,        color:'#60a5fa'        },
                    { label:'Problem Solving', val: ev.problemSolvingScore || 50, color:'#22c55e'        },
                    { label:'Confidence',      val: ev.confidenceScore || 50,     color:'#a78bfa'        },
                  ].map(s => (
                    <div key={s.label} className="mini-score-item">
                      <div className="mini-score-row">
                        <span className="mini-score-label">{s.label}</span>
                        <span className="mini-score-val" style={{ color: s.color }}>{s.val}</span>
                      </div>
                      <div className="mini-score-track">
                        <div className="mini-score-fill" style={{ width:`${s.val}%`, background:s.color }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="sw-grid">
              <div className="report-card fc-strengths">
                <div className="card-title"><CheckCircle size={14}/> What You Did Well</div>
                <ul className="insight-list">
                  {ev.strengths?.map((s, i) => <li key={i}><span className="il-dot green"/>  {s}</li>)}
                </ul>
              </div>
              <div className="report-card fc-weaknesses">
                <div className="card-title"><AlertTriangle size={14}/> Areas to Improve</div>
                <ul className="insight-list">
                  {ev.weaknesses?.map((w, i) => <li key={i}><span className="il-dot amber"/> {w}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Project Insights ─────────────────────── */}
        {activeReportTab === 'projects' && (
          <div className="report-section">
            <div className="section-intro">
              <div className="section-intro-icon">🔬</div>
              <div>
                <div className="section-intro-title">Project & Topic Deep-Dive</div>
                <div className="section-intro-sub">How the AI evaluated each topic you discussed</div>
              </div>
            </div>

            {ev.projectInsights?.length ? ev.projectInsights.map((proj, i) => (
              <div key={i} className="project-insight-card">
                <div className="pi-header">
                  <div className="pi-title">{proj.title}</div>
                  <div className="pi-score-badge" style={{
                    color: proj.rating >= 75 ? '#22c55e' : proj.rating >= 50 ? 'var(--gold)' : '#ef4444',
                    borderColor: proj.rating >= 75 ? 'rgba(34,197,94,0.3)' : proj.rating >= 50 ? 'var(--gold-border)' : 'rgba(239,68,68,0.3)',
                    background: proj.rating >= 75 ? 'rgba(34,197,94,0.08)' : proj.rating >= 50 ? 'var(--gold-dim)' : 'rgba(239,68,68,0.08)',
                  }}>
                    {proj.rating}/100
                  </div>
                </div>
                <div className="pi-track">
                  <div className="pi-fill" style={{
                    width: `${proj.rating}%`,
                    background: proj.rating >= 75 ? '#22c55e' : proj.rating >= 50 ? 'var(--gold)' : '#ef4444',
                  }}/>
                </div>
                <div className="pi-body">
                  <div className="pi-observation">
                    <span className="pi-label">💡 Observation</span>
                    <p>{proj.observation}</p>
                  </div>
                  <div className="pi-suggestion">
                    <span className="pi-label">🎯 To Score Higher</span>
                    <p>{proj.suggestion}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="empty-state">
                No specific project topics were identified from the transcript.
                Make sure to reference your projects clearly during the interview.
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Key Moments ──────────────────────────── */}
        {activeReportTab === 'moments' && (
          <div className="report-section">
            <div className="section-intro">
              <div className="section-intro-icon">⚡</div>
              <div>
                <div className="section-intro-title">Critical Interview Moments</div>
                <div className="section-intro-sub">Exact moments that swayed the interviewer's opinion</div>
              </div>
            </div>

            {ev.keyMoments?.length ? ev.keyMoments.map((moment, i) => (
              <div key={i} className={`moment-card ${moment.type}`}>
                <div className="moment-header">
                  <div className={`moment-badge ${moment.type}`}>
                    {moment.type === 'positive' ? '✅ Strong Moment' : '⚠️ Weak Moment'}
                  </div>
                </div>
                <blockquote className="moment-quote">"{moment.quote}"</blockquote>
                <div className="moment-insight">
                  <ArrowRight size={12}/> {moment.insight}
                </div>
              </div>
            )) : (
              <div className="empty-state">
                No specific key moments were identified. Longer, more detailed answers help the AI pinpoint critical moments.
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Growth Plan ──────────────────────────── */}
        {activeReportTab === 'growth' && (
          <div className="report-section">
            <div className="section-intro">
              <div className="section-intro-icon">🚀</div>
              <div>
                <div className="section-intro-title">Your Personalised Growth Plan</div>
                <div className="section-intro-sub">Specific skills to build before your next real interview</div>
              </div>
            </div>

            {/* Skill Gaps */}
            <div className="report-card" style={{ marginBottom: 20 }}>
              <div className="card-title"><Target size={14}/> Skill Gaps to Close</div>
              <div className="skill-gap-list">
                {ev.skillGaps?.map((sg, i) => (
                  <div key={i} className="skill-gap-item">
                    <div className="sg-header">
                      <span className="sg-skill">{sg.skill}</span>
                      <span className={`sg-priority ${sg.priority?.toLowerCase()}`}>{sg.priority}</span>
                    </div>
                    <div className="sg-resource">
                      <BookOpen size={11}/> {sg.resource}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="report-card">
              <div className="card-title"><ArrowRight size={14}/> Action Plan</div>
              <ol className="next-steps-list">
                {ev.nextSteps?.map((step, i) => (
                  <li key={i}>
                    <span className="step-num">{i + 1}</span>
                    <span className="step-text">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* ── Footer Actions ─────────────────────────────── */}
        <div className="report-footer">
          <button className="btn-restart" onClick={resetAll}>
            <RotateCcw size={14}/> Retake Interview
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mock-interview-container">
      {phase === 'setup'     && renderSetup()}
      {phase === 'interview' && renderInterviewRoom()}
      {phase === 'feedback'  && renderFeedback()}
    </div>
  );
};

export default AIMockInterview;
