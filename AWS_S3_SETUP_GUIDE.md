# 🚀 คู่มือการตั้งค่า Amazon S3 สำหรับ LMS Platform

คู่มือฉบับละเอียดสำหรับการตั้งค่า AWS S3 เพื่อเก็บไฟล์เอกสาร รูปภาพ และวิดีโอ

## 📋 สารบัญ

1. [ข้อกำหนดเบื้องต้น](#ข้อกำหนดเบื้องต้น)
2. [ขั้นตอนที่ 1: สร้าง S3 Bucket](#ขั้นตอนที่-1-สร้าง-s3-bucket)
3. [ขั้นตอนที่ 2: สร้าง IAM User](#ขั้นตอนที่-2-สร้าง-iam-user)
4. [ขั้นตอนที่ 3: ตั้งค่า Bucket Policy และ CORS](#ขั้นตอนที่-3-ตั้งค่า-bucket-policy-และ-cors)
5. [ขั้นตอนที่ 4: ตั้งค่า Environment Variables](#ขั้นตอนที่-4-ตั้งค่า-environment-variables)
6. [ขั้นตอนที่ 5: ทดสอบการอัพโหลด](#ขั้นตอนที่-5-ทดสอบการอัพโหลด)
7. [Troubleshooting](#troubleshooting)

---

## ข้อกำหนดเบื้องต้น

- ✅ AWS Account (ถ้ายังไม่มี [สมัครได้ที่นี่](https://aws.amazon.com/))
- ✅ เข้าสู่ AWS Console ได้
- ✅ มีสิทธิ์ในการสร้าง S3 bucket และ IAM user

---

## ขั้นตอนที่ 1: สร้าง S3 Bucket

### 1.1 เข้าสู่ AWS Console

1. ไปที่ [AWS Console](https://console.aws.amazon.com/)
2. Login ด้วย AWS Account ของคุณ
3. เลือก Region ที่ต้องการ (แนะนำ: **ap-southeast-1** สำหรับประเทศไทย หรือ **ap-southeast-2** สำหรับ Sydney)

### 1.2 สร้าง Bucket

1. ใน AWS Console ค้นหา **"S3"** ใน search bar
2. คลิก **"Create bucket"**

### 1.3 ตั้งค่าข้อมูลพื้นฐาน

**General configuration:**
- **Bucket name**: ตั้งชื่อ bucket (เช่น `lms-uploads-yourname` หรือ `your-company-lms-files`)
  - ⚠️ **สำคัญ**: ชื่อ bucket ต้อง unique ทั่วโลก (ไม่ซ้ำกับคนอื่น)
  - ใช้ตัวอักษรพิมพ์เล็ก, ตัวเลข, และ `-` เท่านั้น
  - ตัวอย่าง: `lms-uploads-2025`, `wit-capstone-files`

- **AWS Region**: เลือก region ที่ใกล้ที่สุด
  - **ap-southeast-1** (Singapore) - แนะนำสำหรับประเทศไทย
  - **ap-southeast-2** (Sydney)
  - **us-east-1** (N. Virginia) - ถูกที่สุด แต่ช้ากว่า

### 1.4 ตั้งค่า Object Ownership

- เลือก **"ACLs disabled"** (แนะนำ) หรือ **"ACLs enabled"** (ถ้าต้องการ control แบบละเอียด)

### 1.5 ตั้งค่า Block Public Access

**สำหรับ Public Files (แนะนำ):**
- ✅ **Uncheck** "Block all public access"
- ✅ เลือก "I acknowledge that the current settings might result in this bucket and the objects within it becoming public"
- ⚠️ **หมายเหตุ**: วิธีนี้ทำให้ไฟล์เข้าถึงได้โดยตรงผ่าน URL (เหมาะสำหรับไฟล์ที่ต้องการให้ดาวน์โหลดได้)

**สำหรับ Private Files:**
- ✅ **Keep** "Block all public access" checked
- ไฟล์จะเข้าถึงได้ผ่าน presigned URLs เท่านั้น (ปลอดภัยกว่า)

### 1.6 ตั้งค่า Versioning (Optional)

- **Versioning**: เลือก "Enable" ถ้าต้องการเก็บ version เก่าไว้
- หรือ "Disable" (แนะนำสำหรับเริ่มต้น)

### 1.7 ตั้งค่า Encryption (Optional แต่แนะนำ)

- **Server-side encryption**: เลือก "Enable"
- **Encryption type**: เลือก "Amazon S3 managed keys (SSE-S3)" (ฟรี)

### 1.8 สร้าง Bucket

1. คลิก **"Create bucket"** ที่ด้านล่าง
2. รอสักครู่จน bucket ถูกสร้างเสร็จ

---

## ขั้นตอนที่ 2: สร้าง IAM User

### 2.1 เข้าสู่ IAM Console

1. ใน AWS Console ค้นหา **"IAM"**
2. ไปที่ **"Users"** ในเมนูด้านซ้าย
3. คลิก **"Create user"**

### 2.2 ตั้งชื่อ User

- **User name**: ตั้งชื่อ (เช่น `lms-s3-uploader`)
- คลิก **"Next"**

### 2.3 ตั้งค่า Permissions

**Option 1: ใช้ Policy ที่มีอยู่ (ง่าย):**
- เลือก **"Attach policies directly"**
- ค้นหาและเลือก **"AmazonS3FullAccess"**
- ⚠️ **หมายเหตุ**: Policy นี้ให้สิทธิ์เต็มกับ S3 ทั้งหมด (เหมาะสำหรับ development)

**Option 2: สร้าง Custom Policy (แนะนำสำหรับ production):**

1. คลิก **"Create policy"**
2. ไปที่ **"JSON"** tab
3. วาง policy นี้ (แก้ไข `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME/*",
        "arn:aws:s3:::YOUR_BUCKET_NAME"
      ]
    }
  ]
}
```

4. คลิก **"Next"**
5. ตั้งชื่อ policy (เช่น `LMS-S3-Upload-Policy`)
6. คลิก **"Create policy"**
7. กลับไปที่หน้า Create User
8. Refresh และเลือก policy ที่สร้างไว้

### 2.4 สร้าง User

1. คลิก **"Next"** (ข้าม Review)
2. คลิก **"Create user"**

### 2.5 บันทึก Access Keys

1. คลิกที่ user ที่สร้างไว้
2. ไปที่ tab **"Security credentials"**
3. คลิก **"Create access key"**
4. เลือก **"Application running outside AWS"**
5. คลิก **"Next"**
6. คลิก **"Create access key"**
7. **⚠️ สำคัญ**: บันทึกข้อมูลเหล่านี้ทันที (จะแสดงแค่ครั้งเดียว):
   - **Access key ID**: `AKIA...`
   - **Secret access key**: `wJalr...`
8. คลิก **"Done"**

---

## ขั้นตอนที่ 3: ตั้งค่า Bucket Policy และ CORS

### 3.1 ตั้งค่า Bucket Policy (สำหรับ Public Access)

1. ไปที่ S3 Console → เลือก bucket ของคุณ
2. ไปที่ tab **"Permissions"**
3. เลื่อนลงไปที่ **"Bucket policy"**
4. คลิก **"Edit"**
5. วาง policy นี้ (แก้ไข `YOUR_BUCKET_NAME`):

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

6. คลิก **"Save changes"**

### 3.2 ตั้งค่า CORS (สำหรับ Frontend Access)

1. ยังอยู่ใน tab **"Permissions"**
2. เลื่อนลงไปที่ **"Cross-origin resource sharing (CORS)"**
3. คลิก **"Edit"**
4. วาง CORS configuration นี้:

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

**สำหรับ Production:** แทนที่ `"AllowedOrigins": ["*"]` ด้วย domain ของคุณ:
```json
"AllowedOrigins": [
  "https://yourdomain.com",
  "https://www.yourdomain.com"
]
```

5. คลิก **"Save changes"**

---

## ขั้นตอนที่ 4: ตั้งค่า Environment Variables

### 4.1 สำหรับ Local Development

1. เปิดไฟล์ `backend/.env`
2. เพิ่ม environment variables:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA... (ใส่ Access Key ID ที่บันทึกไว้)
AWS_SECRET_ACCESS_KEY=wJalr... (ใส่ Secret Access Key ที่บันทึกไว้)
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=lms-uploads-yourname (ใส่ชื่อ bucket ของคุณ)
AWS_S3_PUBLIC_URL=https://lms-uploads-yourname.s3.ap-southeast-1.amazonaws.com
```

**ตัวอย่าง:**
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=lms-uploads-2025
AWS_S3_PUBLIC_URL=https://lms-uploads-2025.s3.ap-southeast-1.amazonaws.com
```

### 4.2 สำหรับ Railway Deployment

1. ไปที่ [Railway Dashboard](https://railway.app/)
2. เลือก Project → Backend Service
3. ไปที่ **"Variables"** tab
4. เพิ่ม environment variables ตามด้านบน

### 4.3 สำหรับ Vercel/Other Platforms

เพิ่ม environment variables ใน platform settings ตามเดียวกัน

---

## ขั้นตอนที่ 5: ทดสอบการอัพโหลด

### 5.1 ทดสอบผ่าน Backend API

1. เริ่ม backend server:
```bash
cd backend
npm run dev
```

2. ทดสอบอัพโหลดไฟล์:
```bash
curl -X POST http://localhost:3001/api/upload/file \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "type=document"
```

### 5.2 ตรวจสอบใน S3 Console

1. ไปที่ S3 Console → เลือก bucket ของคุณ
2. ควรเห็นไฟล์ที่อัพโหลดใน folder `uploads/`
3. คลิกที่ไฟล์ → คลิก **"Open"** เพื่อทดสอบ URL

---

## 📁 โครงสร้างไฟล์ใน S3

ไฟล์จะถูกจัดเก็บตามโครงสร้างนี้:

```
your-bucket-name/
  └── uploads/
      ├── videos/
      │   └── 2024/
      │       └── 01/
      │           └── video_1234567890_abc123.mp4
      ├── documents/
      │   └── 2024/
      │       └── 01/
      │           └── document_1234567890_abc123.pdf
      └── images/
          └── 2024/
              └── 01/
                  └── image_1234567890_abc123.jpg
```

---

## 🔒 Security Best Practices

### สำหรับ Production:

1. **ใช้ IAM Roles แทน Access Keys** (ถ้า deploy บน EC2/ECS)
2. **จำกัด Bucket Policy** ให้เฉพาะ domain ของคุณ
3. **ใช้ Presigned URLs** สำหรับไฟล์ private
4. **เปิดใช้ Versioning** สำหรับไฟล์สำคัญ
5. **ตั้งค่า Lifecycle Policies** เพื่อลบไฟล์เก่าอัตโนมัติ

### ตัวอย่าง Lifecycle Policy:

```json
{
  "Rules": [
    {
      "Id": "DeleteOldFiles",
      "Status": "Enabled",
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

---

## 💰 ต้นทุน

AWS S3 pricing (ap-southeast-1):

- **Storage**: $0.025/GB/month (first 50TB)
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Data transfer out**: $0.12/GB (first 10TB)

**ตัวอย่าง:**
- เก็บไฟล์ 10GB → ~$0.25/เดือน
- อัพโหลด 1,000 ไฟล์ → ~$0.005
- ดาวน์โหลด 10,000 ครั้ง → ~$0.004

---

## 🐛 Troubleshooting

### ปัญหา: "Access Denied" เมื่ออัพโหลด

**แก้ไข:**
1. ตรวจสอบ Access Key ID และ Secret Access Key ถูกต้อง
2. ตรวจสอบ IAM Policy ให้สิทธิ์ `s3:PutObject`
3. ตรวจสอบ Bucket Policy (ถ้าใช้ public access)

### ปัญหา: ไฟล์ไม่สามารถเข้าถึงได้จาก Frontend

**แก้ไข:**
1. ตรวจสอบ CORS configuration
2. ตรวจสอบ Bucket Policy สำหรับ public access
3. ตรวจสอบ `AWS_S3_PUBLIC_URL` ถูกต้อง

### ปัญหา: "Bucket name already exists"

**แก้ไข:**
- ชื่อ bucket ต้อง unique ทั่วโลก
- ลองใช้ชื่ออื่น เช่น เพิ่ม timestamp หรือ random string

### ปัญหา: ไฟล์อัพโหลดช้า

**แก้ไข:**
1. เลือก region ที่ใกล้ที่สุด
2. ใช้ multipart upload สำหรับไฟล์ใหญ่ (>5MB) - ระบบทำอัตโนมัติ

---

## ✅ Checklist

- [ ] สร้าง S3 Bucket
- [ ] ตั้งค่า Bucket Policy (ถ้าต้องการ public access)
- [ ] ตั้งค่า CORS
- [ ] สร้าง IAM User
- [ ] สร้าง Access Keys
- [ ] บันทึก Access Keys ไว้อย่างปลอดภัย
- [ ] ตั้งค่า Environment Variables
- [ ] ทดสอบการอัพโหลด
- [ ] ตรวจสอบไฟล์ใน S3 Console

---

## 📚 เอกสารเพิ่มเติม

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [S3 Pricing Calculator](https://calculator.aws/)

---

## 🆘 ต้องการความช่วยเหลือ?

หากพบปัญหาหรือมีคำถาม:
1. ตรวจสอบ AWS CloudWatch Logs
2. ตรวจสอบ Backend Console Logs
3. ดูที่ `S3_SETUP.md` สำหรับข้อมูลเพิ่มเติม

---

**🎉 เสร็จสิ้น!** ตอนนี้ระบบพร้อมใช้งาน S3 สำหรับเก็บไฟล์แล้ว

