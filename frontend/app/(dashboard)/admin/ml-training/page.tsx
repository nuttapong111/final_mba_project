'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { mlTrainingApi, type MLTrainingStats, type MLTrainingSettings, type MLTrainingHistory } from '@/lib/api';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function MLTrainingPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [stats, setStats] = useState<MLTrainingStats | null>(null);
  const [settings, setSettings] = useState<MLTrainingSettings>({
    aiWeight: 0.3,
    teacherWeight: 0.7,
  });
  const [history, setHistory] = useState<MLTrainingHistory[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsResponse, settingsResponse, historyResponse] = await Promise.all([
        mlTrainingApi.getStats(user?.schoolId || null),
        mlTrainingApi.getSettings(user?.schoolId || null),
        mlTrainingApi.getHistory(user?.schoolId || null, 10),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
      if (settingsResponse.success && settingsResponse.data) {
        setSettings(settingsResponse.data);
      }
      if (historyResponse.success && historyResponse.data) {
        setHistory(historyResponse.data);
      }
    } catch (error) {
      console.error('Error fetching ML training data:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    // Validate weights sum to 1.0
    const totalWeight = settings.aiWeight + settings.teacherWeight;
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ถูกต้อง',
        text: 'ผลรวมของ weight ต้องเท่ากับ 1.0',
      });
      return;
    }

    try {
      setSavingSettings(true);
      const response = await mlTrainingApi.updateSettings(settings, user?.schoolId || null);

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
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
      setSavingSettings(false);
    }
  };

  const handleTrain = async () => {
    const result = await Swal.fire({
      title: 'ยืนยันการเทรนโมเดล',
      text: 'คุณต้องการเทรนโมเดล ML ด้วยข้อมูลปัจจุบันหรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'เทรน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3b82f6',
    });

    if (!result.isConfirmed) return;

    try {
      setTraining(true);
      const response = await mlTrainingApi.train(user?.schoolId || null);

      if (response.success && response.data) {
        await Swal.fire({
          icon: 'success',
          title: 'เทรนโมเดลสำเร็จ!',
          html: `
            <div class="text-left">
              <p><strong>ความแม่นยำ (R²):</strong> ${((response.data.accuracy || 0) * 100).toFixed(2)}%</p>
              <p><strong>Mean Squared Error:</strong> ${(response.data.mse || 0).toFixed(2)}</p>
              <p><strong>Mean Absolute Error:</strong> ${(response.data.mae || 0).toFixed(2)}</p>
              <p><strong>จำนวนข้อมูล:</strong> ${response.data.samples || 0}</p>
            </div>
          `,
          confirmButtonText: 'ตกลง',
        });
        await fetchData(); // Refresh data
      } else {
        throw new Error(response.error || 'การเทรนโมเดลล้มเหลว');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถเทรนโมเดลได้',
      });
    } finally {
      setTraining(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">การเทรนโมเดล ML</h1>
          <p className="text-gray-600 mt-1">จัดการและตรวจสอบการเทรนโมเดล Machine Learning</p>
        </div>
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">การเทรนโมเดล ML</h1>
        <p className="text-gray-600 mt-1">จัดการและตรวจสอบการเทรนโมเดล Machine Learning</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ข้อมูลทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(stats?.totalSamples ?? 0).toLocaleString('th-TH')}
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">มี AI Feedback</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(stats?.samplesWithAI ?? 0).toLocaleString('th-TH')}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Cog6ToothIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ใช้ในการเทรนแล้ว</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(stats?.samplesUsedForTraining ?? 0).toLocaleString('th-TH')}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ความแม่นยำล่าสุด</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats && stats.lastTrainingAccuracy !== null
                  ? `${(stats.lastTrainingAccuracy * 100).toFixed(1)}%`
                  : '-'}
              </p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Training Settings */}
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">ตั้งค่า Weight ของแหล่งข้อมูล</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>คำอธิบาย:</strong> ตั้งค่าความสำคัญของแหล่งข้อมูลในการเทรนโมเดล
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>
                <strong>AI Weight:</strong> น้ำหนักของคะแนนจาก AI (คำตอบจาก AI)
              </li>
              <li>
                <strong>Teacher Weight:</strong> น้ำหนักของคะแนนจากอาจารย์ (การแก้ไขสุดท้ายจากอาจารย์)
              </li>
              <li>ผลรวมของทั้งสองต้องเท่ากับ 1.0</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Weight (น้ำหนักจาก AI)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={settings.aiWeight}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    aiWeight: parseFloat(e.target.value) || 0,
                    teacherWeight: 1 - (parseFloat(e.target.value) || 0),
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                คะแนนจาก AI จะมีน้ำหนัก {settings.aiWeight.toFixed(1)} ({settings.aiWeight * 100}%)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teacher Weight (น้ำหนักจากอาจารย์)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={settings.teacherWeight}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    teacherWeight: parseFloat(e.target.value) || 0,
                    aiWeight: 1 - (parseFloat(e.target.value) || 0),
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                คะแนนจากอาจารย์จะมีน้ำหนัก {settings.teacherWeight.toFixed(1)} ({settings.teacherWeight * 100}%)
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700">
              ผลรวม Weight: <span className="text-blue-600">{settings.aiWeight + settings.teacherWeight}</span>
              {Math.abs(settings.aiWeight + settings.teacherWeight - 1.0) > 0.01 && (
                <span className="text-red-600 ml-2">⚠️ ต้องเท่ากับ 1.0</span>
              )}
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Train Model */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <PlayIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">เทรนโมเดล</h2>
          </div>
          <Button onClick={handleTrain} disabled={training || (stats?.totalSamples ?? 0) < 10}>
            {training ? 'กำลังเทรน...' : 'เริ่มเทรนโมเดล'}
          </Button>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            {stats && (stats.totalSamples ?? 0) < 10 ? (
              <span className="text-red-600">
                ⚠️ ข้อมูลไม่เพียงพอสำหรับเทรนโมเดล (พบ {stats.totalSamples ?? 0} ตัวอย่าง ต้องการอย่างน้อย 10)
              </span>
            ) : (
              <>
                <strong>หมายเหตุ:</strong> การเทรนโมเดลจะใช้ข้อมูลทั้งหมดที่มี AI Feedback และ Teacher Feedback
                โดยจะคำนวณคะแนนเป้าหมายจากสูตร: <code className="bg-white px-2 py-1 rounded">
                  targetScore = AI Weight × aiScore + Teacher Weight × teacherScore
                </code>
              </>
            )}
          </p>
        </div>
      </Card>

      {/* Training History */}
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <ClockIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">ประวัติการเทรน</h2>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">ยังไม่มีประวัติการเทรน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ความแม่นยำ (R²)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MSE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MAE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จำนวนข้อมูล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'completed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          สำเร็จ
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          ล้มเหลว
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.accuracy !== null ? `${(item.accuracy * 100).toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.mse !== null ? item.mse.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.mae !== null ? item.mae.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.samples.toLocaleString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      AI: {item.aiWeight.toFixed(1)}, Teacher: {item.teacherWeight.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
