import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiFileText, FiStar, FiSave
} from 'react-icons/fi';
import io from 'socket.io-client';
import './Interview.css';

const InterviewRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);

  // Media controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [streamReady, setStreamReady] = useState(false);

  // Interview state
  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionCategory, setQuestionCategory] = useState('technical');
  const [activeTab, setActiveTab] = useState('questions');

  // Live feedback scores (recruiter)
  const [liveScores, setLiveScores] = useState({
    technicalScore: 70,
    communicationScore: 70,
    confidenceScore: 70
  });
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Two separate video refs to avoid black screen bug
  const lobbyVideoRef = useRef(null);
  const roomVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  const fetchInterviewDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/interview/room/${roomId}`);
      setInterview(response.data);
      setQuestions(response.data.questionsAsked || []);

      // Pre-fill live scores from any previously saved analysis
      if (response.data.analysis) {
        const a = response.data.analysis;
        setLiveScores({
          technicalScore: a.technicalScore ?? 70,
          communicationScore: a.communicationScore ?? 70,
          confidenceScore: a.confidenceScore ?? 70
        });
      }

      setLoading(false);
    } catch (error) {
      toast.error('Interview room not found');
      navigate('/');
      setLoading(false);
    }
  }, [roomId, navigate]);

  useEffect(() => {
    fetchInterviewDetails();
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [fetchInterviewDetails]);

  // Reassign stream to in-room video element once inCall becomes true
  useEffect(() => {
    if (inCall && roomVideoRef.current && mediaStreamRef.current) {
      roomVideoRef.current.srcObject = mediaStreamRef.current;
      roomVideoRef.current.play().catch(err => console.warn('Room video play error:', err));
    }
  }, [inCall]);

  // Auto-save live feedback every 30s during interview (recruiter only)
  useEffect(() => {
    if (inCall && user?.role === 'recruiter' && interview) {
      autoSaveTimerRef.current = setInterval(() => {
        saveLiveFeedback(true); // silent save
      }, 30000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inCall, interview]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startLocalStream = async () => {
    try {
      console.log('Requesting camera and microphone access...');

      const constraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      // Assign to lobby preview
      if (lobbyVideoRef.current) {
        lobbyVideoRef.current.srcObject = stream;
        await lobbyVideoRef.current.play().catch(err => console.warn('Lobby play error:', err));
        setStreamReady(true);
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/microphone access denied. Please allow permissions in your browser.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found.');
      } else {
        toast.error('Could not access camera/microphone: ' + error.message);
      }
      return null;
    }
  };

  const createPeerConnection = useCallback((socketId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('signal', {
          roomId,
          to: socketId,
          signalData: { type: 'ice-candidate', candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📡 Received remote track:', event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, mediaStreamRef.current);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [roomId]);

  const joinInterview = async () => {
    try {
      const stream = mediaStreamRef.current || await startLocalStream();
      if (!stream) {
        toast.error('Cannot join without camera/microphone access');
        return;
      }

      // Initialize Socket
      const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
      socketRef.current = io(API_BASE);

      socketRef.current.on('connect', () => {
        console.log('🔌 Connected to signaling server');
        socketRef.current.emit('join-room', roomId);
      });

      socketRef.current.on('user-joined', async (userId) => {
        console.log('👤 Another user joined:', userId);
        const pc = createPeerConnection(userId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit('signal', {
          roomId,
          to: userId,
          signalData: { type: 'offer', offer }
        });
      });

      socketRef.current.on('signal', async (data) => {
        const { from, signalData } = data;

        if (signalData.type === 'offer') {
          console.log('📨 Received offer from:', from);
          const pc = createPeerConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current.emit('signal', {
            roomId,
            to: from,
            signalData: { type: 'answer', answer }
          });
        } else if (signalData.type === 'answer') {
          console.log('📨 Received answer from:', from);
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signalData.answer));
        } else if (signalData.type === 'ice-candidate') {
          console.log('📨 Received ICE candidate from:', from);
          try {
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signalData.candidate));
            }
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        }
      });

      await axios.put(`/api/interview/${interview._id}/start`);
      setInCall(true);
      setIsRecording(true);
      toast.success('Joined interview successfully');
    } catch (error) {
      console.error('Failed to join interview:', error);
      toast.error('Failed to join interview');
    }
  };

  const leaveInterview = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      // Save live feedback before leaving (recruiter)
      if (user?.role === 'recruiter') {
        await saveLiveFeedback(true);
      }
      await axios.put(`/api/interview/${interview._id}/end`);
      setInCall(false);
      setIsRecording(false);
      toast.success('Interview ended');

      if (user.role === 'recruiter') {
        navigate(`/recruiter/interviews/${interview._id}/analysis`);
      } else {
        navigate('/student/applications');
      }
    } catch (error) {
      console.error('Error leaving interview:', error);
      toast.error('Error leaving interview');
    }
  };

  const saveLiveFeedback = async (silent = false) => {
    if (!interview) return;
    setSavingFeedback(true);
    try {
      await axios.put(`/api/interview/${interview._id}/live-feedback`, {
        ...liveScores,
        notes
      });
      if (!silent) toast.success('Feedback scores saved!');
    } catch (error) {
      if (!silent) toast.error('Failed to save feedback');
    } finally {
      setSavingFeedback(false);
    }
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        toast.info(audioTrack.enabled ? 'Microphone on' : 'Microphone muted');
      }
    }
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        toast.info(videoTrack.enabled ? 'Camera on' : 'Camera off');
      }
    }
  };

  const addQuestion = async () => {
    if (!currentQuestion.trim()) {
      toast.warning('Please enter a question');
      return;
    }
    try {
      await axios.post(`/api/interview/${interview._id}/questions`, {
        question: currentQuestion,
        category: questionCategory
      });
      const newQuestion = {
        question: currentQuestion,
        askedAt: new Date(),
        category: questionCategory
      };
      setQuestions([...questions, newQuestion]);
      setCurrentQuestion('');
      toast.success('Question added');
    } catch (error) {
      toast.error('Failed to add question');
    }
  };

  const saveNotes = async () => {
    if (!notes.trim()) {
      toast.warning('No notes to save');
      return;
    }
    try {
      await axios.put(`/api/interview/${interview._id}/notes`, { notes });
      toast.success('Notes saved');
    } catch (error) {
      toast.error('Failed to save notes');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const ScoreSlider = ({ label, field, emoji }) => (
    <div className="score-slider-group">
      <div className="slider-header">
        <span className="slider-label">{emoji} {label}</span>
        <span className="slider-value">{liveScores[field]}<small>/100</small></span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={liveScores[field]}
        onChange={(e) => setLiveScores(prev => ({ ...prev, [field]: Number(e.target.value) }))}
        className={`score-range ${liveScores[field] >= 80 ? 'range-high' : liveScores[field] >= 60 ? 'range-mid' : 'range-low'}`}
      />
      <div className="slider-ticks">
        <span>Poor</span><span>Good</span><span>Excellent</span>
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading interview room...</div>;
  }

  if (!interview) {
    return <div className="loading">Interview not found</div>;
  }

  // ──────────── LOBBY ────────────
  if (!inCall) {
    return (
      <div className="interview-lobby">
        <div className="lobby-container">
          <div className="lobby-header">
            <span className="lobby-icon">🎙️</span>
            <h2>Interview Room</h2>
            <p className="lobby-subtitle">Check your camera and microphone before joining</p>
          </div>

          <div className="interview-details">
            <div className="detail-row">
              <span className="detail-icon">💼</span>
              <div>
                <span className="detail-label">Position</span>
                <strong>{interview?.jobId?.title}</strong>
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-icon">🏢</span>
              <div>
                <span className="detail-label">Company</span>
                <strong>{interview?.jobId?.company}</strong>
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-icon">📅</span>
              <div>
                <span className="detail-label">Date & Time</span>
                <strong>{new Date(interview?.scheduledDate).toLocaleDateString()} at {interview?.scheduledTime}</strong>
              </div>
            </div>
            {user.role === 'student' && (
              <div className="detail-row">
                <span className="detail-icon">👤</span>
                <div>
                  <span className="detail-label">Interviewer</span>
                  <strong>{interview?.recruiterId?.name}</strong>
                </div>
              </div>
            )}
            {user.role === 'recruiter' && (
              <div className="detail-row">
                <span className="detail-icon">🎓</span>
                <div>
                  <span className="detail-label">Candidate</span>
                  <strong>{interview?.studentId?.name}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="video-preview">
            {/* Lobby video ref */}
            <video
              ref={lobbyVideoRef}
              autoPlay
              muted
              playsInline
              className="preview-video"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!streamReady && (
              <div className="preview-placeholder">
                <div className="camera-icon">📷</div>
                <p>Camera preview will appear here</p>
              </div>
            )}
          </div>

          <div className="lobby-actions">
            {!streamReady && (
              <button onClick={startLocalStream} className="btn-test-devices">
                🎬 Test Camera & Microphone
              </button>
            )}
            {streamReady && (
              <div className="device-ready">
                <span className="ready-dot"></span> Camera & Microphone Ready
              </div>
            )}
          </div>

          <button
            onClick={joinInterview}
            className="btn-join"
            disabled={!streamReady}
          >
            {streamReady ? '✅ Join Interview' : '⏳ Test devices first...'}
          </button>
        </div>
      </div>
    );
  }

  // ──────────── IN CALL ────────────
  return (
    <div className="interview-room">
      <div className="video-container">
        <div className="main-video">
          {/* Remote video ref */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
          {!remoteVideoRef.current?.srcObject && (
            <div className="remote-placeholder">
              <div className="avatar-placeholder big">
                {user.role === 'recruiter' ? interview?.studentId?.name?.charAt(0) : interview?.recruiterId?.name?.charAt(0)}
              </div>
              <p>Waiting for {user.role === 'recruiter' ? 'candidate' : 'interviewer'} to join...</p>
            </div>
          )}

          {/* Local video ref — separate from lobby to prevent black screen */}
          <div className="local-video-container">
            <video
              ref={roomVideoRef}
              autoPlay
              muted
              playsInline
              className="local-video"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="video-label">You</div>
          </div>

          {isVideoOff && (
            <div className="video-off-overlay">
              <div className="avatar-placeholder">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <p>Camera Off</p>
            </div>
          )}

          {isRecording && (
            <div className="recording-indicator">
              <span className="rec-dot"></span>
              REC {formatDuration(recordingDuration)}
            </div>
          )}
        </div>
      </div>

      <div className="controls-panel">
        <div className="media-controls">
          <button
            className={`control-btn ${isMuted ? 'muted' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <FiMicOff /> : <FiMic />}
          </button>

          <button
            className={`control-btn ${isVideoOff ? 'video-off' : ''}`}
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <FiVideoOff /> : <FiVideo />}
          </button>

          <button
            className="control-btn end-call"
            onClick={leaveInterview}
            title="Leave interview"
          >
            <FiPhoneOff />
          </button>
        </div>
      </div>

      {user.role === 'recruiter' && (
        <div className="interview-sidebar">
          <div className="sidebar-tabs">
            <button
              className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveTab('questions')}
            >
              <FiFileText /> Questions
            </button>
            <button
              className={`tab-btn ${activeTab === 'scoring' ? 'active' : ''}`}
              onClick={() => setActiveTab('scoring')}
            >
              <FiStar /> Live Scoring
            </button>
            <button
              className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              📝 Notes
            </button>
          </div>

          <div className="tab-content">
            {/* ─── QUESTIONS TAB ─── */}
            {activeTab === 'questions' && (
              <div className="questions-section">
                <h3>Interview Questions</h3>

                <div className="add-question">
                  <select
                    value={questionCategory}
                    onChange={(e) => setQuestionCategory(e.target.value)}
                  >
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="situational">Situational</option>
                  </select>

                  <textarea
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="Enter your question..."
                    rows="2"
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addQuestion(); }}
                  />

                  <button onClick={addQuestion} className="btn-add">
                    + Add Question
                  </button>
                </div>

                <div className="questions-list">
                  {questions.length === 0 && (
                    <p className="no-questions">No questions added yet.</p>
                  )}
                  {questions.map((q, index) => (
                    <div key={index} className="question-item">
                      <span className={`category-badge ${q.category}`}>
                        {q.category}
                      </span>
                      <p>{q.question}</p>
                      <small>{new Date(q.askedAt).toLocaleTimeString()}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── LIVE SCORING TAB ─── */}
            {activeTab === 'scoring' && (
              <div className="scoring-section">
                <h3>Live Candidate Scores</h3>
                <p className="scoring-hint">Adjust scores during the interview. They are auto-saved every 30 seconds.</p>

                <div className="overall-badge">
                  <span>Overall Score</span>
                  <strong>
                    {Math.round((liveScores.technicalScore + liveScores.communicationScore + liveScores.confidenceScore) / 3)}
                    <small>/100</small>
                  </strong>
                </div>

                <div className="sliders-container">
                  <ScoreSlider label="Technical Skills" field="technicalScore" emoji="⚙️" />
                  <ScoreSlider label="Communication" field="communicationScore" emoji="💬" />
                  <ScoreSlider label="Confidence" field="confidenceScore" emoji="🎯" />
                </div>

                <button
                  onClick={() => saveLiveFeedback(false)}
                  className="btn-save-scores"
                  disabled={savingFeedback}
                >
                  <FiSave /> {savingFeedback ? 'Saving...' : 'Save Scores Now'}
                </button>
              </div>
            )}

            {/* ─── NOTES TAB ─── */}
            {activeTab === 'notes' && (
              <div className="notes-section">
                <h3>Interview Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes during the interview...&#10;&#10;• Key observations&#10;• Red flags&#10;• Notable answers"
                  rows="12"
                />
                <button onClick={saveNotes} className="btn-save">
                  Save Notes
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;