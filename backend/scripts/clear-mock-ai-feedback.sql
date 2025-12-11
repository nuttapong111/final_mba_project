-- ลบข้อมูล AI feedback ที่เป็น mock data ออกจากตาราง GradingTask
-- สำหรับข้อสอบที่ยังไม่ได้ตรวจ (status = 'pending')
UPDATE "GradingTask"
SET "aiScore" = NULL, "aiFeedback" = NULL
WHERE "status" = 'pending'
  AND (
    "aiFeedback" = 'คำตอบได้รับการตรวจสอบแล้ว'
    OR "aiFeedback" LIKE '%ได้รับการตรวจสอบแล้ว%'
    OR "aiFeedback" = 'ไม่พบคำสำคัญที่เกี่ยวข้อง'
    OR "aiFeedback" LIKE '%พบคำสำคัญที่เกี่ยวข้อง%'
  );

-- ลบข้อมูล AI feedback ที่เป็น mock data ออกจากตาราง AssignmentSubmission
-- สำหรับการบ้านที่ยังไม่ได้ให้คะแนน (score IS NULL)
UPDATE "AssignmentSubmission"
SET "aiScore" = NULL, "aiFeedback" = NULL
WHERE "score" IS NULL
  AND (
    "aiFeedback" = 'คำตอบได้รับการตรวจสอบแล้ว'
    OR "aiFeedback" LIKE '%ได้รับการตรวจสอบแล้ว%'
    OR "aiFeedback" = 'ไม่พบคำสำคัญที่เกี่ยวข้อง'
    OR "aiFeedback" LIKE '%พบคำสำคัญที่เกี่ยวข้อง%'
  );

-- แสดงจำนวนรายการที่ถูกอัปเดต
SELECT 
  'GradingTask' as table_name,
  COUNT(*) as cleared_count
FROM "GradingTask"
WHERE "status" = 'pending'
  AND "aiScore" IS NULL
  AND "aiFeedback" IS NULL
UNION ALL
SELECT 
  'AssignmentSubmission' as table_name,
  COUNT(*) as cleared_count
FROM "AssignmentSubmission"
WHERE "score" IS NULL
  AND "aiScore" IS NULL
  AND "aiFeedback" IS NULL;








