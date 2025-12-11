'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { schoolsApi, type School } from '@/lib/api';
import { BuildingOfficeIcon, PlusIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    subscription: 'FREE',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    console.log('[SCHOOLS PAGE] Component mounted, fetching schools...');
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      console.log('[SCHOOLS PAGE] Fetching schools...');
      const startTime = Date.now();
      
      const response = await schoolsApi.getAll();
      
      const fetchTime = Date.now() - startTime;
      console.log(`[SCHOOLS PAGE] Fetched in ${fetchTime}ms`);
      
      console.log('[SCHOOLS PAGE] Response:', response);
      
      if (response.success) {
        if (response.data && Array.isArray(response.data)) {
          console.log(`[SCHOOLS PAGE] Received ${response.data.length} schools`);
          setSchools(response.data);
          
          if (response.data.length === 0) {
            console.log('[SCHOOLS PAGE] No schools found');
            // Don't show alert, just show empty state
          }
        } else {
          console.warn('[SCHOOLS PAGE] Response success but no data or data is not array:', response);
          setSchools([]);
        }
      } else {
        console.error('[SCHOOLS PAGE] Response not successful:', response);
        throw new Error(response.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error: any) {
      console.error('[SCHOOLS PAGE] Error fetching schools:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถโหลดข้อมูลสถาบันได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleViewDetails = async (school: School) => {
    try {
      const response = await schoolsApi.getById(school.id);
      if (response.success && response.data) {
        setSelectedSchool(response.data);
        setShowDetailModal(true);
      } else {
        throw new Error(response.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถโหลดรายละเอียดสถาบันได้',
      });
    }
  };

  const handleCreateSchool = async () => {
    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกชื่อสถาบัน',
      });
      return;
    }

    try {
      setCreating(true);
      const response = await schoolsApi.create({
        name: formData.name,
        domain: formData.domain || undefined,
        subscription: formData.subscription,
      });

      if (response.success && response.data) {
        Swal.fire({
          icon: 'success',
          title: 'สร้างสำเร็จ!',
          text: 'สร้างสถาบันใหม่เรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
        setShowCreateModal(false);
        setFormData({ name: '', domain: '', subscription: 'FREE' });
        await fetchSchools();
      } else {
        throw new Error(response.error || 'ไม่สามารถสร้างสถาบันได้');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถสร้างสถาบันได้',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการสถาบัน</h1>
          <p className="text-gray-600 mt-1">จัดการสถาบันทั้งหมดในระบบ</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2 inline" />
          เพิ่มสถาบันใหม่
        </Button>
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
          {schools.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">ยังไม่มีสถาบันในระบบ</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <PlusIcon className="h-5 w-5 mr-2 inline" />
                  สร้างสถาบันแรก
                </Button>
              </div>
            </Card>
          ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
          <Card key={school.id} hover>
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{school.name}</h3>
                  {school.domain && (
                <p className="text-sm text-gray-600">{school.domain}</p>
                  )}
              </div>
            </div>
            <div className="space-y-2 mb-4">
                {school.subscription && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">แพ็กเกจ:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      school.subscription === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                      school.subscription === 'BASIC' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {school.subscription}
                </span>
              </div>
                )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">วันที่สร้าง:</span>
                  <span className="text-sm text-gray-900">{formatDate(school.createdAt)}</span>
                </div>
                {school.userCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ผู้ใช้งาน:</span>
                    <span className="text-sm text-gray-900">{school.userCount} คน</span>
                  </div>
                )}
                {school.adminCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ผู้ดูแล:</span>
                    <span className="text-sm text-gray-900">{school.adminCount} คน</span>
              </div>
                )}
            </div>
            <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <Button variant="primary" className="flex-1" onClick={() => handleViewDetails(school)}>
                ดูรายละเอียด
              </Button>
              <Button variant="outline">
                แก้ไข
              </Button>
            </div>
          </Card>
        ))}
      </div>
          )}
        </>
      )}

      {/* Create School Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">เพิ่มสถาบันใหม่</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อสถาบัน <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="กรอกชื่อสถาบัน"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain (ไม่บังคับ)
                </label>
                <Input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แพ็กเกจ
                </label>
                <select
                  value={formData.subscription}
                  onChange={(e) => setFormData({ ...formData, subscription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="FREE">FREE</option>
                  <option value="BASIC">BASIC</option>
                  <option value="PREMIUM">PREMIUM</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleCreateSchool} disabled={creating}>
                {creating ? 'กำลังสร้าง...' : 'สร้างสถาบัน'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* School Details Modal */}
      {showDetailModal && selectedSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">รายละเอียดสถาบัน</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสถาบัน</label>
                  <p className="text-gray-900">{selectedSchool.name}</p>
                </div>
                {selectedSchool.domain && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                    <p className="text-gray-900">{selectedSchool.domain}</p>
                  </div>
                )}
                {selectedSchool.subscription && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">แพ็กเกจ</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedSchool.subscription === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                      selectedSchool.subscription === 'BASIC' ? 'bg-blue-100 text-blue-800' :
                      selectedSchool.subscription === 'ENTERPRISE' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSchool.subscription}
                    </span>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สร้าง</label>
                  <p className="text-gray-900">{formatDate(selectedSchool.createdAt)}</p>
                </div>
                {selectedSchool.userCount !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ใช้งานทั้งหมด</label>
                    <p className="text-gray-900">{selectedSchool.userCount} คน</p>
                  </div>
                )}
                {selectedSchool.adminCount !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ดูแล</label>
                    <p className="text-gray-900">{selectedSchool.adminCount} คน</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowDetailModal(false)}>
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

