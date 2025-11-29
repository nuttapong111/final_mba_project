# AWS S3 Setup Guide

คู่มือการตั้งค่า AWS S3 สำหรับการอัพโหลดไฟล์ (เอกสาร, รูปภาพ, วิดีโอ)

## ข้อกำหนดเบื้องต้น

1. AWS Account
2. AWS S3 Bucket
3. IAM User with S3 permissions

## ขั้นตอนการตั้งค่า

### 1. สร้าง S3 Bucket

1. เข้าสู่ AWS Console → S3
2. คลิก "Create bucket"
3. ตั้งชื่อ bucket (เช่น `lms-uploads`)
4. เลือก Region (แนะนำ: `ap-southeast-1` สำหรับประเทศไทย)
5. ปิด "Block all public access" หากต้องการให้ไฟล์เข้าถึงได้แบบ public
6. คลิก "Create bucket"

### 2. สร้าง IAM User สำหรับ S3 Access

1. เข้าสู่ AWS Console → IAM
2. ไปที่ "Users" → "Create user"
3. ตั้งชื่อ user (เช่น `lms-s3-uploader`)
4. เลือก "Programmatic access"
5. Attach policy: `AmazonS3FullAccess` หรือสร้าง custom policy:

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

6. บันทึก Access Key ID และ Secret Access Key

### 3. ตั้งค่า CORS (ถ้าจำเป็น)

หากต้องการให้ frontend เข้าถึงไฟล์จาก S3 โดยตรง:

1. ไปที่ S3 Bucket → Permissions → CORS
2. เพิ่ม CORS configuration:

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

### 4. ตั้งค่า Environment Variables

เพิ่ม environment variables ใน backend:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_PUBLIC_URL=https://your-bucket-name.s3.ap-southeast-1.amazonaws.com
```

**สำหรับ Railway:**
- ไปที่ Project → Variables
- เพิ่ม environment variables ตามด้านบน

**สำหรับ Local Development:**
- เพิ่มใน `.env` file ใน `backend/` directory

### 5. ตั้งค่า Bucket Policy (สำหรับ Public Access)

หากต้องการให้ไฟล์เข้าถึงได้แบบ public:

1. ไปที่ S3 Bucket → Permissions → Bucket Policy
2. เพิ่ม policy:

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

## โครงสร้างไฟล์ใน S3

ไฟล์จะถูกจัดเก็บตามโครงสร้าง:

```
uploads/
  ├── videos/
  │   ├── 2024/
  │   │   ├── 01/
  │   │   │   └── video_timestamp_random.mp4
  │   │   └── 02/
  ├── documents/
  │   ├── 2024/
  │   │   ├── 01/
  │   │   │   └── document_timestamp_random.pdf
  └── images/
      ├── 2024/
      │   ├── 01/
      │   │   └── image_timestamp_random.jpg
```

## การใช้งาน

### Automatic Fallback

ระบบจะตรวจสอบว่า S3 ถูกตั้งค่าหรือไม่:
- **ถ้ามี S3 credentials:** ใช้ S3 สำหรับอัพโหลด
- **ถ้าไม่มี S3 credentials:** ใช้ local storage (fallback)

### API Endpoints

**Single File Upload:**
```
POST /api/upload/file
Content-Type: multipart/form-data

Form Data:
- file: File
- type: 'video' | 'document' | 'image'
```

**Multiple Files Upload:**
```
POST /api/upload/files
Content-Type: multipart/form-data

Form Data:
- files: File[] (multiple)
- type: 'video' | 'document' | 'image'
```

### Response Format

```json
{
  "success": true,
  "data": {
    "url": "https://bucket.s3.region.amazonaws.com/uploads/videos/2024/01/file.mp4",
    "fileName": "original-name.mp4",
    "fileSize": 1234567,
    "mimeType": "video/mp4",
    "s3Key": "uploads/videos/2024/01/file.mp4"
  }
}
```

## ข้อจำกัด

- **ขนาดไฟล์สูงสุด:** 2GB
- **ประเภทไฟล์ที่รองรับ:**
  - **Videos:** mp4, webm, ogg, mov
  - **Documents:** pdf, doc, docx, xls, xlsx, ppt, pptx
  - **Images:** jpeg, png, gif, webp, svg

## Troubleshooting

### ไฟล์ไม่สามารถอัพโหลดได้

1. ตรวจสอบ AWS credentials ถูกต้อง
2. ตรวจสอบ IAM permissions
3. ตรวจสอบ bucket name และ region
4. ดู backend logs สำหรับ error messages

### ไฟล์ไม่สามารถเข้าถึงได้

1. ตรวจสอบ bucket policy สำหรับ public access
2. ตรวจสอบ CORS configuration
3. ตรวจสอบ `AWS_S3_PUBLIC_URL` ถูกต้อง

### ใช้ Local Storage แทน S3

ถ้าไม่ต้องการใช้ S3:
- ไม่ต้องตั้งค่า AWS environment variables
- ระบบจะใช้ local storage อัตโนมัติ

## ต้นทุน

AWS S3 pricing (ap-southeast-1):
- **Storage:** $0.025/GB/month
- **PUT requests:** $0.005 per 1,000 requests
- **GET requests:** $0.0004 per 1,000 requests
- **Data transfer out:** $0.12/GB (first 10TB)

## Security Best Practices

1. ใช้ IAM roles แทน hardcoded credentials (สำหรับ production)
2. ใช้ presigned URLs สำหรับ private files
3. ตั้งค่า bucket versioning
4. ตั้งค่า lifecycle policies สำหรับไฟล์เก่า
5. ใช้ CloudFront สำหรับ CDN (optional)

