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
import type { CourseCompletionRequirements, QuizPassingRequirement } from '@/lib/mockData';

export default function CourseCompletionSettingsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'completion' | 'grading'>('completion');
  
  // Grading System State
  const [gradingSystem, setGradingSystem] = useState<GradingSystem | null>(null);
  const [gradeWeights, setGradeWeights] = useState<GradeWeight[]>([]);
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

  // Completion Requirements State
  const [requirements, setRequirements] = useState<CourseCompletionRequirements>({
    requireProgress: true,
    minProgressPercentage: 100,
    requireAllQuizzes: false,
    minQuizPassingPercentage: 70,
    quizRequirements: [],
  });

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
        
        // Load completion requirements
        const courseData = courseResponse.data as any;
        if (courseData.completionRequirements) {
          const existingReqs = courseData.completionRequirements;
          const allQuizzes = getAllQuizzes(courseData);
          
          const existingQuizIds = existingReqs.quizRequirements?.map((q: QuizPassingRequirement) => q.quizId) || [];
          const currentQuizIds = allQuizzes.map((q: { id: string; title: string; lessonTitle: string }) => q.id);
          
      const newQuizReqs = allQuizzes
            .filter((q: { id: string; title: string; lessonTitle: string }) => !existingQuizIds.includes(q.id))
            .map((quiz: { id: string; title: string; lessonTitle: string }) => ({
          quizId: quiz.id,
          quizTitle: quiz.title,
          passingPercentage: existingReqs.minQuizPassingPercentage || 70,
          required: true,
        }));
      
      const updatedQuizReqs = [
            ...(existingReqs.quizRequirements || []).filter((q: QuizPassingRequirement) => currentQuizIds.includes(q.quizId)),
        ...newQuizReqs,
      ];
      
      setRequirements({
        ...existingReqs,
        quizRequirements: updatedQuizReqs,
        });
      } else {
          const courseData = courseResponse.data as any;
          const allQuizzes = getAllQuizzes(courseData);
      setRequirements({
        requireProgress: true,
        minProgressPercentage: 100,
        requireAllQuizzes: false,
        minQuizPassingPercentage: 70,
            quizRequirements: allQuizzes.map((quiz: { id: string; title: string; lessonTitle: string }) => ({
          quizId: quiz.id,
          quizTitle: quiz.title,
          passingPercentage: 70,
          required: true,
        })),
      });
    }
      }

      if (gradingResponse.success) {
        setGradingSystem(gradingResponse.data.gradingSystem);
        setGradeWeights(gradingResponse.data.gradeWeights);
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

  // Completion Requirements Handlers
  const handleUpdateRequirement = (field: keyof CourseCompletionRequirements, value: any) => {
    setRequirements({ ...requirements, [field]: value });
  };

  const handleUpdateQuizRequirement = (
    index: number,
    field: keyof QuizPassingRequirement,
    value: any
  ) => {
    const updated = [...(requirements.quizRequirements || [])];
    updated[index] = { ...updated[index], [field]: value };
    setRequirements({ ...requirements, quizRequirements: updated });
  };

  const handleToggleQuizRequired = (index: number) => {
    const updated = [...(requirements.quizRequirements || [])];
    updated[index] = { ...updated[index], required: !updated[index].required };
    setRequirements({ ...requirements, quizRequirements: updated });
  };

  const handleSaveCompletion = async () => {
    if (requirements.requireProgress && !requirements.minProgressPercentage) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณาระบุเปอร์เซ็นต์การเรียน/เข้าเรียน',
        text: 'คุณต้องระบุเปอร์เซ็นต์ขั้นต่ำที่ต้องเรียน/เข้าเรียน',
      });
      return;
    }

    if (!requirements.requireAllQuizzes && !requirements.minQuizPassingPercentage) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณาระบุเปอร์เซ็นต์การผ่านบททดสอบ',
        text: 'คุณต้องระบุเปอร์เซ็นต์ขั้นต่ำที่ต้องผ่านบททดสอบ',
      });
      return;
    }

    await Swal.fire({
      icon: 'success',
      title: 'บันทึกสำเร็จ!',
      text: 'เงื่อนไขการจบหลักสูตรถูกบันทึกเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false,
    });

    fetchData();
  };

  // Grading System Handlers
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

      {/* Section Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveSection('completion')}
            className={`px-6 py-4 font-medium text-sm transition-colors relative ${
              activeSection === 'completion'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            เงื่อนไขการจบหลักสูตร
            {activeSection === 'completion' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveSection('grading')}
            className={`px-6 py-4 font-medium text-sm transition-colors relative ${
              activeSection === 'grading'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ระบบเกรด
            {activeSection === 'grading' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Completion Requirements Section */}
      {activeSection === 'completion' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Progress/Attendance Requirement */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">เงื่อนไขการเรียน/เข้าเรียน</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireProgress"
                    checked={requirements.requireProgress || false}
                    onChange={(e) => {
                      handleUpdateRequirement('requireProgress', e.target.checked);
                      if (!e.target.checked) {
                        handleUpdateRequirement('minProgressPercentage', undefined);
                      } else if (!requirements.minProgressPercentage) {
                        handleUpdateRequirement('minProgressPercentage', 100);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireProgress" className="text-sm font-medium text-gray-700">
                    กำหนดเงื่อนไขการเรียน/เข้าเรียน
                  </label>
                </div>

                {requirements.requireProgress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      เปอร์เซ็นต์ขั้นต่ำที่ต้องเรียน/เข้าเรียน
                    </label>
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={requirements.minProgressPercentage || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 100) {
                            handleUpdateRequirement('minProgressPercentage', value);
                          }
                        }}
                        placeholder="เช่น 80"
                        required={requirements.requireProgress}
                      />
                      <span className="text-gray-600">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      นักเรียนต้องเรียน/เข้าเรียนอย่างน้อย {requirements.minProgressPercentage || 0}% ของหลักสูตร
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Quiz Requirements - General */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">เงื่อนไขการผ่านบททดสอบ (ทั่วไป)</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireAllQuizzes"
                    checked={requirements.requireAllQuizzes}
                    onChange={(e) => {
                      handleUpdateRequirement('requireAllQuizzes', e.target.checked);
                      if (e.target.checked) {
                        handleUpdateRequirement('minQuizPassingPercentage', undefined);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireAllQuizzes" className="text-sm font-medium text-gray-700">
                    ต้องผ่านทุกบททดสอบ
                  </label>
                </div>

                {!requirements.requireAllQuizzes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      เปอร์เซ็นต์ขั้นต่ำที่ต้องผ่านบททดสอบ
                    </label>
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={requirements.minQuizPassingPercentage || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 100) {
                            handleUpdateRequirement('minQuizPassingPercentage', value);
                          }
                        }}
                        placeholder="เช่น 70"
                        required={!requirements.requireAllQuizzes}
                      />
                      <span className="text-gray-600">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      นักเรียนต้องผ่านบททดสอบโดยเฉลี่ยอย่างน้อย {requirements.minQuizPassingPercentage || 0}%
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Individual Quiz Requirements */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">เงื่อนไขการผ่านแต่ละบททดสอบ</h2>
              {allQuizzes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>ยังไม่มีบททดสอบในหลักสูตรนี้</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requirements.quizRequirements?.map((quizReq, index) => {
                    const quiz = allQuizzes.find((q: { id: string; title: string; lessonTitle: string }) => q.id === quizReq.quizId);
                    if (!quiz) return null;

                    return (
                      <div key={quizReq.quizId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{quiz.title}</h3>
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
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">สรุปเงื่อนไข</h2>
              <div className="space-y-3 text-sm">
                {requirements.requireProgress && (
                  <div className="flex items-start space-x-2">
                    <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">การเรียน/เข้าเรียน</p>
                      <p className="text-gray-600">
                        ต้องเรียน/เข้าเรียนอย่างน้อย {requirements.minProgressPercentage || 0}%
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">บททดสอบ</p>
                    <p className="text-gray-600">
                      {requirements.requireAllQuizzes
                        ? 'ต้องผ่านทุกบททดสอบ'
                        : `ต้องผ่านโดยเฉลี่ยอย่างน้อย ${requirements.minQuizPassingPercentage || 0}%`}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Button onClick={handleSaveCompletion} className="w-full">
              <CheckIcon className="h-5 w-5 mr-2 inline" />
              บันทึกเงื่อนไขการจบหลักสูตร
            </Button>
          </div>
        </div>
      )}

      {/* Grading System Section */}
      {activeSection === 'grading' && (
        <div className="space-y-6">
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
        </div>
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
