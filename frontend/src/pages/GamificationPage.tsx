import { useState } from 'react';
import { Trophy, Medal, Star, Flame, History, ChevronRight } from 'lucide-react';
import FeedbackModal from '../components/common/FeedbackModal';

export default function GamificationPage() {
  // Mock dữ liệu tạm thời để thể hiện UI (Giai đoạn 4)
  const currentPoints = 1250;
  
  const topUsers = [
    { rank: 1, name: "Hoàng Đức", points: 4500, avatar: "https://i.pravatar.cc/150?u=1" },
    { rank: 2, name: "Nguyễn Văn A", points: 3200, avatar: "https://i.pravatar.cc/150?u=2" },
    { rank: 3, name: "Trần Thị B", points: 2800, avatar: "https://i.pravatar.cc/150?u=3" },
    { rank: 4, name: "Lê Hoàng C", points: 2100, avatar: "https://i.pravatar.cc/150?u=4" },
    { rank: 5, name: "Phạm Văn D", points: 1950, avatar: "https://i.pravatar.cc/150?u=5" },
  ];

  const transactions = [
    { id: 1, title: "Phân loại Nhựa", weight: "5kg", points: "+50", date: "Vừa xong", type: "earn" },
    { id: 2, title: "Đổi Voucher Giảm Giá", weight: "", points: "-200", date: "Hôm qua", type: "spend" },
    { id: 3, title: "Phân loại Hữu cơ", weight: "12kg", points: "+120", date: "3 ngày trước", type: "earn" },
  ];

  // Trạng thái bật/tắt Modal Feedback Demo
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
        onSubmit={(rating, comment) => {
          console.log("Đã vứt rating lên Server:", rating, comment);
          alert(`Cảm ơn bạn đã đánh giá ${rating} sao!`);
        }}
        collectorName="Anh Lê Bảo Tín - Tài xế 59H1"
      />
    </div>
  );
}
