import { useState, forwardRef } from 'react';

const inputBase = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '13px 14px 13px 42px',
  fontSize: 14,
  fontFamily: 'inherit',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
};

/** Controlled form input with icon, error state & optional password toggle */
const FormInput = forwardRef(function FormInput(
  { label, name, type = 'text', icon, placeholder, error, value, onChange, autoComplete, style = {} },
  ref
) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword && showPwd ? 'text' : type;

  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {/* Leading icon */}
        {icon && (
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, pointerEvents: 'none',
            color: focused ? 'var(--green-400)' : 'var(--text-muted)',
            transition: 'color 150ms',
          }}>{icon}</span>
        )}

        <input
          ref={ref}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...inputBase,
            paddingLeft: icon ? 42 : 14,
            paddingRight: isPassword ? 42 : 14,
            ...(error ? {
              borderColor: '#ef4444',
              boxShadow: '0 0 0 3px rgba(239,68,68,0.12)',
            } : focused ? {
              borderColor: 'var(--green-500)',
              background: 'rgba(34,197,94,0.04)',
              boxShadow: '0 0 0 3px rgba(34,197,94,0.12)',
            } : {}),
            ...style,
          }}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, padding: 0,
              transition: 'color 150ms',
            }}
          >
            {showPwd ? '🙈' : '👁️'}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{error}</p>
      )}
    </div>
  );
});

export default FormInput;
