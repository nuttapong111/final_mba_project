'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { gradingApi, coursesApi, type GradingSystem, type GradeCriteria, type GradeWeight } from '@/lib/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function GradingSystemPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [gradingSystem, setGradingSystem] = useState<GradingSystem | null>(null);
  const [gradeWeights, setGradeWeights] = useState<GradeWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<GradeCriteria | null>(null);
  const [editingWeight, setEditingWeight] = useState<GradeWeight | null>(null);
  const [systemFormData, setSystemFormData] = useState({
    systemType: 'PASS_FAIL' as 'PASS_FAIL' | 'GRADE',
    passingScore: 70,
  });
  const [criteriaFormData, setCriteriaFormData] = useState({
    grade: '',
    minScore: 0,
    maxScore: undefined as number | undefined,
  });
  const [weightFormData, setWeightFormData] = useState({
    category: '',
    weight: 0,
  });

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gradingResponse, courseResponse] = await Promise.all([
        gradingApi.getSystem(courseId),
        coursesApi.getById(courseId),
      ]);

      if (gradingResponse.success) {
        setGradingSystem(gradingResponse.data.gradingSystem);
        setGradeWeights(gradingResponse.data.gradeWeights);
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

  const handleCreateSystem = () => {
    if (gradingSystem) {
      setSystemFormData({
        systemType: gradingSystem.systemType,
        passingScore: gradingSystem.passingScore || 70,
      });
    }
    setShowSystemModal(true);
  };

  const handleSubmitSystem = async () => {
    try {
      if (gradingSystem) {
        const response = await gradingApi.updateSystem(courseId, systemFormData);
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'อัพเดทสำเร็จ',
            text: 'อัพเดทระบบเกรดสำเร็จ',
          });
          setShowSystemModal(false);
          fetchData();
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await gradingApi.createSystem({
          courseId,
          ...systemFormData,
        });
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'สร้างสำเร็จ',
            text: 'สร้างระบบเกรดสำเร็จ',
          });
          setShowSystemModal(false);
          fetchData();
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกได้',
      });
    }
  };

  const handleCreateCriteria = () => {
    if (!gradingSystem || gradingSystem.systemType !== 'GRADE') {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาตั้งค่าระบบเกรดเป็น GRADE ก่อน',
      });
      return;
    }
    setEditingCriteria(null);
    setCriteriaFormData({
      grade: '',
      minScore: 0,
      maxScore: undefined,
    });
    setShowCriteriaModal(true);
  };

  const handleEditCriteria = (criteria: GradeCriteria) => {
    setEditingCriteria(criteria);
    setCriteriaFormData({
      grade: criteria.grade,
      minScore: criteria.minScore,
      maxScore: criteria.maxScore || undefined,
    });
    setShowCriteriaModal(true);
  };

  const handleDeleteCriteria = async (criteria: GradeCriteria) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบเกณฑ์ "${criteria.grade}" หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        const response = await gradingApi.deleteCriteria(criteria.id);
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
          });
          fetchData();
        } else {
          throw new Error(response.error);
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message || 'ไม่สามารถลบได้',
        });
      }
    }
  };

  const handleSubmitCriteria = async () => {
    if (!criteriaFormData.grade || criteriaFormData.minScore < 0 || criteriaFormData.minScore > 100) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณากรอกข้อมูลให้ถูกต้อง',
        text: 'เกรดและคะแนนขั้นต่ำต้องถูกต้อง',
      });
      return;
    }

    try {
      if (editingCriteria) {
        const response = await gradingApi.updateCriteria(editingCriteria.id, criteriaFormData);
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'อัพเดทสำเร็จ',
          });
          setShowCriteriaModal(false);
          fetchData();
        } else {
          throw new Error(response.error);
        }
      } else {
        if (!gradingSystem) {
          throw new Error('กรุณาตั้งค่าระบบเกรดก่อน');
        }
        const response = await gradingApi.createCriteria({
          gradingSystemId: gradingSystem.id,
          ...criteriaFormData,
        });
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'สร้างสำเร็จ',
          });
          setShowCriteriaModal(false);
          fetchData();
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกได้',
      });
    }
  };

  const handleCreateWeight = () => {
    setEditingWeight(null);
    setWeightFormData({
      category: '',
      weight: 0,
    });
    setShowWeightModal(true);
  };

  const handleEditWeight = (weight: GradeWeight) => {
    setEditingWeight(weight);
    setWeightFormData({
      category: weight.category,
      weight: weight.weight,
    });
    setShowWeightModal(true);
  };

  const handleDeleteWeight = async (weight: GradeWeight) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบน้ำหนัก "${weight.category}" หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        const response = await gradingApi.deleteWeight(weight.id);
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
          });
          fetchData();
        } else {
          throw new Error(response.error);
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message || 'ไม่สามารถลบได้',
        });
      }
    }
  };

  const handleSubmitWeight = async () => {
    if (!weightFormData.category || weightFormData.weight <= 0 || weightFormData.weight > 100) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณากรอกข้อมูลให้ถูกต้อง',
        text: 'หมวดหมู่และน้ำหนักต้องถูกต้อง (0-100%)',
      });
      return;
    }

    const totalWeight = gradeWeights.reduce((sum, w) => {
      if (editingWeight && w.id === editingWeight.id) return sum;
      return sum + w.weight;
    }, 0) + weightFormData.weight;

    if (totalWeight > 100) {
      Swal.fire({
        icon: 'error',
        title: 'น้ำหนักรวมเกิน 100%',
        text: `น้ำหนักรวมปัจจุบัน: ${totalWeight}%`,
      });
      return;
    }

    try {
      if (editingWeight) {
        const response = await gradingApi.updateWeight(editingWeight.id, weightFormData);
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'อัพเดทสำเร็จ',
          });
          setShowWeightModal(false);
          fetchData();
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await gradingApi.createWeight({
          courseId,
          ...weightFormData,
        });
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'สร้างสำเร็จ',
          });
          setShowWeightModal(false);
          fetchData();
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกได้',
      });
    }
  };

  const totalWeight = gradeWeights.reduce((sum, w) => sum + w.weight, 0);

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ระบบเกรด</h2>
        <p className="text-gray-600 mt-1">{course?.title}</p>
      </div>

      {/* Grading System */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">ตั้งค่าระบบเกรด</h3>
          <Button onClick={handleCreateSystem}>
            {gradingSystem ? 'แก้ไข' : 'ตั้งค่า'}
          </Button>
        </div>
        {gradingSystem ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">ประเภท:</span>
              <span className="font-semibold">
                {gradingSystem.systemType === 'PASS_FAIL' ? 'ผ่าน/ไม่ผ่าน' : 'เกรด (A-F)'}
              </span>
            </div>
            {gradingSystem.systemType === 'PASS_FAIL' && gradingSystem.passingScore && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">คะแนนขั้นต่ำ:</span>
                <span className="font-semibold">{gradingSystem.passingScore}%</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">ยังไม่ได้ตั้งค่าระบบเกรด</p>
        )}
      </Card>

      {/* Grade Criteria (only for GRADE system) */}
      {gradingSystem?.systemType === 'GRADE' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">เกณฑ์การให้เกรด</h3>
            <Button onClick={handleCreateCriteria}>
              <PlusIcon className="h-5 w-5 mr-2" />
              เพิ่มเกณฑ์
            </Button>
          </div>
          {gradingSystem.criteria && gradingSystem.criteria.length > 0 ? (
            <div className="space-y-3">
              {gradingSystem.criteria.map((criteria) => (
                <div
                  key={criteria.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-semibold text-lg">{criteria.grade}</span>
                    <span className="text-gray-600 ml-2">
                      {criteria.minScore}%{criteria.maxScore ? ` - ${criteria.maxScore}%` : '+'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCriteria(criteria)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCriteria(criteria)}
                      className="text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">ยังไม่มีเกณฑ์การให้เกรด</p>
          )}
        </Card>
      )}

      {/* Grade Weights (only for GRADE system) */}
      {gradingSystem?.systemType === 'GRADE' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">น้ำหนักคะแนน</h3>
            <Button onClick={handleCreateWeight}>
              <PlusIcon className="h-5 w-5 mr-2" />
              เพิ่มน้ำหนัก
            </Button>
          </div>
          {gradeWeights.length > 0 ? (
            <div className="space-y-3">
              {gradeWeights.map((weight) => (
                <div
                  key={weight.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-semibold">{weight.category}</span>
                    <span className="text-gray-600 ml-2">{weight.weight}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditWeight(weight)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWeight(weight)}
                      className="text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">น้ำหนักรวม:</span>
                  <span className={`text-lg font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalWeight}%
                  </span>
                </div>
                {totalWeight !== 100 && (
                  <p className="text-sm text-red-600 mt-1">
                    ⚠️ น้ำหนักรวมต้องเท่ากับ 100%
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">ยังไม่มีน้ำหนักคะแนน</p>
          )}
        </Card>
      )}

      {/* System Modal */}
      {showSystemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {gradingSystem ? 'แก้ไขระบบเกรด' : 'ตั้งค่าระบบเกรด'}
              </h3>
              <button
                onClick={() => setShowSystemModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทระบบเกรด
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="PASS_FAIL"
                      checked={systemFormData.systemType === 'PASS_FAIL'}
                      onChange={(e) => setSystemFormData({ ...systemFormData, systemType: e.target.value as 'PASS_FAIL' | 'GRADE' })}
                      className="text-blue-600"
                    />
                    <span>ผ่าน/ไม่ผ่าน</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="GRADE"
                      checked={systemFormData.systemType === 'GRADE'}
                      onChange={(e) => setSystemFormData({ ...systemFormData, systemType: e.target.value as 'PASS_FAIL' | 'GRADE' })}
                      className="text-blue-600"
                    />
                    <span>เกรด (A-F)</span>
                  </label>
                </div>
              </div>

              {systemFormData.systemType === 'PASS_FAIL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คะแนนขั้นต่ำ (%)
                  </label>
                  <Input
                    type="number"
                    value={systemFormData.passingScore}
                    onChange={(e) => setSystemFormData({ ...systemFormData, passingScore: parseInt(e.target.value) || 70 })}
                    min="0"
                    max="100"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowSystemModal(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSubmitSystem}>
                  บันทึก
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Criteria Modal */}
      {showCriteriaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCriteria ? 'แก้ไขเกณฑ์' : 'เพิ่มเกณฑ์'}
              </h3>
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เกรด *
                </label>
                <Input
                  value={criteriaFormData.grade}
                  onChange={(e) => setCriteriaFormData({ ...criteriaFormData, grade: e.target.value.toUpperCase() })}
                  placeholder="A, B, C, D, F"
                  maxLength={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คะแนนขั้นต่ำ (%) *
                </label>
                <Input
                  type="number"
                  value={criteriaFormData.minScore}
                  onChange={(e) => setCriteriaFormData({ ...criteriaFormData, minScore: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คะแนนสูงสุด (%) (ไม่บังคับ)
                </label>
                <Input
                  type="number"
                  value={criteriaFormData.maxScore || ''}
                  onChange={(e) => setCriteriaFormData({ ...criteriaFormData, maxScore: e.target.value ? parseInt(e.target.value) : undefined })}
                  min="0"
                  max="100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowCriteriaModal(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSubmitCriteria}>
                  บันทึก
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingWeight ? 'แก้ไขน้ำหนัก' : 'เพิ่มน้ำหนัก'}
              </h3>
              <button
                onClick={() => setShowWeightModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่ *
                </label>
                <Input
                  value={weightFormData.category}
                  onChange={(e) => setWeightFormData({ ...weightFormData, category: e.target.value })}
                  placeholder="quiz, assignment, exam, participation"
                />
                <p className="text-xs text-gray-500 mt-1">
                  เช่น: quiz, assignment, exam, participation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  น้ำหนัก (%) *
                </label>
                <Input
                  type="number"
                  value={weightFormData.weight}
                  onChange={(e) => setWeightFormData({ ...weightFormData, weight: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  น้ำหนักรวมปัจจุบัน: {totalWeight}%
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowWeightModal(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSubmitWeight}>
                  บันทึก
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

