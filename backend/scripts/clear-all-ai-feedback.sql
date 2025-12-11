-- ลบข้อมูล AI feedback ทั้งหมดออกจากตาราง GradingTask
-- สำหรับข้อสอบที่ยังไม่ได้ตรวจ (status = 'pending')
-- ใช้เมื่อต้องการให้ระบบ generate ใหม่ทั้งหมด
UPDATE "GradingTask"
SET "aiScore" = NULL, "aiFeedback" = NULL
WHERE "status" = 'pending';

-- ลบข้อมูล AI feedback ทั้งหมดออกจากตาราง AssignmentSubmission
-- สำหรับการบ้านที่ยังไม่ได้ให้คะแนน (score IS NULL)
-- ใช้เมื่อต้องการให้ระบบ generate ใหม่ทั้งหมด
UPDATE "AssignmentSubmission"
SET "aiScore" = NULL, "aiFeedback" = NULL
WHERE "score" IS NULL;

-- แสดงจำนวนรายการที่ถูกอัปเดต
SELECT 
  'GradingTask cleared' as status,
  COUNT(*) as count
FROM "GradingTask"
WHERE "status" = 'pending'
  AND "aiScore" IS NULL
  AND "aiFeedback" IS NULL
UNION ALL
SELECT 
  'AssignmentSubmission cleared' as status,
  COUNT(*) as count
FROM "AssignmentSubmission"
WHERE "score" IS NULL
  AND "aiScore" IS NULL
  AND "aiFeedback" IS NULL;





