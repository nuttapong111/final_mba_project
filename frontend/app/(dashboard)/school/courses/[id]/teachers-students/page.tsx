'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi, usersApi } from '@/lib/api';
import { filterUsersByRole } from '@/lib/utils';
import {
  UserPlusIcon,
  XMarkIcon,
  AcademicCapIcon,
  UserIcon,
  VideoCameraIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function TeachersStudentsPage() {
  const params = useParams();
  const id = params.id as string;
  const { user: currentUser } = useAuthStore();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [teacherRoles, setTeacherRoles] = useState({
    liveTeaching: false,
    grading: false,
    webboard: false,
  });
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseResponse, usersResponse] = await Promise.all([
        coursesApi.getById(id),
        usersApi.getAll(),
      ]);

      if (courseResponse.success && courseResponse.data) {
        setCourse(courseResponse.data);
        // Map teachers and students from API response
        setTeachers(
          courseResponse.data.teachers?.map((t: any) => ({
            id: t.id,
            name: t.name,
            email: t.email,
            avatar: t.avatar,
            roles: t.roles || { liveTeaching: false, grading: false, webboard: false },
            addedAt: t.addedAt || new Date().toISOString(),
          })) || []
        );
        setStudents(
          courseResponse.data.enrolledStudents?.map((s: any) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            avatar: s.avatar,
            enrolledAt: s.enrolledAt || new Date().toISOString(),
            progress: s.progress || 0,
          })) || []
        );
      }

      if (usersResponse.success && usersResponse.data) {
        setAvailableUsers(usersResponse.data);
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

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </Card>
    );
  }

  if (!course) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-600">ไม่พบหลักสูตร</p>
        </div>
      </Card>
    );
  }

  // Filter teachers and students by role and exclude already added ones
  // For school_admin, show all teachers/students from their school
  // For teacher, show only students from courses they teach
  const allAvailableTeachers = filterUsersByRole(
    availableUsers.filter((u: any) => u.role === 'TEACHER' || u.role === 'teacher'),
    currentUser as any,
    currentUser?.role === 'school_admin' ? undefined : [course]
  );
  const availableTeachers = allAvailableTeachers.filter(
    (teacher) => !teachers.some((t) => t.id === teacher.id)
  );
  
  const allAvailableStudents = filterUsersByRole(
    availableUsers.filter((u: any) => u.role === 'STUDENT' || u.role === 'student'),
    currentUser as any,
    currentUser?.role === 'school_admin' ? undefined : [course]
  );
  const availableStudents = allAvailableStudents.filter(
    (student) => !students.some((s) => s.id === student.id)
  );

  const handleAddTeacher = () => {
    if (!selectedTeacher) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกอาจารย์',
        text: 'โปรดเลือกอาจารย์ที่ต้องการเพิ่ม',
      });
      return;
    }

    if (!teacherRoles.liveTeaching && !teacherRoles.grading && !teacherRoles.webboard) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกบทบาท',
        text: 'โปรดเลือกบทบาทของอาจารย์อย่างน้อย 1 บทบาท',
      });
      return;
    }

    const teacher = availableUsers.find((t: any) => t.id === selectedTeacher && (t.role === 'TEACHER' || t.role === 'teacher'));
    if (teacher) {
      const newTeacher: any = {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        avatar: teacher.avatar,
        roles: { ...teacherRoles },
        addedAt: new Date().toISOString().split('T')[0],
      };

      setTeachers([...teachers, newTeacher]);
      setShowAddTeacherModal(false);
      setSelectedTeacher('');
      setTeacherRoles({ liveTeaching: false, grading: false, webboard: false });

      Swal.fire({
        icon: 'success',
        title: 'เพิ่มอาจารย์สำเร็จ!',
        text: `เพิ่ม ${teacher.name} เข้าสู่หลักสูตรแล้ว`,
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `คุณต้องการลบ ${teacher?.name} ออกจากหลักสูตรหรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      setTeachers(teachers.filter((t) => t.id !== teacherId));
      Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ!',
        text: 'ลบอาจารย์ออกจากหลักสูตรแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleAddStudent = () => {
    if (!selectedStudent) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกนักเรียน',
        text: 'โปรดเลือกนักเรียนที่ต้องการเพิ่ม',
      });
      return;
    }

    const student = availableUsers.find((s: any) => s.id === selectedStudent && (s.role === 'STUDENT' || s.role === 'student'));
    if (student) {
      const newStudent: any = {
        id: student.id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        enrolledAt: new Date().toISOString().split('T')[0],
        progress: 0,
      };

      setStudents([...students, newStudent]);
      setShowAddStudentModal(false);
      setSelectedStudent('');

      Swal.fire({
        icon: 'success',
        title: 'เพิ่มนักเรียนสำเร็จ!',
        text: `เพิ่ม ${student.name} เข้าสู่หลักสูตรแล้ว`,
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `คุณต้องการลบ ${student?.name} ออกจากหลักสูตรหรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      setStudents(students.filter((s) => s.id !== studentId));
      Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ!',
        text: 'ลบนักเรียนออกจากหลักสูตรแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleUpdateTeacherRoles = async (teacherId: string, newRoles: any) => {
    setTeachers(
      teachers.map((t) =>
        t.id === teacherId
          ? { ...t, roles: newRoles }
          : t
      )
    );

    Swal.fire({
      icon: 'success',
      title: 'อัปเดตสำเร็จ!',
      text: 'อัปเดตบทบาทของอาจารย์แล้ว',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Teachers Section */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <AcademicCapIcon className="h-6 w-6 mr-2 text-blue-600" />
              อาจารย์ผู้สอน
            </h2>
            <p className="text-gray-600 mt-1">จัดการอาจารย์ที่ดูแลรายวิชานี้</p>
          </div>
          <Button onClick={() => setShowAddTeacherModal(true)} disabled={availableTeachers.length === 0}>
            <UserPlusIcon className="h-5 w-5 mr-2 inline" />
            เพิ่มอาจารย์
          </Button>
        </div>

        {teachers.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ยังไม่มีอาจารย์ในหลักสูตรนี้</p>
            <Button onClick={() => setShowAddTeacherModal(true)} className="mt-4" disabled={availableTeachers.length === 0}>
              เพิ่มอาจารย์คนแรก
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <img
                    src={teacher.avatar || 'https://ui-avatars.com/api/?name=Teacher'}
                    alt={teacher.name}
                    className="h-12 w-12 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">{teacher.email}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={teacher.roles.liveTeaching}
                          onChange={(e) =>
                            handleUpdateTeacherRoles(teacher.id, {
                              ...teacher.roles,
                              liveTeaching: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 flex items-center">
                          <VideoCameraIcon className="h-4 w-4 mr-1" />
                          สอนสด
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={teacher.roles.grading}
                          onChange={(e) =>
                            handleUpdateTeacherRoles(teacher.id, {
                              ...teacher.roles,
                              grading: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 flex items-center">
                          <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                          ตรวจการบ้าน
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={teacher.roles.webboard}
                          onChange={(e) =>
                            handleUpdateTeacherRoles(teacher.id, {
                              ...teacher.roles,
                              webboard: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 flex items-center">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                          Webboard
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      เพิ่มเมื่อ: {new Date(teacher.addedAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveTeacher(teacher.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="ลบอาจารย์"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Students Section */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserIcon className="h-6 w-6 mr-2 text-green-600" />
              นักเรียนที่ลงทะเบียน
            </h2>
            <p className="text-gray-600 mt-1">จัดการนักเรียนในหลักสูตรนี้</p>
          </div>
          <Button onClick={() => setShowAddStudentModal(true)} disabled={availableStudents.length === 0}>
            <UserPlusIcon className="h-5 w-5 mr-2 inline" />
            เพิ่มนักเรียน
          </Button>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ยังไม่มีนักเรียนในหลักสูตรนี้</p>
            <Button onClick={() => setShowAddStudentModal(true)} className="mt-4" disabled={availableStudents.length === 0}>
              เพิ่มนักเรียนคนแรก
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <img
                    src={student.avatar || 'https://ui-avatars.com/api/?name=Student'}
                    alt={student.name}
                    className="h-12 w-12 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    {student.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>ความคืบหน้า</span>
                          <span>{student.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      ลงทะเบียนเมื่อ: {new Date(student.enrolledAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveStudent(student.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="ลบนักเรียน"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">เพิ่มอาจารย์</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกอาจารย์
                </label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">-- เลือกอาจารย์ --</option>
                  {availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  บทบาทในหลักสูตร
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teacherRoles.liveTeaching}
                      onChange={(e) =>
                        setTeacherRoles({ ...teacherRoles, liveTeaching: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center">
                      <VideoCameraIcon className="h-4 w-4 mr-1" />
                      สอนสด (Live Class)
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teacherRoles.grading}
                      onChange={(e) =>
                        setTeacherRoles({ ...teacherRoles, grading: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center">
                      <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                      ตรวจการบ้าน
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teacherRoles.webboard}
                      onChange={(e) =>
                        setTeacherRoles({ ...teacherRoles, webboard: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                      มีส่วนร่วมใน Webboard
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddTeacherModal(false);
                  setSelectedTeacher('');
                  setTeacherRoles({ liveTeaching: false, grading: false, webboard: false });
                }}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button onClick={handleAddTeacher} className="flex-1">
                เพิ่มอาจารย์
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">เพิ่มนักเรียน</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกนักเรียน
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">-- เลือกนักเรียน --</option>
                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddStudentModal(false);
                  setSelectedStudent('');
                }}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button onClick={handleAddStudent} className="flex-1">
                เพิ่มนักเรียน
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

