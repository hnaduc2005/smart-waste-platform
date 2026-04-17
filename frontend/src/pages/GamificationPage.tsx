import { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Flame, History, ChevronRight } from 'lucide-react';
import FeedbackModal from '../components/common/FeedbackModal';
import axios from 'axios';

interface LeaderboardUser {
  citizenId?: number;
  citizenName?: string;
  totalPoints?: number;
}

interface TopUser {
  rank: number;
  name: string;
  points: number;
  avatar: string;
}

interface TransactionHistory {
  id?: number;
  reason?: string;
  amount: number;
  createdAt: string;
}

interface Transaction {
  id: number;
  title: string;
  weight: string;
  points: string;
  date: string;
  type: 'earn' | 'spend';
}

export default function GamificationPage() {
  const [currentPoints, setCurrentPoints] = useState<number>(0);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);

  useEffect(() => {
    // 1. Lấy dữ liệu Bảng Xếp Hạng (Leaderboard) thực tế từ Backend
    axios.get('http://localhost:8084/api/v1/rewards/leaderboard')
      .then(res => {
        const leaderData: TopUser[] = res.data.map((user: LeaderboardUser, idx: number) => ({
          rank: idx + 1,
          name: user.citizenName || 'Người chơi ẩn danh',
          points: user.totalPoints || 0,
          // Avatar sinh tự động ngẫu nhiên dựa trên citizenId
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${user.citizenId || idx}`
        }));
        setTopUsers(leaderData);
      })
      .catch((err: unknown) => {
        console.error("Lỗi lấy Leaderboard:", err);
        // Fallback UI nếu server sập
        setTopUsers([
          { rank: 1, name: "Hoàng Đức (Mẫu)", points: 4500, avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=1" },
          { rank: 2, name: "Nguyễn Văn A", points: 3000, avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=2" }
        ]);
      });

    // 2. Lấy dữ liệu Lịch sử Điểm số (History)
    const userId = localStorage.getItem('userId');
    
    // Nếu có đăng nhập User ID thật sự thì lấy API
    if (userId) {
      axios.get(`http://localhost:8084/api/v1/rewards/${userId}/history`)
        .then(res => {
          const txData: Transaction[] = res.data.map((item: TransactionHistory, idx: number) => ({
            id: item.id || idx,
            title: item.reason || (item.amount > 0 ? "Nhận thưởng thu gom" : "Quy đổi điểm"),
            weight: "", 
            points: item.amount > 0 ? `+${item.amount}` : `${item.amount}`,
            date: new Date(item.createdAt).toLocaleDateString('vi-VN'),
            type: item.amount > 0 ? 'earn' : 'spend'
          }));
          setTransactions(txData);

          // Tính tổng số điểm hiện có của User (cho UI chính)
          const total = res.data.reduce((acc: number, curr: TransactionHistory) => acc + curr.amount, 0);
          setCurrentPoints(total);
        })
        .catch((err: unknown) => console.error("Lỗi lấy History:", err));
    } else {
      // Mock Demo Data nếu người dùng chưa mảng userId trong Storage
      setCurrentPoints(1250);
      setTransactions([
        { id: 1, title: "Phân loại Nhựa", weight: "5kg", points: "+50", date: "Vừa xong", type: "earn" },
        { id: 2, title: "Đổi Voucher Gojek", weight: "", points: "-200", date: "Hôm qua", type: "spend" },
        { id: 3, title: "Phân loại Hữu cơ", weight: "12kg", points: "+120", date: "3 ngày trước", type: "earn" },
      ]);
    }
  }, []);

  return (
    <div className="w-full relative z-10 flex flex-col md:flex-row gap-6 p-4 pt-10">
      
      {/* CỘT TRÁI: ĐIỂM SỐ & LỊCH SỬ GIAO DỊCH */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Card Điểm Số */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-900 rounded-3xl p-8 shadow-[0_8px_30px_rgb(16,185,129,0.2)] border border-emerald-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-emerald-400 opacity-20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <h2 className="text-emerald-100 font-medium tracking-wide flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            ĐIỂM TÍCH LŨY CỦA BẠN
          </h2>
          
          <div className="mt-4 flex items-end gap-3">
            <span className="text-6xl font-black text-white tracking-tighter drop-shadow-md">
              {currentPoints.toLocaleString()}
            </span>
            <span className="text-xl text-emerald-200 mb-2 font-medium">EcoP</span>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button className="bg-white text-emerald-800 font-bold py-2.5 px-6 rounded-xl shadow-lg hover:bg-emerald-50 transition-colors">
              Đổi Thưởng
            </button>
            {/* Nút giả lập hiện Feedback */}
            <button 
              onClick={() => setIsFeedbackOpen(true)}
              className="bg-teal-800/50 text-white font-medium py-2.5 px-6 rounded-xl border border-teal-500/30 hover:bg-teal-700/50 transition-colors backdrop-blur-sm"
            >
              Demo Đánh Giá Thu Gom
            </button>
          </div>
        </div>

        {/* Lịch Sử Giao Dịch */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-xl flex-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <History className="w-5 h-5 text-blue-400" /> Lịch sử hoạt động
            </h3>
            <button className="text-sm font-medium text-slate-400 flex items-center hover:text-emerald-400 transition-colors">
              Xem tất cả <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors">
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-base">{tx.title}</span>
                  <div className="text-sm text-slate-400 mt-1 flex gap-2">
                    {tx.weight && <span>{tx.weight} •</span>} 
                    <span>{tx.date}</span>
                  </div>
                </div>
                <div className={`text-xl font-bold ${tx.type === 'earn' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* CỘT PHẢI: LEADERBOARD BẢNG XẾP HẠNG */}
      <div className="w-full md:w-[400px] bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-xl flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-400" /> TOP KỴ SĨ XANH
          </h2>
          <span className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full font-bold">Tháng Mày</span>
        </div>

        <div className="flex flex-col gap-3">
          {topUsers.map((user, idx) => {
            const isTop3 = idx < 3;
            return (
              <div 
                key={user.rank} 
                className={`flex items-center gap-4 p-4 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                  idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/50' :
                  idx === 1 ? 'bg-gradient-to-r from-slate-300/20 to-slate-400/10 border border-slate-300/50' :
                  idx === 2 ? 'bg-gradient-to-r from-amber-700/20 to-amber-800/10 border border-amber-700/50' :
                  'bg-slate-800 border border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Hạng */}
                <div className="w-8 flex justify-center font-black text-lg">
                  {idx === 0 ? <Medal className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" /> :
                   idx === 1 ? <Medal className="w-7 h-7 text-slate-300" /> :
                   idx === 2 ? <Medal className="w-7 h-7 text-amber-600" /> :
                   <span className="text-slate-500">{user.rank}</span>}
                </div>

                {/* Avatar */}
                <div className="relative">
                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-slate-700 object-cover" />
                  {idx === 0 && <Flame className="w-5 h-5 text-orange-500 absolute -bottom-1 -right-1 fill-orange-500 animate-bounce" />}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h4 className={`font-bold ${isTop3 ? 'text-white' : 'text-slate-300'}`}>{user.name}</h4>
                  <p className="text-sm text-emerald-400 font-medium">{user.points.toLocaleString()} EcoP</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tích hợp Modal Feedback vào Trang */}
      <FeedbackModal 
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={async (rating, comment) => {
          try {
            await axios.post('http://localhost:8085/api/v1/feedback', {
              requestId: "11111111-2222-3333-4444-555555555555", // Mock ID cho Demo
              rating: rating,
              comment: comment
            });
            console.log("Đã gửi rating lên Server thành công:", rating, comment);
          } catch (error) {
            console.error("Lỗi khi gửi đánh giá:", error);
            // Vẫn cho phép hoàn thành UI UX kể cả khi văng lỗi nếu đang build offline
          }
        }}
        collectorName="Anh Lê Bảo Tín (59H1)"
      />
    </div>
  );
}
