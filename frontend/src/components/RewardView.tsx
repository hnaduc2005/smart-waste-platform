import { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Flame, History, ChevronRight, CheckCircle2, X, Loader2 } from 'lucide-react';
import FeedbackModal from '../components/common/FeedbackModal';
import { useAuth } from '../context/AuthContext';
import { rewardApi } from '../services/rewardApi';
import { userApi } from '../services/userApi';
import { collectionApi } from '../services/collectionApi';
import axios from 'axios';

interface TopUser {
  rank: number;
  name: string;
  points: number;
  avatar: string;
}

interface Transaction {
  id: number;
  title: string;
  weight: string;
  points: string;
  date: string;
  type: 'earn' | 'spend';
}

export const RewardView = () => {
  const { user } = useAuth();
  const [currentPoints, setCurrentPoints] = useState<number>(0);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAllHistory, setShowAllHistory] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [latestTask, setLatestTask] = useState<any>(null);
  const [collectorName, setCollectorName] = useState<string>('Người thu gom');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleRedeem = async (cost: number, title: string) => {
    setErrorMsg('');
    if (currentPoints < cost) {
      setErrorMsg(`Rất tiếc! Bạn cần thêm ${(cost - currentPoints).toLocaleString()} EcoP nữa để đổi phần quà này.`);
      return;
    }
    
    if (!user?.userId) return;

    setIsRedeeming(true);

    try {
      const minDelay = new Promise(resolve => setTimeout(resolve, 1500));
      const apiCall = rewardApi.redeemReward({
        citizenId: user.userId,
        cost: cost,
        rewardTitle: title
      });

      await Promise.all([apiCall, minDelay]);
      
      setRedeemSuccess(true);
      setCurrentPoints(prev => Math.max(0, prev - cost));
      
      // Reload history to show the new transaction
      rewardApi.getHistory(user.userId).then(res => {
         const newTx: Transaction = {
           id: Date.now(),
           title: `Đổi quà: ${title}`,
           weight: "",
           points: `-${cost}`,
           date: new Date().toLocaleDateString('vi-VN'),
           type: 'spend'
         };
         setTransactions(prev => [newTx, ...prev]);
      });

      setTimeout(() => {
        setRedeemSuccess(false);
        setIsModalOpen(false);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Lỗi khi đổi thưởng: " + (err.response?.data || "Vui lòng thử lại"));
    } finally {
      setIsRedeeming(false);
    }
  };

  useEffect(() => {
    // 1. Fetch Leaderboard via Api
    rewardApi.getLeaderboard()
      .then(async res => {
        const leaderData: TopUser[] = await Promise.all(res.map(async (u, idx) => {
          // citizenName is now fetched from user-service by backend directly
          // Use it as-is; it will be fullName if backend call succeeded, or fallback
          return {
            rank: u.rank || idx + 1,
            name: u.citizenName || `User ${u.citizenId.substring(0, 8)}`,
            points: u.totalPoints || 0,
            avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${u.citizenId}`
          };
        }));
        setTopUsers(leaderData);
      })
      .catch((err) => {
        console.error("Lỗi lấy Leaderboard:", err);
        setTopUsers([]);
      });

    // 2. Fetch User History
    if (user?.userId) {
      rewardApi.getHistory(user.userId)
        .then(res => {
          const humanizeReason = (reason: string) => {
            if (!reason) return 'Nhận thưởng thu gom';
            return reason
              .replace('Phan loai rac:', 'Phân loại rác:')
              .replace('RECYCLABLE', '♻️ Tái chế')
              .replace('ORGANIC', '🍎 Hữu cơ')
              .replace('HAZARDOUS', '⚠️ Độc hại')
              .replace('ELECTRONIC', '💻 Điện tử')
              .replace('BULKY', '🛋️ Cồng kềnh');
          };
          const txData: Transaction[] = res.map((item: any, idx) => {
            const val = item.amount ?? item.points ?? 0;
            return {
              id: idx,
              title: humanizeReason(item.reason),
              weight: "",
              points: val > 0 ? `+${val}` : `${val}`,
              date: (() => {
                const raw = item.createdAt;
                if (!raw) return '';
                const str = raw.includes('T') && !raw.endsWith('Z') && !raw.includes('+') ? raw + 'Z' : raw;
                return new Date(str).toLocaleDateString('vi-VN');
              })(),
              type: val > 0 ? 'earn' : 'spend'
            };
          });
          setTransactions(txData);

          const total = res.reduce((acc, curr: any) => acc + (curr.amount ?? curr.points ?? 0), 0);
          setCurrentPoints(total || 0);
        })
        .catch((err) => {
          console.error("Lỗi lấy History:", err);
          setCurrentPoints(0);
          setTransactions([]);
        });
        
      collectionApi.getCitizenCompletedTasks(user.userId).then(async (tasks) => {
        if (tasks && tasks.length > 0) {
          const sorted = tasks.sort((a: any, b: any) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
          const latest = sorted[0];
          setLatestTask(latest);
          try {
             const cUser = await userApi.getUser(latest.collectorId);
             setCollectorName(cUser.fullName || 'Người thu gom');
          } catch (e) {
             setCollectorName('Người thu gom');
          }
        }
      }).catch(console.error);
    }
  }, [user?.userId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* CỘT TRÁI: ĐIỂM SỐ & LỊCH SỬ GIAO DỊCH */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Card Điểm Số */}
          <div style={{ 
            background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', 
            borderRadius: 24, padding: 32, boxShadow: '0 8px 30px rgba(16,185,129,0.2)', 
            border: '1px solid rgba(16,185,129,0.3)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: '#34d399', opacity: 0.2, borderRadius: '50%', filter: 'blur(40px)' }}></div>
            
            <h2 style={{ color: '#d1fae5', fontSize: 16, fontWeight: 600, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Star size={20} fill="#facc15" color="#facc15" />
              ĐIỂM TÍCH LŨY CỦA BẠN
            </h2>
            
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <span style={{ fontSize: 64, fontWeight: 900, color: 'white', letterSpacing: '-2px', lineHeight: 1 }}>
                {currentPoints.toLocaleString()}
              </span>
              <span style={{ fontSize: 20, color: '#a7f3d0', marginBottom: 8, fontWeight: 600 }}>EcoP</span>
            </div>
            
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              {feedbackSuccess && (
                <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.5)', color: '#34d399', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, animation: 'slideDown 0.3s ease' }}>
                  Cảm ơn bạn đã gửi đánh giá!
                </div>
              )}
              {errorMsg && (
                <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#fca5a5', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, animation: 'slideDown 0.3s ease' }}>
                  {errorMsg}
                </div>
              )}
              <button 
                onClick={() => { setIsModalOpen(true); setErrorMsg(''); }}
                style={{ 
                  background: 'white', color: '#065f46', fontWeight: 700, padding: '12px 24px', 
                  borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}
              >
                Đổi Thưởng
              </button>
              <button 
                onClick={() => {
                  if (!latestTask) {
                    setErrorMsg("Bạn chưa có đơn thu gom nào hoàn thành để đánh giá.");
                    return;
                  }
                  setIsFeedbackOpen(true);
                }}
                style={{ 
                  background: 'rgba(13, 148, 136, 0.5)', color: 'white', fontWeight: 600, padding: '12px 24px', 
                  borderRadius: 12, border: '1px solid rgba(20, 184, 166, 0.3)', cursor: 'pointer', backdropFilter: 'blur(4px)' 
                }}
              >
                Đánh Giá Thu Gom
              </button>
            </div>
          </div>

          {/* Lịch Sử Giao Dịch */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', borderRadius: 24, padding: 24, border: '1px solid var(--border)', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: 'white' }}>
                <History size={20} color="#60a5fa" /> Lịch sử hoạt động
              </h3>
              {transactions.length > 3 && (
                <button 
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  style={{ 
                    fontSize: 14, fontWeight: 600, color: 'var(--green-400)', display: 'flex', alignItems: 'center', 
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: '6px 14px', 
                    borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
                >
                  {showAllHistory ? 'Thu gọn' : 'Xem tất cả'} 
                  <ChevronRight size={16} style={{ marginLeft: 4, transform: showAllHistory ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {transactions.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 20, background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.04)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <History size={32} color="var(--text-muted)" />
                  </div>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 16, margin: '0 0 8px' }}>Chưa có hoạt động nào</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Bạn chưa thực hiện giao dịch hay quy đổi điểm thưởng nào. Hãy tiếp tục phân loại rác nhé!</p>
                </div>
              ) : (
                (showAllHistory ? transactions : transactions.slice(0, 3)).map((tx) => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>{tx.title}</span>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 8 }}>
                        {tx.weight && <span>{tx.weight} •</span>} 
                        <span>{tx.date}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: tx.type === 'earn' ? '#4ade80' : '#f87171' }}>
                      {tx.points}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: LEADERBOARD BẢNG XẾP HẠNG */}
        <div style={{ flex: '1 1 350px', background: 'var(--bg-card)', backdropFilter: 'blur(12px)', borderRadius: 24, padding: 24, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Trophy size={28} color="#facc15" /> TOP KỴ SĨ XANH
            </h2>
            <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.1)', color: 'white', padding: '4px 12px', borderRadius: 20, fontWeight: 700 }}>Tháng Này</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topUsers.map((user, idx) => {
              const isTop3 = idx < 3;
              let bgStyle = 'rgba(255,255,255,0.03)';
              let borderStyle = '1px solid rgba(255,255,255,0.05)';
              
              if (idx === 0) {
                bgStyle = 'linear-gradient(90deg, rgba(234,179,8,0.1) 0%, rgba(202,138,4,0.05) 100%)';
                borderStyle = '1px solid rgba(234,179,8,0.3)';
              } else if (idx === 1) {
                bgStyle = 'linear-gradient(90deg, rgba(203,213,225,0.1) 0%, rgba(148,163,184,0.05) 100%)';
                borderStyle = '1px solid rgba(203,213,225,0.3)';
              } else if (idx === 2) {
                bgStyle = 'linear-gradient(90deg, rgba(180,83,9,0.1) 0%, rgba(146,64,14,0.05) 100%)';
                borderStyle = '1px solid rgba(180,83,9,0.3)';
              }

              return (
                <div key={user.rank} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, background: bgStyle, border: borderStyle }}>
                  {/* Hạng */}
                  <div style={{ width: 32, display: 'flex', justifyContent: 'center', fontWeight: 900, fontSize: 18 }}>
                    {idx === 0 ? <Medal size={32} color="#facc15" style={{ filter: 'drop-shadow(0 0 5px rgba(250,204,21,0.5))' }} /> :
                     idx === 1 ? <Medal size={28} color="#cbd5e1" /> :
                     idx === 2 ? <Medal size={28} color="#d97706" /> :
                     <span style={{ color: 'var(--text-muted)' }}>{user.rank}</span>}
                  </div>

                  {/* Avatar */}
                  <div style={{ position: 'relative' }}>
                    <img src={user.avatar} alt={user.name} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
                    {idx === 0 && <Flame size={20} color="#f97316" fill="#f97316" style={{ position: 'absolute', bottom: -4, right: -4 }} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontWeight: 700, color: isTop3 ? 'white' : 'var(--text-primary)', fontSize: 16 }}>{user.name}</h4>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--green-400)', fontWeight: 600 }}>{user.points.toLocaleString()} EcoP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tích hợp Modal Feedback vào Trang */}
      {latestTask && (
        <FeedbackModal 
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          onSubmit={async (rating, comment) => {
            try {
              await axios.post(`/api/v1/feedback`, {
                requestId: latestTask.requestId,
                rating: rating,
                comment: comment
              });
              setFeedbackSuccess(true);
              setTimeout(() => setFeedbackSuccess(false), 3000);
            } catch (error) {
              console.error("Lỗi khi gửi đánh giá:", error);
              setErrorMsg("Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại sau.");
            }
          }}
          collectorName={collectorName}
        />
      )}

      {/* Modal Đổi Thưởng */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, width: '100%', maxWidth: 500, padding: 32, position: 'relative', animation: 'slideDown 0.2s ease' }}>
            <button 
              onClick={() => { setIsModalOpen(false); setErrorMsg(''); }} 
              style={{ position: 'absolute', right: 24, top: 24, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            {isRedeeming ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Loader2 size={48} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: '0 0 12px' }}>Đang xử lý đổi quà...</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Vui lòng đợi giây lát, hệ thống đang xử lý và gửi email voucher cho bạn.</p>
              </div>
            ) : redeemSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 80, height: 80, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle2 size={48} color="#10b981" />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: '0 0 12px' }}>Đổi quà thành công!</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Mã Voucher đã được gửi về email của bạn.</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>Đổi phần thưởng 🎁</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px' }}>Chọn gói ưu đãi bạn muốn đổi bằng EcoP.</p>
                
                {errorMsg && (
                  <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.3s ease' }}>
                    <span>⚠️</span> {errorMsg}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                  {[
                    { id: 1, title: 'Voucher Highland Coffee 50k', cost: 500, icon: '☕' },
                    { id: 2, title: 'Thẻ GrabFood 100k', cost: 1000, icon: '🚗' },
                    { id: 3, title: 'Gói nạp điện thoại 20k', cost: 200, icon: '📱' },
                  ].map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => handleRedeem(item.cost, item.title)}
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: 24 }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'white' }}>{item.title}</div>
                        <div style={{ fontSize: 14, color: 'var(--green-400)', marginTop: 4 }}>{item.cost} EcoP</div>
                      </div>
                      <ChevronRight size={20} color="var(--text-muted)" />
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                  Số dư hiện tại: <b style={{ color: 'var(--green-400)' }}>{currentPoints.toLocaleString()} EcoP</b>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
