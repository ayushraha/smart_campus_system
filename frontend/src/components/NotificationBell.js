// frontend/src/components/NotificationBell.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, Calendar, Clock, Briefcase } from 'lucide-react';
import axios from 'axios';
import './NotificationBell.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const typeIcon = (type) => {
  switch (type) {
    case 'drive': return <Briefcase size={14} />;
    case 'deadline': return <Clock size={14} />;
    case 'interview': return <Calendar size={14} />;
    default: return <Bell size={14} />;
  }
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const token = localStorage.getItem('token');

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // silently fail for polling
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const markRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/notifications/read-all/all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
    setLoading(false);
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const removed = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (removed && !removed.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  return (
    <div className="notif-bell-wrap" ref={panelRef}>
      <button
        className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span className="notif-panel-title">
              <Bell size={16} /> Notifications
              {unreadCount > 0 && <span className="notif-count-tag">{unreadCount} new</span>}
            </span>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={markAllRead} disabled={loading}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={32} />
                <p>No notifications yet</p>
                <span>Subscribe to companies to get drive alerts!</span>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => !n.isRead && markRead(n._id)}
                >
                  <div className={`notif-type-icon type-${n.type}`}>
                    {typeIcon(n.type)}
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-msg">{n.message}</div>
                    <div className="notif-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  <div className="notif-actions">
                    {!n.isRead && (
                      <button className="notif-read-btn" onClick={(e) => { e.stopPropagation(); markRead(n._id); }} title="Mark as read">
                        <Check size={12} />
                      </button>
                    )}
                    <button className="notif-del-btn" onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }} title="Delete">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
