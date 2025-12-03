import prisma from '../src/config/database';
import { markContentCompleted } from '../src/services/contentProgressService';

async function updatePollProgress() {
  try {
    console.log('🔄 กำลังอัพเดตสถานะ progress สำหรับแบบประเมินที่เคยส่งแล้ว...\n');

    // Get all poll responses
    const pollResponses = await prisma.pollResponse.findMany({
      include: {
        poll: {
          include: {
            content: {
              include: {
                lesson: {
                  select: {
                    courseId: true,
                  },
                },
              },
            },
            course: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    console.log(`📊 พบ poll responses ทั้งหมด: ${pollResponses.length} รายการ\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const response of pollResponses) {
      try {
        const poll = response.poll;
        const contentId = poll.contentId;
        const studentId = response.studentId;

        // Skip if poll doesn't have contentId
        if (!contentId) {
          console.log(`⏭️  ข้าม poll "${poll.title}" (id: ${poll.id}) - ไม่มี contentId`);
          skippedCount++;
          continue;
        }

        // Get courseId from content or poll
        const courseId = poll.content?.lesson?.courseId || poll.course?.id;
        
        if (!courseId) {
          console.log(`⏭️  ข้าม poll "${poll.title}" (id: ${poll.id}) - ไม่พบ courseId`);
          skippedCount++;
          continue;
        }

        // Check if already marked as completed
        const existingProgress = await prisma.contentProgress.findUnique({
          where: {
            contentId_studentId: {
              contentId,
              studentId,
            },
          },
        });

        if (existingProgress?.completed) {
          console.log(`✓  Poll "${poll.title}" สำหรับ student ${studentId} - มีสถานะ completed อยู่แล้ว`);
          successCount++;
          continue;
        }

        // Mark content as completed
        await markContentCompleted(contentId, courseId, studentId);
        console.log(`✅ อัพเดตสำเร็จ: Poll "${poll.title}" (contentId: ${contentId}, studentId: ${studentId})`);
        successCount++;

      } catch (error: any) {
        console.error(`❌ เกิดข้อผิดพลาดสำหรับ poll response ${response.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 สรุปผลการอัพเดต:');
    console.log(`   ✅ สำเร็จ: ${successCount} รายการ`);
    console.log(`   ⏭️  ข้าม: ${skippedCount} รายการ`);
    console.log(`   ❌ เกิดข้อผิดพลาด: ${errorCount} รายการ`);
    console.log(`\n✅ อัพเดตสถานะ progress สำหรับแบบประเมินเสร็จสิ้น!`);

  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePollProgress();

