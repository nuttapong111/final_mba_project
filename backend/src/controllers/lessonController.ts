import { Context } from 'hono';
import { saveCourseContent, type LessonData } from '../services/lessonService';

export const saveCourseContentController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('id');
    const { lessons } = await c.req.json();

    console.log('[DEBUG] saveCourseContentController - Received data:', {
      courseId,
      lessonsCount: lessons?.length,
      lessons: JSON.stringify(lessons, null, 2),
    });

    if (!Array.isArray(lessons)) {
      return c.json({ success: false, error: 'ข้อมูลไม่ถูกต้อง' }, 400);
    }

    // Debug: Check for file data in lessons
    lessons.forEach((lesson: any, lessonIndex: number) => {
      if (lesson.contents) {
        lesson.contents.forEach((content: any, contentIndex: number) => {
          if (content.fileUrl || content.fileName) {
            console.log(`[DEBUG] Content ${lessonIndex}-${contentIndex} has file data:`, {
              title: content.title,
              type: content.type,
              fileUrl: content.fileUrl,
              fileName: content.fileName,
              fileSize: content.fileSize,
            });
          } else {
            console.log(`[DEBUG] Content ${lessonIndex}-${contentIndex} has NO file data:`, {
              title: content.title,
              type: content.type,
              url: content.url,
              fileUrl: content.fileUrl,
              fileName: content.fileName,
              fileSize: content.fileSize,
            });
          }
        });
      }
    });

    await saveCourseContent(courseId, lessons, user);
    return c.json({ success: true, message: 'บันทึกเนื้อหาหลักสูตรสำเร็จ' });
  } catch (error: any) {
    console.error('[ERROR] saveCourseContentController:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

