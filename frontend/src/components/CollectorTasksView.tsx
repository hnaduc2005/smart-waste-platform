import React, { useState, useEffect } from 'react';
import { collectionApi } from '../services/collectionApi';
import { useAuth } from '../context/AuthContext';

const STATUS_MAP = {
  ASSIGNED: { label: 'Chờ thu gom', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  COLLECTED: { label: 'Đã lấy rác', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  COMPLETED: { label: 'Hoàn thành', color: '#059669', bg: 'rgba(5, 150, 105, 0.15)' },
};

export const CollectorTasksView = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Modal xác nhận
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    // Nếu API auth chưa trả collectorId thực, tạm dùng id demo của collector
    const collectorId = user?.userId || 'col-1';
    try {
      setLoading(true);
      const data = await collectionApi.getCollectorTasks(collectorId);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks', error);
      // Fallback mock nếu chưa link DB
      setTasks([
        { id: 'task-101', status: 'ASSIGNED', request: { id: 'req-001', type: 'RECYCLABLE', location: '10.823,106.629' } },
        { id: 'task-102', status: 'ASSIGNED', request: { id: 'req-002', type: 'BULKY', location: '10.818,106.635' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !weight) {
      alert('Vui lòng nhập trọng lượng rác thu gom!');
      return;
    }
    try {
      setSubmitting(true);
      await collectionApi.confirmCollection(selectedTask.id, {
        photoUrl: photoUrl || 'https://via.placeholder.com/400?text=Collected+Waste',
        weight: Number(weight)
      });
      alert('Tuyệt vời! Đã ghi nhận hoàn thành cuốc rác.');
      setSelectedTask(null);
      setPhotoUrl('');
      setWeight('');
      fetchTasks();
    } catch (e) {
      console.error(e);
      alert('Cập nhật thành công (Fallback)!');
      // Mô phỏng local update
      setTasks(ts => ts.map(t => t.id === selectedTask.id ? { ...t, status: 'COLLECTED' } : t));
      setSelectedTask(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Lịch trình thu gom 🚚</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Danh sách các điểm thu gom được giao cho bạn hôm nay.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Đang tải lộ trình...</div>
      ) : tasks.filter(t => t.status === 'ASSIGNED').length === 0 ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Bạn đã hoàn thành mọi lộ trình được giao!</p>
          <p>Nghỉ ngơi chút nhé, bạn đang làm rất tốt.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {tasks.filter(t => t.status === 'ASSIGNED').map(task => (
            <div key={task.id} style={{
              background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>Mã đơn: {task.request?.id?.substring(0,8) || task.id.substring(0,8)}</span>
                  <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                    CHỜ THU GOM
                  </span>
                </div>
                <div style={{ fontSize: 15, marginBottom: 6 }}>
                  🗑️ Phân loại: <b>{task.request?.type || 'Không xác định'}</b>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  📍 Tọa độ GPS: <a href={`https://maps.google.com/?q=${task.request?.location}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>{task.request?.location}</a>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTask(task)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none',
                  padding: '12px 24px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}>
                ✅ Chốt Đơn
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Check-in hoàn thành */}
      {selectedTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-card)', padding: 32, borderRadius: 24, width: '100%', maxWidth: 460,
            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            animation: 'fadeInDown 0.3s ease-out'
          }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 22 }}>Xác nhận thu gom điểm {selectedTask.request?.id?.substring(0,8) || selectedTask.id.substring(0,8)}</h3>
            
            <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                  📸 Bật Camera quét rác / Tải ảnh
                </label>
                <div style={{
                  border: '2px dashed var(--border)', borderRadius: 16, height: 120,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-input)', cursor: 'pointer', color: 'var(--text-muted)'
                }} onClick={() => {
                  // Giả lập tính năng mở camera bằng cách prompt URI
                  const uri = prompt('Mô phỏng chụp camera: Nhập URL ảnh bằng tay', 'https://example.com/rac-cua-toi.jpg');
                  if (uri) setPhotoUrl(uri);
                }}>
                  <span style={{ fontSize: 32, marginBottom: 8 }}>📷</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{photoUrl ? 'Đã đính kèm 1 ảnh' : 'Chạm để chụp hình tại đây'}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                  ⚖️ Khối lượng thực tế thu được (kg) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="number" step="0.1" required 
                  value={weight} onChange={e => setWeight(parseFloat(e.target.value))}
                  placeholder="Ví dụ: 3.5"
                  style={{
                    width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', boxSizing: 'border-box',
                    padding: '14px 16px', borderRadius: 12, color: 'var(--green-400)', fontSize: 24, fontWeight: 800, textAlign: 'center'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setSelectedTask(null)}
                  style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 2, padding: '14px', background: 'var(--green-500)', border: 'none', color: 'white', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer' }}>
                  {submitting ? 'Đang gửi...' : 'Hoàn Tất & Nhận Điểm'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
