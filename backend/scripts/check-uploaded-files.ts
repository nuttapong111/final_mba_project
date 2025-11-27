import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUploadedFiles() {
  try {
    console.log('🔍 กำลังตรวจสอบไฟล์ที่อัพโหลดในฐานข้อมูล...\n');

    // ตรวจสอบ LessonContent ที่มี fileUrl
    const contentsWithFiles = await prisma.lessonContent.findMany({
      where: {
        OR: [
          { fileUrl: { not: null } },
          { fileName: { not: null } },
          { fileSize: { not: null } },
        ],
      },
      include: {
        lesson: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 พบเนื้อหาที่มีไฟล์: ${contentsWithFiles.length} รายการ\n`);

    if (contentsWithFiles.length === 0) {
      console.log('❌ ไม่พบไฟล์ที่อัพโหลดในฐานข้อมูล');
      console.log('\n💡 สาเหตุที่เป็นไปได้:');
      console.log('   1. ยังไม่ได้อัพโหลดไฟล์');
      console.log('   2. ไฟล์ถูกอัพโหลดแต่ไม่ได้บันทึกลงฐานข้อมูล');
      console.log('   3. ไฟล์ถูกลบออกจากฐานข้อมูลแล้ว');
      return;
    }

    // แสดงรายละเอียดไฟล์
    contentsWithFiles.forEach((content, index) => {
      console.log(`\n📁 ไฟล์ที่ ${index + 1}:`);
      console.log(`   หลักสูตร: ${content.lesson.course.title}`);
      console.log(`   บทเรียน: ${content.lesson.title}`);
      console.log(`   เนื้อหา: ${content.title}`);
      console.log(`   ประเภท: ${content.type}`);
      console.log(`   fileUrl: ${content.fileUrl || 'ไม่มี'}`);
      console.log(`   fileName: ${content.fileName || 'ไม่มี'}`);
      console.log(`   fileSize: ${content.fileSize ? `${(content.fileSize / 1024).toFixed(2)} KB` : 'ไม่มี'}`);
      console.log(`   URL (ถ้ามี): ${content.url || 'ไม่มี'}`);
      console.log(`   สร้างเมื่อ: ${content.createdAt.toLocaleString('th-TH')}`);
    });

    // ตรวจสอบไฟล์ใน filesystem
    console.log('\n\n🔍 กำลังตรวจสอบไฟล์ใน filesystem...\n');
    const { readdirSync, statSync, existsSync } = require('fs');
    const { join } = require('path');
    
    const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    
    if (existsSync(UPLOAD_DIR)) {
      const files = readdirSync(UPLOAD_DIR);
      console.log(`📂 พบไฟล์ใน ${UPLOAD_DIR}: ${files.length} ไฟล์\n`);
      
      if (files.length > 0) {
        files.forEach((file: string, index: number) => {
          const filePath = join(UPLOAD_DIR, file);
          const stats = statSync(filePath);
          console.log(`   ${index + 1}. ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
      } else {
        console.log('   ไม่พบไฟล์ใน directory');
      }
    } else {
      console.log(`❌ ไม่พบ directory ${UPLOAD_DIR}`);
    }

    // ตรวจสอบความสอดคล้องระหว่าง database และ filesystem
    console.log('\n\n🔍 กำลังตรวจสอบความสอดคล้อง...\n');
    
    const fileUrlsInDb = contentsWithFiles
      .map(c => c.fileUrl)
      .filter(url => url && url.includes('/uploads/'))
      .map(url => {
        // แยกชื่อไฟล์จาก URL
        const match = url.match(/\/uploads\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (existsSync(UPLOAD_DIR)) {
      const filesInFs = readdirSync(UPLOAD_DIR);
      
      console.log(`📊 ไฟล์ในฐานข้อมูล: ${fileUrlsInDb.length} ไฟล์`);
      console.log(`📊 ไฟล์ใน filesystem: ${filesInFs.length} ไฟล์\n`);

      // ตรวจสอบไฟล์ที่อยู่ใน DB แต่ไม่มีใน FS
      const missingInFs = fileUrlsInDb.filter(fileName => !filesInFs.includes(fileName));
      if (missingInFs.length > 0) {
        console.log('⚠️  ไฟล์ที่อยู่ในฐานข้อมูลแต่ไม่มีใน filesystem:');
        missingInFs.forEach(file => console.log(`   - ${file}`));
      }

      // ตรวจสอบไฟล์ที่อยู่ใน FS แต่ไม่มีใน DB
      const missingInDb = filesInFs.filter(file => !fileUrlsInDb.includes(file));
      if (missingInDb.length > 0) {
        console.log('\n⚠️  ไฟล์ที่อยู่ใน filesystem แต่ไม่มีในฐานข้อมูล:');
        missingInDb.forEach(file => console.log(`   - ${file}`));
      }

      if (missingInFs.length === 0 && missingInDb.length === 0) {
        console.log('✅ ข้อมูลสอดคล้องกันทั้งหมด');
      }
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUploadedFiles();

