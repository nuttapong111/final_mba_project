'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { assignmentsApi, coursesApi, uploadApi, type Assignment } from '@/lib/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function AssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    file: null as File | null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsResponse, courseResponse] = await Promise.all([
        assignmentsApi.getByCourse(courseId),
        coursesApi.getById(courseId),
      ]);

      if (assignmentsResponse.success) {
        setAssignments(assignmentsResponse.data);
      }

      if (courseResponse.success) {
        setCourse(courseResponse.data);
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

  const handleCreate = () => {
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      maxScore: 100,
      file: null,
    });
    setShowCreateModal(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
      maxScore: assignment.maxScore,
      file: null,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (assignment: Assignment) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบการบ้าน "${assignment.title}" หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        const response = await assignmentsApi.delete(assignment.id);
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: 'ลบการบ้านสำเร็จ',
          });
          fetchData();
        } else {
          throw new Error(response.error);
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message || 'ไม่สามารถลบการบ้านได้',
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณากรอกข้อมูล',
        text: 'กรุณากรอกชื่อการบ้าน',
      });
      return;
    }

    try {
      setUploading(true);

      let fileUrl = editingAssignment?.fileUrl || '';
      let fileName = editingAssignment?.fileName || '';
      let fileSize = editingAssignment?.fileSize || 0;
      let s3Key = editingAssignment?.s3Key || '';

      // Upload file if new file is selected
      if (formData.file) {
        const uploadResponse = await uploadApi.uploadFile(
          formData.file,
          'document',
          () => {}
        );

        if (uploadResponse.success && uploadResponse.data) {
          fileUrl = uploadResponse.data.url;
          fileName = uploadResponse.data.fileName;
          fileSize = uploadResponse.data.fileSize;
          s3Key = uploadResponse.data.s3Key || '';
        } else {
          throw new Error(uploadResponse.error || 'ไม่สามารถอัพโหลดไฟล์ได้');
        }
      }

      const assignmentData = {
        courseId,
        title: formData.title,
        description: formData.description || undefined,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        s3Key: s3Key || undefined,
        dueDate: formData.dueDate || undefined,
        maxScore: formData.maxScore,
      };

      if (editingAssignment) {
        const response = await assignmentsApi.update(editingAssignment.id, assignmentData);
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'อัพเดทสำเร็จ',
            text: 'อัพเดทการบ้านสำเร็จ',
          });
          setShowCreateModal(false);
          fetchData();
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await assignmentsApi.create(assignmentData);
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'สร้างสำเร็จ',
            text: 'สร้างการบ้านสำเร็จ',
          });
          setShowCreateModal(false);
          fetchData();
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกการบ้านได้',
      });
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">การบ้าน</h2>
          <p className="text-gray-600 mt-1">{course?.title}</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon className="h-5 w-5 mr-2" />
          เพิ่มการบ้าน
        </Button>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <DocumentArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ยังไม่มีข้อมูลการบ้าน</p>
            <Button onClick={handleCreate} className="mt-4">
              เพิ่มการบ้านแรก
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{assignment.title}</h3>
                    {isOverdue(assignment.dueDate) && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                        หมดเวลาแล้ว
                      </span>
                    )}
                  </div>
                  {assignment.description && (
                    <p className="text-gray-600 mb-4">{assignment.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {assignment.dueDate && (
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>กำหนดส่ง: {formatDate(assignment.dueDate)}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>ส่งแล้ว: {assignment._count?.submissions || 0} คน</span>
                    </div>
                    <span>คะแนนเต็ม: {assignment.maxScore} คะแนน</span>
                    {assignment.fileName && (
                      <div className="flex items-center space-x-1">
                        <DocumentArrowUpIcon className="h-4 w-4" />
                        <span>{assignment.fileName} ({formatFileSize(assignment.fileSize)})</span>
                      </div>
                    )}
                  </div>
                </div>
                  <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/school/courses/${courseId}/assignments/${assignment.id}/grading`)}
                  >
                    ให้คะแนน ({assignment._count?.submissions || 0})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(assignment)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(assignment)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAssignment ? 'แก้ไขการบ้าน' : 'เพิ่มการบ้าน'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อการบ้าน *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="กรอกชื่อการบ้าน"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="กรอกคำอธิบายการบ้าน"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    กำหนดส่ง
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คะแนนเต็ม
                  </label>
                  <Input
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 100 })}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ไฟล์การบ้าน (PDF, DOC, DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {editingAssignment?.fileName && !formData.file && (
                  <p className="text-sm text-gray-600 mt-1">
                    ไฟล์ปัจจุบัน: {editingAssignment.fileName}
                  </p>
                )}
                {formData.file && (
                  <p className="text-sm text-green-600 mt-1">
                    เลือกไฟล์ใหม่: {formData.file.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={uploading}
                >
                  ยกเลิก
                </Button>
                <Button onClick={handleSubmit} disabled={uploading}>
                  {uploading ? 'กำลังบันทึก...' : editingAssignment ? 'อัพเดท' : 'สร้าง'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

