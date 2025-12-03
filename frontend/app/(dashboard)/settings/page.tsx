'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { aiSettingsApi, type AIProvider } from '@/lib/api';
import {
  Cog6ToothIcon,
  BuildingOfficeIcon,
  PaintBrushIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function SettingsPage() {
  const [schoolName, setSchoolName] = useState('โรงเรียนกวดวิชา ABC');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [domain, setDomain] = useState('abc-tutoring.com');
  const [schoolLogo, setSchoolLogo] = useState<string>('');

  const handleSave = () => {
    // บันทึกชื่อโรงเรียนและตราโรงเรียนลง localStorage (ใน production จะบันทึกลง API)
    if (typeof window !== 'undefined') {
      localStorage.setItem('schoolName', schoolName);
      if (schoolLogo) {
        localStorage.setItem('schoolLogo', schoolLogo);
      }
    }
    
    Swal.fire({
      icon: 'success',
      title: 'บันทึกสำเร็จ!',
      text: 'การตั้งค่าถูกบันทึกเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
        <p className="text-gray-600 mt-1">จัดการการตั้งค่าสถาบันและระบบ</p>
      </div>

      {/* School Settings */}
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">ข้อมูลสถาบัน</h2>
        </div>
        <div className="space-y-4">
          <Input
            label="ชื่อสถาบัน"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
          <Input
            label="Domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="your-school.com"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ตราโรงเรียน (Logo)
            </label>
            <div className="flex items-center space-x-4">
              {schoolLogo ? (
                <div className="relative">
                  <img
                    src={schoolLogo}
                    alt="School Logo"
                    className="h-20 w-20 object-contain border-2 border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => setSchoolLogo('')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Logo</span>
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!file.type.startsWith('image/')) {
                        Swal.fire({
                          icon: 'error',
                          title: 'ประเภทไฟล์ไม่ถูกต้อง',
                          text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น',
                        });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setSchoolLogo(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button variant="outline" size="sm">
                    {schoolLogo ? 'เปลี่ยน Logo' : 'อัปโหลด Logo'}
                  </Button>
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Logo นี้จะถูกใช้ในใบประกาศนียบัตร
            </p>
          </div>
        </div>
      </Card>

      {/* Branding */}
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <PaintBrushIcon className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Branding</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              สีหลัก (Primary Color)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-20 rounded border border-gray-300"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">ตัวอย่างสี:</p>
            <div
              className="h-20 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              สีหลักของคุณ
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription */}
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <CreditCardIcon className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">แพ็กเกจ</h2>
        </div>
        <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">แพ็กเกจปัจจุบัน</p>
              <p className="text-2xl font-bold mt-1">Premium</p>
              <p className="text-sm opacity-90 mt-2">หมดอายุ: 15 มี.ค. 2025</p>
            </div>
            <Button variant="secondary" size="sm">
              อัปเกรดแพ็กเกจ
            </Button>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <ShieldCheckIcon className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">ความปลอดภัย</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">เพิ่มความปลอดภัยให้กับบัญชีของคุณ</p>
            </div>
            <Button variant="outline" size="sm">
              เปิดใช้งาน
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">เปลี่ยนรหัสผ่าน</p>
              <p className="text-sm text-gray-600">อัปเดตรหัสผ่านของคุณ</p>
            </div>
            <Button variant="outline" size="sm">
              เปลี่ยนรหัสผ่าน
            </Button>
          </div>
        </div>
      </Card>

      {/* AI Settings */}
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <SparklesIcon className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">ตั้งค่า AI สำหรับตรวจข้อสอบ</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เปิดใช้งาน AI
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">เปิดใช้งาน AI สำหรับช่วยตรวจข้อสอบ</span>
            </label>
          </div>

          {aiEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือก AI Provider
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="GEMINI">Gemini AI (Google)</option>
                  <option value="ML">ML Model (Python)</option>
                  <option value="BOTH">ทั้งสองแบบ (ML เป็นหลัก, Gemini เป็นสำรอง)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {aiProvider === 'GEMINI' && 'ใช้ Gemini AI จาก Google สำหรับตรวจข้อสอบ'}
                  {aiProvider === 'ML' && 'ใช้ ML Model ที่เทรนจากข้อมูลการให้คะแนนของอาจารย์'}
                  {aiProvider === 'BOTH' && 'ใช้ ML Model เป็นหลัก และใช้ Gemini เป็นสำรองเมื่อ ML ไม่พร้อม'}
                </p>
              </div>

              {aiProvider === 'ML' || aiProvider === 'BOTH' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ML API URL
                  </label>
                  <Input
                    value={mlApiUrl}
                    onChange={(e) => setMlApiUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL ของ ML API service (ต้อง deploy แยก)
                  </p>
                </div>
              ) : null}

              {(aiProvider === 'GEMINI' || aiProvider === 'BOTH') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gemini API Key {hasGeminiKey && <span className="text-green-600">(มี API Key อยู่แล้ว)</span>}
                  </label>
                  <Input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder={hasGeminiKey ? 'กรอกเพื่ออัพเดต API Key' : 'กรอก Gemini API Key'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    API Key จาก Google AI Studio (https://makersuite.google.com/app/apikey)
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAISettings}
                  disabled={loadingAI}
                >
                  {loadingAI ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า AI'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          บันทึกการตั้งค่า
        </Button>
      </div>
    </div>
  );
}

