'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { coursesApi, gradingApi, type GradingSystem, type GradeCriteria, type GradeWeight } from '@/lib/api';
import type { QuizPassingRequirement } from '@/lib/mockData';

export default function CourseCompletionSettingsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // System Type Selection
  const [systemType, setSystemType] = useState<'PASS_FAIL' | 'GRADE'>('PASS_FAIL');
  
  // Grading System State
  const [gradingSystem, setGradingSystem] = useState<GradingSystem | null>(null);
  const [gradeWeights, setGradeWeights] = useState<GradeWeight[]>([]);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<GradeCriteria | null>(null);
  const [editingWeight, setEditingWeight] = useState<GradeWeight | null>(null);
  
  // Form Data
  const [passFailFormData, setPassFailFormData] = useState<{
    passingScore: number;
    requireProgress: boolean;
    minProgressPercentage: number | undefined;
    requireAllQuizzes: boolean;
    minQuizPassingPercentage: number | undefined;
  }>({
    passingScore: 70,
    requireProgress: true,
    minProgressPercentage: 100,
    requireAllQuizzes: false,
    minQuizPassingPercentage: 70,
  });
  
  const [gradeFormData, setGradeFormData] = useState<{
    requireProgress: boolean;
    minProgressPercentage: number | undefined;
    requireAllQuizzes: boolean;
    minQuizPassingPercentage: number | undefined;
    certificateMinGrade: string;
  }>({
    requireProgress: true,
    minProgressPercentage: 100,
    requireAllQuizzes: false,
    minQuizPassingPercentage: 70,
    certificateMinGrade: '',
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

  // Quiz Requirements State
  const [quizRequirements, setQuizRequirements] = useState<QuizPassingRequirement[]>([]);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseResponse, gradingResponse] = await Promise.all([
        coursesApi.getById(courseId),
        gradingApi.getSystem(courseId),
      ]);

      if (courseResponse.success && courseResponse.data) {
        setCourse(courseResponse.data);
        const courseData = courseResponse.data as any;
        const allQuizzes = getAllQuizzes(courseData);
        
        // Initialize quiz requirements
        setQuizRequirements(allQuizzes.map((quiz: { id: string; title: string; lessonTitle: string }) => ({
          quizId: quiz.id,
          quizTitle: quiz.title,
          passingPercentage: 70,
          required: true,
        })));
      }

      if (gradingResponse.success && gradingResponse.data) {
        const system = gradingResponse.data.gradingSystem;
        setGradingSystem(system);
        setGradeWeights(gradingResponse.data.gradeWeights);
        
        if (system) {
          setSystemType(system.systemType);
          
          // Load completion requirements from grading system
          if (system.systemType === 'PASS_FAIL') {
            setPassFailFormData({
              passingScore: system.passingScore || 70,
              requireProgress: (system as any).requireProgress ?? true,
              minProgressPercentage: (system as any).minProgressPercentage ?? 100,
              requireAllQuizzes: (system as any).requireAllQuizzes ?? false,
              minQuizPassingPercentage: (system as any).minQuizPassingPercentage ?? 70,
            });
          } else {
            setGradeFormData({
              requireProgress: (system as any).requireProgress ?? true,
              minProgressPercentage: (system as any).minProgressPercentage ?? 100,
              requireAllQuizzes: (system as any).requireAllQuizzes ?? false,
              minQuizPassingPercentage: (system as any).minQuizPassingPercentage ?? 70,
              certificateMinGrade: (system as any).certificateMinGrade || '',
            });
          }
        }
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

  const getAllQuizzes = (courseData: any) => {
    if (!courseData?.lessons) return [];
    const quizzes: Array<{ id: string; title: string; lessonTitle: string }> = [];
    
    courseData.lessons.forEach((lesson: any) => {
      if (lesson.contents) {
        lesson.contents.forEach((content: any) => {
          if (content.type === 'QUIZ' || content.type === 'PRE_TEST') {
            quizzes.push({
              id: content.id,
              title: content.title || (content.type === 'PRE_TEST' ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบ'),
              lessonTitle: lesson.title,
            });
          }
        });
      }
    });
    
    return quizzes;
  };

  const allQuizzes = course ? getAllQuizzes(course) : [];

  const handleUpdateQuizRequirement = (
    index: number,
    field: keyof QuizPassingRequirement,
    value: any
  ) => {
    const updated = [...quizRequirements];
    updated[index] = { ...updated[index], [field]: value };
    setQuizRequirements(updated);
  };

  const handleToggleQuizRequired = (index: number) => {
    const updated = [...quizRequirements];
    updated[index] = { ...updated[index], required: !updated[index].required };
    setQuizRequirements(updated);
  };

  const handleSave = async () => {
    try {
      // Validate based on system type
      if (systemType === 'PASS_FAIL') {
        if (passFailFormData.requireProgress && !passFailFormData.minProgressPercentage) {
          Swal.fire({
            icon: 'error',
            title: 'กรุณาระบุเปอร์เซ็นต์การเรียน/เข้าเรียน',
          });
          return;
        }
        if (!passFailFormData.requireAllQuizzes && !passFailFormData.minQuizPassingPercentage) {
          Swal.fire({
            icon: 'error',
            title: 'กรุณาระบุเปอร์เซ็นต์การผ่านบททดสอบ',
          });
          return;
        }
      } else {
        if (gradeFormData.requireProgress && !gradeFormData.minProgressPercentage) {
          Swal.fire({
            icon: 'error',
            title: 'กรุณาระบุเปอร์เซ็นต์การเรียน/เข้าเรียน',
          });
          return;
        }
        if (!gradeFormData.requireAllQuizzes && !gradeFormData.minQuizPassingPercentage) {
          Swal.fire({
            icon: 'error',
            title: 'กรุณาระบุเปอร์เซ็นต์การผ่านบททดสอบ',
          });
          return;
        }
      }

      // Create or update grading system
      const systemData = systemType === 'PASS_FAIL' ? {
        courseId,
        systemType: 'PASS_FAIL' as const,
        passingScore: passFailFormData.passingScore,
        requireProgress: passFailFormData.requireProgress,
        minProgressPercentage: passFailFormData.minProgressPercentage,
        requireAllQuizzes: passFailFormData.requireAllQuizzes,
        minQuizPassingPercentage: passFailFormData.minQuizPassingPercentage,
      } : {
        courseId,
        systemType: 'GRADE' as const,
        requireProgress: gradeFormData.requireProgress,
        minProgressPercentage: gradeFormData.minProgressPercentage,
        requireAllQuizzes: gradeFormData.requireAllQuizzes,
        minQuizPassingPercentage: gradeFormData.minQuizPassingPercentage,
        certificateMinGrade: gradeFormData.certificateMinGrade || null,
      };

      if (gradingSystem) {
        const response = await gradingApi.updateSystem(courseId, systemData);
        if (!response.success) throw new Error(response.error);
      } else {
        const response = await gradingApi.createSystem(systemData);
        if (!response.success) throw new Error(response.error);
      }

      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: 'บันทึกการตั้งค่าสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      });

      fetchData();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกได้',
      });
    }
  };

  // Grade Criteria Handlers
  const handleCreateCriteria = () => {
    if (systemType !== 'GRADE') {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกระบบเกรดก่อน',
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

  // Weight Handlers
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
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">ไม่พบหลักสูตร</p>
        <Button onClick={() => router.push('/school/courses')} className="mt-4">
          กลับไปหน้าหลักสูตร
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">เงื่อนไขการจบหลักสูตรและระบบเกรด</h2>
        <p className="text-gray-600 mt-1">{course.title}</p>
      </div>

      {/* System Type Selection */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">เลือกประเภทระบบ</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              value="PASS_FAIL"
              checked={systemType === 'PASS_FAIL'}
              onChange={(e) => setSystemType(e.target.value as 'PASS_FAIL' | 'GRADE')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">ผ่าน/ไม่ผ่าน</span>
              <p className="text-sm text-gray-500">ตั้งเกณฑ์การผ่าน เช่น เรียนครบ ผ่านทุกการทดสอบเกินกี่ %</p>
            </div>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              value="GRADE"
              checked={systemType === 'GRADE'}
              onChange={(e) => setSystemType(e.target.value as 'PASS_FAIL' | 'GRADE')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">ระบบเกรด</span>
              <p className="text-sm text-gray-500">ตั้งเกณฑ์น้ำหนัก เกณฑ์ของแต่ละเกรด และคิดเกรดอัตโนมัติ รวมถึงเงื่อนไขการได้ใบประกาศ</p>
            </div>
          </label>
        </div>
      </Card>

      {/* Pass/Fail System */}
      {systemType === 'PASS_FAIL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Passing Score */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">เกณฑ์การผ่าน</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    คะแนนขั้นต่ำที่ต้องผ่าน (%)
                  </label>
                  <Input
                    type="number"
                    value={passFailFormData.passingScore}
                    onChange={(e) => setPassFailFormData({ ...passFailFormData, passingScore: parseInt(e.target.value) || 70 })}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </Card>

            {/* Progress/Attendance Requirement */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">เงื่อนไขการเรียน/เข้าเรียน</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireProgress"
                    checked={passFailFormData.requireProgress}
                    onChange={(e) => {
                      setPassFailFormData({
                        ...passFailFormData,
                        requireProgress: e.target.checked,
                        minProgressPercentage: e.target.checked ? (passFailFormData.minProgressPercentage ?? 100) : undefined,
                      });
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireProgress" className="text-sm font-medium text-gray-700">
                    กำหนดเงื่อนไขการเรียน/เข้าเรียน
                  </label>
                </div>

                {passFailFormData.requireProgress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      เปอร์เซ็นต์ขั้นต่ำที่ต้องเรียน/เข้าเรียน
                    </label>
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={passFailFormData.minProgressPercentage || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 100) {
                            setPassFailFormData({ ...passFailFormData, minProgressPercentage: value });
                          }
                        }}
                        placeholder="เช่น 100"
                        required={passFailFormData.requireProgress}
                      />
                      <span className="text-gray-600">%</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quiz Requirements */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">เงื่อนไขการผ่านบททดสอบ</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireAllQuizzes"
                    checked={passFailFormData.requireAllQuizzes}
                    onChange={(e) => {
                      setPassFailFormData({
                        ...passFailFormData,
                        requireAllQuizzes: e.target.checked,
                        minQuizPassingPercentage: e.target.checked ? undefined : (passFailFormData.minQuizPassingPercentage || 70),
                      });
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireAllQuizzes" className="text-sm font-medium text-gray-700">
                    ต้องผ่านทุกบททดสอบ
                  </label>
                </div>

                {!passFailFormData.requireAllQuizzes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      เปอร์เซ็นต์ขั้นต่ำที่ต้องผ่านบททดสอบ
                    </label>
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={passFailFormData.minQuizPassingPercentage || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 100) {
                            setPassFailFormData({ ...passFailFormData, minQuizPassingPercentage: value });
                          }
                        }}
                        placeholder="เช่น 70"
                        required={!passFailFormData.requireAllQuizzes}
                      />
                      <span className="text-gray-600">%</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Individual Quiz Requirements */}
            {allQuizzes.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">เงื่อนไขการผ่านแต่ละบททดสอบ</h3>
                <div className="space-y-4">
                  {quizRequirements.map((quizReq, index) => {
                    const quiz = allQuizzes.find((q: { id: string; title: string; lessonTitle: string }) => q.id === quizReq.quizId);
                    if (!quiz) return null;

                    return (
                      <div key={quizReq.quizId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                            <p className="text-sm text-gray-500">{quiz.lessonTitle}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={quizReq.required}
                                onChange={() => handleToggleQuizRequired(index)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">จำเป็นต้องผ่าน</span>
                            </label>
                          </div>
                        </div>

                        {quizReq.required && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              เปอร์เซ็นต์ที่ต้องผ่าน
                            </label>
                            <div className="flex items-center space-x-3">
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={quizReq.passingPercentage}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (value >= 1 && value <= 100) {
                                    handleUpdateQuizRequirement(index, 'passingPercentage', value);
                                  }
                                }}
                                required={quizReq.required}
                              />
                              <span className="text-gray-600">%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปเงื่อนไข</h3>
              <div className="space-y-3 text-sm">
                {passFailFormData.requireProgress && (
                  <div className="flex items-start space-x-2">
                    <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">การเรียน/เข้าเรียน</p>
                      <p className="text-gray-600">
                        ต้องเรียน/เข้าเรียนอย่างน้อย {passFailFormData.minProgressPercentage || 0}%
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">บททดสอบ</p>
                    <p className="text-gray-600">
                      {passFailFormData.requireAllQuizzes
                        ? 'ต้องผ่านทุกบททดสอบ'
                        : `ต้องผ่านโดยเฉลี่ยอย่างน้อย ${passFailFormData.minQuizPassingPercentage || 0}%`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">คะแนนรวม</p>
                    <p className="text-gray-600">
                      ต้องได้คะแนนรวมอย่างน้อย {passFailFormData.passingScore}% เพื่อผ่าน
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Button onClick={handleSave} className="w-full">
              <CheckIcon className="h-5 w-5 mr-2 inline" />
              บันทึกการตั้งค่า
            </Button>
          </div>
        </div>
      )}

      {/* Grade System */}
      {systemType === 'GRADE' && (
        <div className="space-y-6">
          {/* Completion Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Progress/Attendance Requirement */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">เงื่อนไขการเรียน/เข้าเรียน</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="gradeRequireProgress"
                      checked={gradeFormData.requireProgress}
                      onChange={(e) => {
                        setGradeFormData({
                          ...gradeFormData,
                          requireProgress: e.target.checked,
                          minProgressPercentage: e.target.checked ? (gradeFormData.minProgressPercentage ?? 100) : undefined,
                        });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="gradeRequireProgress" className="text-sm font-medium text-gray-700">
                      กำหนดเงื่อนไขการเรียน/เข้าเรียน
                    </label>
                  </div>

                  {gradeFormData.requireProgress && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        เปอร์เซ็นต์ขั้นต่ำที่ต้องเรียน/เข้าเรียน
                      </label>
                      <div className="flex items-center space-x-3">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={gradeFormData.minProgressPercentage || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value >= 1 && value <= 100) {
                              setGradeFormData({ ...gradeFormData, minProgressPercentage: value });
                            }
                          }}
                          placeholder="เช่น 100"
                          required={gradeFormData.requireProgress}
                        />
                        <span className="text-gray-600">%</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Quiz Requirements */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">เงื่อนไขการผ่านบททดสอบ</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="gradeRequireAllQuizzes"
                      checked={gradeFormData.requireAllQuizzes}
                      onChange={(e) => {
                        setGradeFormData({
                          ...gradeFormData,
                          requireAllQuizzes: e.target.checked,
                          minQuizPassingPercentage: e.target.checked ? undefined : (gradeFormData.minQuizPassingPercentage || 70),
                        });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="gradeRequireAllQuizzes" className="text-sm font-medium text-gray-700">
                      ต้องผ่านทุกบททดสอบ
                    </label>
                  </div>

                  {!gradeFormData.requireAllQuizzes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        เปอร์เซ็นต์ขั้นต่ำที่ต้องผ่านบททดสอบ
                      </label>
                      <div className="flex items-center space-x-3">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={gradeFormData.minQuizPassingPercentage || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value >= 1 && value <= 100) {
                              setGradeFormData({ ...gradeFormData, minQuizPassingPercentage: value });
                            }
                          }}
                          placeholder="เช่น 70"
                          required={!gradeFormData.requireAllQuizzes}
                        />
                        <span className="text-gray-600">%</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปเงื่อนไข</h3>
                <div className="space-y-3 text-sm">
                  {gradeFormData.requireProgress && (
                    <div className="flex items-start space-x-2">
                      <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">การเรียน/เข้าเรียน</p>
                        <p className="text-gray-600">
                          ต้องเรียน/เข้าเรียนอย่างน้อย {gradeFormData.minProgressPercentage || 0}%
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start space-x-2">
                    <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">บททดสอบ</p>
                      <p className="text-gray-600">
                        {gradeFormData.requireAllQuizzes
                          ? 'ต้องผ่านทุกบททดสอบ'
                          : `ต้องผ่านโดยเฉลี่ยอย่างน้อย ${gradeFormData.minQuizPassingPercentage || 0}%`}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Grade Criteria */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">เกณฑ์การให้เกรด</h3>
              <Button onClick={handleCreateCriteria}>
                <PlusIcon className="h-5 w-5 mr-2" />
                เพิ่มเกณฑ์
              </Button>
            </div>
            {gradingSystem?.criteria && gradingSystem.criteria.length > 0 ? (
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

          {/* Grade Weights */}
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

          {/* Certificate Requirements */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เงื่อนไขการได้ใบประกาศ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  เกรดขั้นต่ำที่ต้องได้เพื่อรับใบประกาศ
                </label>
                <select
                  value={gradeFormData.certificateMinGrade}
                  onChange={(e) => setGradeFormData({ ...gradeFormData, certificateMinGrade: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">-- เลือกเกรด --</option>
                  {gradingSystem?.criteria?.map((criteria) => (
                    <option key={criteria.id} value={criteria.grade}>
                      เกรด {criteria.grade} (≥{criteria.minScore}%)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  นักเรียนต้องได้เกรดขั้นต่ำตามที่กำหนดเพื่อรับใบประกาศนียบัตร
                </p>
              </div>
            </div>
          </Card>

          <Button onClick={handleSave} className="w-full">
            <CheckIcon className="h-5 w-5 mr-2 inline" />
            บันทึกการตั้งค่า
          </Button>
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
