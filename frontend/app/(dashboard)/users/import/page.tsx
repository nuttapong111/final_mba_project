'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface ImportUser {
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'school_admin';
  password?: string;
}

interface ImportResult {
  success: ImportUser[];
  failed: Array<{ user: ImportUser; error: string }>;
}

export default function BulkImportUsersPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<ImportUser[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ImportUser[]>([]);

  // Template CSV structure
  const csvTemplate = `name,email,role,password
อาจารย์ สมศรี,teacher1@example.com,teacher,password123
นักเรียน ดีใจ,student1@example.com,student,password123
นักเรียน สมชาย,student2@example.com,student,password123`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (csvText: string): ImportUser[] => {
    const lines = csvText.split('\n').filter((line) => line.trim());
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    
    const users: ImportUser[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.length >= 3) {
        const user: ImportUser = {
          name: values[headers.indexOf('name')] || '',
          email: values[headers.indexOf('email')] || '',
          role: (values[headers.indexOf('role')] || 'student') as 'teacher' | 'student' | 'school_admin',
          password: values[headers.indexOf('password')] || undefined,
        };
        
        // Validate required fields
        if (user.name && user.email && user.role) {
          users.push(user);
        }
      }
    }
    
    return users;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ไม่ถูกต้อง',
        text: 'กรุณาอัปโหลดไฟล์ CSV เท่านั้น',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          Swal.fire({
            icon: 'error',
            title: 'ไม่พบข้อมูล',
            text: 'ไม่พบข้อมูลผู้ใช้ในไฟล์ กรุณาตรวจสอบรูปแบบไฟล์',
          });
          return;
        }
        setPreviewData(parsed);
        setImportData(parsed);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์',
        });
      }
    };
    reader.readAsText(file);
  };

  const validateUser = (user: ImportUser): string | null => {
    if (!user.name || user.name.trim() === '') {
      return 'กรุณากรอกชื่อ';
    }
    if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      return 'อีเมลไม่ถูกต้อง';
    }
    if (!['teacher', 'student', 'school_admin'].includes(user.role)) {
      return 'บทบาทไม่ถูกต้อง (ต้องเป็น teacher, student, หรือ school_admin)';
    }
    return null;
  };

  const handleImport = async () => {
    if (importData.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่มีข้อมูล',
        text: 'กรุณาอัปโหลดไฟล์ก่อน',
      });
      return;
    }

    setIsProcessing(true);
    const result: ImportResult = {
      success: [],
      failed: [],
    };

    // Simulate import process
    for (const user of importData) {
      const error = validateUser(user);
      if (error) {
        result.failed.push({ user, error });
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 100));
        result.success.push(user);
      }
    }

    setImportResult(result);
    setIsProcessing(false);

    if (result.failed.length === 0) {
      Swal.fire({
        icon: 'success',
        title: 'นำเข้าสำเร็จ!',
        text: `นำเข้าผู้ใช้ ${result.success.length} คนเรียบร้อยแล้ว`,
        confirmButtonText: 'ตกลง',
      }).then(() => {
        router.push('/users');
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'นำเข้าบางส่วน',
        html: `
          <p>นำเข้าสำเร็จ: ${result.success.length} คน</p>
          <p>นำเข้าไม่สำเร็จ: ${result.failed.length} คน</p>
          <p class="mt-2 text-sm text-gray-600">กรุณาตรวจสอบรายละเอียดด้านล่าง</p>
        `,
        confirmButtonText: 'ตกลง',
      });
    }
  };

  const handleReset = () => {
    setImportData([]);
    setPreviewData([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      teacher: 'อาจารย์',
      student: 'นักเรียน',
      school_admin: 'ผู้ดูแลสถาบัน',
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Import ผู้ใช้งาน</h1>
            <p className="text-gray-600 mt-1">นำเข้าผู้ใช้งานหลายคนพร้อมกันด้วยไฟล์ CSV</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">วิธีใช้งาน</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>ดาวน์โหลดไฟล์ Template CSV</li>
            <li>กรอกข้อมูลผู้ใช้ตาม Template (name, email, role, password)</li>
            <li>อัปโหลดไฟล์ CSV ที่กรอกข้อมูลแล้ว</li>
            <li>ตรวจสอบข้อมูลก่อนนำเข้า</li>
            <li>กดปุ่ม "นำเข้าผู้ใช้" เพื่อดำเนินการ</li>
          </ol>
          <div className="pt-4">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <DocumentArrowDownIcon className="h-5 w-5 mr-2 inline" />
              ดาวน์โหลด Template CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* File Upload */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">อัปโหลดไฟล์ CSV</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">ลากไฟล์ CSV มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button variant="outline" as="span">
              เลือกไฟล์ CSV
            </Button>
          </label>
          {previewData.length > 0 && (
            <p className="text-green-600 mt-4 font-medium">
              ✓ พบข้อมูล {previewData.length} รายการ
            </p>
          )}
        </div>
      </Card>

      {/* Preview Data */}
      {previewData.length > 0 && !importResult && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">ตัวอย่างข้อมูล ({previewData.length} รายการ)</h2>
            <Button variant="outline" onClick={handleReset}>
              ล้างข้อมูล
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">ชื่อ</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">อีเมล</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">บทบาท</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">รหัสผ่าน</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 10).map((user, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.password ? '••••••••' : <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 10 && (
              <p className="text-sm text-gray-600 mt-4 text-center">
                แสดง 10 รายการแรก จากทั้งหมด {previewData.length} รายการ
              </p>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleImport} disabled={isProcessing}>
              {isProcessing ? 'กำลังนำเข้า...' : 'นำเข้าผู้ใช้'}
            </Button>
          </div>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">ผลการนำเข้า</h2>
          
          {/* Success Summary */}
          {importResult.success.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">
                  นำเข้าสำเร็จ: {importResult.success.length} คน
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-200">
                      <th className="text-left py-2 px-3 font-medium text-green-900">ชื่อ</th>
                      <th className="text-left py-2 px-3 font-medium text-green-900">อีเมล</th>
                      <th className="text-left py-2 px-3 font-medium text-green-900">บทบาท</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.success.map((user, index) => (
                      <tr key={index} className="border-b border-green-100">
                        <td className="py-2 px-3">{user.name}</td>
                        <td className="py-2 px-3">{user.email}</td>
                        <td className="py-2 px-3">{getRoleLabel(user.role)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failed Summary */}
          {importResult.failed.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2 mb-2">
                <XCircleIcon className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">
                  นำเข้าไม่สำเร็จ: {importResult.failed.length} คน
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-200">
                      <th className="text-left py-2 px-3 font-medium text-red-900">ชื่อ</th>
                      <th className="text-left py-2 px-3 font-medium text-red-900">อีเมล</th>
                      <th className="text-left py-2 px-3 font-medium text-red-900">บทบาท</th>
                      <th className="text-left py-2 px-3 font-medium text-red-900">ข้อผิดพลาด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.failed.map((item, index) => (
                      <tr key={index} className="border-b border-red-100">
                        <td className="py-2 px-3">{item.user.name || '-'}</td>
                        <td className="py-2 px-3">{item.user.email || '-'}</td>
                        <td className="py-2 px-3">{getRoleLabel(item.user.role)}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center space-x-1">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                            <span className="text-red-700">{item.error}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={handleReset}>
              นำเข้าใหม่
            </Button>
            <Button onClick={() => router.push('/users')}>
              กลับไปหน้าผู้ใช้งาน
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

