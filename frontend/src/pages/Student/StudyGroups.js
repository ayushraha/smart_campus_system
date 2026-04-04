import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './StudyGroups.css';
import {
  Users, Plus, Search, MessageCircle, LogIn, LogOut,
  Trash2, Send, X, ChevronLeft, Loader, Lock, ShieldCheck
} from 'lucide-react';

const API  = process.env.REACT_APP_API_URL;
const TOKEN = () => localStorage.getItem('token');
const HEADERS = () => ({ Authorization: `Bearer ${TOKEN()}` });

const COMPANY_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981',
  '#3b82f6','#ef4444','#14b8a6','#f97316','#84cc16'
];
const companyColor = (name) =>
  COMPANY_COLORS[(name?.charCodeAt(0) || 0) % COMPANY_COLORS.length];

export default function StudyGroups() {
  const [groups, setGroups]           = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages]       = useState([]);
  const [msgInput, setMsgInput]       = useState('');
  const [search, setSearch]           = useState('');
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingChat, setLoadingChat]    = useState(false);
  const [sendingMsg, setSendingMsg]      = useState(false);
  const [showCreate, setShowCreate]      = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', description: '', maxMembers: 30 });

  const messagesEndRef = useRef(null);
  const pollRef        = useRef(null);
  const lastMsgTime    = useRef(null);
  const myId = (() => {
    try { return JSON.parse(atob(TOKEN()?.split('.')[1] || '')).userId; } catch { return null; }
  })();

  // ── Fetch groups ───────────────────────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const res = await axios.get(`${API}/study-groups`, {
        headers: HEADERS(),
        params: search ? { search } : {}
      });
      if (res.data.success) {
        setGroups(res.data.groups);
        setIsShortlisted(res.data.isShortlisted === true);
      }
    } catch { toast.error('Failed to load groups'); }
    finally { setLoadingGroups(false); }
  }, [search]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // ── Fetch all messages (initial load) ─────────────────────────────────────
  const fetchMessages = useCallback(async (groupId) => {
    setLoadingChat(true);
    try {
      const res = await axios.get(`${API}/study-groups/${groupId}/messages`, { headers: HEADERS() });
      if (res.data.success) {
        setMessages(res.data.messages);
        if (res.data.messages.length > 0) {
          lastMsgTime.current = res.data.messages[res.data.messages.length - 1].createdAt;
        }
      }
    } catch (err) {
      if (err.response?.data?.reason === 'not_shortlisted') {
        toast.error('Only shortlisted students can access group chats.');
      } else {
        toast.error('Failed to load messages');
      }
    } finally { setLoadingChat(false); }
  }, []);

  // ── Poll for new messages (4s) ─────────────────────────────────────────────
  const pollMessages = useCallback(async (groupId) => {
    if (!groupId) return;
    try {
      const params = lastMsgTime.current ? { since: lastMsgTime.current } : {};
      const res = await axios.get(`${API}/study-groups/${groupId}/messages`, {
        headers: HEADERS(), params
      });
      if (res.data.success && res.data.messages.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m._id));
          const newMsgs = res.data.messages.filter(m => !ids.has(m._id));
          if (newMsgs.length === 0) return prev;
          lastMsgTime.current = newMsgs[newMsgs.length - 1].createdAt;
          return [...prev, ...newMsgs];
        });
      }
    } catch {}
  }, []);

  // ── Open a group ───────────────────────────────────────────────────────────
  const openGroup = async (group) => {
    clearInterval(pollRef.current);
    lastMsgTime.current = null;
    setMessages([]);
    setActiveGroup(group);
    if (isShortlisted) {
      await fetchMessages(group._id);
      pollRef.current = setInterval(() => pollMessages(group._id), 4000);
    }
  };

  // Cleanup poll on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Join / Leave ───────────────────────────────────────────────────────────
  const handleJoin = async (groupId, e) => {
    e?.stopPropagation();
    if (!isShortlisted) {
      toast.error('Only shortlisted students can join study groups.');
      return;
    }
    try {
      const res = await axios.post(`${API}/study-groups/${groupId}/join`, {}, { headers: HEADERS() });
      toast.success(res.data.message);
      fetchGroups();
      if (activeGroup?._id === groupId) {
        setActiveGroup(prev => ({
          ...prev,
          members: res.data.joined
            ? [...prev.members, { _id: myId }]
            : prev.members.filter(m => (m._id || m) !== myId)
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  // ── Delete group ───────────────────────────────────────────────────────────
  const handleDelete = async (groupId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this study group?')) return;
    try {
      await axios.delete(`${API}/study-groups/${groupId}`, { headers: HEADERS() });
      toast.success('Group deleted');
      if (activeGroup?._id === groupId) {
        setActiveGroup(null);
        clearInterval(pollRef.current);
      }
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeGroup) return;
    if (!isShortlisted) {
      toast.error('Only shortlisted students can send messages.');
      return;
    }
    setSendingMsg(true);
    try {
      const res = await axios.post(
        `${API}/study-groups/${activeGroup._id}/messages`,
        { content: msgInput.trim() },
        { headers: HEADERS() }
      );
      if (res.data.success) {
        setMessages(prev => [...prev, res.data.message]);
        lastMsgTime.current = res.data.message.createdAt;
        setMsgInput('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally { setSendingMsg(false); }
  };

  // ── Create group ───────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isShortlisted) {
      toast.error('Only shortlisted students can create study groups.');
      return;
    }
    if (!form.name || !form.company) return toast.error('Name and company are required');
    try {
      const res = await axios.post(`${API}/study-groups`, form, { headers: HEADERS() });
      toast.success('Group created! 🎉');
      setShowCreate(false);
      setForm({ name: '', company: '', description: '', maxMembers: 30 });
      fetchGroups();
      openGroup(res.data.group);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const isMemberOf = (group) =>
    group.members?.some(m => (m._id || m).toString() === myId);

  const isCreatorOf = (group) => {
    const creator = group.createdBy?._id || group.createdBy;
    return creator?.toString() === myId;
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // ── Locked Banner Component ────────────────────────────────────────────────
  const LockedBanner = () => (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7, #fffbeb)',
      border: '1px solid #f59e0b',
      borderLeft: '5px solid #f59e0b',
      borderRadius: '12px',
      padding: '18px 20px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px'
    }}>
      <div style={{
        background: '#f59e0b',
        borderRadius: '50%',
        width: '42px',
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Lock size={20} color="#fff" />
      </div>
      <div>
        <div style={{ fontWeight: '700', color: '#92400e', fontSize: '15px', marginBottom: '5px' }}>
          🔒 Study Groups are for Shortlisted Students Only
        </div>
        <div style={{ color: '#92400e', fontSize: '13px', lineHeight: '1.6' }}>
          You need to be <strong>shortlisted, in interview, or selected</strong> by a recruiter to create, join, or chat in study groups.
          Apply to jobs and get shortlisted to unlock this feature!
        </div>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="sg-page">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* ── Left Panel: Group List ── */}
      <aside className="sg-sidebar">
        <div className="sg-sidebar-header">
          <div>
            <h2 className="sg-title">Study Groups</h2>
            <p className="sg-subtitle">
              {isShortlisted
                ? <><ShieldCheck size={13} style={{ verticalAlign: 'middle', color: '#10b981' }} /> Shortlisted — Full Access</>
                : <><Lock size={13} style={{ verticalAlign: 'middle', color: '#f59e0b' }} /> Shortlisted students only</>
              }
            </p>
          </div>
          {/* Only show "New" button if shortlisted */}
          {isShortlisted && (
            <button className="sg-create-btn" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> New
            </button>
          )}
        </div>

        <div className="sg-search">
          <Search size={15} className="sg-search-icon" />
          <input
            className="sg-search-input"
            placeholder="Search company, name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="sg-group-list">
          {loadingGroups ? (
            <div className="sg-empty"><Loader size={22} className="sg-spin" /> Loading…</div>
          ) : groups.length === 0 ? (
            <div className="sg-empty">
              <Users size={28} />
              <p>No groups yet.<br />
                {isShortlisted ? 'Be the first to create one!' : 'Get shortlisted to create one!'}
              </p>
            </div>
          ) : groups.map(g => (
            <div
              key={g._id}
              className={`sg-group-card ${activeGroup?._id === g._id ? 'active' : ''}`}
              onClick={() => openGroup(g)}
            >
              <div
                className="sg-company-badge"
                style={{ background: companyColor(g.company) }}
              >
                {g.company[0].toUpperCase()}
              </div>
              <div className="sg-group-info">
                <div className="sg-group-name">{g.name}</div>
                <div className="sg-group-meta">
                  <span className="sg-company-tag">{g.company}</span>
                  <span className="sg-member-count">
                    <Users size={10} /> {g.members?.length}/{g.maxMembers}
                  </span>
                </div>
              </div>
              <div className="sg-card-actions">
                {isMemberOf(g) ? (
                  <span className="sg-joined-dot" title="Joined">●</span>
                ) : null}
                {isCreatorOf(g) && (
                  <button
                    className="sg-icon-btn danger"
                    onClick={(e) => handleDelete(g._id, e)}
                    title="Delete group"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right Panel: Chat ── */}
      <main className="sg-chat-panel">
        {!activeGroup ? (
          <div className="sg-welcome">
            {/* Show locked banner if not shortlisted */}
            {!isShortlisted && (
              <div style={{ width: '100%', maxWidth: '560px', textAlign: 'left' }}>
                <LockedBanner />
              </div>
            )}
            <div className="sg-welcome-icon">{isShortlisted ? '👥' : '🔒'}</div>
            <h3>
              {isShortlisted
                ? 'Select a study group to start chatting'
                : 'Study Groups — Shortlisted Access Only'
              }
            </h3>
            <p>
              {isShortlisted
                ? 'Join company-specific rooms and prepare together with peers'
                : 'Get shortlisted by a recruiter to unlock study groups and chat with fellow candidates.'
              }
            </p>
            {isShortlisted && (
              <button className="sg-create-big-btn" onClick={() => setShowCreate(true)}>
                <Plus size={18} /> Create a Study Group
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="sg-chat-header">
              <button className="sg-back-btn" onClick={() => { setActiveGroup(null); clearInterval(pollRef.current); }}>
                <ChevronLeft size={18} />
              </button>
              <div
                className="sg-chat-avatar"
                style={{ background: companyColor(activeGroup.company) }}
              >
                {activeGroup.company[0].toUpperCase()}
              </div>
              <div className="sg-chat-meta">
                <div className="sg-chat-name">{activeGroup.name}</div>
                <div className="sg-chat-sub">{activeGroup.company} · {activeGroup.members?.length} members</div>
              </div>
              <div className="sg-chat-header-actions">
                {isShortlisted ? (
                  !isMemberOf(activeGroup) ? (
                    <button className="sg-join-btn" onClick={() => handleJoin(activeGroup._id)}>
                      <LogIn size={14} /> Join
                    </button>
                  ) : !isCreatorOf(activeGroup) ? (
                    <button className="sg-leave-btn" onClick={() => handleJoin(activeGroup._id)}>
                      <LogOut size={14} /> Leave
                    </button>
                  ) : null
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: '#fef3c7', color: '#92400e', borderRadius: '20px',
                    padding: '5px 12px', fontSize: '12px', fontWeight: '600'
                  }}>
                    <Lock size={12} /> Shortlisted Only
                  </span>
                )}
              </div>
            </div>

            {/* Locked state overlay for non-shortlisted viewing a group */}
            {!isShortlisted ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '40px', gap: '16px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  borderRadius: '50%', width: '72px', height: '72px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Lock size={32} color="#fff" />
                </div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Chat is Locked</h3>
                <p style={{ color: '#64748b', textAlign: 'center', maxWidth: '380px', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  Only students who have been <strong>shortlisted, invited for interview, or selected</strong> by a recruiter can access group chats.
                  <br /><br />
                  Apply to more jobs and get shortlisted to unlock this feature!
                </p>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="sg-messages">
                  {loadingChat ? (
                    <div className="sg-msg-loading"><Loader size={20} className="sg-spin" /> Loading messages…</div>
                  ) : messages.length === 0 ? (
                    <div className="sg-no-msgs">
                      <MessageCircle size={32} />
                      <p>{isMemberOf(activeGroup) ? 'No messages yet. Say hello! 👋' : 'Join the group to see messages.'}</p>
                    </div>
                  ) : (
                    messages.map(m => {
                      const isMe = m.senderId === myId || m.senderId?._id === myId;
                      return (
                        <div key={m._id} className={`sg-msg-row ${isMe ? 'me' : 'them'}`}>
                          {!isMe && (
                            <div className="sg-msg-avatar" style={{ background: companyColor(m.senderName) }}>
                              {m.senderName[0].toUpperCase()}
                            </div>
                          )}
                          <div className="sg-bubble-wrap">
                            {!isMe && <div className="sg-sender-name">{m.senderName}</div>}
                            <div className={`sg-bubble ${isMe ? 'mine' : 'theirs'}`}>
                              {m.content}
                            </div>
                            <div className="sg-msg-time">{formatTime(m.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send Box */}
                {isMemberOf(activeGroup) ? (
                  <form className="sg-send-bar" onSubmit={sendMessage}>
                    <input
                      className="sg-msg-input"
                      placeholder="Type a message… (Enter to send)"
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="sg-send-btn"
                      disabled={sendingMsg || !msgInput.trim()}
                    >
                      {sendingMsg ? <Loader size={16} className="sg-spin" /> : <Send size={16} />}
                    </button>
                  </form>
                ) : (
                  <div className="sg-join-nudge">
                    <LogIn size={16} />
                    Join this group to participate in the conversation
                    <button onClick={() => handleJoin(activeGroup._id)}>Join Now</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ── Create Group Modal ── */}
      {showCreate && isShortlisted && (
        <div className="sg-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="sg-modal" onClick={e => e.stopPropagation()}>
            <div className="sg-modal-header">
              <h3>Create Study Group</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="sg-modal-form">
              <label>Group Name *</label>
              <input
                placeholder="e.g. Google SWE Prep 2025"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
              <label>Company *</label>
              <input
                placeholder="e.g. Google, Microsoft, Amazon"
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
                required
              />
              <label>Description</label>
              <textarea
                placeholder="What will this group focus on? (optional)"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
              <label>Max Members</label>
              <input
                type="number"
                min={2} max={100}
                value={form.maxMembers}
                onChange={e => setForm({ ...form, maxMembers: Number(e.target.value) })}
              />
              <button type="submit" className="sg-modal-submit">
                <Plus size={16} /> Create Group
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
