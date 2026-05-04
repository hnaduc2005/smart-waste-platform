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

// ── Role config ───────────────────────────────────────────────────
const ROLES = [
  { value: 'CITIZEN',    emoji: '🧑‍💼', name: 'Công dân',    desc: 'Đặt yêu cầu thu gom, nhận điểm thưởng, xem lịch sử và bảng xếp hạng.' },
  { value: 'COLLECTOR',  emoji: '🚛', name: 'Thu gom',    desc: 'Nhận danh sách nhiệm vụ theo khu vực, xác nhận bằng ảnh hiện trường.' },
  { value: 'ENTERPRISE', emoji: '🏭', name: 'Doanh nghiệp', desc: 'Quản lý đội ngũ thu gom, điều phối trên bản đồ, báo cáo analytics.' },
];

const STEPS = ['role', 'info', 'security'];
const STEP_TITLES = ['Bạn là ai? 🎭', 'Thông tin cơ bản 📋', 'Bảo mật tài khoản 🔐'];

// ── Password strength ─────────────────────────────────────────────
function calcStrength(pwd: string) {
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}
const STRENGTH_LABELS = ['', 'Rất yếu', 'Yếu', 'Trung bình', 'Mạnh'];
const STRENGTH_COLORS = ['transparent', '#ef4444', '#f97316', '#eab308', '#22c55e'];

export default function RegisterPage() {
  const navigate  = useNavigate();
  const { register } = useAuth();

  const [step, setStep]     = useState(0);   // 0 | 1 | 2
  const [form, setForm]     = useState({ role: 'CITIZEN', username: '', email: '', password: '', confirm: '', agree: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert]   = useState<{ msg: string; type: string }>({ msg: '', type: 'error' });
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [field]: val }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const pwdStrength = calcStrength(form.password);

  // ── Validate & advance steps ──────────────────────────────────
  const goNext = () => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (form.username.length < 3) errs.username = 'Username phải có ít nhất 3 ký tự';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ';
    }
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(s => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.password.length < 6) errs.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (form.password !== form.confirm) errs.confirm = 'Mật khẩu xác nhận không khớp';
    if (!form.agree) errs.agree = 'Vui lòng đồng ý với điều khoản sử dụng';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await register({ username: form.username, email: form.email, password: form.password, role: form.role });
      setAlert({ msg: `🎉 Chào mừng ${form.username}! Đang chuyển hướng...`, type: 'success' });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      const { message, details } = extractError(err) as { message: string; details?: Record<string, string> };
      setAlert({ msg: message, type: 'error' });
      if (details?.username || details?.email) setStep(1);
      const fieldErrs: Record<string, string> = {};
      if (details?.username) fieldErrs.username = details.username;
      if (details?.email)    fieldErrs.email    = details.email;
      if (details?.password) fieldErrs.password  = details.password;
      setErrors(fieldErrs);
    } finally {
      setLoading(false);
    }
  };

  // ── Step indicator ────────────────────────────────────────────
  const StepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {STEPS.map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
            background: i < step ? '#16a34a' : i === step ? 'linear-gradient(135deg,#22c55e,#14b8a6)' : 'var(--border)',
            color: i <= step ? '#fff' : 'var(--text-muted)',
            boxShadow: i === step ? '0 0 12px rgba(34,197,94,0.4)' : 'none',
            transition: 'all 0.3s',
          }}>
            {i < step ? '✓' : i + 1}
          </div>
          <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: i === step ? 'var(--green-400)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {['Vai trò', 'Thông tin', 'Bảo mật'][i]}
          </span>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 10px', minWidth: 20 }} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="auth-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>
      <ParticlesBackground />

      <AuthBrandSide
        title="Tham gia cùng"
        highlight="12,000+"
        subtitle="Dù bạn là công dân, người thu gom hay doanh nghiệp — EcoCycle có vai trò phù hợp giúp bạn đóng góp cho môi trường."
        features={ROLES.map(r => ({ icon: r.emoji, title: r.name, label: r.desc }))}
      />

      <div className="auth-form-side" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, overflowY: 'auto' }}>
        <GlassCard style={{ width: '100%', maxWidth: 480, padding: '40px 40px' }}>
          <StepIndicator />

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
              {STEP_TITLES[step]}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {step === 0 && 'Chọn vai trò để cá nhân hóa trải nghiệm'}
              {step === 1 && 'Thông tin dùng để đăng nhập vào hệ thống'}
              {step === 2 && 'Thiết lập mật khẩu để bảo vệ tài khoản'}
            </p>
          </div>

          <Alert message={alert.msg} type={alert.type} onClose={() => setAlert({ msg: '', type: 'error' })} />

          {/* ── STEP 0: Role ── */}
          {step === 0 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {ROLES.map(r => (
                  <label key={r.value} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '16px 10px', cursor: 'pointer', textAlign: 'center',
                    background: form.role === r.value ? 'rgba(34,197,94,0.1)' : 'var(--bg-input)',
                    border: `1px solid ${form.role === r.value ? 'var(--green-500)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: form.role === r.value ? '0 0 0 1px rgba(34,197,94,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="role" value={r.value} hidden checked={form.role === r.value} onChange={set('role')} />
                    <span style={{ fontSize: 24 }}>{r.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: form.role === r.value ? 'var(--green-400)' : 'var(--text-secondary)' }}>
                      {r.name}
                    </span>
                  </label>
                ))}
              </div>
              {/* Role description */}
              <div style={{
                padding: '12px 16px', background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10,
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20,
              }}>
                {ROLES.find(r => r.value === form.role)?.emoji}{' '}
                <strong style={{ color: 'var(--green-400)' }}>{ROLES.find(r => r.value === form.role)?.name}</strong>:{' '}
                {ROLES.find(r => r.value === form.role)?.desc}
              </div>
              <Button onClick={() => setStep(1)}>Tiếp theo →</Button>
            </div>
          )}

          {/* ── STEP 1: Info ── */}
          {step === 1 && (
            <div>
              <div className="register-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormInput label="Tên đăng nhập *" name="username" icon="👤" placeholder="min. 3 ký tự" autoComplete="username"
                  value={form.username} onChange={set('username')} error={errors.username} />
                <FormInput label="Email *" name="email" type="email" icon="📧" placeholder="email@gmail.com" autoComplete="email"
                  value={form.email} onChange={set('email')} error={errors.email} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button variant="secondary" fullWidth onClick={() => setStep(0)} style={{ flex: '0 0 auto', width: 'auto', padding: '14px 20px' }}>
                  ← Quay lại
                </Button>
                <Button onClick={goNext}>Tiếp theo →</Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Password ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} noValidate>
              <FormInput label="Mật khẩu *" name="password" type="password" icon="🔒" placeholder="Tối thiểu 6 ký tự"
                value={form.password} onChange={set('password')} error={errors.password} />

              {/* Strength bar */}
              {form.password && (
                <div style={{ marginTop: -12, marginBottom: 16 }}>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: STRENGTH_COLORS[pwdStrength], width: `${pwdStrength * 25}%`, transition: 'all 0.3s' }} />
                  </div>
                  <p style={{ fontSize: 11, color: STRENGTH_COLORS[pwdStrength], marginTop: 4 }}>
                    Độ mạnh: {STRENGTH_LABELS[pwdStrength]}
                  </p>
                </div>
              )}

              <FormInput label="Xác nhận mật khẩu *" name="confirmPassword" type="password" icon="🔐" placeholder="Nhập lại mật khẩu"
                value={form.confirm} onChange={set('confirm')} error={errors.confirm} />

              {/* Terms */}
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.agree} onChange={set('agree')} style={{ marginTop: 3, accentColor: 'var(--green-500)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Tôi đồng ý với{' '}
                  <a href="#" style={{ color: 'var(--green-400)', textDecoration: 'none' }}>Điều khoản sử dụng</a> và{' '}
                  <a href="#" style={{ color: 'var(--green-400)', textDecoration: 'none' }}>Chính sách bảo mật</a>
                </span>
              </label>
              {errors.agree && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 12, marginTop: -12 }}>{errors.agree}</p>}

              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="button" variant="secondary" fullWidth onClick={() => setStep(1)} style={{ flex: '0 0 auto', width: 'auto', padding: '14px 20px' }}>
                  ← Quay lại
                </Button>
                <Button type="submit" loading={loading}>Tạo tài khoản 🚀</Button>
              </div>
            </form>
          )}

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: 'var(--green-400)', textDecoration: 'none', fontWeight: 500 }}>
              Đăng nhập ngay
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
