import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { 
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiFileText
} from 'react-icons/fi';
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
  
  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const localVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    fetchInterviewDetails();
    return () => {
      // Cleanup: stop all media tracks when component unmounts
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const fetchInterviewDetails = async () => {
    try {
      const response = await axios.get(`/api/interview/room/${roomId}`);
      setInterview(response.data);
      setQuestions(response.data.questionsAsked || []);
      setLoading(false);
    } catch (error) {
      toast.error('Interview room not found');
      navigate('/');
      setLoading(false);
    }
  };

  const startLocalStream = async () => {
    try {
      console.log('Requesting camera and microphone access...');
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media stream obtained:', stream);
      
      mediaStreamRef.current = stream;
      
      // Set video element source
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        
        // Ensure video plays
        localVideoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          localVideoRef.current.play()
            .then(() => {
              console.log('Video playing successfully');
              setStreamReady(true);
            })
            .catch(err => console.error('Error playing video:', err));
        };
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/microphone access denied. Please allow permissions.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found.');
      } else {
        toast.error('Could not access camera/microphone: ' + error.message);
      }
      
      return null;
    }
  };

  const joinInterview = async () => {
    try {
      const stream = await startLocalStream();
      
      if (!stream) {
        toast.error('Cannot join without camera/microphone access');
        return;
      }

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
      // Stop all tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
      }
      
      await axios.put(`/api/interview/${interview._id}/end`);
      setInCall(false);
      setIsRecording(false);
      
      toast.success('Interview ended');
      
      // Navigate based on role
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
      console.error('Failed to add question:', error);
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
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="loading">Loading interview room...</div>;
  }

  if (!interview) {
    return <div className="loading">Interview not found</div>;
  }

  if (!inCall) {
    return (
      <div className="interview-lobby">
        <div className="lobby-container">
          <h2>Interview Room</h2>
          <div className="interview-details">
            <p><strong>Position:</strong> {interview?.jobId?.title}</p>
            <p><strong>Company:</strong> {interview?.jobId?.company}</p>
            <p><strong>Date:</strong> {new Date(interview?.scheduledDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {interview?.scheduledTime}</p>
            {user.role === 'student' && (
              <>
                <p><strong>Interviewer:</strong> {interview?.recruiterId?.name}</p>
              </>
            )}
            {user.role === 'recruiter' && (
              <>
                <p><strong>Candidate:</strong> {interview?.studentId?.name}</p>
              </>
            )}
          </div>

          <div className="video-preview">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline
              className="preview-video"
              style={{ transform: 'scaleX(-1)' }}
            />
            <p>Check your camera and microphone</p>
            {!streamReady && (
              <button 
                onClick={startLocalStream} 
                className="btn-test-devices"
              >
                Test Camera & Microphone
              </button>
            )}
          </div>

          <button 
            onClick={joinInterview} 
            className="btn-join"
            disabled={!streamReady}
          >
            {streamReady ? 'Join Interview' : 'Testing devices...'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-room">
      <div className="video-container">
        <div className="main-video">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline
            className="local-video-main"
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className="video-label">
            {user.role === 'recruiter' ? interview?.studentId?.name : interview?.recruiterId?.name}
          </div>
          
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
            <button className="tab-btn active">
              <FiFileText /> Questions
            </button>
          </div>

          <div className="tab-content">
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
                />
                
                <button onClick={addQuestion} className="btn-add">
                  Add Question
                </button>
              </div>

              <div className="questions-list">
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

            <div className="notes-section">
              <h3>Interview Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Take notes during the interview..."
                rows="10"
              />
              <button onClick={saveNotes} className="btn-save">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;