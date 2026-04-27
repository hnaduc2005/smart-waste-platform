import React, { useState, useEffect } from 'react';
import { collectionApi } from '../services/collectionApi';
import { enterpriseApi } from '../services/enterpriseApi';
import { userApi } from '../services/userApi';
import { notificationApi } from '../services/notificationApi';
import { useAuth } from '../context/AuthContext';

const WASTE_LABELS: Record<string, {label:string;icon:string}> = {
  RECYCLABLE: { label: 'Tái chế', icon: '♻️' },
  ORGANIC:    { label: 'Hữu cơ',  icon: '🍎' },
  HAZARDOUS:  { label: 'Độc hại', icon: '⚠️' },
  BULKY:      { label: 'Cồng kềnh', icon: '🛋️' },
  ELECTRONIC: { label: 'Điện tử', icon: '💻' },
};

const STATUS_LABELS: Record<string, {label:string;color:string;bg:string}> = {
  PENDING:    { label: 'Chờ duyệt',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  ASSIGNED:   { label: 'Đã gán',      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  ON_THE_WAY: { label: 'Đang đến',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  COLLECTED:  { label: 'Đã lấy',      color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  COMPLETED:  { label: 'Hoàn thành',  color: '#059669', bg: 'rgba(5,150,105,0.15)' },
  CANCELLED:  { label: 'Đã từ chối',  color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

const TAB_ITEMS = [
  { id: 'requests', label: 'Tiếp nhận đơn', icon: '📥' },
  { id: 'dispatch', label: 'Điều phối', icon: '🗺️' },
  { id: 'tracking', label: 'Theo dõi tiến độ', icon: '📡' },
  { id: 'capacity', label: 'Năng lực', icon: '🏭' },
  { id: 'rewards',  label: 'Cấu hình điểm', icon: '🏅' },
];

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
  padding: '12px 14px', borderRadius: 10, color: 'white', fontSize: 14, boxSizing: 'border-box',
};

export const EnterpriseDashboardView = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');

  // --- Data states ---
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [collectors, setCollectors]   = useState<any[]>([]);
  const [enterprise, setEnterprise]   = useState<any>(null);
  const [rewardRules, setRewardRules] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState<{type:'success'|'error';text:string}|null>(null);

  // Capacity form
  const [capForm, setCapForm] = useState({ name:'', address:'', licenseNumber:'', dailyCapacity:'', serviceArea:'', acceptedWasteTypes:'', phone:'', email:'' });

  const showToast = (type: 'success'|'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [reqs, cols, rules] = await Promise.allSettled([
        collectionApi.getAllRequests(),
        userApi.getCollectors(),
        enterpriseApi.getRewardRules(),
      ]);
      if (reqs.status === 'fulfilled') setAllRequests(reqs.value || []);
      if (cols.status === 'fulfilled') setCollectors(cols.value || []);
      if (rules.status === 'fulfilled') setRewardRules(rules.value || []);

      if (user?.userId) {
        try {
          const ent = await enterpriseApi.getMyEnterprise(user.userId);
          setEnterprise(ent);
          setCapForm({
            name: ent.name || '',
            address: ent.address || '',
            licenseNumber: ent.licenseNumber || '',
            dailyCapacity: String(ent.dailyCapacity || ''),
            serviceArea: ent.serviceArea || '',
            acceptedWasteTypes: ent.acceptedWasteTypes || '',
            phone: ent.phone || '',
            email: ent.email || '',
          });
        } catch { /* No enterprise registered yet */ }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [user?.userId]);

  // Refresh tracking every 15s
  useEffect(() => {
    if (activeTab !== 'tracking') return;
    const id = setInterval(() => collectionApi.getAllRequests().then(d => setAllRequests(d || [])), 15000);
    return () => clearInterval(id);
  }, [activeTab]);

  // --- Actions ---
  const handleReject = async (reqId: string, citizenId: string) => {
    try {
      await collectionApi.rejectRequest(reqId);
      setAllRequests(r => r.map(x => x.id === reqId ? { ...x, status: 'CANCELLED' } : x));
      notificationApi.create({ userId: citizenId, title: 'Đơn thu gom bị từ chối ❌', message: `Đơn (ID: ${reqId.substring(0,8)}) không phù hợp với khu vực phục vụ của chúng tôi.`, type: 'SYSTEM', isRead: false }).catch(()=>{});
      showToast('success', '✅ Đã từ chối đơn');
    } catch { showToast('error', '❌ Không thể từ chối đơn'); }
  };

  const handleAssign = async (reqId: string, collectorId: string, citizenId: string) => {
    if (!collectorId) return;
    try {
      await collectionApi.assignTask({ requestId: reqId, collectorId });
      setAllRequests(r => r.map(x => x.id === reqId ? { ...x, status: 'ASSIGNED' } : x));
      notificationApi.create({ userId: citizenId, title: 'Đơn rác đã được giao tài xế 🚛', message: `Đơn (ID: ${reqId.substring(0,8)}) sắp được thu gom.`, type: 'COLLECTION', isRead: false }).catch(()=>{});
      notificationApi.create({ userId: collectorId, title: 'Bạn có nhiệm vụ mới! 🚛', message: `Đơn (ID: ${reqId.substring(0,8)}) vừa được phân công.`, type: 'SYSTEM', isRead: false }).catch(()=>{});
      showToast('success', '✅ Đã gán tài xế thành công');
    } catch (e: any) { showToast('error', `❌ ${e?.response?.data?.message || 'Gán thất bại'}`); }
  };

  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...capForm, dailyCapacity: parseFloat(capForm.dailyCapacity) };
      if (enterprise?.id) {
        const updated = await enterpriseApi.updateEnterprise(enterprise.id, payload);
        setEnterprise(updated);
      } else {
        const created = await enterpriseApi.createEnterprise(payload as any);
        setEnterprise(created);
      }
      showToast('success', '✅ Đã lưu thông tin doanh nghiệp');
    } catch { showToast('error', '❌ Không thể lưu thông tin'); }
  };

  const handleSaveRule = async (wasteType: string, pointsPerKg: number) => {
    try {
      const updated = await enterpriseApi.updateRewardRule(wasteType, pointsPerKg);
      setRewardRules(r => r.map(x => x.type === wasteType ? { ...x, pointsPerKg: updated.pointsPerKg } : x));
      showToast('success', `✅ Đã cập nhật điểm cho ${WASTE_LABELS[wasteType]?.label}`);
    } catch { showToast('error', '❌ Không thể lưu quy tắc điểm'); }
  };

  const pendingReqs = allRequests.filter(r => r.status === 'PENDING');
  const activeReqs  = allRequests.filter(r => ['ASSIGNED','ON_THE_WAY','COLLECTED'].includes(r.status));
  const doneReqs    = allRequests.filter(r => r.status === 'COMPLETED');

  const card = (label: string, value: any, icon: string, color: string) => (
    <div style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ width:44, height:44, background: color, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{icon}</div>
      <div>
        <div style={{ fontSize:26, fontWeight:900 }}>{value}</div>
        <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>{label}</div>
      </div>
    </div>
  );

  const statusBadge = (status: string) => {
    const s = STATUS_LABELS[status] || { label: status, color:'#888', bg:'rgba(128,128,128,0.1)' };
    return <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:700, background:s.bg, color:s.color }}>{s.label}</span>;
  };

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'var(--text-secondary)' }}>⏳ Đang tải dữ liệu...</div>;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize:28, fontWeight:800, margin:0 }}>Quản lý Doanh nghiệp 🏭</h2>
        <p style={{ color:'var(--text-secondary)', margin:'8px 0 0' }}>Trung tâm điều phối và quản lý toàn bộ hoạt động thu gom rác thải.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ padding:'12px 20px', borderRadius:12, fontWeight:600, fontSize:14,
          background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: toast.type === 'success' ? '#34d399' : '#f87171' }}>
          {toast.text}
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16 }}>
        {card('Tổng đơn thu gom', allRequests.length, '📋', 'rgba(59,130,246,0.15)')}
        {card('Chờ duyệt', pendingReqs.length, '⏳', 'rgba(245,158,11,0.15)')}
        {card('Đang xử lý', activeReqs.length, '🚚', 'rgba(139,92,246,0.15)')}
        {card('Hoàn thành', doneReqs.length, '✅', 'rgba(16,185,129,0.15)')}
        {card('Tài xế', collectors.length, '👷', 'rgba(234,179,8,0.15)')}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, borderBottom:'1px solid var(--border)', paddingBottom:0, flexWrap:'wrap' }}>
        {TAB_ITEMS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding:'10px 20px', background: activeTab===t.id ? 'rgba(34,197,94,0.15)' : 'transparent',
              border: activeTab===t.id ? '1px solid rgba(34,197,94,0.4)' : '1px solid transparent',
              color: activeTab===t.id ? '#34d399' : 'var(--text-secondary)',
              borderRadius:'10px 10px 0 0', fontWeight:600, fontSize:14, cursor:'pointer', transition:'all 0.2s',
              display:'flex', alignItems:'center', gap:6 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* === TAB: TIẾP NHẬN === */}
      {activeTab === 'requests' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <p style={{ color:'var(--text-secondary)', margin:0 }}>Danh sách các đơn thu gom đang chờ duyệt từ người dân. Bạn có thể tiếp nhận (gán tài xế) hoặc từ chối.</p>
          {pendingReqs.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, background:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border)', color:'var(--text-secondary)' }}>
              <div style={{ fontSize:48 }}>🎉</div>
              <p>Không có đơn nào đang chờ duyệt!</p>
            </div>
          ) : pendingReqs.map(req => (
            <div key={req.id} style={{ background:'var(--bg-card)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:16, padding:20,
              display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:20 }}>{WASTE_LABELS[req.type]?.icon || '🗑️'}</span>
                  <span style={{ fontWeight:700, fontSize:16 }}>{WASTE_LABELS[req.type]?.label || req.type}</span>
                  {statusBadge(req.status)}
                </div>
                <div style={{ fontSize:13, color:'var(--text-secondary)' }}>📍 {req.location}</div>
                {req.description && <div style={{ fontSize:13, color:'var(--text-secondary)', fontStyle:'italic', marginTop:4 }}>📝 {req.description}</div>}
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>ID: {req.id.substring(0,8)} · {req.createdAt ? new Date(req.createdAt).toLocaleString('vi-VN') : ''}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, minWidth:220 }}>
                <select defaultValue=""
                  onChange={e => { if(e.target.value) handleAssign(req.id, e.target.value, req.citizenId); }}
                  style={{ ...INPUT_STYLE, color:'var(--green-400)', fontWeight:600 }}>
                  <option value="">-- Gán tài xế --</option>
                  {collectors.map(c => <option key={c.id} value={c.id}>{c.fullName || 'Tài xế'}</option>)}
                </select>
                <button onClick={() => handleReject(req.id, req.citizenId)}
                  style={{ padding:'10px 16px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)',
                    color:'#f87171', borderRadius:10, fontWeight:600, cursor:'pointer' }}>
                  ❌ Từ chối đơn
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === TAB: ĐIỀU PHỐI === */}
      {activeTab === 'dispatch' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <p style={{ color:'var(--text-secondary)', margin:0 }}>Gán tài xế cho các đơn đã tiếp nhận. Dùng bản đồ ở mục <b>Bản đồ</b> để điều phối trực quan hơn.</p>
          {allRequests.filter(r => r.status === 'PENDING').length === 0 && (
            <div style={{ textAlign:'center', padding:32, background:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border)', color:'var(--text-secondary)' }}>
              Tất cả đơn đã được điều phối hoặc chưa có đơn mới.
            </div>
          )}
          {allRequests.filter(r => r.status === 'PENDING').map(req => (
            <div key={req.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:18,
              display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
              <div>
                <div style={{ fontWeight:700 }}>{WASTE_LABELS[req.type]?.icon} {WASTE_LABELS[req.type]?.label || req.type}</div>
                <div style={{ fontSize:13, color:'var(--text-secondary)' }}>📍 {req.location} · ID: {req.id.substring(0,8)}</div>
              </div>
              <select defaultValue="" onChange={e => { if(e.target.value) handleAssign(req.id, e.target.value, req.citizenId); }}
                style={{ ...INPUT_STYLE, maxWidth:220, color:'var(--green-400)' }}>
                <option value="">-- Chọn tài xế --</option>
                {collectors.map(c => <option key={c.id} value={c.id}>{c.fullName || 'Tài xế'}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* === TAB: THEO DÕI === */}
      {activeTab === 'tracking' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <p style={{ color:'var(--text-secondary)', margin:0 }}>Trạng thái thu gom theo thời gian thực. Tự động cập nhật mỗi 15 giây.</p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:4 }}>
            {Object.entries(STATUS_LABELS).map(([k,v]) => (
              <span key={k} style={{ fontSize:12, padding:'4px 12px', borderRadius:20, background:v.bg, color:v.color, fontWeight:600 }}>
                {v.label}: {allRequests.filter(r=>r.status===k).length}
              </span>
            ))}
          </div>
          {allRequests.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, background:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border)', color:'var(--text-secondary)' }}>Chưa có dữ liệu.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[...allRequests].sort((a,b) => new Date(b.createdAt||0).getTime() - new Date(a.createdAt||0).getTime()).map(req => (
                <div key={req.id} style={{ background:'var(--bg-card)', border:`1px solid ${STATUS_LABELS[req.status]?.color || '#888'}33`,
                  borderRadius:14, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <span style={{ fontWeight:700 }}>{WASTE_LABELS[req.type]?.icon} {WASTE_LABELS[req.type]?.label || req.type}</span>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>ID: {req.id.substring(0,8)} · {req.createdAt ? new Date(req.createdAt).toLocaleString('vi-VN') : ''}</div>
                  </div>
                  {statusBadge(req.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === TAB: NĂNG LỰC === */}
      {activeTab === 'capacity' && (
        <form onSubmit={handleSaveCapacity} style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:700 }}>
          <p style={{ color:'var(--text-secondary)', margin:0 }}>Cập nhật thông tin năng lực xử lý rác của doanh nghiệp. Dữ liệu sẽ được lưu thật vào database.</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, padding:28, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20 }}>
            {[
              { key:'name', label:'Tên doanh nghiệp', colSpan:2 },
              { key:'licenseNumber', label:'Số giấy phép kinh doanh' },
              { key:'dailyCapacity', label:'Công suất (Tấn/ngày)', type:'number' },
              { key:'serviceArea', label:'Khu vực phục vụ', colSpan:2 },
              { key:'acceptedWasteTypes', label:'Loại rác tiếp nhận (vd: RECYCLABLE,ORGANIC)', colSpan:2 },
              { key:'address', label:'Địa chỉ trụ sở', colSpan:2 },
              { key:'phone', label:'Điện thoại' },
              { key:'email', label:'Email' },
            ].map((f: any) => (
              <div key={f.key} style={{ gridColumn: f.colSpan === 2 ? 'span 2' : 'span 1' }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-secondary)', marginBottom:6 }}>{f.label}</label>
                <input type={f.type||'text'} value={(capForm as any)[f.key]}
                  onChange={e => setCapForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={INPUT_STYLE} />
              </div>
            ))}
          </div>
          <button type="submit" style={{ alignSelf:'flex-end', padding:'14px 36px', background:'var(--green-500)', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:15, cursor:'pointer' }}>
            💾 Lưu thông tin
          </button>
        </form>
      )}

      {/* === TAB: CẤU HÌNH ĐIỂM === */}
      {activeTab === 'rewards' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <p style={{ color:'var(--text-secondary)', margin:0 }}>Cấu hình số điểm thưởng người dân nhận được trên mỗi kg rác thải. Thay đổi sẽ lưu vào database và có hiệu lực ngay.</p>
          {rewardRules.length === 0 ? (
            <div style={{ textAlign:'center', padding:32, background:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border)', color:'var(--text-muted)' }}>
              Chưa có quy tắc nào được cấu hình. Hệ thống sẽ dùng giá trị mặc định.
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
              {rewardRules.map((rule: any) => {
                const wl = WASTE_LABELS[rule.type] || { icon:'🗑️', label: rule.type };
                return (
                  <RuleCard key={rule.type} rule={rule} wl={wl} onSave={handleSaveRule} />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function RuleCard({ rule, wl, onSave }: { rule: any; wl: any; onSave: (t:string, p:number)=>void }) {
  const [pts, setPts] = useState<number>(rule.pointsPerKg || 0);
  return (
    <div style={{ padding:24, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, display:'flex', alignItems:'center', gap:18 }}>
      <div style={{ width:52, height:52, background:'rgba(255,255,255,0.05)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{wl.icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, marginBottom:10 }}>{wl.label}</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="number" min={0} step={0.5} value={pts} onChange={e => setPts(parseFloat(e.target.value))}
            style={{ width:80, background:'var(--bg-input)', border:'1px solid var(--border)', padding:'8px', borderRadius:8, color:'var(--green-400)', fontSize:18, fontWeight:800, textAlign:'center' }} />
          <span style={{ color:'var(--text-secondary)', fontSize:13 }}>điểm / kg</span>
          <button onClick={() => onSave(rule.type, pts)}
            style={{ padding:'8px 16px', background:'var(--green-500)', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>Lưu</button>
        </div>
      </div>
    </div>
  );
}
