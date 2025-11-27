'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import {
  AcademicCapIcon,
  ChartBarIcon,
  VideoCameraIcon,
  ShieldCheckIcon,
  UsersIcon,
  SparklesIcon,
  CheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  const features = [
    {
      icon: AcademicCapIcon,
      title: 'จัดการหลักสูตร',
      description: 'สร้างและจัดการหลักสูตรได้ง่าย พร้อมระบบเนื้อหาครบครัน',
    },
    {
      icon: VideoCameraIcon,
      title: 'ห้องเรียนออนไลน์',
      description: 'Live Class แบบ Real-time พร้อม Whiteboard และ Screen Sharing',
    },
    {
      icon: ChartBarIcon,
      title: 'AI ตรวจข้อสอบ',
      description: 'ระบบ AI ตรวจข้อสอบอัตโนมัติ ทั้งปรนัยและอัตนัย',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Multi-tenant',
      description: 'รองรับหลายสถาบันบนแพลตฟอร์มเดียว แยกข้อมูลชัดเจน',
    },
    {
      icon: UsersIcon,
      title: 'จัดการผู้ใช้',
      description: 'ระบบ Role-based Access Control ครบทุกบทบาท',
    },
    {
      icon: SparklesIcon,
      title: 'Analytics',
      description: 'รายงานและวิเคราะห์ข้อมูลแบบ Real-time',
    },
  ];

  const pricingPlans = [
    {
      name: 'Basic',
      price: '2,990',
      period: 'เดือน',
      features: [
        'รองรับนักเรียน 100 คน',
        'หลักสูตรไม่จำกัด',
        'ข้อสอบไม่จำกัด',
        'Live Class 10 ชั่วโมง/เดือน',
        'Email Support',
      ],
      popular: false,
    },
    {
      name: 'Premium',
      price: '4,990',
      period: 'เดือน',
      features: [
        'รองรับนักเรียน 500 คน',
        'หลักสูตรไม่จำกัด',
        'ข้อสอบไม่จำกัด',
        'Live Class ไม่จำกัด',
        'AI ตรวจข้อสอบ',
        'Priority Support',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'ติดต่อสอบถาม',
      period: '',
      features: [
        'รองรับนักเรียนไม่จำกัด',
        'Custom Domain',
        'White Label',
        'API Access',
        'Dedicated Support',
        'Custom Features',
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">LMS Platform</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">เข้าสู่ระบบ</Button>
              </Link>
              <Link href="/login">
                <Button>ทดลองใช้ฟรี</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              ระบบจัดการการเรียนรู้ออนไลน์
              <br />
              สำหรับโรงเรียนกวดวิชา
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              แพลตฟอร์ม LMS แบบ Multi-tenant พร้อมระบบ AI ตรวจข้อสอบอัตโนมัติ
              รองรับหลายสถาบันบนแพลตฟอร์มเดียว
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/login">
                <Button size="lg">เริ่มใช้งานทันที</Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  ดูฟีเจอร์
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">ฟีเจอร์หลัก</h2>
            <p className="text-xl text-gray-600">ทุกสิ่งที่คุณต้องการในระบบ LMS</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">แพ็กเกจราคา</h2>
            <p className="text-xl text-gray-600">เลือกแพ็กเกจที่เหมาะกับสถาบันของคุณ</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 bg-white rounded-xl border-2 ${
                  plan.popular
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    แนะนำ
                  </span>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-600 ml-2">บาท/{plan.period}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {plan.name === 'Enterprise' ? 'ติดต่อสอบถาม' : 'เลือกแพ็กเกจ'}
                  <ArrowRightIcon className="h-5 w-5 ml-2 inline" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            พร้อมเริ่มใช้งานแล้วหรือยัง?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            ทดลองใช้ฟรี 14 วัน ไม่ต้องใช้บัตรเครดิต
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              เริ่มทดลองใช้ฟรี
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <AcademicCapIcon className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white">LMS Platform</span>
              </div>
              <p className="text-sm">
                ระบบจัดการการเรียนรู้ออนไลน์สำหรับโรงเรียนกวดวิชา
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">ผลิตภัณฑ์</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">ฟีเจอร์</a></li>
                <li><a href="#" className="hover:text-white">ราคา</a></li>
                <li><a href="#" className="hover:text-white">ทดลองใช้</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">บริษัท</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">เกี่ยวกับเรา</a></li>
                <li><a href="#" className="hover:text-white">ติดต่อ</a></li>
                <li><a href="#" className="hover:text-white">ข่าวสาร</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">สนับสนุน</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">เอกสาร</a></li>
                <li><a href="#" className="hover:text-white">ช่วยเหลือ</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 LMS Platform. สงวนลิขสิทธิ์.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
