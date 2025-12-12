'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function NewLessonPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [contents, setContents] = useState<Array<{
    type: 'video' | 'document' | 'live_link' | 'quiz' | 'pre_test' | 'poll';
    title: string;
    url?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
  }>>([]);

  const handleAddContent = (type: 'video' | 'document' | 'live_link' | 'quiz' | 'pre_test' | 'poll') => {
    setContents([
      ...contents,
      {
        type,
        title: type === 'poll' ? 'แบบประเมินความพึงพอใจ' : '',
        url: type === 'video' || type === 'live_link' ? '' : undefined,
        fileUrl: type === 'document' ? '' : undefined,
        duration: type === 'video' ? undefined : undefined,
      },
    ]);
  };

  const handleUpdateContent = (index: number, field: string, value: any) => {
    const updated = [...contents];
    updated[index] = { ...updated[index], [field]: value };
    setContents(updated);
  };

  const handleRemoveContent = (index: number) => {
    setContents(contents.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await Swal.fire({
      icon: 'success',
      title: 'สร้างบทเรียนสำเร็จ!',
      text: 'บทเรียนถูกสร้างเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false,
    });
    
    router.push(`/school/courses/${courseId}/lessons`);
  };

  const contentTypes = [
    { type: 'pre_test' as const, label: 'แบบทดสอบก่อนเรียน', icon: '📝' },
    { type: 'video' as const, label: 'วิดีโอการสอน', icon: '🎥' },
    { type: 'document' as const, label: 'เอกสารประกอบ', icon: '📄' },
    { type: 'live_link' as const, label: 'ลิงก์สอนสด', icon: '🔗' },
    { type: 'quiz' as const, label: 'ข้อสอบ', icon: '📋' },
    { type: 'poll' as const, label: 'แบบประเมิน', icon: '📊' },
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">เพิ่มบทเรียนใหม่</h1>
          <p className="text-gray-600 mt-1">สร้างบทเรียนและเพิ่มเนื้อหา</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลบทเรียน</h2>
              <div className="space-y-4">
                <Input
                  label="ชื่อบทเรียน"
                  name="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น บทที่ 1: พื้นฐานคณิตศาสตร์"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    คำอธิบาย
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="อธิบายบทเรียน..."
                  />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">เนื้อหาบทเรียน</h2>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((ct) => (
                    <button
                      key={ct.type}
                      type="button"
                      onClick={() => handleAddContent(ct.type)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {ct.icon} {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {contents.map((content, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        {contentTypes.find(ct => ct.type === content.type)?.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveContent(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <Input
                        label="ชื่อเนื้อหา"
                        value={content.title}
                        onChange={(e) => handleUpdateContent(index, 'title', e.target.value)}
                        placeholder="เช่น วิดีโอการสอน: พื้นฐานคณิตศาสตร์"
                        required
                      />
                      {content.type === 'live_link' && (
                        <Input
                          label="URL"
                          type="url"
                          value={content.url || ''}
                          onChange={(e) => handleUpdateContent(index, 'url', e.target.value)}
                          placeholder="https://..."
                          required
                        />
                      )}
                      {content.type === 'video' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              วิธีเพิ่มวิดีโอ
                            </label>
                            <div className="flex space-x-4 mb-3">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`video-source-${index}`}
                                  checked={!content.fileUrl || content.fileUrl === ''}
                                  onChange={() => {
                                    handleUpdateContent(index, 'fileUrl', undefined);
                                    handleUpdateContent(index, 'fileName', undefined);
                                    handleUpdateContent(index, 'fileSize', undefined);
                                    handleUpdateContent(index, 'file', undefined);
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700">ใช้ URL</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`video-source-${index}`}
                                  checked={content.fileUrl !== undefined && content.fileUrl !== ''}
                                  onChange={() => {
                                    handleUpdateContent(index, 'url', undefined);
                                    // Set fileUrl to a placeholder value to enable file upload option
                                    if (!content.fileUrl || content.fileUrl === '') {
                                      handleUpdateContent(index, 'fileUrl', 'pending');
                                    }
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700">อัพโหลดไฟล์</span>
                              </label>
                            </div>
                          </div>
                          {!content.fileUrl || content.fileUrl === '' ? (
                            <Input
                              label="URL วิดีโอ"
                              type="url"
                              value={content.url || ''}
                              onChange={(e) => handleUpdateContent(index, 'url', e.target.value)}
                              placeholder="https://..."
                            />
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                ไฟล์วิดีโอ
                              </label>
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // ตรวจสอบขนาดไฟล์ (สูงสุด 2GB)
                                    if (file.size > 2 * 1024 * 1024 * 1024) {
                                      Swal.fire({
                                        icon: 'error',
                                        title: 'ไฟล์ใหญ่เกินไป',
                                        text: 'ขนาดไฟล์ไม่ควรเกิน 2GB',
                                      });
                                      return;
                                    }
                                    // ตรวจสอบประเภทไฟล์
                                    if (!file.type.startsWith('video/')) {
                                      Swal.fire({
                                        icon: 'error',
                                        title: 'ประเภทไฟล์ไม่ถูกต้อง',
                                        text: 'กรุณาเลือกไฟล์วิดีโอเท่านั้น',
                                      });
                                      return;
                                    }
                                    // เก็บไฟล์จริงไว้ใน state สำหรับอัพโหลด
                                    handleUpdateContent(index, 'file', file);
                                    // สร้าง URL สำหรับแสดงตัวอย่าง (local preview)
                                    const fileUrl = URL.createObjectURL(file);
                                    handleUpdateContent(index, 'fileUrl', fileUrl);
                                    handleUpdateContent(index, 'fileName', file.name);
                                    handleUpdateContent(index, 'fileSize', file.size);
                                    
                                    // อ่าน duration จากไฟล์วิดีโออัตโนมัติ
                                    const video = document.createElement('video');
                                    video.preload = 'metadata';
                                    video.onloadedmetadata = () => {
                                      window.URL.revokeObjectURL(fileUrl);
                                      const durationInMinutes = Math.ceil(video.duration / 60);
                                      handleUpdateContent(index, 'duration', durationInMinutes);
                                    };
                                    video.src = fileUrl;
                                  }
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              />
                              {content.fileUrl && content.fileUrl !== 'pending' && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">📹</span>
                                      <div className="flex flex-col">
                                        <span className="text-sm text-gray-700 font-medium">
                                          {content.fileName || 'ไฟล์วิดีโอที่เลือก'}
                                        </span>
                                        {content.fileSize && (
                                          <span className="text-xs text-gray-500">
                                            {formatFileSize(content.fileSize)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateContent(index, 'fileUrl', undefined);
                                        handleUpdateContent(index, 'fileName', undefined);
                                        handleUpdateContent(index, 'fileSize', undefined);
                                      }}
                                      className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <Input
                            label="ระยะเวลา (นาที)"
                            type="number"
                            value={content.duration || ''}
                            onChange={(e) => handleUpdateContent(index, 'duration', parseInt(e.target.value))}
                            placeholder="45"
                          />
                        </>
                      )}
                      {content.type === 'document' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            ไฟล์เอกสาร
                          </label>
                          <input
                            type="file"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            accept=".pdf,.doc,.docx"
                          />
                        </div>
                      )}
                      {content.type === 'poll' && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            ใช้ปุ่มด้านล่างเพื่อสร้างแบบประเมินแบบละเอียด
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push(`/school/courses/${courseId}/lessons/poll`)}
                          >
                            สร้างแบบประเมินแบบละเอียด
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {contents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>ยังไม่มีเนื้อหา คลิกปุ่มด้านบนเพื่อเพิ่มเนื้อหา</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">คำแนะนำ</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• เพิ่มแบบทดสอบก่อนเรียนเพื่อวัดความรู้พื้นฐาน</li>
                <li>• เพิ่มวิดีโอการสอนหรือเอกสารประกอบ</li>
                <li>• เพิ่มข้อสอบหลังเรียนเพื่อประเมินผล</li>
                <li>• สามารถเพิ่มลิงก์สอนสดได้</li>
                <li>• เพิ่มแบบประเมินความพึงพอใจหลังข้อสอบ</li>
              </ul>
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



