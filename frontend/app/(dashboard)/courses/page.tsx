'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi } from '@/lib/api';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import {
  AcademicCapIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function CoursesPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesApi.getAll();
        if (response.success && response.data) {
          setCourses(response.data);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโหลดข้อมูลหลักสูตรได้',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCourse = () => {
    Swal.fire({
      title: 'สร้างหลักสูตรใหม่',
      text: 'ฟีเจอร์นี้จะพร้อมใช้งานในเร็วๆ นี้',
      icon: 'info',
      confirmButtonText: 'ตกลง',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการหลักสูตร</h1>
          <p className="text-gray-600 mt-1">สร้างและจัดการหลักสูตรทั้งหมด</p>
        </div>
        <Button onClick={handleCreateCourse}>
          <PlusIcon className="h-5 w-5 mr-2 inline" />
          สร้างหลักสูตรใหม่
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาหลักสูตร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </Card>

      {/* Courses Grid */}
      {loading ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
          <Card key={course.id} hover className="flex flex-col">
            <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
              <img
                src={course.thumbnail || 'https://via.placeholder.com/400x300'}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                {course.status === 'published' ? 'เผยแพร่' : course.status}
              </span>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <img
                    src={course.instructor.avatar || 'https://ui-avatars.com/api/?name=Instructor'}
                    alt={course.instructor.name}
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="text-sm text-gray-600">{course.instructor.name}</span>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {course.category}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>⏱ {course.duration} ชั่วโมง</span>
                <span>👥 {course.students} คน</span>
                <span>⭐ {course.rating}</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(course.price)}
                </span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    แก้ไข
                  </Button>
                  <Button variant="primary" size="sm">
                    ดูรายละเอียด
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          ))}
        </div>
      )}

      {!loading && filteredCourses.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ไม่พบหลักสูตรที่ค้นหา</p>
          </div>
        </Card>
      )}
    </div>
  );
}

