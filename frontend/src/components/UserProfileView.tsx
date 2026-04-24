import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/userApi';
import GlassCard from './GlassCard';
import FormInput from './FormInput';
import Button from './Button';
import Alert from './Alert';

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
    companyName: ''
  });

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
      setFormData({
        fullName: data.fullName || '',
        address: data.address || '',
        vehiclePlate: data.vehiclePlate || '',
        companyName: data.companyName || ''
      });
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
      } else if (profile?.role === 'ENTERPRISE') {
        updates.companyName = formData.companyName;
      }
      
      const updated = await userApi.updateProfile(user!.userId, updates);
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
              <FormInput
                label="Tên Doanh Nghiệp"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Nhập tên doanh nghiệp"
              />
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
          </div>

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
