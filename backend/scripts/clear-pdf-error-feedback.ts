import prisma from '../src/config/database';

/**
 * Script to clear PDF error feedback from assignment submissions
 * This will allow the system to retry AI grading for PDF files
 */
async function clearPDFErrorFeedback() {
  try {
    console.log('[CLEAR PDF ERROR] Starting to clear PDF error feedback...');

    // Find submissions with PDF error messages
    const submissionsWithErrors = await prisma.assignmentSubmission.findMany({
      where: {
        aiFeedback: {
          not: null,
        },
        score: null, // Only clear if not yet graded
        OR: [
          { aiFeedback: { contains: 'ไม่สามารถตรวจไฟล์ PDF' } },
          { aiFeedback: { contains: 'ไม่สามารถเข้าถึงหรืออ่านเนื้อหาจากไฟล์ภายนอก' } },
          { aiFeedback: { contains: 'Cannot' }, aiFeedback: { contains: 'PDF' } },
          { aiFeedback: { contains: 'PDF' }, aiFeedback: { contains: 'ไม่สามารถ' } },
        ],
      },
      select: {
        id: true,
        fileName: true,
        aiFeedback: true,
      },
    });

    console.log(`[CLEAR PDF ERROR] Found ${submissionsWithErrors.length} submissions with PDF error messages`);

    if (submissionsWithErrors.length === 0) {
      console.log('[CLEAR PDF ERROR] No submissions to clear');
      return;
    }

    // Clear AI feedback and score
    const result = await prisma.assignmentSubmission.updateMany({
      where: {
        id: { in: submissionsWithErrors.map((s) => s.id) },
      },
      data: {
        aiScore: null,
        aiFeedback: null,
      },
    });

    console.log(`[CLEAR PDF ERROR] Cleared ${result.count} submissions`);

    // Show summary
    const pdfSubmissions = await prisma.assignmentSubmission.count({
      where: {
        fileName: { endsWith: '.pdf' },
        score: null,
        aiFeedback: null,
        aiScore: null,
      },
    });

    console.log(`[CLEAR PDF ERROR] Total PDF submissions ready for re-grading: ${pdfSubmissions}`);
    console.log('[CLEAR PDF ERROR] Done!');
  } catch (error: any) {
    console.error('[CLEAR PDF ERROR] Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  clearPDFErrorFeedback()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export default clearPDFErrorFeedback;
