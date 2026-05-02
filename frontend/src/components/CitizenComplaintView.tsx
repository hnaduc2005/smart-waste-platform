import { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { collectionApi } from '../services/collectionApi';
import { useAuth } from '../context/AuthContext';

const COMPLAINT_TYPES = [
  { value: 'NOT_COLLECTED', label: '🚫 Tài xế không đến lấy rác' },
  { value: 'LATE_COLLECTION', label: '⏰ Thu gom trễ hơn cam kết' },
  { value: 'WRONG_POINTS', label: '🏆 Điểm thưởng tính sai' },
  { value: 'RUDE_BEHAVIOR', label: '😤 Thái độ tài xế không tốt' },
  { value: 'DAMAGE', label: '💥 Gây hư hỏng tài sản' },
  { value: 'OTHER', label: '📝 Lý do khác' },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  OPEN:        { label: 'Chờ xử lý',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '🟡' },
  IN_PROGRESS: { label: 'Đang xử lý',   color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  icon: '🔵' },
  RESOLVED:    { label: 'Đã giải quyết',color: '#4ade80', bg: 'rgba(74,222,128,0.15)',  icon: '✅' },
  CLOSED:      { label: 'Đã đóng',      color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: '⚫' },
};

const WASTE_LABELS: Record<string, string> = {
  RECYCLABLE: '♻️ Tái chế', ORGANIC: '🍎 Hữu cơ',
  HAZARDOUS: '⚠️ Độc hại', BULKY: '🛋️ Cồng kềnh', ELECTRONIC: '💻 Điện tử',
};

export const CitizenComplaintView = () => {
  const { user } = useAuth();
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    requestId: '',
    type: 'OTHER',
    title: '',
    description: '',
  });

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);
    Promise.allSettled([
      adminApi.getMyCitizenComplaints(user.userId),
      collectionApi.getCitizenRequests(user.userId),
    ]).then(([cRes, rRes]) => {
      if (cRes.status === 'fulfilled') setMyComplaints(cRes.value || []);
      if (rRes.status === 'fulfilled') {
        const done = (rRes.value || []).filter((r: any) =>
          ['COMPLETED', 'COLLECTED', 'CANCELLED'].includes(r.status)
        );
        setRequests(done);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.type) return;
    setSubmitting(true);
    try {
      const req = requests.find(r => r.id === form.requestId);
      const payload: any = {
        citizenId: user?.userId,
        citizenName: user?.username || 'Người dùng',
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
      };
      if (form.requestId) payload.requestId = form.requestId;
      const created = await adminApi.createComplaint(payload);
      setMyComplaints(prev => [created, ...prev]);
      setForm({ requestId: '', type: 'OTHER', title: '', description: '' });
      setShowForm(false);
      showToast('success', '✅ Khiếu nại đã được gửi thành công! Admin sẽ xem xét trong 24-48 giờ.');
    } catch {
      showToast('error', '❌ Gửi khiếu nại thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 36 }}>⏳</div>
      <p style={{ color: 'var(--text-secondary)' }}>Đang tải...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Khiếu nại & Phản hồi 📩</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>
            Gửi khiếu nại khi việc thu gom không đúng cam kết. Admin sẽ xem xét và phản hồi trong 24-48 giờ.
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #22c55e, #14b8a6)', color: 'white', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(34,197,94,0.3)' }}>
          + Gửi khiếu nại mới
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ padding: '14px 20px', borderRadius: 14, fontWeight: 600, fontSize: 14,
          background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: toast.type === 'success' ? '#4ade80' : '#f87171' }}>
          {toast.text}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Tổng khiếu nại', value: myComplaints.length, icon: '📩', color: 'rgba(59,130,246,0.12)' },
          { label: 'Đang chờ',       value: myComplaints.filter(c => c.status === 'OPEN').length, icon: '🟡', color: 'rgba(245,158,11,0.12)' },
          { label: 'Đang xử lý',     value: myComplaints.filter(c => c.status === 'IN_PROGRESS').length, icon: '🔵', color: 'rgba(96,165,250,0.12)' },
          { label: 'Đã giải quyết',  value: myComplaints.filter(c => c.status === 'RESOLVED').length, icon: '✅', color: 'rgba(34,197,94,0.12)' },
        ].map(s => (
          <div key={s.label} style={{ padding: 22, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
            <div style={{ width: 44, height: 44, background: s.color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Complaint list */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 17 }}>📋 Danh sách khiếu nại của bạn</h3>
        {myComplaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p>Bạn chưa có khiếu nại nào. Tuyệt vời!</p>
            <button onClick={() => setShowForm(true)}
              style={{ marginTop: 8, padding: '10px 24px', background: 'var(--green-500)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
              Gửi khiếu nại đầu tiên
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myComplaints.map((c: any) => {
              const ss = STATUS_STYLE[c.status] || STATUS_STYLE.OPEN;
              return (
                <div key={c.id} style={{ padding: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.status === 'OPEN' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{c.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        {COMPLAINT_TYPES.find(t => t.value === c.type)?.label || c.type}
                      </div>
                      {c.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{c.description}</div>}
                      {c.adminNote && (
                        <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, fontSize: 13 }}>
                          <span style={{ fontWeight: 700, color: '#4ade80' }}>💬 Phản hồi từ Admin: </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{c.adminNote}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: ss.bg, color: ss.color }}>
                        {ss.icon} {ss.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </span>
                      {c.resolvedAt && (
                        <span style={{ fontSize: 11, color: '#4ade80' }}>
                          ✅ Xử lý: {new Date(c.resolvedAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div onClick={e => e.target === e.currentTarget && setShowForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#111a16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: 36, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>📩 Gửi khiếu nại mới</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 22 }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Đơn liên quan */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  📦 Đơn thu gom liên quan (tuỳ chọn)
                </label>
                <select value={form.requestId} onChange={e => setForm(p => ({ ...p, requestId: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '12px 14px', borderRadius: 12, color: 'white', fontSize: 14 }}>
                  <option value="">-- Không liên kết đơn cụ thể --</option>
                  {requests.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      #{r.id?.substring(0, 8)} · {WASTE_LABELS[r.type] || r.type} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loại khiếu nại */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  🏷️ Loại khiếu nại <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {COMPLAINT_TYPES.map(t => (
                    <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: form.type === t.value ? 'rgba(34,197,94,0.12)' : 'var(--bg-input)', border: `1px solid ${form.type === t.value ? 'var(--green-400)' : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' }}>
                      <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={() => setForm(p => ({ ...p, type: t.value }))} style={{ display: 'none' }} />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tiêu đề */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  📝 Tiêu đề <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Mô tả ngắn gọn vấn đề của bạn..."
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '12px 14px', borderRadius: 12, color: 'white', fontSize: 14, boxSizing: 'border-box' }} />
              </div>

              {/* Mô tả */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  📋 Mô tả chi tiết
                </label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={4} placeholder="Mô tả chi tiết sự việc, thời gian, địa điểm..."
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '12px 14px', borderRadius: 12, color: 'white', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              {/* Lưu ý */}
              <div style={{ padding: '14px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, fontSize: 13, color: '#93c5fd' }}>
                ℹ️ Khiếu nại sẽ được Admin xem xét trong vòng <strong>24-48 giờ</strong>. Bạn sẽ nhận thông báo khi có kết quả.
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Huỷ bỏ
                </button>
                <button type="submit" disabled={submitting || !form.title.trim()}
                  style={{ flex: 2, padding: '14px', background: submitting ? '#64748b' : 'linear-gradient(135deg, #22c55e, #14b8a6)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? '⏳ Đang gửi...' : '📩 Gửi khiếu nại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
