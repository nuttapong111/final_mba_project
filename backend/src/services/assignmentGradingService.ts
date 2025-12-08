import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';
import { getAIGradingSuggestion } from './aiService';

export interface AssignmentGradingTask {
  id: string;
  courseId: string;
  courseTitle: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  submittedAt: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  maxScore: number;
  status: 'pending' | 'graded';
  aiScore?: number;
  aiFeedback?: string;
}

/**
 * Get all assignment submissions that need grading for the logged-in teacher
 */
export const getAssignmentGradingTasks = async (user: AuthUser): Promise<AssignmentGradingTask[]> => {
  // Get all courses where user is instructor or teacher with grading permission
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { instructorId: user.id },
        {
          teachers: {
            some: {
              teacherId: user.id,
              grading: true,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
    },
  });

  const courseIds = courses.map((c) => c.id);

  if (courseIds.length === 0) {
    return [];
  }

  // Get all assignment submissions from these courses
  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      assignment: {
        courseId: { in: courseIds },
      },
      submittedAt: { not: null },
    },
    include: {
      assignment: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              schoolId: true,
            },
          },
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  // Generate presigned URLs for S3 files
  const tasksWithUrls = await Promise.all(
    submissions.map(async (submission) => {
      let fileUrl = submission.fileUrl;

      if (submission.s3Key) {
        try {
          const { getPresignedUrl } = await import('./s3Service');
          fileUrl = await getPresignedUrl(submission.s3Key, 3600);
        } catch (error) {
          console.error(`[ASSIGNMENT GRADING] Failed to generate presigned URL for ${submission.s3Key}:`, error);
        }
      }

      // Use existing AI feedback from database, or generate if not exists
      let aiScore: number | undefined = submission.aiScore || undefined;
      let aiFeedback: string | undefined = submission.aiFeedback || undefined;

      // Generate AI feedback if not exists and not graded yet
      if (!aiScore && !aiFeedback && !submission.score && submission.submittedAt) {
        try {
          console.log('[ASSIGNMENT GRADING] Generating AI feedback for submission:', submission.id);
          
          const schoolId = submission.assignment.course.schoolId;
          const assignmentTitle = submission.assignment.title;
          const assignmentDescription = submission.assignment.description || '';
          
          console.log('[ASSIGNMENT GRADING] Assignment:', assignmentTitle);
          console.log('[ASSIGNMENT GRADING] SchoolId:', schoolId);
          
          // Build assignment context (question + description + teacher's file if exists)
          let assignmentContext = `การบ้าน: ${assignmentTitle}`;
          if (assignmentDescription) {
            assignmentContext += `\nคำอธิบาย: ${assignmentDescription}`;
          }
          
          // Try to extract text from teacher's attached file (if PDF)
          if (submission.assignment.fileUrl || submission.assignment.s3Key) {
            const teacherFileName = submission.assignment.fileName || '';
            const isTeacherPDF = teacherFileName.toLowerCase().endsWith('.pdf');
            
            if (isTeacherPDF) {
              try {
                const { extractTextFromPDFUrl } = await import('./pdfService');
                const teacherFileText = await extractTextFromPDFUrl(
                  submission.assignment.fileUrl || '',
                  submission.assignment.s3Key || null
                );
                
                if (teacherFileText && teacherFileText.trim()) {
                  assignmentContext += `\n\nไฟล์แนบจากอาจารย์ (${teacherFileName}):\n${teacherFileText}`;
                  console.log(`[ASSIGNMENT GRADING] Extracted ${teacherFileText.length} characters from teacher's PDF`);
                }
              } catch (pdfError: any) {
                console.warn(`[ASSIGNMENT GRADING] Could not read teacher's PDF file: ${pdfError.message}`);
                // Continue without teacher's file content
              }
            }
          }
          
          // Generate AI feedback for student's answer
          const studentFileName = submission.fileName || '';
          const isStudentPDF = studentFileName.toLowerCase().endsWith('.pdf');
          
          let aiResult;
          if (isStudentPDF && (submission.fileUrl || submission.s3Key)) {
            // Use Gemini File API for PDF files
            const { getAIGradingSuggestionWithPDF } = await import('./aiService');
            aiResult = await getAIGradingSuggestionWithPDF(
              assignmentContext,
              submission.fileUrl || '',
              submission.s3Key || null,
              submission.assignment.maxScore,
              schoolId
            );
          } else {
            // Use text-based method
            let studentAnswer = 'นักเรียนส่งไฟล์';
            if (submission.fileName) {
              studentAnswer = `นักเรียนส่งไฟล์: ${submission.fileName}`;
            }
            
            aiResult = await getAIGradingSuggestion(
              assignmentContext,
              studentAnswer,
              submission.assignment.maxScore,
              schoolId
            );
          }
          
          console.log('[ASSIGNMENT GRADING] AI result received:', {
            score: aiResult.score,
            feedbackLength: aiResult.feedback.length,
            feedbackPreview: aiResult.feedback.substring(0, 100) + '...',
          });
          
          aiScore = aiResult.score;
          aiFeedback = aiResult.feedback;

          // Save AI feedback to database
          await prisma.assignmentSubmission.update({
            where: { id: submission.id },
            data: {
              aiScore: aiResult.score,
              aiFeedback: aiResult.feedback,
            },
          });
          console.log('[ASSIGNMENT GRADING] AI feedback saved to database for submission:', submission.id);
        } catch (error: any) {
          console.error('[ASSIGNMENT GRADING] Error generating AI feedback for submission:', submission.id, error);
          console.error('[ASSIGNMENT GRADING] Error details:', {
            message: error.message,
            stack: error.stack,
            assignmentTitle: submission.assignment.title,
            fileName: submission.fileName,
          });
          // Continue without AI feedback
          // Don't set aiScore/aiFeedback so frontend knows there's no AI feedback
        }
      }

      return {
        id: submission.id,
        courseId: submission.assignment.courseId,
        courseTitle: submission.assignment.course.title,
        assignmentId: submission.assignmentId,
        assignmentTitle: submission.assignment.title,
        assignmentDescription: submission.assignment.description || undefined,
        studentId: submission.studentId,
        studentName: submission.student.name,
        studentAvatar: submission.student.avatar || undefined,
        submittedAt: submission.submittedAt?.toISOString() || submission.createdAt.toISOString(),
        fileUrl: fileUrl || undefined,
        fileName: submission.fileName || undefined,
        fileSize: submission.fileSize || undefined,
        s3Key: submission.s3Key || undefined,
        teacherFileUrl: submission.assignment.fileUrl || undefined,
        teacherFileName: submission.assignment.fileName || undefined,
        teacherS3Key: submission.assignment.s3Key || undefined,
        score: submission.score || undefined,
        feedback: submission.feedback || undefined,
        gradedAt: submission.gradedAt?.toISOString() || undefined,
        maxScore: submission.assignment.maxScore,
        status: submission.score !== null ? ('graded' as const) : ('pending' as const),
        aiScore,
        aiFeedback,
      };
    })
  );

  return tasksWithUrls;
};

/**
 * Grade an assignment submission
 */
export const gradeAssignmentSubmission = async (
  submissionId: string,
  score: number,
  feedback: string | undefined,
  user: AuthUser
): Promise<AssignmentGradingTask> => {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          course: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  if (!submission) {
    throw new Error('ไม่พบการส่งงาน');
  }

  // Check permission (only teachers and admins can grade)
  const isTeacher = submission.assignment.course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && submission.assignment.course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: submission.assignment.courseId,
      teacherId: user.id,
      grading: true,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์ให้คะแนน');
  }

  // Validate score
  if (score < 0 || score > submission.assignment.maxScore) {
    throw new Error(`คะแนนต้องอยู่ระหว่าง 0 ถึง ${submission.assignment.maxScore}`);
  }

  const updated = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      score,
      feedback: feedback || null,
      gradedAt: new Date(),
      gradedBy: user.id,
    },
    include: {
      assignment: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              schoolId: true,
            },
          },
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  // Save to ML training data
  try {
    const { saveMLTrainingData } = await import('./mlTrainingDataService');
    // Build assignment context as question
    let assignmentContext = `การบ้าน: ${updated.assignment.title}`;
    if (updated.assignment.description) {
      assignmentContext += `\nคำอธิบาย: ${updated.assignment.description}`;
    }
    
    // Get student answer (from file or notes)
    let studentAnswer = 'นักเรียนส่งไฟล์';
    if (updated.fileName) {
      studentAnswer = `นักเรียนส่งไฟล์: ${updated.fileName}`;
    }
    
    await saveMLTrainingData(
      assignmentContext,
      studentAnswer,
      updated.aiScore,
      updated.aiFeedback,
      updated.score,
      updated.feedback,
      updated.assignment.maxScore,
      'assignment',
      updated.id,
      updated.assignment.course.schoolId
    );
  } catch (error: any) {
    console.error('[ASSIGNMENT GRADING] Error saving ML training data:', error);
    // Don't throw - this is not critical
  }

  // Generate presigned URL if needed
  let fileUrl = updated.fileUrl;
  if (updated.s3Key) {
    try {
      const { getPresignedUrl } = await import('./s3Service');
      fileUrl = await getPresignedUrl(updated.s3Key, 3600);
    } catch (error) {
      console.error(`[ASSIGNMENT GRADING] Failed to generate presigned URL:`, error);
    }
  }

  return {
    id: updated.id,
    courseId: updated.assignment.courseId,
    courseTitle: updated.assignment.course.title,
    assignmentId: updated.assignmentId,
    assignmentTitle: updated.assignment.title,
    studentId: updated.studentId,
    studentName: updated.student.name,
    studentAvatar: updated.student.avatar || undefined,
    submittedAt: updated.submittedAt?.toISOString() || updated.createdAt.toISOString(),
    fileUrl: fileUrl || undefined,
    fileName: updated.fileName || undefined,
    fileSize: updated.fileSize || undefined,
    score: updated.score || undefined,
    feedback: updated.feedback || undefined,
    gradedAt: updated.gradedAt?.toISOString() || undefined,
    maxScore: updated.assignment.maxScore,
    status: updated.score !== null ? ('graded' as const) : ('pending' as const),
  };
};

