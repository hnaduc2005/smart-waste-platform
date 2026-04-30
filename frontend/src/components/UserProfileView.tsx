import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/userApi';
import { enterpriseApi } from '../services/enterpriseApi';
import GlassCard from './GlassCard';
import FormInput from './FormInput';
import Button from './Button';
import Alert from './Alert';

const renderHighlightedText = (text: string, query: string) => {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, index) => 
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={index} className="font-bold text-green-400">{part}</span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
};

export function UserProfileView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    vehiclePlate: '',
    companyName: '', // For Enterprise: their own name. For Collector: the name of the Enterprise they work for.
    email: ''
  });

  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [showEnterpriseSearch, setShowEnterpriseSearch] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (user?.userId) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userApi.getProfile(user!.userId);
      setProfile(data);
      
      let email = '';
      try {
        const authData = await userApi.getUser(user!.userId); // userApi.getUser mapped to `/users/{id}` in user-service? Wait.
        // Wait, userApi.getUser goes to user-service. We need to call auth-service to get email!
        // Let's use axios directly or add a new method. But we can just use `api.get` from axios.
      } catch(e) {}
      
      setFormData({
        fullName: data.fullName || '',
        address: data.address || '',
        vehiclePlate: data.vehiclePlate || '',
        companyName: data.companyName || '',
        email: '' // will be fetched right after
      });
      
      // Fetch email from auth-service
      try {
         const authRes = await fetch(`/api/v1/auth/users/${user!.userId}`);
         if (authRes.ok) {
           const authJson = await authRes.json();
           setFormData(prev => ({ ...prev, email: authJson.email || '' }));
         }
      } catch (e) {}

      // If user is a Collector, fetch the list of available enterprises to choose from
      if (data.role === 'COLLECTOR') {
        try {
          const entList = await userApi.getEnterprises();
          // Map companyName from user_db to 'name' for the UI component
          const formatted = entList.map((e: any) => ({
            ...e,
            name: e.companyName || e.fullName || 'Doanh Nghiệp (Chưa cập nhật tên)'
          })).filter((e: any) => e.name);
          setEnterprises(formatted);
        } catch (e) {
          console.error('Không thể tải danh sách doanh nghiệp', e);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updates: any = {};
      if (profile?.role === 'CITIZEN') {
        updates.fullName = formData.fullName;
        updates.address = formData.address;
      } else if (profile?.role === 'COLLECTOR') {
        updates.fullName = formData.fullName;
        updates.vehiclePlate = formData.vehiclePlate;
        updates.companyName = formData.companyName; // Associate collector with this enterprise
      } else if (profile?.role === 'ENTERPRISE') {
        updates.companyName = formData.companyName;
        try {
          const ent = await enterpriseApi.getMyEnterprise(user!.userId);
          if (ent && ent.id) {
            await enterpriseApi.updateEnterprise(ent.id, { name: formData.companyName });
          }
        } catch(e) { /* might not exist yet */ }
      }
      
      const updated = await userApi.updateProfile(user!.userId, updates);
      
      if (formData.email) {
        await userApi.updateAuthEmail(user!.userId, formData.email);
      }

      setProfile(updated);
      setSuccess('Cập nhật thông tin thành công!');
    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">Hồ Sơ Cá Nhân</h2>
      </div>

      <GlassCard className="p-6 md:p-8">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile?.role === 'ENTERPRISE' ? (
              <div className="flex flex-col">
                <FormInput
                  label="Tên Doanh Nghiệp"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Nhập tên doanh nghiệp"
                  disabled={true}
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
                <span className="text-xs text-yellow-500 mt-1">
                  * Tên doanh nghiệp chỉ có thể được thay đổi trong mục Năng Lực của Quản lý Doanh Nghiệp.
                </span>
              </div>
            ) : (
              <FormInput
                label="Họ và Tên"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
              />
            )}

            {profile?.role === 'CITIZEN' && (
              <FormInput
                label="Địa Chỉ"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ của bạn"
              />
            )}

            {profile?.role === 'COLLECTOR' && (
              <FormInput
                label="Biển Số Xe"
                name="vehiclePlate"
                value={formData.vehiclePlate}
                onChange={handleChange}
                placeholder="Nhập biển số xe (VD: 29A-12345)"
              />
            )}

            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập địa chỉ email của bạn"
            />
          </div>

          {/* Enterprise Search — outside grid so dropdown floats freely */}
          {profile?.role === 'COLLECTOR' && (
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Doanh Nghiệp Trực Thuộc
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 16, pointerEvents: 'none', color: 'var(--text-muted)'
                }}>🏢</span>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={(e) => {
                    handleChange(e);
                    setShowEnterpriseSearch(true);
                    setSelectedIndex(-1);
                  }}
                  onFocus={() => setShowEnterpriseSearch(true)}
                  onBlur={() => setTimeout(() => {
                    setShowEnterpriseSearch(false);
                    setSelectedIndex(-1);
                  }, 200)}
                  onKeyDown={(e) => {
                    const query = (formData.companyName || '').trim().toLowerCase();
                    const filtered = query
                      ? enterprises.filter(ent => ent.name.toLowerCase().includes(query))
                      : enterprises;
                    const sorted = [...filtered].sort((a, b) => {
                      if (!query) return a.name.localeCompare(b.name);
                      const nameA = a.name.toLowerCase();
                      const nameB = b.name.toLowerCase();
                      if (nameA === query) return -1;
                      if (nameB === query) return 1;
                      const startA = nameA.startsWith(query);
                      const startB = nameB.startsWith(query);
                      if (startA && !startB) return -1;
                      if (!startA && startB) return 1;
                      return nameA.localeCompare(nameB);
                    });
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, sorted.length - 1)); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, -1)); }
                    else if (e.key === 'Enter') {
                      e.preventDefault();
                      if (selectedIndex >= 0 && selectedIndex < sorted.length) {
                        setFormData({ ...formData, companyName: sorted[selectedIndex].name });
                        setShowEnterpriseSearch(false);
                      }
                    } else if (e.key === 'Escape') { setShowEnterpriseSearch(false); }
                  }}
                  placeholder="Gõ tên doanh nghiệp để tìm kiếm..."
                  autoComplete="off"
                  style={{
                    width: '100%', background: showEnterpriseSearch ? '#161e1a' : 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderTopLeftRadius: 'var(--radius-sm)',
                    borderTopRightRadius: 'var(--radius-sm)',
                    borderBottomLeftRadius: showEnterpriseSearch ? 0 : 'var(--radius-sm)',
                    borderBottomRightRadius: showEnterpriseSearch ? 0 : 'var(--radius-sm)',
                    padding: '13px 42px 13px 42px',
                    fontSize: 14, fontFamily: 'inherit', color: 'var(--text-primary)', outline: 'none',
                    transition: 'background 150ms'
                  }}
                />
                {formData.companyName && (
                  <button
                    type="button"
                    onClick={() => { setFormData({ ...formData, companyName: '' }); setShowEnterpriseSearch(true); setSelectedIndex(-1); }}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0 }}
                  >✕</button>
                )}
              </div>

              {/* Dropdown — absolute, floats over button below */}
              {showEnterpriseSearch && (
                <div style={{
                  position: 'absolute', zIndex: 9999, left: 0, right: 0, top: '100%', marginTop: -1,
                  background: '#161e1a', border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderBottomLeftRadius: 'var(--radius-sm)',
                  borderBottomRightRadius: 'var(--radius-sm)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}>
                  {enterprises.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>
                      ⏳ Đang tải danh sách doanh nghiệp...
                    </div>
                  ) : (() => {
                    const query = (formData.companyName || '').trim().toLowerCase();
                    const filtered = query
                      ? enterprises.filter(ent => ent.name.toLowerCase().includes(query))
                      : enterprises;
                    const sorted = [...filtered].sort((a, b) => {
                      if (!query) return a.name.localeCompare(b.name);
                      const nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
                      if (nameA === query) return -1;
                      if (nameB === query) return 1;
                      if (nameA.startsWith(query) && !nameB.startsWith(query)) return -1;
                      if (!nameA.startsWith(query) && nameB.startsWith(query)) return 1;
                      return nameA.localeCompare(nameB);
                    });
                    if (sorted.length === 0) return (
                      <div style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>
                        Không tìm thấy doanh nghiệp nào phù hợp.
                      </div>
                    );
                    return (
                      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {sorted.map((ent, idx) => (
                          <div
                            key={ent.id}
                            style={{
                              padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                              transition: 'background-color 120ms',
                              backgroundColor: idx === selectedIndex ? 'rgba(255,255,255,0.07)' : 'transparent',
                              color: 'var(--text-primary)', fontSize: 14,
                              borderBottom: idx < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                            }}
                            onMouseDown={(e) => { e.preventDefault(); setFormData({ ...formData, companyName: ent.name }); setShowEnterpriseSearch(false); }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>🔍</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {renderHighlightedText(ent.name, formData.companyName)}
                              {ent.serviceArea && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>- {ent.serviceArea}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" loading={saving}>
              Lưu Thay Đổi
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
