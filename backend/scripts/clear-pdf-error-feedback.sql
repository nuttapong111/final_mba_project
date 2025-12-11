-- Script to clear PDF error feedback from assignment submissions
-- This will allow the system to retry AI grading for PDF files

-- Clear AI feedback that contains PDF error messages
UPDATE "AssignmentSubmission"
SET 
  "aiScore" = NULL,
  "aiFeedback" = NULL
WHERE 
  "aiFeedback" IS NOT NULL
  AND (
    "aiFeedback" LIKE '%ไม่สามารถตรวจไฟล์ PDF%'
    OR "aiFeedback" LIKE '%ไม่สามารถเข้าถึงหรืออ่านเนื้อหาจากไฟล์ภายนอก%'
    OR "aiFeedback" LIKE '%Cannot%PDF%'
    OR "aiFeedback" LIKE '%PDF%ไม่สามารถ%'
  )
  AND "score" IS NULL; -- Only clear if not yet graded

-- Show count of cleared records
SELECT COUNT(*) as cleared_count
FROM "AssignmentSubmission"
WHERE 
  "aiFeedback" IS NULL
  AND "aiScore" IS NULL
  AND "fileName" LIKE '%.pdf'
  AND "score" IS NULL;
