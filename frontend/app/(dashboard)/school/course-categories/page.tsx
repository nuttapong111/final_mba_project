'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { courseCategoriesApi, type CourseCategory } from '@/lib/api';
import { TagIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function CourseCategoriesPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await courseCategoriesApi.getAll();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลหมวดหมู่ได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEdit = (category: CourseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDelete = async (category: CourseCategory) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบหมวดหมู่ "${category.name}" หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        const response = await courseCategoriesApi.delete(category.id);
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: 'ลบหมวดหมู่เรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false,
          });
          fetchCategories();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: response.error || 'ไม่สามารถลบหมวดหมู่ได้',
          });
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.response?.data?.error || error.message || 'ไม่สามารถลบหมวดหมู่ได้',
        });
      }
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'กรุณากรอกชื่อหมวดหมู่';
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
      let response;

      if (showEditModal && editingCategory) {
        response = await courseCategoriesApi.update(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        });
      } else {
        response = await courseCategoriesApi.create({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        });
      }

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: showEditModal ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ',
          text: showEditModal
            ? 'แก้ไขหมวดหมู่เรียบร้อยแล้ว'
            : 'เพิ่มหมวดหมู่เรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: response.error || 'ไม่สามารถบันทึกข้อมูลได้',
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการหมวดหมู่หลักสูตร</h1>
          <p className="text-gray-600 mt-1">เพิ่ม แก้ไข หรือลบหมวดหมู่หลักสูตร</p>
        </div>
        <Button onClick={handleAdd}>
          <PlusIcon className="h-5 w-5 mr-2 inline" />
          เพิ่มหมวดหมู่
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : (
        <Card>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">ยังไม่มีหมวดหมู่</p>
              <p className="text-gray-400 text-sm">คลิก "เพิ่มหมวดหมู่" เพื่อเพิ่มหมวดหมู่ใหม่</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">ชื่อหมวดหมู่</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">คำอธิบาย</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{category.name}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {category.description || '-'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <PencilIcon className="h-4 w-4 mr-1 inline" />
                            แก้ไข
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category)}
                          >
                            <TrashIcon className="h-4 w-4 mr-1 inline" />
                            ลบ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">เพิ่มหมวดหมู่</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="ชื่อหมวดหมู่"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                placeholder="เช่น คณิตศาสตร์"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="อธิบายเกี่ยวกับหมวดหมู่นี้..."
                />
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
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'กำลังบันทึก...' : 'เพิ่มหมวดหมู่'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">แก้ไขหมวดหมู่</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="ชื่อหมวดหมู่"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="อธิบายเกี่ยวกับหมวดหมู่นี้..."
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1"
                  disabled={submitting}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

