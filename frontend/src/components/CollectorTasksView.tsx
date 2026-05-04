import React, { useState, useEffect, useCallback } from 'react';
import { collectionApi } from '../services/collectionApi';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/notificationApi';
import { userApi } from '../services/userApi';
import { enterpriseApi } from '../services/enterpriseApi';

const STATUS_MAP = {
  ASSIGNED: { label: 'Chờ thu gom', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  ON_THE_WAY: { label: 'Đang đến', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
};

const WASTE_TYPE_MAP: Record<string, string> = {
  'RECYCLABLE': '♻️ Rác tái chế (Nhựa, Giấy, Kim loại)',
  'ORGANIC': '🍎 Rác hữu cơ (Thức ăn thừa)',
  'HAZARDOUS': '⚠️ Rác độc hại (Pin, Hóa chất)',
  'BULKY': '🛋️ Rác cồng kềnh (Tủ, Bàn ghế)',
  'ELECTRONIC': '💻 Rác điện tử (E-waste)',
};

export const CollectorTasksView = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State cho Modal xác nhận
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string); // base64
    };
    reader.readAsDataURL(file);
    setPhotoFile(file);
  };

  // Lấy ownerUserId của enterprise mà collector thuộc về
  // để gửi thông báo đích danh thay vì broadcast cho tất cả enterprise
  const getEnterpriseOwnerId = useCallback(async (task: any): Promise<string | undefined> => {
    try {
      const collectorProfile = await userApi.getProfile(task.collectorId || user?.userId || '');
      const companyName = collectorProfile?.companyName;
      if (!companyName) return undefined;
      const ent = await enterpriseApi.getEnterpriseByName(companyName);
      return ent?.ownerUserId || undefined;
    } catch {
      return undefined;
    }
  }, [user?.userId]);

  const fetchTasks = async () => {
    const collectorId = user?.userId;
    if (!collectorId) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await collectionApi.getCollectorTasks(collectorId);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    // Optimistic update UI immediately
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    const targetTask = tasks.find(t => t.id === taskId);

    if (newStatus === 'ON_THE_WAY') {
      if (targetTask?.request?.location) {
        window.open(`https://maps.google.com/?q=${targetTask.request.location}`, '_blank');
      }

      // Notify citizen
      if (targetTask?.request?.citizenId) {
        notificationApi.create({
          userId: targetTask.request.citizenId,
          title: 'Tài xế đang đến thu gom! 🚚',
          message: `Đơn rác (ID: ${targetTask.request.id?.substring(0, 8)}) sắp được thu gom. Xin vui lòng chuẩn bị.`,
          type: 'COLLECTION',
          isRead: false
        }).catch(console.warn);
      }

      // Notify enterprise — gửi đích danh tới enterprise owner
      getEnterpriseOwnerId(targetTask).then(enterpriseOwnerId => {
        notificationApi.create({
          ...(enterpriseOwnerId ? { userId: enterpriseOwnerId } : { targetRole: 'ENTERPRISE' }),
          title: 'Cập nhật tiến trình: Đang đến 🚚',
          message: `Tài xế vừa bắt đầu di chuyển đến điểm thu gom (ID: ${targetTask?.request?.id?.substring(0,8)}).`,
          type: 'SYSTEM',
          isRead: false
        }).catch(console.warn);
      });

      // Cập nhật trạng thái xe thành Đang đi gom (isOnline = false)
      if (user?.userId) {
        userApi.updateProfile(user.userId, { isOnline: false }).catch(console.warn);
      }
    }

    // Call real status-update API to sync across services
    await collectionApi.updateTaskStatus(taskId, newStatus);
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000); // Refresh every 30s

    // --- Start Location Tracking ---
    const updateLocation = () => {
      if (navigator.geolocation && user?.userId) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await userApi.updateProfile(user.userId, {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              });
            } catch (err) {
              console.warn('Lỗi cập nhật vị trí tài xế:', err);
            }
          },
          (err) => console.warn('Không lấy được vị trí GPS:', err),
          { enableHighAccuracy: true }
        );
      }
    };

    // Update ngay khi vào trang và lặp lại mỗi 15s để bản đồ điều phối thấy tài xế di chuyển
    updateLocation();
    const locInterval = setInterval(updateLocation, 15000);
    // --- End Location Tracking ---

    return () => {
      clearInterval(interval);
      clearInterval(locInterval);
    };
  }, [user?.userId]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = Number(weight);
    if (!selectedTask || !weight || isNaN(weightNum) || weightNum <= 0) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập trọng lượng rác thu gom !' });
      return;
    }
    try {
      setSubmitting(true);
      await collectionApi.confirmCollection(selectedTask.id, {
        photoUrl: photoUrl || 'https://via.placeholder.com/400?text=Collected+Waste',
        weight: Number(weight),
        isValid: isValid
      });

      // Notify citizen
      if (selectedTask.request?.citizenId) {
        notificationApi.create({
          userId: selectedTask.request.citizenId,
          title: isValid ? 'Rác của bạn đã được thu gom thành công! ✅' : 'Đơn rác sai phân loại ⚠️',
          message: isValid
            ? `Đơn (ID: ${selectedTask.request.id?.substring(0, 8)}) nặng ${weight}kg đã thu gom xong. Hệ thống đang cộng điểm thưởng cho bạn.`
            : `Đơn (ID: ${selectedTask.request.id?.substring(0, 8)}) đã được thu gom. Tuy nhiên rác chưa phân loại đúng nên bạn chỉ nhận được một phần điểm nhỏ để khuyến khích.`,
          type: 'SYSTEM',
          isRead: false
        }).catch(console.warn);
      }

      // Notify enterprise — gửi đích danh tới enterprise owner
      getEnterpriseOwnerId(selectedTask).then(enterpriseOwnerId => {
        notificationApi.create({
          ...(enterpriseOwnerId ? { userId: enterpriseOwnerId } : { targetRole: 'ENTERPRISE' }),
          title: 'Cập nhật tiến trình: Đã hoàn thành ✅',
          message: `Tài xế vừa hoàn thành thu gom đơn (ID: ${selectedTask.request?.id?.substring(0,8)}) với trọng lượng ${weight}kg.`,
          type: 'SYSTEM',
          isRead: false
        }).catch(console.warn);
      });

      // Kiểm tra xem còn đơn nào đang 'ON_THE_WAY' không, nếu không thì chuyển về 'Sẵn sàng' (isOnline = true)
      if (user?.userId) {
        const hasOtherOnTheWay = tasks.some(t => t.status === 'ON_THE_WAY' && t.id !== selectedTask.id);
        if (!hasOtherOnTheWay) {
          userApi.updateProfile(user.userId, { isOnline: true }).catch(console.warn);
        }
      }

      setStatusMsg({ type: 'success', text: '🎉 Đã ghi nhận hoàn thành cuốc rác!' });
      setTimeout(() => setStatusMsg(null), 4000);
      setSelectedTask(null);
      setPhotoUrl('');
      setPhotoFile(null);
      setWeight('');
      setIsValid(true);
      if (photoInputRef.current) photoInputRef.current.value = '';
      fetchTasks();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      setStatusMsg({ type: 'error', text: `❌ ${msg}` });
      setTimeout(() => setStatusMsg(null), 5000);
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

      {/* Status toast */}
      {statusMsg && (
        <div style={{
          padding: '12px 20px', borderRadius: 14, fontWeight: 600, fontSize: 14,
          background: statusMsg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
        }}>
          {statusMsg.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Đang tải lộ trình...</div>
      ) : tasks.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Bạn đã hoàn thành mọi lộ trình được giao!</p>
          <p>Nghỉ ngơi chút nhé, bạn đang làm rất tốt.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              background: 'var(--bg-card)', border: `1px solid ${STATUS_MAP[task.status as keyof typeof STATUS_MAP]?.color || '#3b82f6'}22`,
              borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: STATUS_MAP[task.status as keyof typeof STATUS_MAP]?.color || '#3b82f6' }}>
                    Mã đơn: {task.request?.id?.substring(0, 8) || task.id.substring(0, 8)}
                  </span>
                  <span style={{ background: STATUS_MAP[task.status as keyof typeof STATUS_MAP]?.bg, color: STATUS_MAP[task.status as keyof typeof STATUS_MAP]?.color, padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                    {STATUS_MAP[task.status as keyof typeof STATUS_MAP]?.label.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 15, marginBottom: 6 }}>
                  <b>Phân loại:</b> {WASTE_TYPE_MAP[task.request?.type] || task.request?.type || 'Không xác định'}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  📍 Tọa độ GPS:{' '}
                  <a href={`https://maps.google.com/?q=${task.request?.location}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                    {task.request?.location}
                  </a>
                </div>
                {task.request?.description && (
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                    📝 Ghi chú: {task.request.description}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {task.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleUpdateStatus(task.id, 'ON_THE_WAY')}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none',
                      padding: '12px 24px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap'
                    }}>
                    🚚 Đang đến
                  </button>
                )}
                {task.status === 'ON_THE_WAY' && (
                  <button
                    onClick={() => setSelectedTask(task)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none',
                      padding: '12px 24px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap'
                    }}>
                    ✅ Đã thu gom
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Check-in hoàn thành */}
      {selectedTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'linear-gradient(180deg, var(--bg-card) 0%, #0f172a 100%)',
            padding: 40, borderRadius: 28, width: '100%', maxWidth: 480,
            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            animation: 'fadeInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 64, height: 64, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>📸</div>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Nghiệm thu thu gom</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: 15 }}>Đơn hàng: {selectedTask.request?.id?.substring(0, 8) || selectedTask.id.substring(0, 8)}</p>
            </div>

            <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
                  1. Chụp ảnh hiện trường (đã sạch sẽ) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {/* Hidden file input */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    border: `2px dashed ${photoUrl ? 'rgba(16,185,129,0.6)' : 'rgba(16,185,129,0.4)'}`,
                    borderRadius: 16, height: 160,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: photoUrl ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.2)',
                    cursor: 'pointer', color: photoUrl ? '#10b981' : 'var(--text-muted)',
                    transition: 'all 0.2s', overflow: 'hidden', position: 'relative'
                  }}
                  onClick={() => photoInputRef.current?.click()}
                >
                  {photoUrl ? (
                    <>
                      <img
                        src={photoUrl}
                        alt="Ảnh hiện trường"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }}
                      />
                      {/* Overlay for re-upload */}
                      <div style={{
                        position: 'absolute', bottom: 8, right: 8,
                        background: 'rgba(0,0,0,0.6)', borderRadius: 8,
                        padding: '4px 10px', fontSize: 12, color: 'white', fontWeight: 600
                      }}>
                        📷 Thay ảnh
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 36, marginBottom: 8 }}>📁</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Chọn ảnh từ máy tính</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG, WEBP — nhấn để chọn file</span>
                    </>
                  )}
                </div>
                {photoFile && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--green-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ✅ {photoFile.name}
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
                  2. Khối lượng thực tế thu được (kg) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '4px 16px' }}>
                  <input
                    type="number" step="0.1" min="0.1" required
                    value={weight}
                    onChange={e => {
                      const v = e.target.valueAsNumber;
                      setWeight(isNaN(v) ? '' : v);
                    }}
                    placeholder="0.0"
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      color: 'var(--green-400)', fontSize: 32, fontWeight: 800, padding: '12px 0'
                    }}
                  />
                  <span style={{ fontSize: 20, color: 'var(--text-muted)', fontWeight: 600 }}>kg</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isValid} onChange={(e) => setIsValid(e.target.checked)} style={{ width: 20, height: 20, accentColor: '#10b981' }} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isValid ? '#10b981' : '#ef4444' }}>
                      {isValid ? '✅ Rác phân loại hợp lệ' : '❌ Rác KHÔNG hợp lệ'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Bỏ chọn nếu người dân phân loại sai. Đơn vẫn sẽ được dọn nhưng người dân sẽ chỉ nhận được điểm khuyến khích (tùy vào cấu hình của doanh nghiệp).
                    </div>
                  </div>
                </label>
              </div>

              {!photoUrl && (
                <div style={{ fontSize: 13, color: '#f59e0b', textAlign: 'center', padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 12 }}>
                  ⚠️ Bạn chưa đính kèm ảnh hiện trường. Đơn vẫn có thể hoàn tất nhưng sẽ thiếu dữ liệu minh chứng.
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <button type="button" onClick={() => { setSelectedTask(null); setPhotoUrl(''); setPhotoFile(null); setWeight(''); setIsValid(true); if (photoInputRef.current) photoInputRef.current.value = ''; }}
                  style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', borderRadius: 16, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 2, padding: '16px', background: !submitting ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)', border: 'none', color: !submitting ? 'white' : 'rgba(255,255,255,0.3)', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: !submitting ? 'pointer' : 'not-allowed', boxShadow: !submitting ? '0 8px 24px rgba(16, 185, 129, 0.4)' : 'none', transition: 'all 0.2s' }}
                >
                  {submitting ? 'Đang gửi...' : 'Hoàn Tất Thu Gom'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
