# 🚀 Quick Start: ตั้งค่า S3 ใน 5 ขั้นตอน

## ✅ ขั้นตอนที่ 1: สร้าง S3 Bucket

1. **ใน AWS Console ที่คุณเปิดอยู่:**
   - ค้นหา **"S3"** ใน search bar ด้านบน (Q Search)
   - หรือไปที่ **Services** → **Storage** → **S3**

2. **คลิก "Create bucket"**

3. **ตั้งค่าตามนี้:**
   - **Bucket name**: `lms-uploads-yourname` (เปลี่ยน yourname เป็นชื่อของคุณ)
     - ตัวอย่าง: `lms-uploads-2025`, `wit-capstone-files`
   - **Region**: เลือก **"Asia Pacific (Sydney) - ap-southeast-2"** (ตามที่เห็นใน Console)
   - **Object Ownership**: เลือก **"ACLs disabled"**

4. **Block Public Access:**
   - ✅ **Uncheck** "Block all public access" (ยกเลิกการบล็อก)
   - ✅ คลิก checkbox "I acknowledge..."

5. **คลิก "Create bucket"** ด้านล่าง

---

## ✅ ขั้นตอนที่ 2: ตั้งค่า Bucket Policy

1. **คลิกที่ bucket ที่สร้างไว้**

2. **ไปที่ tab "Permissions"**

3. **เลื่อนลงไปที่ "Bucket policy" → คลิก "Edit"**

4. **วาง policy นี้** (แก้ไข `YOUR_BUCKET_NAME` เป็นชื่อ bucket ของคุณ):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

**ตัวอย่าง:** ถ้า bucket name คือ `lms-uploads-2025`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::lms-uploads-2025/*"
    }
  ]
}
```

5. **คลิก "Save changes"**

---

## ✅ ขั้นตอนที่ 3: ตั้งค่า CORS

1. **ยังอยู่ใน tab "Permissions"**

2. **เลื่อนลงไปที่ "Cross-origin resource sharing (CORS)" → คลิก "Edit"**

3. **วาง CORS configuration นี้:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

4. **คลิก "Save changes"**

---

## ✅ ขั้นตอนที่ 4: สร้าง IAM User

1. **ใน AWS Console:**
   - ค้นหา **"IAM"** ใน search bar
   - หรือไปที่ **Services** → **Security, Identity, & Compliance** → **IAM**

2. **ไปที่ "Users" ในเมนูด้านซ้าย → คลิก "Create user"**

3. **ตั้งชื่อ user:**
   - **User name**: `lms-s3-uploader`
   - คลิก **"Next"**

4. **ตั้งค่า Permissions:**
   - เลือก **"Attach policies directly"**
   - ค้นหาและเลือก **"AmazonS3FullAccess"**
   - คลิก **"Next"**

5. **คลิก "Create user"**

6. **สร้าง Access Key:**
   - คลิกที่ user ที่สร้างไว้ (`lms-s3-uploader`)
   - ไปที่ tab **"Security credentials"**
   - คลิก **"Create access key"**
   - เลือก **"Application running outside AWS"**
   - คลิก **"Next"** → **"Create access key"**

7. **⚠️ สำคัญ: บันทึกข้อมูลนี้ทันที** (จะแสดงแค่ครั้งเดียว):
   - **Access key ID**: `AKIA...`
   - **Secret access key**: `wJalr...`
   - คลิก **"Done"**

---

## ✅ ขั้นตอนที่ 5: ตั้งค่า Environment Variables

### สำหรับ Local Development:

1. **เปิดไฟล์ `backend/.env`**

2. **เพิ่มข้อมูลนี้** (แก้ไขตามข้อมูลของคุณ):

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA... (ใส่ Access Key ID ที่บันทึกไว้)
AWS_SECRET_ACCESS_KEY=wJalr... (ใส่ Secret Access Key ที่บันทึกไว้)
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET_NAME=lms-uploads-yourname (ใส่ชื่อ bucket ของคุณ)
AWS_S3_PUBLIC_URL=https://lms-uploads-yourname.s3.ap-southeast-2.amazonaws.com
```

**ตัวอย่าง:**
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET_NAME=lms-uploads-2025
AWS_S3_PUBLIC_URL=https://lms-uploads-2025.s3.ap-southeast-2.amazonaws.com
```

### สำหรับ Railway:

1. **ไปที่ [Railway Dashboard](https://railway.app/)**
2. **เลือก Project → Backend Service**
3. **ไปที่ "Variables" tab**
4. **เพิ่ม environment variables ตามด้านบน**

---

## ✅ ทดสอบ

1. **เริ่ม backend server:**
```bash
cd backend
npm run dev
```

2. **ตรวจสอบ logs:**
   - ควรเห็น `[S3] Using S3 for file upload` ถ้าตั้งค่าถูกต้อง
   - หรือ `[UPLOAD] S3 not configured, using local storage` ถ้ายังตั้งค่าไม่ครบ

3. **ทดสอบอัพโหลดไฟล์** ผ่าน API หรือ UI

---

## 📝 Checklist

- [ ] สร้าง S3 Bucket
- [ ] ตั้งค่า Bucket Policy
- [ ] ตั้งค่า CORS
- [ ] สร้าง IAM User
- [ ] สร้าง Access Keys และบันทึกไว้
- [ ] ตั้งค่า Environment Variables
- [ ] ทดสอบการอัพโหลด

---

## 🆘 ปัญหาที่พบบ่อย

### "Access Denied"
- ตรวจสอบ Access Keys ถูกต้อง
- ตรวจสอบ IAM Policy ให้สิทธิ์ `s3:PutObject`

### ไฟล์ไม่สามารถเข้าถึงได้
- ตรวจสอบ Bucket Policy
- ตรวจสอบ CORS configuration

### "Bucket name already exists"
- เปลี่ยนชื่อ bucket (ต้อง unique ทั่วโลก)

---

## 📚 เอกสารเพิ่มเติม

- ดูคู่มือละเอียด: `AWS_S3_SETUP_GUIDE.md`
- ดูคู่มือสั้น: `S3_SETUP.md`

---

**🎉 เสร็จแล้ว!** ระบบพร้อมใช้งาน S3 แล้ว


