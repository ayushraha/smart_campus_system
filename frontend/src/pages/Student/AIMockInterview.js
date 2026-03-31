import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Camera, CameraOff, Mic, MicOff, Send, MessageSquare, 
  Play, StopCircle, Award, CheckCircle, AlertTriangle 
} from 'lucide-react';
import './AIMockInterview.css';

const AIMockInterview = () => {
  // Phase: 'setup', 'interview', 'feedback'
  const [phase, setPhase] = useState('setup');
  const [loading, setLoading] = useState(false);

  // Setup state
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Entry-Level');
  const [interviewType, setInterviewType] = useState('Technical');

  // Interview state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSTTActive, setIsSTTActive] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(true);
  const [status, setStatus] = useState('idle'); // 'idle', 'speaking', 'listening', 'thinking'

  // Media state
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const videoRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Feedback state
  const [evaluation, setEvaluation] = useState(null);

  // Speech Recognition (Web Speech API)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
  }

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle webcam
  useEffect(() => {
    if (phase === 'interview' && cameraActive && !stream) {
      startMedia();
    }
  }, [phase, cameraActive]);

  const startMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Failed to get media", err);
      toast.warning("Camera/Microphone access denied. You can still use text chat.");
      setCameraActive(false);
      setMicActive(false);
    }
  };

  const stopMedia = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopMedia();
  }, [stream]);

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = !cameraActive);
    }
    setCameraActive(!cameraActive);
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !micActive);
    }
    setMicActive(!micActive);
  };

  // Text to Speech
  const speakText = (text, onComplete) => {
    if (!isTTSActive || !window.speechSynthesis) {
        if (onComplete) onComplete();
        return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const engVoice = voices.find(v => v.lang.includes('en-US')) || voices[0];
    if (engVoice) utterance.voice = engVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => {
        setStatus('listening');
        if (onComplete) onComplete();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Speech to Text
  const toggleListening = (auto = false) => {
    if (!recognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isSTTActive) {
      recognition.stop();
      setIsSTTActive(false);
    } else {
      try {
        recognition.start();
        setIsSTTActive(true);
        if (!auto) toast.info("Listening... Speak now");
      } catch(e) {
        console.error(e);
      }
    }
  };

  if (recognition) {
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsSTTActive(false);
      // Auto-send if it was a voice capture
      if (status === 'listening') {
        setTimeout(() => sendMessage(null, transcript), 500);
      }
    };
    recognition.onerror = (event) => {
      console.error("STT Error:", event.error);
      setIsSTTActive(false);
      if (status === 'listening') setStatus('idle');
    };
    recognition.onend = () => {
      setIsSTTActive(false);
    };
  }

  // --- API Integrations ---

  const startInterview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/mock-interview/chat', {
        jobRole,
        interviewType,
        experienceLevel,
        conversationHistory: []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const welcomeMessage = { role: 'ai', content: response.data.response };
        setMessages([welcomeMessage]);
        setPhase('interview');
        speakText(response.data.response, () => {
            toggleListening(true);
        });
      }
    } catch (error) {
      toast.error('Failed to start interview.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e, voiceContent = null) => {
    if (e) e.preventDefault();
    const userMsg = voiceContent || inputMessage;
    if (!userMsg.trim()) return;

    setInputMessage('');
    const newHistory = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);
    setLoading(true);
    setStatus('thinking');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/mock-interview/chat', {
        jobRole,
        interviewType,
        experienceLevel,
        conversationHistory: newHistory
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessages([...newHistory, { role: 'ai', content: response.data.response }]);
        speakText(response.data.response, () => {
          toggleListening(true);
        });
      }
    } catch (error) {
      toast.error('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const endInterview = async () => {
    if (messages.length < 3) {
      toast.warning("Interview was too short to evaluate.");
      stopMedia();
      setPhase('setup');
      setMessages([]);
      return;
    }

    setLoading(true);
    toast.info("Evaluating interview...", { autoClose: false, toastId: 'eval' });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/mock-interview/evaluate', {
        jobRole,
        interviewType,
        experienceLevel,
        conversationHistory: messages
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setEvaluation(response.data.evaluation);
        stopMedia();
        setPhase('feedback');
        toast.dismiss('eval');
        toast.success("Evaluation complete!");
      }
    } catch (error) {
      toast.error('Failed to evaluate interview.');
      toast.dismiss('eval');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Functions ---

  const renderSetup = () => (
    <div className="setup-card">
      <h1>AI Mock Interview</h1>
      <p>Configure your mock interview. Our Gemini AI will roleplay as an expert recruiter to help you practice.</p>

      <div className="form-group">
        <label>Target Job Role</label>
        <input 
          type="text" 
          value={jobRole} 
          onChange={(e) => setJobRole(e.target.value)} 
          placeholder="e.g. Frontend Developer, Data Analyst"
        />
      </div>

      <div className="form-group">
        <label>Experience Level</label>
        <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
          <option value="Internship">Internship</option>
          <option value="Entry-Level">Entry-Level</option>
          <option value="Mid-Level">Mid-Level</option>
          <option value="Senior">Senior</option>
        </select>
      </div>

      <div className="form-group">
        <label>Interview Focus</label>
        <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
          <option value="Technical">Technical (Concepts & Problem Solving)</option>
          <option value="Behavioral">Behavioral (Leadership & Culture Fit)</option>
          <option value="System Design">System Design</option>
        </select>
      </div>

      <button className="btn-start" onClick={startInterview} disabled={loading}>
        {loading ? 'Starting AI Engine...' : <span><Play size={20} /> Start Interview</span>}
      </button>
    </div>
  );

  const renderInterviewRoom = () => (
    <div className={`interview-room status-${status}`}>
      <div className="video-main-container">
        {status === 'thinking' && (
          <div className="thinking-progress">
            <div className="thinking-progress-bar active"></div>
          </div>
        )}

        <div className="ai-persona-container">
          <div className="ai-avatar-group">
            <div className="ai-avatar">
              <div className={`pulse-ring ${status === 'speaking' ? 'active' : ''}`}></div>
              <div className={`pulse-ring delay-1 ${status === 'speaking' ? 'active' : ''}`}></div>
              <div className="ai-icon">🏛️</div>
            </div>
            <div className="ai-meta">
              <h1 className="playfair-headline">Aurelian Assistant</h1>
              <div className="status-badge">
                {status === 'speaking' && "Synthesizing Insight..."}
                {status === 'listening' && "Awaiting Candidate..."}
                {status === 'thinking' && "Analyzing Response..."}
                {status === 'idle' && "System Ready"}
              </div>
            </div>
          </div>
        </div>

        <div className="candidate-video-wrapper">
          {cameraActive && stream ? (
            <video ref={videoRef} autoPlay muted playsInline className="video-feed" />
          ) : (
            <div className="video-placeholder">
              <CameraOff size={32} />
              <p>Opt-out: No Video</p>
            </div>
          )}
          
          <div className="user-voice-indicator">
             <div className={`bar ${isSTTActive ? 'animating' : ''}`}></div>
             <div className={`bar ${isSTTActive ? 'animating' : ''}`}></div>
             <div className={`bar ${isSTTActive ? 'animating' : ''}`}></div>
          </div>

          <div className="video-controls-overlay">
            <button className={`control-btn ${!micActive ? 'danger' : 'active'}`} onClick={toggleMic}>
              {micActive ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
            <button className={`control-btn ${!cameraActive ? 'danger' : 'active'}`} onClick={toggleCamera}>
              {cameraActive ? <Camera size={16} /> : <CameraOff size={16} />}
            </button>
            <button className="control-btn danger" onClick={endInterview}>
              <StopCircle size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="transcript-sidebar">
        <div className="sidebar-header">
          <h2 className="playfair-headline-sm">Journal</h2>
        </div>
        <div className="transcript-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-bubble ${msg.role}`}>
              <div className="msg-text">{msg.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="mini-input" onSubmit={sendMessage}>
          <input 
            type="text" 
            value={inputMessage} 
            onChange={(e) => setInputMessage(e.target.value)} 
            placeholder="Document point of concern..."
            disabled={loading}
          />
          <button type="submit" disabled={!inputMessage.trim()}><Send size={14}/></button>
        </form>
      </div>
    </div>
  );

  const renderFeedback = () => {
    if (!evaluation) return null;
    return (
      <div className="feedback-card">
        <div className="feedback-header">
          <h2>Interview Evaluation Complete</h2>
          <p>Role: {experienceLevel} {jobRole} ({interviewType})</p>
        </div>

        <div className="score-circle">
          {evaluation.overallScore}
          <span>/ 100</span>
        </div>

        <div className="overall-feedback" style={{ marginBottom: '30px' }}>
          <strong>Summary: </strong> {evaluation.feedback}
        </div>

        <div className="feedback-grid">
          <div className="feedback-section" style={{ borderLeft: '4px solid #22c55e' }}>
            <h3 style={{ color: '#16a34a' }}><CheckCircle size={20}/> Strengths</h3>
            <ul>
              {evaluation.strengths.map((str, i) => <li key={i}>{str}</li>)}
            </ul>
          </div>
          <div className="feedback-section" style={{ borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ color: '#d97706' }}><AlertTriangle size={20}/> Areas to Improve</h3>
            <ul>
              {evaluation.weaknesses.map((wk, i) => <li key={i}>{wk}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
          <div><strong>Communication:</strong> {evaluation.communicationScore}/100</div>
          <div><strong>Technical:</strong> {evaluation.technicalScore}/100</div>
        </div>

        <button className="btn-restart" onClick={() => { setPhase('setup'); setMessages([]); }}>
          Try Another Interview
        </button>
      </div>
    );
  };

  return (
    <div className="mock-interview-container">
      {phase === 'setup' && renderSetup()}
      {phase === 'interview' && renderInterviewRoom()}
      {phase === 'feedback' && renderFeedback()}
    </div>
  );
};

export default AIMockInterview;
