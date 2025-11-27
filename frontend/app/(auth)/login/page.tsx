'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getRoleDashboardPath } from '@/lib/roleConfig';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardPath = getRoleDashboardPath(user.role);
      router.replace(dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      
      // Wait for state to update and localStorage to be set
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const { user: currentUser, isAuthenticated: auth } = useAuthStore.getState();
      
      if (currentUser && auth) {
        const dashboardPath = getRoleDashboardPath(currentUser.role);
        
        // Show success message briefly then redirect
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ!',
          text: `ยินดีต้อนรับ ${currentUser.name}`,
          timer: 1000,
          showConfirmButton: false,
        });
        
        // Redirect after a short delay to ensure state is updated
        setTimeout(() => {
          router.replace(dashboardPath);
        }, 1100);
      } else {
        throw new Error('ไม่สามารถเข้าสู่ระบบได้');
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: error instanceof Error ? error.message : 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      });
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@example.com', password: 'password123', role: 'Super Admin' },
    { email: 'school@example.com', password: 'password123', role: 'School Admin' },
    { email: 'teacher@example.com', password: 'password123', role: 'Teacher' },
    { email: 'student1@example.com', password: 'password123', role: 'Student' },
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">LMS Platform</h1>
            <p className="text-gray-600">เข้าสู่ระบบเพื่อเริ่มใช้งาน</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="อีเมล"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="รหัสผ่าน"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">จดจำฉัน</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                ลืมรหัสผ่าน?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ยังไม่มีบัญชี?{' '}
              <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                สมัครสมาชิก
              </a>
            </p>
          </div>
        </Card>

        <Card className="w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-4">บัญชีทดสอบ</h2>
          <p className="text-sm text-gray-600 mb-6">
            คลิกเพื่อกรอกข้อมูลเข้าสู่ระบบอัตโนมัติ
          </p>
          <div className="space-y-3">
            {demoAccounts.map((account, index) => (
              <button
                key={index}
                onClick={() => fillDemoAccount(account.email, account.password)}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{account.role}</p>
                    <p className="text-sm text-gray-600 mt-1">{account.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">คลิกเพื่อกรอก</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
