import { useState, useEffect } from 'react';
import { Star, Trophy, History, ChevronRight, Gift, X, CheckCircle2 } from 'lucide-react';
import { rewardApi, RewardHistory, LeaderboardEntry } from '../services/rewardApi';
import { useAuth } from '../context/AuthContext';

export const RewardView = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<RewardHistory[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  useEffect(() => {
    if (user?.userId) {
      rewardApi.getHistory(user.userId)
        .then(res => {
          setHistory(res);
          setPoints(res.reduce((acc, curr) => acc + curr.points, 0));
        })
        .catch(() => {
          // Mock data if failed
          const mockHistory: RewardHistory[] = [
            { id: '1', citizenId: user.userId, points: 50, reason: 'Thu gom rác hữu cơ', createdAt: new Date().toISOString() },
            { id: '2', citizenId: user.userId, points: 120, reason: 'Thu gom rác tái chế', createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: '3', citizenId: user.userId, points: -200, reason: 'Đổi Voucher Highland', createdAt: new Date(Date.now() - 172800000).toISOString() },
          ];
          setHistory(mockHistory);
          setPoints(650);
        });

      rewardApi.getLeaderboard()
        .then(res => setLeaderboard(res.slice(0, 5)))
        .catch(() => {
          setLeaderboard([
            { citizenId: '1', username: 'Anh Tuấn', totalPoints: 2450, rank: 1 },
            { citizenId: '2', username: 'Minh Hằng', totalPoints: 1820, rank: 2 },
            { citizenId: '3', username: 'Quốc Bảo', totalPoints: 1540, rank: 3 },
          ]);
        });
    }
  }, [user]);

  const handleRedeem = () => {
    setRedeemSuccess(true);
    setTimeout(() => {
      setRedeemSuccess(false);
      setIsModalOpen(false);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Điểm thưởng của bạn 🏆</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Tích lũy EcoP từ việc thu gom rác và đổi lấy những phần quà hấp dẫn.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #22c55e, #10b981)',
            color: 'white', border: 'none', padding: '12px 28px', borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(34,197,94,0.3)'
          }}
        >
          🎁 Đổi phần thưởng
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
        {/* Left Column: Points & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Points Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, #111a16 0%, #064e3b 100%)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 120, opacity: 0.1 }}>💎</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4ade80', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              <Star size={16} fill="#4ade80" /> EcoCycle Loyalty
            </div>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 56, fontWeight: 900, color: 'white' }}>{points.toLocaleString()}</span>
              <span style={{ fontSize: 20, color: '#4ade80', fontWeight: 600 }}>EcoP</span>
            </div>
            <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              Bạn đang ở hạng <b>Bạc</b>. Tích thêm 350 EcoP để lên hạng <b>Vàng</b>!
            </div>
          </div>

          {/* History */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={20} color="var(--green-400)" /> Lịch sử hoạt động
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                Xem tất cả <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{item.reason}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 16, color: item.points > 0 ? '#4ade80' : '#ef4444' }}>
                    {item.points > 0 ? `+${item.points}` : item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Leaderboard */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 24px', fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy size={20} color="#f59e0b" /> Bảng xếp hạng
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {leaderboard.map((u, idx) => (
              <div key={u.citizenId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: idx === 0 ? 'rgba(245,158,11,0.08)' : 'transparent', border: idx === 0 ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent' }}>
                <div style={{ width: 28, textAlign: 'center', fontWeight: 900, fontSize: 14, color: idx === 0 ? '#f59e0b' : 'var(--text-muted)' }}>{idx + 1}</div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {u.username.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{u.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--green-400)' }}>{u.totalPoints.toLocaleString()} EcoP</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Bạn đang đứng thứ <b>12</b> khu vực</p>
          </div>
        </div>
      </div>

      {/* Redeem Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111a16', border: '1px solid var(--border)', borderRadius: 28, width: '90%', maxWidth: 500, padding: 32, position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', right: 24, top: 24, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X /></button>
            
            {redeemSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 80, height: 80, background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle2 size={48} color="#22c55e" />
                </div>
                <h3 style={{ fontSize: 24, margin: '0 0 12px' }}>Đổi quà thành công!</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Mã Voucher đã được gửi về email của bạn.</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 24, margin: '0 0 8px' }}>Đổi phần thưởng 🎁</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Chọn gói ưu đãi bạn muốn đổi bằng EcoP.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                  {[
                    { id: 1, title: 'Voucher Highland Coffee 50k', cost: 500, icon: '☕' },
                    { id: 2, title: 'Thẻ GrabFood 100k', cost: 1000, icon: '🚗' },
                    { id: 3, title: 'Gói nạp điện thoại 20k', cost: 200, icon: '📱' },
                  ].map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 16, cursor: 'pointer' }} onClick={handleRedeem}>
                      <div style={{ fontSize: 24 }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--green-400)' }}>{item.cost} EcoP</div>
                      </div>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Số dư sau khi đổi: <b>{(points - 500).toLocaleString()} EcoP</b>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
