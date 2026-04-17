import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ParticlesBackground from '../components/ParticlesBackground';
import AuthBrandSide from '../components/AuthBrandSide';
import GlassCard from '../components/GlassCard';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import Alert from '../components/Alert';

const STEPS = ['email', 'otp', 'newpwd', 'success'];

function calcStrength(pwd) {
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}
const ST_COLORS = ['transparent','#ef4444','#f97316','#eab308','#22c55e'];
const ST_LABELS = ['','Rất yếu','Yếu','Trung bình','Mạnh'];

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp]   = useState(Array(6).fill(''));
  const [pwd, setPwd]   = useState({ new: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [alert, setAlert]   = useState({ msg: '', type: 'error' });
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  // ── Countdown ─────────────────────────────────────────────────
  const startCountdown = () => {
    setCountdown(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current); return 0; } return c - 1; });
    }, 1000);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Step 1: Send OTP ─────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Email không hợp lệ' }); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200)); // simulate
    setStep(1);
    startCountdown();
    setLoading(false);
  };

  // ── OTP input handlers ────────────────────────────────────────
  const handleOtpChange = (i, val) => {
    const clean = val.replace(/\D/, '');
    const next  = [...otp];
    next[i]     = clean;
    setOtp(next);
    if (clean && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next   = [...otp];
    [...pasted].forEach((ch, j) => { next[j] = ch; });
    setOtp(next);
    const lastFilled = Math.min(pasted.length, 5);
    otpRefs.current[lastFilled]?.focus();
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setAlert({ msg: 'Vui lòng nhập đủ 6 chữ số', type: 'error' }); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    if (code === '000000') { setAlert({ msg: 'Mã OTP không đúng. Thử lại.', type: 'error' }); setLoading(false); return; }
    setStep(2);
    setLoading(false);
  };

  // ── Step 3: Reset Password ────────────────────────────────────
  const handleReset = async () => {
    const errs = {};
    if (pwd.new.length < 6) errs.new = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (pwd.new !== pwd.confirm) errs.confirm = 'Mật khẩu không khớp';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setStep(3);
    setLoading(false);
  };

  const strength = calcStrength(pwd.new);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>
      <ParticlesBackground />
      <AuthBrandSide
        title="Bảo mật tài khoản"
        highlight="của bạn"
        subtitle="Mật khẩu mạnh bảo vệ tài khoản và điểm thưởng tích lũy. Chúng tôi sẽ giúp bạn khôi phục an toàn."
        features={[
          { icon: '🔐', label: 'Xác minh danh tính qua email' },
          { icon: '⏱️', label: 'Mã OTP hết hạn sau 10 phút' },
          { icon: '🛡️', label: 'Tất cả token cũ bị vô hiệu hóa ngay lập tức' },
        ]}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, overflowY: 'auto' }}>
        <GlassCard style={{ width: '100%', maxWidth: 440, padding: '44px 40px' }}>

          <Alert message={alert.msg} type={alert.type} onClose={() => setAlert({ msg: '', type: 'error' })} />

          {/* ── STEP 0: Email ── */}
          {step === 0 && (
            <div>
              <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(20,184,166,0.1))', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 24 }}>📧</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Quên mật khẩu?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>Nhập email đăng ký. Chúng tôi sẽ gửi mã OTP để xác minh danh tính.</p>
              <FormInput label="Email đã đăng ký" name="email" type="email" icon="📧" placeholder="email@gmail.com"
                value={email} onChange={e => { setEmail(e.target.value); setErrors({}); }} error={errors.email} />
              <Button onClick={handleSendOtp} loading={loading}>Gửi mã OTP ✉️</Button>
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>← Quay lại đăng nhập</Link>
              </div>
            </div>
          )}

          {/* ── STEP 1: OTP ── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 30, marginBottom: 16 }}>🔢</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Nhập mã OTP</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                Mã 6 chữ số đã được gửi đến <strong style={{ color: 'var(--green-400)' }}>{email}</strong>
              </p>

              {/* OTP inputs */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
                {otp.map((val, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text" maxLength={1} inputMode="numeric"
                    value={val}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    style={{
                      width: 52, height: 58, textAlign: 'center',
                      fontSize: 22, fontWeight: 700, fontFamily: 'inherit',
                      background: 'var(--bg-input)',
                      border: `1px solid ${val ? 'var(--green-500)' : 'var(--border)'}`,
                      borderRadius: 10, color: 'var(--text-primary)', outline: 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>

              {/* Countdown/Resend */}
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                {countdown > 0
                  ? <>Gửi lại sau <strong style={{ color: 'var(--text-secondary)' }}>{countdown}s</strong></>
                  : <button onClick={() => { startCountdown(); setAlert({ msg: '✅ Đã gửi lại mã OTP!', type: 'success' }); }}
                      style={{ background: 'none', border: 'none', color: 'var(--green-400)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 500 }}>
                      Gửi lại mã OTP
                    </button>
                }
              </p>

              <Button onClick={handleVerifyOtp} loading={loading}>Xác nhận mã OTP</Button>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button onClick={() => setStep(0)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>← Đổi email</button>
              </div>
            </div>
          )}

          {/* ── STEP 2: New Password ── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 30, marginBottom: 16 }}>🔑</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Đặt mật khẩu mới</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Mật khẩu mới phải có ít nhất 6 ký tự.</p>

              <FormInput label="Mật khẩu mới *" name="newPassword" type="password" icon="🔒" placeholder="Tối thiểu 6 ký tự"
                value={pwd.new} onChange={e => { setPwd(p => ({ ...p, new: e.target.value })); setErrors(p => ({ ...p, new: '' })); }} error={errors.new} />
              {pwd.new && (
                <div style={{ marginTop: -12, marginBottom: 16 }}>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: ST_COLORS[strength], width: `${strength * 25}%`, transition: 'all 0.3s' }} />
                  </div>
                  <p style={{ fontSize: 11, color: ST_COLORS[strength], marginTop: 4 }}>Độ mạnh: {ST_LABELS[strength]}</p>
                </div>
              )}

              <FormInput label="Xác nhận mật khẩu *" name="confirmPassword" type="password" icon="🔐" placeholder="Nhập lại"
                value={pwd.confirm} onChange={e => { setPwd(p => ({ ...p, confirm: e.target.value })); setErrors(p => ({ ...p, confirm: '' })); }} error={errors.confirm} />

              <Button onClick={handleReset} loading={loading}>Cập nhật mật khẩu 🔐</Button>
            </div>
          )}

          {/* ── STEP 3: Success ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 80, height: 80, background: 'linear-gradient(135deg,#22c55e,#14b8a6)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, margin: '0 auto 24px',
                boxShadow: '0 0 40px rgba(34,197,94,0.4)',
                animation: 'popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
              }}>✅</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Đặt lại thành công!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
                Mật khẩu đã được cập nhật. Tất cả phiên đăng nhập cũ đã bị vô hiệu hóa.
              </p>
              <Link to="/login">
                <Button>Đăng nhập ngay →</Button>
              </Link>
              <style>{`@keyframes popIn { from { transform:scale(0); opacity:0; } to { transform:scale(1); opacity:1; } }`}</style>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
