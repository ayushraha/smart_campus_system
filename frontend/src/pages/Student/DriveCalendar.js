// frontend/src/pages/Student/DriveCalendar.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Clock, Users, Star } from 'lucide-react';
import './DriveCalendar.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Helpers ──────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const TYPE_COLOR = {
  'placement-drive': 'dot-drive',
  'interview':       'dot-interview',
  'deadline':        'dot-deadline',
  'info-session':    'dot-info-session',
  'workshop':        'dot-workshop',
  'ppt':             'dot-ppt',
};

const TOKEN = () => localStorage.getItem('token');
const HEADERS = () => ({ Authorization: `Bearer ${TOKEN()}` });

// Build calendar grid for a given year/month
function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

const DriveCalendar = () => {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const [events, setEvents]    = useState([]);
  const [loading, setLoading]  = useState(true);
  const [subInput, setSubInput] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  // ── Fetch events for current month ─────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/drive-events`, {
        headers: HEADERS(),
        params: { month: viewMonth + 1, year: viewYear }
      });
      if (res.data.success) setEvents(res.data.events || []);
    } catch (err) {
      toast.error('Failed to load events');
    }
    setLoading(false);
  }, [viewMonth, viewYear]);

  // ── Fetch subscriptions ─────────────────────────────────────────────
  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/notifications/subscriptions/list`, { headers: HEADERS() });
      if (res.data.success) setSubscriptions(res.data.subscriptions || []);
    } catch {}
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  // ── Navigate months ─────────────────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  // ── Events for a given day ──────────────────────────────────────────
  const eventsOnDay = (day) => {
    if (!day) return [];
    return events.filter(ev => {
      const d = new Date(ev.eventDate);
      return d.getDate() === day && d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    });
  };

  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  // ── Subscribe ───────────────────────────────────────────────────────
  const handleSubscribe = async () => {
    if (!subInput.trim()) return;
    setSubLoading(true);
    try {
      const res = await axios.post(`${API}/notifications/subscribe`,
        { companyName: subInput.trim() },
        { headers: HEADERS() }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setSubInput('');
        fetchSubscriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to subscribe');
    }
    setSubLoading(false);
  };

  const handleUnsubscribe = async (companyName) => {
    try {
      await axios.delete(`${API}/notifications/subscribe/${encodeURIComponent(companyName)}`, { headers: HEADERS() });
      toast.success(`Unsubscribed from ${companyName}`);
      fetchSubscriptions();
    } catch {
      toast.error('Failed to unsubscribe');
    }
  };

  // ── Register for event ──────────────────────────────────────────────
  const handleRegister = async (eventId) => {
    try {
      const res = await axios.post(`${API}/drive-events/${eventId}/register`, {}, { headers: HEADERS() });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchEvents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const isRegistered = (ev) => {
    const userId = JSON.parse(atob((TOKEN() || '').split('.')[1] || 'e30=') || '{}').id;
    return ev.registeredStudents?.some(id => id === userId || id?._id === userId || id?.toString() === userId?.toString());
  };

  // ── Build grid ──────────────────────────────────────────────────────
  const cells = buildGrid(viewYear, viewMonth);
  const isToday = (day) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const typeLabel = (t) => ({
    'placement-drive': 'Placement Drive',
    'interview': 'Interview',
    'deadline': 'Deadline',
    'info-session': 'Info Session',
    'workshop': 'Workshop',
    'ppt': 'Pre-Placement Talk'
  }[t] || t);

  if (loading) {
    return (
      <div className="dc-loading">
        <div className="dc-spinner"></div>
        <p>Loading Campus Drive Calendar...</p>
      </div>
    );
  }

  return (
    <div className="drive-calendar-page">
      {/* ── Header ── */}
      <div className="dc-header">
        <h1>📅 Campus Drive Calendar</h1>
        <p>Track placement drives, deadlines & interviews. Subscribe to companies for instant alerts.</p>
      </div>

      {/* ── Subscribe Bar ── */}
      <div className="dc-subscribe-bar">
        <h3>🔔 Company Alerts — Subscribe to get notified when a company posts a drive</h3>
        <div className="dc-subscribe-input-row">
          <input
            className="dc-sub-input"
            placeholder="Enter company name (e.g. Google, Microsoft, Infosys...)"
            value={subInput}
            onChange={e => setSubInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
          />
          <button className="dc-sub-btn" onClick={handleSubscribe} disabled={subLoading || !subInput.trim()}>
            <Plus size={14} /> Subscribe
          </button>
        </div>
        {subscriptions.length > 0 && (
          <div className="dc-chips">
            {subscriptions.map(sub => (
              <span key={sub._id} className="dc-chip">
                {sub.companyName}
                <button className="dc-chip-remove" onClick={() => handleUnsubscribe(sub.companyName)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Calendar + Side Panel ── */}
      <div className="dc-body">
        {/* Calendar */}
        <div className="dc-calendar-card">
          {/* Month navigation */}
          <div className="dc-cal-nav">
            <button className="dc-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <h2>{MONTHS[viewMonth]} {viewYear}</h2>
            <button className="dc-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>

          {/* Legend */}
          <div className="dc-legend">
            {Object.entries(TYPE_COLOR).map(([type, cls]) => (
              <span key={type} className="dc-legend-item">
                <span className={`dc-legend-dot ${cls}`}></span>
                {typeLabel(type)}
              </span>
            ))}
          </div>

          {/* Weekday headers */}
          <div className="dc-weekdays">
            {DAYS.map(d => <div key={d} className="dc-weekday">{d}</div>)}
          </div>

          {/* Day grid */}
          <div className="dc-grid">
            {cells.map((day, idx) => {
              const dayEvents = eventsOnDay(day);
              return (
                <div
                  key={idx}
                  className={[
                    'dc-day',
                    !day ? 'empty' : '',
                    isToday(day) ? 'today' : '',
                    selectedDay === day ? 'selected' : '',
                    dayEvents.length > 0 ? 'has-events' : ''
                  ].join(' ')}
                  onClick={() => day && setSelectedDay(day)}
                >
                  <div className="dc-day-num">{day || ''}</div>
                  <div className="dc-event-dots">
                    {dayEvents.slice(0, 3).map(ev => (
                      <span key={ev._id} className={`dc-event-dot ${TYPE_COLOR[ev.type] || 'dot-drive'}`}></span>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="dc-more-text">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="dc-side-panel">
          <div className="dc-side-header">
            <h3>
              {selectedDay
                ? `${selectedDay} ${MONTHS[viewMonth]} ${viewYear}`
                : 'Select a Date'}
            </h3>
            <p>{selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} scheduled</p>
          </div>

          <div className="dc-side-events">
            {!selectedDay && (
              <div className="dc-no-events">
                <span>📅</span>
                <p>Click on any date</p>
                <small>to see events scheduled for that day</small>
              </div>
            )}

            {selectedDay && selectedEvents.length === 0 && (
              <div className="dc-no-events">
                <span>🌿</span>
                <p>No events today</p>
                <small>Check other dates or subscribe to be notified!</small>
              </div>
            )}

            {selectedEvents.map(ev => {
              const registered = isRegistered(ev);
              const isCancelled = ev.status === 'cancelled';
              const slotsLeft = ev.maxSlots > 0 ? ev.maxSlots - (ev.registeredStudents?.length || 0) : null;

              return (
                <div key={ev._id} className={`dc-event-card type-${ev.type}`}>
                  <div className="dc-card-top">
                    <div className="dc-company-avatar">
                      {(ev.company || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="dc-card-info">
                      <div className="dc-card-title">{ev.title}</div>
                      <div className="dc-card-company">{ev.company}</div>
                    </div>
                    <span className={`dc-type-badge badge-${ev.type}`}>
                      {typeLabel(ev.type)}
                    </span>
                  </div>

                  <div className="dc-card-meta">
                    <div className="dc-meta-row">
                      <Clock size={12} />
                      {formatTime(ev.eventDate)}
                    </div>
                    {ev.venue && (
                      <div className="dc-meta-row">
                        <MapPin size={12} />
                        {ev.venue}
                      </div>
                    )}
                    {ev.applicationDeadline && (
                      <div className="dc-meta-row" style={{ color: '#dc2626' }}>
                        <Clock size={12} />
                        Apply by: {formatDate(ev.applicationDeadline)}
                      </div>
                    )}
                    {slotsLeft !== null && (
                      <div className="dc-meta-row">
                        <Users size={12} />
                        {slotsLeft > 0 ? `${slotsLeft} slots remaining` : 'Slots full'}
                      </div>
                    )}
                    {ev.salary?.min && (
                      <div className="dc-meta-row">
                        <Star size={12} />
                        ₹{(ev.salary.min / 100000).toFixed(1)}L – ₹{(ev.salary.max / 100000).toFixed(1)}L CTC
                      </div>
                    )}
                  </div>

                  {(ev.eligibility?.minCGPA > 0 || ev.eligibility?.departments?.length > 0) && (
                    <div className="dc-card-eligibility">
                      {ev.eligibility.minCGPA > 0 && `Min CGPA: ${ev.eligibility.minCGPA}  `}
                      {ev.eligibility.departments?.length > 0 && `Dept: ${ev.eligibility.departments.join(', ')}`}
                    </div>
                  )}

                  {ev.description && (
                    <p style={{ fontSize: 12, color: '#475569', margin: '0 0 10px', lineHeight: 1.5 }}>
                      {ev.description.length > 100 ? ev.description.slice(0, 100) + '...' : ev.description}
                    </p>
                  )}

                  <button
                    className={`dc-register-btn ${isCancelled ? 'cancelled' : registered ? 'registered' : 'register'}`}
                    onClick={() => !isCancelled && handleRegister(ev._id)}
                    disabled={isCancelled || (slotsLeft === 0 && !registered)}
                  >
                    {isCancelled ? '❌ Event Cancelled'
                      : registered ? '✅ Registered — Click to Unregister'
                      : slotsLeft === 0 ? '⛔ Slots Full'
                      : '+ Register for Event'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveCalendar;
