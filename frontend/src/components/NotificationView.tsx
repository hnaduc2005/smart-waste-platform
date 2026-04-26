import { useState, useEffect } from 'react';
import { Bell, Trophy, Truck, AlertTriangle, CheckCircle, Trash2, Settings, MailOpen, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/notificationApi';

type NotificationType = 'REWARD' | 'COLLECTION' | 'SYSTEM' | 'ALERT';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
}



export const NotificationView = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let interval: any;
    const fetchNotis = async () => {
      try {
        const data = await notificationApi.getMine();
        setNotifications(data);
      } catch(e) {
        console.error('Failed to fetch notifications', e);
        setNotifications([]);
      }
    };
    fetchNotis();
    interval = setInterval(fetchNotis, 3000);
    return () => clearInterval(interval);
  }, []);

  const displayNotis = notifications;
  const unreadCount = displayNotis.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await notificationApi.markAsRead(id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await notificationApi.markAllAsRead();
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    await notificationApi.delete(id);
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'REWARD': return <Trophy size={20} className="text-amber-400" />;
      case 'COLLECTION': return <Truck size={20} className="text-emerald-400" />;
      case 'ALERT': return <AlertTriangle size={20} className="text-red-400" />;
      case 'SYSTEM': return <CheckCircle size={20} className="text-blue-400" />;
    }
  };

  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case 'REWARD': return 'rgba(245, 158, 11, 0.1)';
      case 'COLLECTION': return 'rgba(16, 185, 129, 0.1)';
      case 'ALERT': return 'rgba(239, 68, 68, 0.1)';
      case 'SYSTEM': return 'rgba(59, 130, 246, 0.1)';
    }
  };

  const formatTime = (isoString: string) => {
    // Đảm bảo UTC nếu backend trả về thiếu 'Z'
    const utcString = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
    const date = new Date(utcString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return `Hôm qua`;
    return `${diffDays} ngày trước`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(34,197,94,0.05), rgba(20,184,166,0.05))',
        padding: '24px 32px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            width: 56, height: 56, background: 'linear-gradient(135deg, #22c55e, #14b8a6)', 
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(34,197,94,0.3)'
          }}>
            <Bell size={28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Thông báo của bạn</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              Bạn có <b style={{ color: 'var(--green-400)' }}>{unreadCount}</b> thông báo chưa đọc
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            style={{
              background: 'var(--bg-input)', color: unreadCount === 0 ? 'var(--text-muted)' : 'white', 
              border: '1px solid var(--border)', padding: '10px 16px', borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: unreadCount === 0 ? 'not-allowed' : 'pointer', 
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
            }}
          >
            <MailOpen size={16} /> Đánh dấu đã đọc tất cả
          </button>
          <button 
            style={{
              background: 'var(--bg-input)', color: 'var(--text-secondary)', 
              border: '1px solid var(--border)', padding: '10px', borderRadius: 12,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notifications.length === 0 ? (
          <div style={{ 
            textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', 
            borderRadius: 24, border: '1px dashed var(--border)' 
          }}>
            <Bell size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-secondary)' }}>Không có thông báo nào</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Bạn đã xem hết tất cả thông báo.</p>
          </div>
        ) : (
          displayNotis.map(noti => (
            <div 
              key={noti.id} 
              onClick={() => markAsRead(noti.id)}
              style={{ 
                display: 'flex', alignItems: 'flex-start', gap: 16, 
                background: noti.isRead ? 'var(--bg-card)' : 'rgba(34,197,94,0.03)', 
                border: noti.isRead ? '1px solid var(--border)' : '1px solid rgba(34,197,94,0.2)', 
                borderRadius: 20, padding: 20, cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {!noti.isRead && (
                <div style={{ 
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, 
                  background: 'var(--green-400)' 
                }} />
              )}
              
              <div style={{ 
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: getBgColor(noti.type), display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                {getIcon(noti.type)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <h4 style={{ 
                    margin: 0, fontSize: 16, fontWeight: noti.isRead ? 600 : 700, 
                    color: noti.isRead ? 'var(--text-secondary)' : 'white' 
                  }}>
                    {noti.title}
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatTime(noti.createdAt)}
                  </span>
                </div>
                <p style={{ 
                  margin: 0, fontSize: 14, lineHeight: 1.5,
                  color: noti.isRead ? 'var(--text-muted)' : 'var(--text-secondary)' 
                }}>
                  {noti.message}
                </p>
              </div>

              <button 
                onClick={(e) => deleteNotification(noti.id, e)}
                style={{ 
                  background: 'none', border: 'none', padding: 8, 
                  color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 8,
                  opacity: 0.6, transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.6'; }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
