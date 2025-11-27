'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { usersApi, courseCategoriesApi, coursesApi, type CourseCategory } from '@/lib/api';
import { normalizeRole } from '@/lib/utils';

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
}

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    categoryId: '',
    level: 'beginner',
    courseType: 'video' as 'video' | 'live',
    livePlatform: '' as 'zoom' | 'google_meet' | '',
    instructorId: '',
    startDate: '',
    endDate: '',
    duration: '',
    price: '',
    status: 'draft',
  });

  useEffect(() => {
    fetchCourse();
    fetchTeachers();
    fetchCategories();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await coursesApi.getById(courseId);
      if (response.success && response.data) {
        const course = response.data;
        setFormData({
          title: course.title || '',
          description: course.description || '',
          category: course.category || '',
          categoryId: (course as any).categoryId || '',
          level: course.level?.toLowerCase() || 'beginner',
          courseType: (course.courseType?.toLowerCase() || 'video') as 'video' | 'live',
          livePlatform: (course as any).livePlatform?.toLowerCase() || '',
          instructorId: course.instructor?.id || '',
          startDate: (course as any).startDate ? new Date((course as any).startDate).toISOString().split('T')[0] : '',
          endDate: (course as any).endDate ? new Date((course as any).endDate).toISOString().split('T')[0] : '',
          duration: String((course as any).duration || 0),
          price: String(course.price || 0),
          status: course.status?.toLowerCase() || 'draft',
        });
        if (course.thumbnail) {
          setThumbnailPreview(course.thumbnail);
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลหลักสูตรได้',
      });
      router.push('/school/courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await usersApi.getAll();
      if (response.success && response.data) {
        const allTeachers = response.data.filter(
          (user) => normalizeRole(user.role) === 'teacher'
        );
        
        // Filter by schoolId if school admin
        const filteredTeachers =
          currentUser && normalizeRole(currentUser.role) === 'school_admin'
            ? allTeachers.filter((teacher) => teacher.schoolId === currentUser.schoolId)
            : allTeachers;
        
        setTeachers(filteredTeachers);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await courseCategoriesApi.getAll();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ไม่ถูกต้อง',
        text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ใหญ่เกินไป',
        text: 'กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5 MB',
      });
      return;
    }

    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.instructorId) {
      await Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน',
      });
      return;
    }

    try {
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      
      const courseData = {
        title: formData.title,
        description: formData.description,
        category: selectedCategory?.name || formData.category,
        categoryId: formData.categoryId || undefined,
        level: formData.level,
        courseType: formData.courseType,
        livePlatform: formData.courseType === 'live' ? formData.livePlatform : undefined,
        instructorId: formData.instructorId,
        duration: parseInt(formData.duration) || 0,
        price: parseFloat(formData.price) || 0,
        status: formData.status,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        thumbnail: thumbnailPreview || undefined,
      };

      const response = await coursesApi.update(courseId, courseData);

      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'แก้ไขหลักสูตรสำเร็จ!',
          text: 'หลักสูตรถูกแก้ไขเรียบร้อยแล้ว',
          timer: 2000,
          showConfirmButton: false,
        });
        
        router.push('/school/courses');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: response.error || 'ไม่สามารถแก้ไขหลักสูตรได้',
        });
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message || 'ไม่สามารถแก้ไขหลักสูตรได้',
      });
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
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">แก้ไขหลักสูตร</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">ข้อมูลพื้นฐาน</h2>
          <div className="space-y-4">
            <Input
              label="ชื่อหลักสูตร *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบายหลักสูตร *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมวดหมู่ *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => {
                    const selected = categories.find(cat => cat.id === e.target.value);
                    setFormData({
                      ...formData,
                      categoryId: e.target.value,
                      category: selected?.name || '',
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระดับ *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="beginner">เริ่มต้น</option>
                  <option value="intermediate">ปานกลาง</option>
                  <option value="advanced">ขั้นสูง</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทหลักสูตร *
                </label>
                <select
                  value={formData.courseType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      courseType: e.target.value as 'video' | 'live',
                      livePlatform: e.target.value === 'live' ? formData.livePlatform : '',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="video">วิดีโอ</option>
                  <option value="live">สอนสด</option>
                </select>
              </div>

              {formData.courseType === 'live' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    แพลตฟอร์มสอนสด *
                  </label>
                  <select
                    value={formData.livePlatform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        livePlatform: e.target.value as 'zoom' | 'google_meet',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">-- เลือกแพลตฟอร์ม --</option>
                    <option value="zoom">Zoom</option>
                    <option value="google_meet">Google Meet</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ครูผู้สอน *
              </label>
              {loadingTeachers ? (
                <div className="text-gray-500">กำลังโหลด...</div>
              ) : (
                <select
                  value={formData.instructorId}
                  onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">-- เลือกครูผู้สอน --</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="ระยะเวลา (ชั่วโมง) *"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                min="0"
                required
              />

              <Input
                label="ราคา (บาท) *"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                min="0"
                step="0.01"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะ *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="draft">แบบร่าง</option>
                  <option value="published">เผยแพร่</option>
                  <option value="archived">เก็บถาวร</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="วันที่เริ่มต้น"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />

              <Input
                label="วันที่สิ้นสุด"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">รูปภาพหลักสูตร</h2>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              id="thumbnail-input"
            />

            {thumbnailPreview ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={thumbnailPreview}
                    alt="Course thumbnail"
                    className="max-w-full h-48 rounded-lg object-cover"
                  />
                </div>
                <div className="space-y-2">
                  {thumbnailFile && (
                    <p className="text-sm text-gray-600">
                      {thumbnailFile.name} ({((thumbnailFile.size || 0) / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <div className="flex justify-center space-x-2">
                    <label
                      htmlFor="thumbnail-input"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      เปลี่ยนรูปภาพ
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ลบรูปภาพ
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <label
                    htmlFor="thumbnail-input"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors"
                  >
                    เลือกรูปภาพ
                  </label>
                  <p className="mt-2 text-sm text-gray-500">
                    หรือลากวางไฟล์ที่นี่
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5 MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            ยกเลิก
          </Button>
          <Button type="submit">บันทึกการแก้ไข</Button>
        </div>
      </form>
    </div>
  );
}

