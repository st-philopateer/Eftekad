import React, { useState, useEffect, useRef } from 'react';

export default function NotificationsBell({ user, onNavigateTab }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifications();

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    if (window.io) {
      const socket = window.io();
      
      let debounceTimer;
      const debouncedFetch = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchNotifications();
        }, 1500);
      };

      socket.on('data-changed', debouncedFetch);
      return () => {
        socket.disconnect();
        clearTimeout(debounceTimer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [user?.username]);

  const fetchNotifications = async () => {
    if (!user || !user.username) return;
    try {
      const activeService = localStorage.getItem('activeService_' + user.username) || '';
      const activeStage = localStorage.getItem('activeStage_' + user.username) || '';
      const dashboardMode = localStorage.getItem('dashboardMode_' + user.username) || 'service';
      
      const queryParams = new URLSearchParams({
        username: user.username,
        role: user.role || '',
        church: user.church || '',
        activeService,
        activeStage,
        dashboardMode
      });
      
      const response = await fetch(`/api/notifications?${queryParams.toString()}`);
      const result = await response.json();
      if (response.ok && result.success) {
        let list = result.notifications || [];
        setNotifications(list);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          role: user.role,
          church: user.church
        })
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n) => {
    setIsOpen(false);
    if (!n.read) {
      markAsRead(n.id);
    }
    if (n.payload && n.payload.type === 'stage_transfer') {
      const event = new CustomEvent('open-stage-transfer-modal', { detail: n });
      window.dispatchEvent(event);
      return;
    }
    if (n.linkTab && onNavigateTab) {
      onNavigateTab(n.linkTab);
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="notif-bell-wrapper" ref={dropdownRef}>
      <button 
        type="button" 
        className="notif-bell-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="الإشعارات والتنبيهات"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h6 className="mb-0">الإشعارات والتنبيهات 🔔</h6>
            <button 
              type="button" 
              className={`notif-read-btn ${unreadCount === 0 ? 'is-read' : ''}`}
              onClick={markAllAsRead} 
              disabled={unreadCount === 0}
              title="تحديد الكل كمقروء"
              style={{ width: '26px', height: '26px', padding: '0', fontSize: '0.9rem' }}
            >
              ✔
            </button>
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">لا توجد إشعارات جديدة ✝</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`notif-item ${n.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notif-content">
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">{formatTime(n.timestamp)}</div>
                  </div>
                  <div className="notif-actions">
                    <button 
                      type="button" 
                      className={`notif-read-btn ${n.read ? 'is-read' : ''}`}
                      onClick={(e) => {
                        if (!n.read) markAsRead(n.id, e);
                        else e.stopPropagation();
                      }}
                      disabled={n.read}
                      title={n.read ? "تم القراءة" : "علم كمقروء"}
                    >
                      <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>✔</span>
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
}
