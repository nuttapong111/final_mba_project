'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeftIcon, PlusIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { usersApi, courseCategoriesApi, coursesApi, type CourseCategory } from '@/lib/api';
import { normalizeRole } from '@/lib/utils';
import type { LiveSession } from '@/lib/mockData';

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
}

export default function NewCoursePage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
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
  const [liveSessions, setLiveSessions] = useState<Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>>([]);

  useEffect(() => {
    fetchTeachers();
    fetchCategories();
  }, [currentUser]);

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await usersApi.getAll();
      if (response.success && response.data) {
        // Filter only teachers from the same school
        const allTeachers = response.data.filter(user => {
          const role = normalizeRole(user.role);
          return role === 'teacher';
        });

        // If current user is school admin, filter by schoolId
        if (currentUser) {
          const currentRole = normalizeRole(currentUser.role);
          if (currentRole === 'school_admin' && currentUser.schoolId) {
            const filteredTeachers = allTeachers.filter(teacher => 
              teacher.schoolId === currentUser.schoolId
            );
            setTeachers(filteredTeachers);
          } else if (currentRole === 'super_admin') {
            // Super admin can see all teachers
            setTeachers(allTeachers);
          } else {
            setTeachers(allTeachers);
          }
        } else {
          setTeachers(allTeachers);
        }
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดรายชื่อครูได้',
      });
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
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดรายการหมวดหมู่ได้',
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate instructor
    if (!formData.instructorId) {
      await Swal.fire({
        icon: 'error',
        title: 'กรุณาเลือกครูผู้สอน',
        text: 'ต้องเลือกครูผู้สอนสำหรับหลักสูตร',
        confirmButtonText: 'ตกลง',
      });
      return;
    }
    
    // Live class validation - Hidden for Phase 2
    // if (formData.courseType === 'live') {
    //   if (!formData.livePlatform) {
    //     await Swal.fire({
    //       icon: 'error',
    //       title: 'กรุณาเลือกช่องทางเรียนสด',
    //       text: 'เมื่อเลือกเรียนแบบสด ต้องเลือกช่องทาง (Zoom หรือ Google Meet)',
    //       confirmButtonText: 'ตกลง',
    //     });
    //     return;
    //   }
    //   
    //   if (!formData.startDate || !formData.endDate) {
    //     await Swal.fire({
    //       icon: 'error',
    //       title: 'กรุณากรอกวันเริ่มต้นและวันสิ้นสุด',
    //       text: 'หลักสูตรเรียนสดต้องมีวันเริ่มต้นและวันสิ้นสุด',
    //       confirmButtonText: 'ตกลง',
    //     });
    //     return;
    //   }
    //   
    //   if (liveSessions.length === 0) {
    //     await Swal.fire({
    //       icon: 'error',
    //       title: 'กรุณาเพิ่มตารางเรียน',
    //       text: 'ต้องเพิ่มตารางเรียนอย่างน้อย 1 ครั้ง',
    //       confirmButtonText: 'ตกลง',
    //     });
    //     return;
    //   }
    //   
    //   // Validate all sessions have complete data
    //   const incompleteSession = liveSessions.find(s => !s.date || !s.startTime || !s.endTime);
    //   if (incompleteSession) {
    //     await Swal.fire({
    //       icon: 'error',
    //       title: 'กรุณากรอกข้อมูลตารางเรียนให้ครบถ้วน',
    //       text: 'ทุกครั้งเรียนต้องมีวัน เวลาเริ่มต้น และเวลาสิ้นสุด',
    //       confirmButtonText: 'ตกลง',
    //     });
    //     return;
    //   }
    // }
    
    try {
      // Find category ID if category name is provided
      const selectedCategory = categories.find(cat => cat.name === formData.category);
      
      // Prepare course data
      const courseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        categoryId: selectedCategory?.id,
        level: formData.level,
        courseType: formData.courseType,
        livePlatform: undefined, // formData.courseType === 'live' ? formData.livePlatform : undefined, // Phase 2
        instructorId: formData.instructorId,
        duration: parseInt(formData.duration) || 0,
        price: parseFloat(formData.price) || 0,
        status: formData.status,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        thumbnail: thumbnailPreview || undefined,
      };

      const response = await coursesApi.create(courseData);

      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'สร้างหลักสูตรสำเร็จ!',
          text: 'หลักสูตรถูกสร้างเรียบร้อยแล้ว คุณสามารถเพิ่มเนื้อหาหลักสูตรได้',
          timer: 2000,
          showConfirmButton: false,
        });
        
        router.push('/school/courses');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: response.error || 'ไม่สามารถสร้างหลักสูตรได้',
        });
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message || 'ไม่สามารถสร้างหลักสูตรได้',
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSession = () => {
    setLiveSessions([
      ...liveSessions,
      {
        date: '',
        startTime: '',
        endTime: '',
      },
    ]);
  };

  const handleUpdateSession = (index: number, field: string, value: string) => {
    const updated = [...liveSessions];
    updated[index] = { ...updated[index], [field]: value };
    setLiveSessions(updated);
  };

  const handleRemoveSession = (index: number) => {
    setLiveSessions(liveSessions.filter((_, i) => i !== index));
  };

  const generateMeetingLink = (platform: 'zoom' | 'google_meet', sessionId: string): string => {
    if (platform === 'zoom') {
      return `https://zoom.us/j/${sessionId}`;
    } else {
      return `https://meet.google.com/${sessionId}`;
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ไม่ถูกต้อง',
        text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ใหญ่เกินไป',
        text: 'กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB',
      });
      return;
    }

    setThumbnailFile(file);

    // Create preview
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
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">สร้างหลักสูตรใหม่</h1>
          <p className="text-gray-600 mt-1">กรอกข้อมูลเพื่อสร้างหลักสูตรใหม่</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลหลักสูตร</h2>
              <div className="space-y-4">
                <Input
                  label="ชื่อหลักสูตร"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="เช่น คณิตศาสตร์ ม.4"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    คำอธิบาย
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="อธิบายรายละเอียดของหลักสูตร..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      หมวดหมู่
                    </label>
                    {loadingCategories ? (
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm text-gray-500">กำลังโหลดหมวดหมู่...</span>
                      </div>
                    ) : (
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                        disabled={categories.length === 0}
                      >
                        <option value="">
                          {categories.length === 0 ? 'ไม่มีหมวดหมู่ (กรุณาเพิ่มหมวดหมู่ก่อน)' : 'เลือกหมวดหมู่'}
                        </option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {categories.length === 0 && !loadingCategories && (
                      <p className="text-xs text-red-500 mt-1">
                        ไม่พบหมวดหมู่ กรุณาเพิ่มหมวดหมู่ในเมนู "หมวดหมู่หลักสูตร" ก่อน
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      ระดับ
                    </label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="beginner">เริ่มต้น</option>
                      <option value="intermediate">ปานกลาง</option>
                      <option value="advanced">ขั้นสูง</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    ประเภทการเรียน
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.courseType === 'video' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="courseType"
                        value="video"
                        checked={formData.courseType === 'video'}
                        onChange={(e) => setFormData({ ...formData, courseType: e.target.value as 'video' | 'live', livePlatform: '' })}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.courseType === 'video' 
                            ? 'border-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {formData.courseType === 'video' && (
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">เรียนแบบวิดีโอ</div>
                          <div className="text-sm text-gray-500">เรียนผ่านวิดีโอที่บันทึกไว้</div>
                        </div>
                      </div>
                    </label>
                    {/* Live Class Option - Hidden for Phase 2
                    <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.courseType === 'live' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="courseType"
                        value="live"
                        checked={formData.courseType === 'live'}
                        onChange={(e) => setFormData({ ...formData, courseType: e.target.value as 'video' | 'live' })}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.courseType === 'live' 
                            ? 'border-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {formData.courseType === 'live' && (
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">เรียนแบบสด</div>
                          <div className="text-sm text-gray-500">เรียนผ่าน Zoom หรือ Google Meet</div>
                        </div>
                      </div>
                    </label>
                    */}
                  </div>
                  {/* Live Platform Selection - Hidden for Phase 2
                  {formData.courseType === 'live' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        ช่องทางเรียนสด
                      </label>
                      <select
                        name="livePlatform"
                        value={formData.livePlatform}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      >
                        <option value="">เลือกช่องทาง</option>
                        <option value="zoom">Zoom</option>
                        <option value="google_meet">Google Meet</option>
                      </select>
                    </div>
                  )}
                  */}
                </div>
              </div>
            </Card>

            {formData.courseType === 'video' && (
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4">เนื้อหาหลักสูตร</h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>หมายเหตุ:</strong> แอดมินโรงเรียนเป็นผู้เพิ่มเนื้อหาหลักสูตร (วิดีโอ, เอกสาร, แบบทดสอบ) 
                      ครูผู้สอนที่เลือกจะอยู่ในบอร์ดตอบปัญหาของนักเรียน ตรวจการบ้าน และตรวจข้อสอบ
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      รูปภาพหลักสูตร
                    </label>
                    <input
                      id="thumbnail-input"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    {thumbnailPreview ? (
                      <div className="relative">
                        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                          <img
                            src={thumbnailPreview}
                            alt="Course thumbnail preview"
                            className="w-full h-64 object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveThumbnail}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          {thumbnailFile?.name} ({((thumbnailFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    ) : (
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                          isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">
                          {isDragging ? 'วางไฟล์ที่นี่' : 'ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์'}
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                          รองรับไฟล์รูปภาพ (JPG, PNG, GIF) ขนาดไม่เกิน 5MB
                        </p>
                        <Button variant="outline" type="button" onClick={(e) => {
                          e.stopPropagation();
                          const input = document.getElementById('thumbnail-input') as HTMLInputElement;
                          input?.click();
                        }}>
                          เลือกไฟล์
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Live Class Schedule - Hidden for Phase 2
            {formData.courseType === 'live' && (
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4">ตารางเรียนสด</h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>หมายเหตุ:</strong> ระบบจะสร้างลิงก์เรียนออนไลน์ให้อัตโนมัติ และแจ้งเตือนไปยังครูผู้สอนและนักเรียนก่อนวันเรียน 
                      ครูผู้สอนจะเป็นผู้ดูแลการเรียนการสอนและสามารถอัดวิดีโอได้
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        วันเริ่มต้น
                      </label>
                      <Input
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        วันสิ้นสุด
                      </label>
                      <Input
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        ตารางเรียน
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddSession}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        เพิ่มครั้งเรียน
                      </Button>
                    </div>
                    {liveSessions.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500 text-sm">ยังไม่มีตารางเรียน</p>
                        <p className="text-gray-400 text-xs mt-1">คลิก "เพิ่มครั้งเรียน" เพื่อเพิ่มตารางเรียน</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {liveSessions.map((session, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">ครั้งที่ {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSession(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  วันเรียน
                                </label>
                                <Input
                                  type="date"
                                  value={session.date}
                                  onChange={(e) => handleUpdateSession(index, 'date', e.target.value)}
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  เวลาเริ่มต้น
                                </label>
                                <Input
                                  type="time"
                                  value={session.startTime}
                                  onChange={(e) => handleUpdateSession(index, 'startTime', e.target.value)}
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  เวลาสิ้นสุด
                                </label>
                                <Input
                                  type="time"
                                  value={session.endTime}
                                  onChange={(e) => handleUpdateSession(index, 'endTime', e.target.value)}
                                  required
                                />
                              </div>
                            </div>
                            {session.date && session.startTime && (
                              <div className="mt-2 text-xs text-gray-500">
                                ลิงก์เรียน: {generateMeetingLink(
                                  formData.livePlatform as 'zoom' | 'google_meet',
                                  `${formData.title.replace(/\s+/g, '')}-${index + 1}-${Date.now()}`
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
            */}
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">ตั้งค่า</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ครูผู้สอน <span className="text-red-500">*</span>
                  </label>
                  {loadingTeachers ? (
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-gray-500">กำลังโหลดรายชื่อครู...</span>
                    </div>
                  ) : (
                    <select
                      name="instructorId"
                      value={formData.instructorId}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                      disabled={teachers.length === 0}
                    >
                      <option value="">
                        {teachers.length === 0 ? 'ไม่พบครูในโรงเรียน' : 'เลือกครูผู้สอน'}
                      </option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} {teacher.email ? `(${teacher.email})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {teachers.length === 0 && !loadingTeachers && (
                    <p className="text-xs text-red-500 mt-1">
                      ไม่พบครูในโรงเรียนของคุณ กรุณาเพิ่มครูผู้สอนก่อน
                    </p>
                  )}
                  {formData.courseType === 'video' && (
                    <p className="text-xs text-gray-500 mt-1">
                      ครูจะอยู่ในบอร์ดตอบปัญหา ตรวจการบ้าน และตรวจข้อสอบ
                    </p>
                  )}
                  {/* Live class teacher note - Hidden for Phase 2
                  {formData.courseType === 'live' && (
                    <p className="text-xs text-gray-500 mt-1">
                      ครูจะเป็นผู้ดูแลการเรียนการสอนและสามารถอัดวิดีโอได้
                    </p>
                  )}
                  */}
                </div>
                <Input
                  label="ระยะเวลา (ชั่วโมง)"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="40"
                  required
                />
                <Input
                  label="ราคา (บาท)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="2990"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    สถานะ
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="draft">แบบร่าง</option>
                    <option value="published">เผยแพร่</option>
                  </select>
                </div>
              </div>
            </Card>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                ยกเลิก
              </Button>
              <Button type="submit" className="flex-1">
                บันทึก
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}



