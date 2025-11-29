import 'dotenv/config';

console.log('🔍 กำลังตรวจสอบ S3 Configuration...\n');

const checks = [
  {
    name: 'AWS_ACCESS_KEY_ID',
    value: process.env.AWS_ACCESS_KEY_ID,
    required: true,
  },
  {
    name: 'AWS_SECRET_ACCESS_KEY',
    value: process.env.AWS_SECRET_ACCESS_KEY,
    required: true,
  },
  {
    name: 'AWS_REGION',
    value: process.env.AWS_REGION || 'ap-southeast-1',
    required: false,
  },
  {
    name: 'AWS_S3_BUCKET_NAME',
    value: process.env.AWS_S3_BUCKET_NAME,
    required: true,
  },
  {
    name: 'AWS_S3_PUBLIC_URL',
    value: process.env.AWS_S3_PUBLIC_URL,
    required: false,
  },
];

let allPassed = true;

checks.forEach((check) => {
  const hasValue = !!check.value;
  const status = hasValue ? '✅' : (check.required ? '❌' : '⚠️');
  const message = hasValue 
    ? (check.name.includes('SECRET') || check.name.includes('KEY') 
        ? `${check.value?.substring(0, 8)}...` 
        : check.value)
    : (check.required ? 'MISSING (Required)' : 'Not set (Optional)');
  
  console.log(`${status} ${check.name}: ${message}`);
  
  if (check.required && !hasValue) {
    allPassed = false;
  }
});

console.log('\n📊 Summary:');
if (allPassed) {
  console.log('✅ S3 is configured - will use S3 for file uploads');
} else {
  console.log('⚠️  S3 is NOT fully configured - will use local storage (fallback)');
  console.log('\n💡 To configure S3:');
  console.log('   1. Set AWS_ACCESS_KEY_ID');
  console.log('   2. Set AWS_SECRET_ACCESS_KEY');
  console.log('   3. Set AWS_S3_BUCKET_NAME');
  console.log('   4. (Optional) Set AWS_REGION (default: ap-southeast-1)');
  console.log('   5. (Optional) Set AWS_S3_PUBLIC_URL');
}

process.exit(allPassed ? 0 : 1);

