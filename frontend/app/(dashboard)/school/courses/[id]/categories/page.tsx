'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { questionBanksApi, coursesApi, type QuestionCategory } from '@/lib/api';

export default function CourseCategoriesPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [questionBank, setQuestionBank] = useState<any>(null);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseResponse, questionBankResponse] = await Promise.all([
        coursesApi.getById(courseId),
        questionBanksApi.getByCourse(courseId),
      ]);

      if (courseResponse.success && courseResponse.data) {
        setCourse(courseResponse.data);
      }

      if (questionBankResponse.success && questionBankResponse.data) {
        setQuestionBank(questionBankResponse.data);
        setCategories(
          questionBankResponse.data.categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            questionCount: cat._count?.questions || 0,
            createdAt: cat.createdAt,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({ name: '', description: '' });
  };

  const handleEdit = (category: QuestionCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณากรอกชื่อหมวดหมู่',
      });
      return;
    }

    if (!questionBank) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่พบคลังข้อสอบ',
      });
      return;
    }

    try {
      if (isAdding) {
        const response = await questionBanksApi.createCategory(questionBank.id, {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
        });

        if (response.success && response.data) {
          setCategories([
            ...categories,
            {
              id: response.data.id,
              name: response.data.name,
              description: response.data.description,
              questionCount: 0,
              createdAt: response.data.createdAt,
            },
          ]);
          setIsAdding(false);
          setFormData({ name: '', description: '' });

          await Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ!',
            text: 'เพิ่มหมวดหมู่สำเร็จ',
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: response.error || 'ไม่สามารถเพิ่มหมวดหมู่ได้',
          });
        }
      } else if (editingId) {
        const response = await questionBanksApi.updateCategory(editingId, {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
        });

        if (response.success && response.data) {
          setCategories(
            categories.map((cat) =>
              cat.id === editingId
                ? {
                    ...cat,
                    name: response.data.name,
                    description: response.data.description,
                  }
                : cat
            )
          );
          setEditingId(null);
          setFormData({ name: '', description: '' });

          await Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ!',
            text: 'แก้ไขหมวดหมู่สำเร็จ',
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: response.error || 'ไม่สามารถแก้ไขหมวดหมู่ได้',
          });
        }
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    }
  };

  const handleDelete = async (categoryId: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบหมวดหมู่นี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        const response = await questionBanksApi.deleteCategory(categoryId);

        if (response.success) {
          setCategories(categories.filter((cat) => cat.id !== categoryId));
          await Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ!',
            text: 'หมวดหมู่ถูกลบเรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: response.error || 'ไม่สามารถลบหมวดหมู่ได้',
          });
        }
      } catch (error: any) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.response?.data?.error || error.message || 'ไม่สามารถลบหมวดหมู่ได้',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">หมวดหมู่</h2>
          <p className="text-gray-600 mt-1">{course?.title || 'กำลังโหลด...'}</p>
        </div>
        {!isAdding && (
          <Button onClick={handleAdd}>
            <PlusIcon className="h-5 w-5 mr-2 inline" />
            เพิ่มหมวดหมู่ใหม่
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4">เพิ่มหมวดหมู่ใหม่</h3>
          <div className="space-y-4">
            <Input
              label="ชื่อหมวดหมู่ *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="เช่น พีชคณิต, เรขาคณิต"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="อธิบายเกี่ยวกับหมวดหมู่นี้..."
              />
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                ยกเลิก
              </Button>
              <Button onClick={handleSave} className="flex-1">
                บันทึก
              </Button>
            </div>
          </div>
        </Card>
      )}

      {categories.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <TagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ยังไม่มีหมวดหมู่</p>
            <p className="text-sm text-gray-500 mt-2">
              คลิกปุ่ม "เพิ่มหมวดหมู่ใหม่" เพื่อเพิ่มหมวดหมู่
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id}>
              {editingId === category.id ? (
                <div className="space-y-4">
                  <Input
                    label="ชื่อหมวดหมู่ *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      คำอธิบาย
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={handleCancel} className="flex-1">
                      ยกเลิก
                    </Button>
                    <Button onClick={handleSave} className="flex-1">
                      บันทึก
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <TagIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  )}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      จำนวนข้อสอบ: <span className="font-medium text-gray-900">{category.questionCount} ข้อ</span>
                    </p>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



