'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  AcademicCapIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  QrCodeIcon,
  UserIcon,
  CalendarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { mockCourses } from '@/lib/mockData';

interface CertificateElement {
  id: string;
  type: 'studentName' | 'courseName' | 'completionDate' | 'signatureName' | 'signaturePosition' | 'signatureImage' | 'qrCode' | 'schoolName' | 'schoolLogo';
  label: string;
  enabled: boolean;
  x: number; // percentage
  y: number; // percentage
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  signatureIndex?: number; // สำหรับระบุว่าเป็นลายเซ็นของบุคคลที่เท่าไร (1, 2, 3)
}

interface SignaturePerson {
  id: number;
  enabled: boolean;
  name: string;
  position: string;
  signatureImage: string;
  nameX: number;
  nameY: number;
  positionX: number;
  positionY: number;
  signatureX: number;
  signatureY: number;
  nameFontSize: number;
  positionFontSize: number;
  nameColor: string;
  positionColor: string;
}

export default function CourseCertificatePage() {
  const params = useParams();
  const courseId = params.id as string;
  const course = mockCourses.find(c => c.id === courseId);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [templateImage, setTemplateImage] = useState<string | null>(null);
  // ดึงข้อมูลโรงเรียนจาก localStorage หรือ mock data (ใน production จะดึงจาก API)
  const [schoolName, setSchoolName] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('schoolName');
      return saved || 'โรงเรียนกวดวิชา ABC';
    }
    return 'โรงเรียนกวดวิชา ABC';
  });
  const [schoolLogo, setSchoolLogo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('schoolLogo');
      return saved || '';
    }
    return '';
  });
  
  // อัพเดทข้อมูลโรงเรียนเมื่อมีการเปลี่ยนแปลงใน settings
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== 'undefined') {
        const name = localStorage.getItem('schoolName');
        const logo = localStorage.getItem('schoolLogo');
        if (name) setSchoolName(name);
        if (logo !== null) setSchoolLogo(logo);
      }
    };
    
    // ตรวจสอบการเปลี่ยนแปลงทุก 1 วินาที (เพราะ localStorage ไม่ trigger storage event ในหน้าเดียวกัน)
    const interval = setInterval(() => {
      handleStorageChange();
    }, 1000);
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const [elements, setElements] = useState<CertificateElement[]>([
    { id: '1', type: 'studentName', label: 'ชื่อผู้ที่ได้รับ', enabled: true, x: 50, y: 40, fontSize: 24, color: '#000000' },
    { id: '2', type: 'courseName', label: 'ชื่อหลักสูตร', enabled: true, x: 50, y: 50, fontSize: 20, color: '#000000' },
    { id: '3', type: 'completionDate', label: 'วันเดือนปีที่ได้รับ', enabled: true, x: 50, y: 60, fontSize: 16, color: '#000000' },
    { id: '4', type: 'schoolName', label: 'ชื่อโรงเรียน', enabled: true, x: 50, y: 15, fontSize: 18, color: '#000000' },
    { id: '5', type: 'schoolLogo', label: 'ตราโรงเรียน', enabled: true, x: 20, y: 15, fontSize: 0 },
    { id: '7', type: 'qrCode', label: 'QR Code', enabled: true, x: 10, y: 90, fontSize: 0 },
  ]);

  const [signaturePersons, setSignaturePersons] = useState<SignaturePerson[]>([
    {
      id: 1,
      enabled: true,
      name: 'ผู้อำนวยการ',
      position: 'ผู้อำนวยการโรงเรียน',
      signatureImage: '',
      nameX: 65,
      nameY: 80,
      positionX: 65,
      positionY: 85,
      signatureX: 65,
      signatureY: 70,
      nameFontSize: 16,
      positionFontSize: 14,
      nameColor: '#000000',
      positionColor: '#000000',
    },
    {
      id: 2,
      enabled: false,
      name: '',
      position: '',
      signatureImage: '',
      nameX: 50,
      nameY: 80,
      positionX: 50,
      positionY: 85,
      signatureX: 50,
      signatureY: 70,
      nameFontSize: 16,
      positionFontSize: 14,
      nameColor: '#000000',
      positionColor: '#000000',
    },
    {
      id: 3,
      enabled: false,
      name: '',
      position: '',
      signatureImage: '',
      nameX: 35,
      nameY: 80,
      positionX: 35,
      positionY: 85,
      signatureX: 35,
      signatureY: 70,
      nameFontSize: 16,
      positionFontSize: 14,
      nameColor: '#000000',
      positionColor: '#000000',
    },
  ]);

  const [settings, setSettings] = useState({
    issuerName: 'โรงเรียนกวดวิชา ABC',
  });

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setTemplateImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleElementToggle = (id: string) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, enabled: !el.enabled } : el
    ));
  };

  const handleElementUpdate = useCallback((id: string, field: keyof CertificateElement, value: any) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, [field]: value } : el
    ));
  }, []);

  const [draggingType, setDraggingType] = useState<{ type: 'element' | 'signature'; id: string; field?: string } | null>(null);

  const handleSignaturePersonUpdate = useCallback((personId: number, field: keyof SignaturePerson, value: any) => {
    setSignaturePersons(prev => prev.map(person =>
      person.id === personId ? { ...person, [field]: value } : person
    ));
  }, []);

  const handleSignatureImageUpload = (personId: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
        handleSignaturePersonUpdate(personId, 'signatureImage', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setDraggingType({ type: 'element', id: elementId });
    const element = elements.find(el => el.id === elementId);
    if (element && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setDragOffset({
        x: x - element.x,
        y: y - element.y,
      });
    }
  };


  // เพิ่ม global mouse event listeners สำหรับ drag & drop ที่ทำงานได้ดีกว่า
  useEffect(() => {
    if (!draggingType) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
        const x = Math.max(0, Math.min(100, mouseX - dragOffset.x));
        const y = Math.max(0, Math.min(100, mouseY - dragOffset.y));
        
        if (draggingType.type === 'element') {
          handleElementUpdate(draggingType.id, 'x', x);
          handleElementUpdate(draggingType.id, 'y', y);
        } else if (draggingType.type === 'signature' && draggingType.field) {
          const personId = parseInt(draggingType.id);
          setSignaturePersons(prev => {
            const person = prev.find(p => p.id === personId);
            if (person) {
              if (draggingType.field === 'signature') {
                return prev.map(p => p.id === personId ? { ...p, signatureX: x, signatureY: y } : p);
              } else if (draggingType.field === 'name') {
                return prev.map(p => p.id === personId ? { ...p, nameX: x, nameY: y } : p);
              } else if (draggingType.field === 'position') {
                return prev.map(p => p.id === personId ? { ...p, positionX: x, positionY: y } : p);
              }
            }
            return prev;
          });
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggingType(null);
      setDragOffset({ x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingType, dragOffset, handleElementUpdate]);

  const generateQRCode = (text: string): string => {
    // ใช้ QR code API หรือ library
    // สำหรับ demo ใช้ placeholder
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  };

  const getElementDisplayValue = (element: CertificateElement): string => {
    switch (element.type) {
      case 'studentName':
        return 'นาย/นาง/นางสาว [ชื่อผู้เรียน]';
      case 'courseName':
        return course?.title || '[ชื่อหลักสูตร]';
      case 'completionDate':
        return new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
      case 'schoolName':
        return schoolName;
      case 'qrCode':
        return '';
      default:
        return '';
    }
  };

  const handleSave = async () => {
    if (!templateImage) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาแนบ Template',
        text: 'คุณต้องแนบรูป Template ใบประกาศนียบัตรก่อน',
      });
      return;
    }

    await Swal.fire({
      icon: 'success',
      title: 'บันทึกสำเร็จ!',
      text: 'การตั้งค่าใบประกาศนียบัตรถูกบันทึกเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handlePreview = () => {
    if (!templateImage) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาแนบ Template',
        text: 'คุณต้องแนบรูป Template ใบประกาศนียบัตรก่อน',
      });
      return;
    }

    // แสดง preview ใน modal
    const enabledElements = elements.filter(el => el.enabled);
    const enabledSignatures = signaturePersons.filter(p => p.enabled);
    const previewHTML = `
      <div style="position: relative; width: 800px; max-width: 100%; margin: 0 auto;">
        <img src="${templateImage}" style="width: 100%; height: auto; display: block;" />
        ${enabledElements.map(el => {
          const value = getElementDisplayValue(el);
          if (el.type === 'qrCode') {
            const qrUrl = generateQRCode(`https://verify.example.com/cert/${courseId}`);
            return `<div style="position: absolute; left: ${el.x}%; top: ${el.y}%; transform: translate(-50%, -50%);">
              <img src="${qrUrl}" style="width: 100px; height: 100px;" />
            </div>`;
          }
          if (el.type === 'schoolLogo' && schoolLogo) {
            return `<div style="position: absolute; left: ${el.x}%; top: ${el.y}%; transform: translate(-50%, -50%);">
              <img src="${schoolLogo}" style="max-width: 100px; max-height: 100px; object-fit: contain;" />
            </div>`;
          }
          if (el.type === 'schoolLogo') {
            return `<div style="position: absolute; left: ${el.x}%; top: ${el.y}%; transform: translate(-50%, -50%); 
              width: 80px; height: 80px; border: 2px solid #ccc; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
              <span style="font-size: 10px; color: #999;">ตราโรงเรียน</span>
            </div>`;
          }
          return `<div style="position: absolute; left: ${el.x}%; top: ${el.y}%; transform: translate(-50%, -50%); 
            font-size: ${el.fontSize || 16}px; color: ${el.color || '#000000'}; white-space: nowrap; font-family: 'Sukhumvit Set', 'Sarabun', 'Kanit', sans-serif;">
            ${value}
          </div>`;
        }).join('')}
        ${enabledSignatures.map(person => {
          let html = '';
          if (person.signatureImage) {
            html += `<div style="position: absolute; left: ${person.signatureX}%; top: ${person.signatureY}%; transform: translate(-50%, -50%);">
              <img src="${person.signatureImage}" style="max-width: 150px; max-height: 80px;" />
            </div>`;
          }
          if (person.name) {
            html += `<div style="position: absolute; left: ${person.nameX}%; top: ${person.nameY}%; transform: translate(-50%, -50%); 
              font-size: ${person.nameFontSize}px; color: ${person.nameColor}; white-space: nowrap; font-family: 'Sukhumvit Set', 'Sarabun', 'Kanit', sans-serif;">
              ${person.name}
            </div>`;
          }
          if (person.position) {
            html += `<div style="position: absolute; left: ${person.positionX}%; top: ${person.positionY}%; transform: translate(-50%, -50%); 
              font-size: ${person.positionFontSize}px; color: ${person.positionColor}; white-space: nowrap; font-family: 'Sukhumvit Set', 'Sarabun', 'Kanit', sans-serif;">
              ${person.position}
            </div>`;
          }
          return html;
        }).join('')}
      </div>
    `;

    Swal.fire({
      title: 'ตัวอย่างใบประกาศนียบัตร',
      html: previewHTML,
      width: 900,
      showConfirmButton: true,
      confirmButtonText: 'ปิด',
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ใบประกาศนียบัตร</h2>
          <p className="text-gray-600 mt-1">{course?.title}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handlePreview}>
            <EyeIcon className="h-5 w-5 mr-2 inline" />
            ดูตัวอย่าง
          </Button>
          <Button onClick={handleSave}>
            <DocumentArrowDownIcon className="h-5 w-5 mr-2 inline" />
            บันทึก
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Template Upload */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Template ใบประกาศนียบัตร</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                อัปโหลดรูป Template
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleTemplateUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                รูปภาพที่แนะนำ: PNG, JPG ขนาด 1200x800px หรือมากกว่า
              </p>
            </div>
          </Card>

          {/* Certificate Canvas */}
          {templateImage && (
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">จัดวางตำแหน่ง</h3>
              <div
                ref={canvasRef}
                className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50"
                style={{ aspectRatio: '3/2', minHeight: '400px' }}
              >
                <img
                  src={templateImage}
                  alt="Certificate Template"
                  className="w-full h-full object-contain"
                />
                {elements
                  .filter(el => el.enabled)
                  .map((element) => (
                    <div
                      key={element.id}
                      className="absolute cursor-move border-2 border-blue-500 bg-blue-50 bg-opacity-80 rounded px-2 py-1 text-xs"
                      style={{
                        left: `${element.x}%`,
                        top: `${element.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: element.fontSize ? `${element.fontSize}px` : '14px',
                        color: element.color || '#000000',
                        fontFamily: "'Sukhumvit Set', 'Sarabun', 'Kanit', sans-serif",
                        zIndex: draggingType?.type === 'element' && draggingType.id === element.id ? 1000 : 10,
                      }}
                      onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                    >
                      {element.type === 'qrCode' ? (
                        <div className="w-20 h-20 bg-white border border-gray-300 flex items-center justify-center">
                          <QrCodeIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      ) : element.type === 'schoolLogo' && schoolLogo ? (
                        <img
                          src={schoolLogo}
                          alt="School Logo"
                          className="max-w-[100px] max-h-[100px] object-contain"
                        />
                      ) : element.type === 'schoolLogo' ? (
                        <div className="w-20 h-20 bg-white border border-gray-300 flex items-center justify-center rounded">
                          <span className="text-xs text-gray-400">ตราโรงเรียน</span>
                        </div>
                      ) : (
                        getElementDisplayValue(element)
                      )}
                    </div>
                  ))}
                {signaturePersons
                  .filter(person => person.enabled)
                  .map((person) => (
                    <div key={`signature-${person.id}`}>
                      {person.signatureImage && (
                        <div
                          className="absolute cursor-move border-2 border-green-500 bg-green-50 bg-opacity-80 rounded px-2 py-1"
                          style={{
                            left: `${person.signatureX}%`,
                            top: `${person.signatureY}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: draggingType?.type === 'signature' && draggingType.id === person.id.toString() && draggingType.field?.startsWith('signature') ? 1000 : 10,
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setDraggingType({ type: 'signature', id: person.id.toString(), field: 'signature' });
                            if (canvasRef.current) {
                              const rect = canvasRef.current.getBoundingClientRect();
                              const x = ((e.clientX - rect.left) / rect.width) * 100;
                              const y = ((e.clientY - rect.top) / rect.height) * 100;
                              setDragOffset({
                                x: x - person.signatureX,
                                y: y - person.signatureY,
                              });
                            }
                          }}
                        >
                          <img
                            src={person.signatureImage}
                            alt={`Signature ${person.id}`}
                            className="max-w-[120px] max-h-[60px] object-contain"
                          />
                        </div>
                      )}
                      {person.name && (
                        <div
                          className="absolute cursor-move border-2 border-green-500 bg-green-50 bg-opacity-80 rounded px-2 py-1 text-xs"
                          style={{
                            left: `${person.nameX}%`,
                            top: `${person.nameY}%`,
                            transform: 'translate(-50%, -50%)',
                            fontSize: `${person.nameFontSize}px`,
                            color: person.nameColor,
                            fontFamily: "'Sukhumvit Set', 'Sarabun', 'Kanit', sans-serif",
                            zIndex: draggingType?.type === 'signature' && draggingType.id === person.id.toString() && draggingType.field?.startsWith('name') ? 1000 : 10,
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setDraggingType({ type: 'signature', id: person.id.toString(), field: 'name' });
                            if (canvasRef.current) {
                              const rect = canvasRef.current.getBoundingClientRect();
                              const x = ((e.clientX - rect.left) / rect.width) * 100;
                              const y = ((e.clientY - rect.top) / rect.height) * 100;
                              setDragOffset({
                                x: x - person.nameX,
                                y: y - person.nameY,
                              });
                            }
                          }}
                        >
                          {person.name}
                        </div>
                      )}
                      {person.position && (
                        <div
                          className="absolute cursor-move border-2 border-green-500 bg-green-50 bg-opacity-80 rounded px-2 py-1 text-xs"
                          style={{
                            left: `${person.positionX}%`,
                            top: `${person.positionY}%`,
                            transform: 'translate(-50%, -50%)',
                            fontSize: `${person.positionFontSize}px`,
                            color: person.positionColor,
                            fontFamily: "'Sukhumvit Set', 'Sarabun', 'Kanit', sans-serif",
                            zIndex: draggingType?.type === 'signature' && draggingType.id === person.id.toString() && draggingType.field?.startsWith('position') ? 1000 : 10,
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setDraggingType({ type: 'signature', id: person.id.toString(), field: 'position' });
                            if (canvasRef.current) {
                              const rect = canvasRef.current.getBoundingClientRect();
                              const x = ((e.clientX - rect.left) / rect.width) * 100;
                              const y = ((e.clientY - rect.top) / rect.height) * 100;
                              setDragOffset({
                                x: x - person.positionX,
                                y: y - person.positionY,
                              });
                            }
                          }}
                        >
                          {person.position}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                💡 ลากวาง elements เพื่อจัดตำแหน่งบน Template
              </p>
            </Card>
          )}

          {/* Settings */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลใบประกาศนียบัตร</h3>
            <div className="space-y-4">
              <Input
                label="ชื่อผู้ออกใบประกาศนียบัตร"
                value={settings.issuerName}
                onChange={(e) => setSettings({ ...settings, issuerName: e.target.value })}
                placeholder="โรงเรียนกวดวิชา ABC"
              />
            </div>
          </Card>

          {/* Signature Persons */}
          <div className="space-y-4">
            {signaturePersons.map((person) => (
              <Card key={person.id}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">บุคคลที่ {person.id}</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={person.enabled}
                      onChange={(e) => handleSignaturePersonUpdate(person.id, 'enabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">ใช้ลายเซ็นนี้</label>
                  </div>
                </div>
                {person.enabled && (
                  <div className="space-y-4">
                    <Input
                      label={`ชื่อ-นามสกุล ของบุคคลที่ ${person.id}`}
                      value={person.name}
                      onChange={(e) => handleSignaturePersonUpdate(person.id, 'name', e.target.value)}
                      placeholder="เช่น นายสมชาย ใจดี"
                    />
                    <Input
                      label={`ตำแหน่ง ของบุคคลที่ ${person.id}`}
                      value={person.position}
                      onChange={(e) => handleSignaturePersonUpdate(person.id, 'position', e.target.value)}
                      placeholder="เช่น ผู้อำนวยการโรงเรียน"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        ลายเซ็น ของบุคคลที่ {person.id}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSignatureImageUpload(person.id, e)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      {person.signatureImage && (
                        <img
                          src={person.signatureImage}
                          alt={`Signature ${person.id}`}
                          className="mt-2 max-w-[200px] max-h-[100px] object-contain border border-gray-300 rounded"
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">ขนาดตัวอักษร (ชื่อ)</label>
                        <Input
                          type="number"
                          min="8"
                          max="72"
                          value={person.nameFontSize}
                          onChange={(e) => handleSignaturePersonUpdate(person.id, 'nameFontSize', parseInt(e.target.value))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">ขนาดตัวอักษร (ตำแหน่ง)</label>
                        <Input
                          type="number"
                          min="8"
                          max="72"
                          value={person.positionFontSize}
                          onChange={(e) => handleSignaturePersonUpdate(person.id, 'positionFontSize', parseInt(e.target.value))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">สี (ชื่อ)</label>
                        <input
                          type="color"
                          value={person.nameColor}
                          onChange={(e) => handleSignaturePersonUpdate(person.id, 'nameColor', e.target.value)}
                          className="w-full h-8 rounded border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">สี (ตำแหน่ง)</label>
                        <input
                          type="color"
                          value={person.positionColor}
                          onChange={(e) => handleSignaturePersonUpdate(person.id, 'positionColor', e.target.value)}
                          className="w-full h-8 rounded border border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Elements List */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Elements ที่แสดง</h3>
            <div className="space-y-3">
              {elements.map((element) => (
                <div
                  key={element.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {element.type === 'studentName' && <UserIcon className="h-4 w-4 text-blue-600" />}
                      {element.type === 'courseName' && <AcademicCapIcon className="h-4 w-4 text-blue-600" />}
                      {element.type === 'completionDate' && <CalendarIcon className="h-4 w-4 text-blue-600" />}
                      {element.type === 'schoolName' && <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />}
                      {element.type === 'schoolLogo' && <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />}
                      {element.type === 'qrCode' && <QrCodeIcon className="h-4 w-4 text-blue-600" />}
                      <span className="text-sm font-medium text-gray-900">{element.label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={element.enabled}
                      onChange={() => handleElementToggle(element.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  {element.enabled && element.type !== 'qrCode' && element.type !== 'schoolLogo' && element.type !== 'signatureImage' && (
                    <div className="mt-2 space-y-2">
                      {element.fontSize !== undefined && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">ขนาดตัวอักษร</label>
                          <Input
                            type="number"
                            min="8"
                            max="72"
                            value={element.fontSize}
                            onChange={(e) => handleElementUpdate(element.id, 'fontSize', parseInt(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">สี</label>
                        <input
                          type="color"
                          value={element.color || '#000000'}
                          onChange={(e) => handleElementUpdate(element.id, 'color', e.target.value)}
                          className="w-full h-8 rounded border border-gray-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">คำแนะนำ</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• อัปโหลดรูป Template ใบประกาศนียบัตรก่อน</li>
              <li>• ติ๊กเลือก elements ที่ต้องการแสดง</li>
              <li>• ติ๊กเลือกบุคคลที่ต้องการให้ลงนาม (สูงสุด 3 ท่าน)</li>
              <li>• กรอกข้อมูลชื่อ-นามสกุลและตำแหน่งของแต่ละบุคคล</li>
              <li>• อัปโหลดรูปลายเซ็นของแต่ละบุคคล</li>
              <li>• ลากวาง elements และลายเซ็นเพื่อจัดตำแหน่งบน Template</li>
              <li>• QR Code จะถูกสร้างอัตโนมัติสำหรับตรวจสอบ</li>
              <li>• สามารถปรับขนาดตัวอักษรและสีได้</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
