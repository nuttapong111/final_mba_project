'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { aiSettingsApi, type AISettings } from '@/lib/api';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'GEMINI' as 'GEMINI' | 'ML' | 'BOTH',
    mlApiUrl: '',
    geminiApiKey: '',
    enabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await aiSettingsApi.getSettings();
      
      if (response.success && response.data) {
        setSettings(response.data);
        setFormData({
          provider: response.data.provider,
          mlApiUrl: response.data.mlApiUrl || '',
          geminiApiKey: '', // Don't show existing key for security
          enabled: response.data.enabled,
        });
      } else {
        throw new Error(response.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถโหลดการตั้งค่าได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await aiSettingsApi.updateSettings(formData);
      
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
        await fetchSettings();
      } else {
        throw new Error(response.error || 'ไม่สามารถบันทึกได้');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกการตั้งค่าได้',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
        <p className="text-gray-600 mt-1">จัดการการตั้งค่าระบบ</p>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : (
        <>
          {/* AI Settings */}
          <Card>
            <div className="flex items-center space-x-3 mb-6">
              <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">การตั้งค่า AI</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value as 'GEMINI' | 'ML' | 'BOTH' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="GEMINI">Gemini</option>
                  <option value="ML">ML Model</option>
                  <option value="BOTH">Both (Gemini + ML)</option>
                </select>
              </div>

              {(formData.provider === 'ML' || formData.provider === 'BOTH') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ML API URL
                  </label>
                  <Input
                    type="text"
                    value={formData.mlApiUrl}
                    onChange={(e) => setFormData({ ...formData, mlApiUrl: e.target.value })}
                    placeholder="https://your-ml-api.com"
                  />
                </div>
              )}

              {(formData.provider === 'GEMINI' || formData.provider === 'BOTH') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gemini API Key {settings?.hasGeminiKey && '(มีอยู่แล้ว)'}
                  </label>
                  <Input
                    type="password"
                    value={formData.geminiApiKey}
                    onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                    placeholder={settings?.hasGeminiKey ? 'เว้นว่างไว้เพื่อไม่เปลี่ยน' : 'Enter Gemini API Key'}
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                  เปิดใช้งาน AI
                </label>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
