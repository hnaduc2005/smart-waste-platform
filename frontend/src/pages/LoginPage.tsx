import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../services/authApi';
import ParticlesBackground from '../components/ParticlesBackground';
import AuthBrandSide from '../components/AuthBrandSide';
import GlassCard from '../components/GlassCard';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import Alert from '../components/Alert';

const BRAND_STATS = [
  { value: '12K+', label: 'Người dùng' },
  { value: '98T',  label: 'Rác tái chế/tháng' },
  { value: '340+', label: 'Doanh nghiệp' },
];
const BRAND_FEATURES = [
  { icon: '🤖', label: 'Nhận diện rác tự động bằng AI Camera' },
  { icon: '🏆', label: 'Hệ thống tích điểm thưởng Gamification' },
  { icon: '📍', label: 'Theo dõi thu gom realtime trên bản đồ' },
  { icon: '📊', label: 'Dashboard phân tích dữ liệu cho doanh nghiệp' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]     = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [alert, setAlert]   = useState({ msg: '', type: 'error' });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Vui lòng nhập username';
    if (!form.password)        errs.password = 'Vui lòng nhập mật khẩu';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ msg: '', type: 'error' });
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ username: form.username, password: form.password });
      setAlert({ msg: '✅ Đăng nhập thành công! Đang chuyển hướng...', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      const { message, status } = extractError(err);
      if (status === 401) setAlert({ msg: 'Sai username hoặc mật khẩu. Vui lòng thử lại.', type: 'error' });
      else if (status === 403) setAlert({ msg: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.', type: 'error' });
      else setAlert({ msg: message, type: 'error' });
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

          <Alert message={alert.msg} type={alert.type} onClose={() => setAlert({ msg: '', type: 'error' })} />

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
              Đăng nhập
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
