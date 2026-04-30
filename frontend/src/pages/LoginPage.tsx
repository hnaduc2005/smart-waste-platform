import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../services/authApi';
import ParticlesBackground from '../components/ParticlesBackground';
import AuthBrandSide from '../components/AuthBrandSide';
import GlassCard from '../components/GlassCard';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

const BRAND_STATS = [
  { value: '12K+', label: 'Người dùng' },
  { value: '98T', label: 'Rác tái chế/tháng' },
  { value: '340+', label: 'Doanh nghiệp' },
];
const BRAND_FEATURES = [
  { icon: '🤖', label: 'Nhận diện rác tự động bằng AI Camera' },
  { icon: '🏆', label: 'Hệ thống tích điểm thưởng Gamification' },
  { icon: '📍', label: 'Theo dõi thu gom realtime trên bản đồ' },
  { icon: '📊', label: 'Dashboard phân tích dữ liệu cho doanh nghiệp' },
];

type ToastType = 'success' | 'error' | 'loading' | '';

interface ToastData {
  type: ToastType;
  msg: string;
}

const TOAST_STYLES = {
  success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.4)', color: '#86efac' },
  error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)', color: '#fca5a5' },
  loading: { bg: 'rgba(234,179,8,0.10)', border: 'rgba(234,179,8,0.4)', color: '#fde68a' },
};

function LoginToast({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  if (!toast.type || !toast.msg) return null;
  const s = TOAST_STYLES[toast.type] || TOAST_STYLES.error;
  const isLoading = toast.type === 'loading';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px', borderRadius: 14, marginBottom: 24,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontSize: 14, fontWeight: 500, lineHeight: 1.5,
      animation: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      boxShadow: `0 4px 20px ${s.border}`,
    }}>
      <span style={{
        fontSize: 20, flexShrink: 0,
        display: 'inline-block',
        animation: isLoading ? 'toastSpin 0.9s linear infinite' : 'none',
      }}>
        {toast.type === 'success' ? '✅' : toast.type === 'loading' ? '⏳' : '❌'}
      </span>
      <span style={{ flex: 1 }}>{toast.msg}</span>
      {!isLoading && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, fontSize: 18, opacity: 0.65, padding: 0, lineHeight: 1, marginLeft: 4 }}
        >✕</button>
      )}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
        @keyframes toastSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastData>({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const clearToast = () => setToast({ type: '', msg: '' });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    clearToast();
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.username.trim()) errs.username = 'Vui lòng nhập username';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearToast();
    if (!validate()) return;

    setLoading(true);
    setToast({ type: 'loading', msg: 'Đang xác thực tài khoản, vui lòng chờ...' });

    try {
      const userData = await login({ username: form.username, password: form.password });
      setToast({ type: 'success', msg: 'Đăng nhập thành công! Đang chuyển hướng...' });
      setTimeout(() => {
        if (userData && userData.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 1200);
    } catch (err: any) {
      const { message, status } = extractError(err);
      if (status === 401) {
        setToast({ type: 'error', msg: '🔐 Sai tên đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại.' });
      } else if (status === 403) {
        setToast({ type: 'error', msg: '🚫 Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.' });
      } else if (!status) {
        setToast({ type: 'error', msg: '🌐 Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.' });
      } else {
        setToast({ type: 'error', msg: message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>
      <ParticlesBackground />

      <AuthBrandSide
        title="Thu gom rác thông minh hơn với"
        highlight="AI & IoT"
        subtitle="Kết nối công dân, người thu gom và doanh nghiệp trong một hệ sinh thái tái chế hiệu quả, minh bạch và có thưởng điểm."
        stats={BRAND_STATS}
        features={BRAND_FEATURES}
      />

      {/* Form side */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, overflowY: 'auto' }}>
        <GlassCard style={{ width: '100%', maxWidth: 440, padding: '44px 40px' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8 }}>
              Chào mừng trở lại 👋
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Chưa có tài khoản?{' '}
              <Link to="/register" style={{ color: 'var(--green-400)', textDecoration: 'none', fontWeight: 500 }}>
                Đăng ký miễn phí
              </Link>
            </p>
          </div>

          {/* Toast notification */}
          <LoginToast toast={toast} onClose={clearToast} />

          <form onSubmit={handleSubmit} noValidate>
            <FormInput
              label="Tên đăng nhập"
              name="username"
              icon="👤"
              placeholder="Nhập username của bạn"
              autoComplete="username"
              value={form.username}
              onChange={set('username')}
              error={errors.username}
            />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Mật khẩu</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--green-400)', textDecoration: 'none', fontWeight: 500 }}>
                  Quên mật khẩu?
                </Link>
              </div>
              <FormInput
                name="password"
                type="password"
                icon="🔒"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                value={form.password}
                onChange={set('password')}
                error={errors.password}
              />
            </div>

            <Button type="submit" loading={loading} style={{ marginTop: 8 }}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            EcoCycle Platform © 2025 · Xây dựng vì môi trường xanh 🌱
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
