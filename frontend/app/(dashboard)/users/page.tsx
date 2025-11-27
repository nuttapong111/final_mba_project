'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { usersApi } from '@/lib/api';
import { getRoleLabel, filterUsersByRole, normalizeRole } from '@/lib/utils';
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  schoolId?: string;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBulkImport = () => {
    router.push('/users/import');
  };

  const handleAddUser = () => {
    setShowAddModal(true);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'STUDENT',
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'กรุณากรอกชื่อ';
    }

    if (!formData.email.trim()) {
      errors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!formData.password) {
      errors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (formData.password.length < 6) {
      errors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (!formData.role) {
      errors.role = 'กรุณาเลือกบทบาท';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await usersApi.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        schoolId: currentUser?.schoolId,
      });

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: 'เพิ่มผู้ใช้ใหม่เรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
        setShowAddModal(false);
        fetchUsers();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: response.error || 'ไม่สามารถเพิ่มผู้ใช้ได้',
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message || 'ไม่สามารถเพิ่มผู้ใช้ได้',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableRoles = () => {
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'SUPER_ADMIN') {
      return [
        { value: 'SCHOOL_ADMIN', label: 'แอดมินโรงเรียน' },
        { value: 'TEACHER', label: 'ครูผู้สอน' },
        { value: 'STUDENT', label: 'นักเรียน' },
      ];
    } else if (currentUser?.role === 'school_admin' || currentUser?.role === 'SCHOOL_ADMIN') {
      return [
        { value: 'TEACHER', label: 'ครูผู้สอน' },
        { value: 'STUDENT', label: 'นักเรียน' },
      ];
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
          <p className="text-gray-600 mt-1">จัดการผู้ใช้งานทั้งหมดในระบบ</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleBulkImport}>
            <UserPlusIcon className="h-5 w-5 mr-2 inline" />
            Bulk Import
          </Button>
          <Button onClick={handleAddUser}>
            <PlusIcon className="h-5 w-5 mr-2 inline" />
            เพิ่มผู้ใช้ใหม่
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาผู้ใช้..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </Card>

      {/* Users List */}
      <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">ผู้ใช้</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">อีเมล</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">บทบาท</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">สถานะ</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <UsersIcon className="h-10 w-10 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {getRoleLabel(normalizeRole(user.role))}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          ใช้งาน
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            แก้ไข
                          </Button>
                          <Button variant="ghost" size="sm">
                            ลบ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">ไม่พบผู้ใช้ที่ค้นหา</p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">เพิ่มผู้ใช้ใหม่</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="ชื่อ"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                required
              />

              <Input
                label="อีเมล"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={formErrors.email}
                required
              />

              <Input
                label="รหัสผ่าน"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={formErrors.password}
                required
              />

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  บทบาท
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    formErrors.role ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">-- เลือกบทบาท --</option>
                  {getAvailableRoles().map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {formErrors.role && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                  disabled={submitting}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'กำลังเพิ่ม...' : 'เพิ่มผู้ใช้'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

