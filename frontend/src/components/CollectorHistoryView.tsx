import React, { useState, useEffect } from 'react';
import { collectionApi } from '../services/collectionApi';
import { useAuth } from '../context/AuthContext';

const WASTE_TYPE_MAP: Record<string, { label: string; emoji: string }> = {
  RECYCLABLE:  { label: 'Tái chế (Nhựa, Giấy, Kim loại)', emoji: '♻️' },
  ORGANIC:     { label: 'Hữu cơ (Thức ăn thừa)',           emoji: '🍎' },
  HAZARDOUS:   { label: 'Độc hại (Pin, Hóa chất)',          emoji: '⚠️' },
  BULKY:       { label: 'Cồng kềnh (Tủ, Bàn ghế)',          emoji: '🛋️' },
  ELECTRONIC:  { label: 'Điện tử (E-waste)',                emoji: '💻' },
};

interface HistoryItem {
  taskId: string;
  status: string;
  requestId: string;
  wasteType: string;
  location: string;
  description?: string;
  photoUrl?: string;
  weight?: number;
}

export const CollectorHistoryView = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const collectorId = user?.userId;
    if (!collectorId) { setLoading(false); return; }

    setLoading(true);
    collectionApi.getCollectorHistory(collectorId)
      .then((data: HistoryItem[]) => {
        setHistory(data);
        setError(null);
      })
      .catch(() => setError('Không thể tải lịch sử. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [user?.userId]);

  const totalWeight = history.reduce((sum, item) => sum + (item.weight ?? 0), 0);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Lịch sử thu gom 📋</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>
          Toàn bộ các yêu cầu bạn đã hoàn thành, lấy dữ liệu trực tiếp từ hệ thống.
        </p>
      </div>

      {/* Summary cards */}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            {
              icon: '✅',
              label: 'Tổng đơn hoàn thành',
              value: history.length.toString(),
              color: '#10b981',
              bg: 'rgba(16,185,129,0.1)',
            },
            {
              icon: '⚖️',
              label: 'Tổng khối lượng thu gom',
              value: `${totalWeight.toFixed(1)} kg`,
              color: '#3b82f6',
              bg: 'rgba(59,130,246,0.1)',
            },
            {
              icon: '📸',
              label: 'Có ảnh nghiệm thu',
              value: history.filter(h => h.photoUrl).length.toString(),
              color: '#f59e0b',
              bg: 'rgba(245,158,11,0.1)',
            },
          ].map(card => (
            <div key={card.label} style={{
              background: 'var(--bg-card)', border: `1px solid ${card.color}33`,
              borderRadius: 16, padding: '20px 24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}>
              <div style={{
                width: 44, height: 44, background: card.bg, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 12,
              }}>
                {card.icon}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: card.color, lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content area */}
      {loading ? (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)',
          textAlign: 'center', padding: 60, color: 'var(--text-secondary)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⏳</div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Đang tải lịch sử từ hệ thống...</p>
        </div>
      ) : error ? (
        <div style={{
          background: 'rgba(239,68,68,0.08)', borderRadius: 20,
          border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center', padding: 48,
          color: '#f87171',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>{error}</p>
        </div>
      ) : history.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)',
          textAlign: 'center', padding: 60, color: 'var(--text-secondary)',
        }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>📭</div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Chưa có lịch sử thu gom</p>
          <p style={{ fontSize: 14 }}>Các đơn hàng đã hoàn thành sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {history.map((item) => {
            const waste = WASTE_TYPE_MAP[item.wasteType] ?? { label: item.wasteType, emoji: '🗑️' };
            return (
              <div
                key={item.taskId}
                onClick={() => setSelectedItem(item)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 16, padding: '18px 22px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}
              >
                {/* Left: info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#10b981' }}>
                      Mã đơn: {item.requestId?.substring(0, 8)}
                    </span>
                    <span style={{
                      background: 'rgba(16,185,129,0.15)', color: '#10b981',
                      padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                    }}>
                      ✅ HOÀN THÀNH
                    </span>
                  </div>

                  <div style={{ fontSize: 14, marginBottom: 5 }}>
                    <b>{waste.emoji} Loại rác:</b> {waste.label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    📍 {item.location}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      📝 {item.description}
                    </div>
                  )}
                </div>

                {/* Right: stats + thumbnail */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, marginLeft: 20, flexShrink: 0 }}>
                  {item.weight != null && (
                    <div style={{
                      background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
                      padding: '6px 14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    }}>
                      ⚖️ {item.weight} kg
                    </div>
                  )}
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt="Proof"
                      style={{
                        width: 60, height: 60, objectFit: 'cover',
                        borderRadius: 10, border: '2px solid rgba(16,185,129,0.3)',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 60, height: 60, background: 'rgba(255,255,255,0.04)',
                      borderRadius: 10, border: '1px dashed var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, color: 'var(--text-muted)',
                    }}>
                      📷
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, var(--bg-card) 0%, #0f172a 100%)',
              padding: 40, borderRadius: 28, width: '100%', maxWidth: 520,
              border: '1px solid rgba(16,185,129,0.2)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 64, height: 64, background: 'rgba(16,185,129,0.1)',
                color: '#10b981', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, margin: '0 auto 16px',
              }}>
                ✅
              </div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Chi tiết đơn thu gom</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0', fontSize: 14 }}>
                Mã đơn: {selectedItem.requestId?.substring(0, 8)}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Loại rác', value: `${WASTE_TYPE_MAP[selectedItem.wasteType]?.emoji ?? '🗑️'} ${WASTE_TYPE_MAP[selectedItem.wasteType]?.label ?? selectedItem.wasteType}` },
                { label: 'Địa điểm', value: `📍 ${selectedItem.location}` },
                ...(selectedItem.description ? [{ label: 'Ghi chú', value: `📝 ${selectedItem.description}` }] : []),
                ...(selectedItem.weight != null ? [{ label: 'Khối lượng', value: `⚖️ ${selectedItem.weight} kg` }] : []),
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '12px 16px', background: 'rgba(255,255,255,0.04)',
                  borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', maxWidth: '65%' }}>{row.value}</span>
                </div>
              ))}

              {selectedItem.photoUrl && (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>
                    📸 Ảnh nghiệm thu
                  </div>
                  <img
                    src={selectedItem.photoUrl}
                    alt="Collection proof"
                    style={{
                      width: '100%', height: 200, objectFit: 'cover',
                      borderRadius: 14, border: '2px solid rgba(16,185,129,0.2)',
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              style={{
                width: '100%', marginTop: 24, padding: '14px',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14, color: 'var(--text-secondary)', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
