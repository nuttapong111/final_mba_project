import prisma from '../src/config/database';

async function checkDatabase() {
  try {
    console.log('🔍 กำลังตรวจสอบ Database...\n');

    // 1. ตรวจสอบ Connection
    console.log('1. ตรวจสอบ Database Connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // 2. ตรวจสอบ ContentProgress table
    console.log('2. ตรวจสอบ ContentProgress table...');
    try {
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ContentProgress'
        );
      `;
      
      const exists = (tableExists as any[])[0]?.exists;
      if (exists) {
        console.log('✅ ContentProgress table exists\n');
        
        // ตรวจสอบ columns
        const columns = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'ContentProgress'
          ORDER BY ordinal_position;
        `;
        
        console.log('📋 Columns in ContentProgress table:');
        (columns as any[]).forEach((col: any) => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
        });
        console.log('');
        
        // ตรวจสอบ indexes
        const indexes = await prisma.$queryRaw`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE tablename = 'ContentProgress';
        `;
        
        console.log('📊 Indexes:');
        (indexes as any[]).forEach((idx: any) => {
          console.log(`   - ${idx.indexname}`);
        });
        console.log('');
        
        // ตรวจสอบ constraints
        const constraints = await prisma.$queryRaw`
          SELECT constraint_name, constraint_type
          FROM information_schema.table_constraints
          WHERE table_name = 'ContentProgress';
        `;
        
        console.log('🔒 Constraints:');
        (constraints as any[]).forEach((constraint: any) => {
          console.log(`   - ${constraint.constraint_name}: ${constraint.constraint_type}`);
        });
        console.log('');
        
        // นับจำนวน records
        const count = await prisma.contentProgress.count();
        console.log(`📊 Total records: ${count}\n`);
        
      } else {
        console.log('❌ ContentProgress table does NOT exist');
        console.log('💡 Run: npx prisma db push\n');
      }
    } catch (error: any) {
      console.error('❌ Error checking ContentProgress table:', error.message);
    }

    // 3. ตรวจสอบ LessonContent table (related table)
    console.log('3. ตรวจสอบ LessonContent table...');
    try {
      const lessonContentCount = await prisma.lessonContent.count();
      console.log(`✅ LessonContent table exists (${lessonContentCount} records)\n`);
    } catch (error: any) {
      console.error('❌ LessonContent table error:', error.message);
    }

    // 4. ตรวจสอบ CourseStudent table (for progress calculation)
    console.log('4. ตรวจสอบ CourseStudent table...');
    try {
      const courseStudentCount = await prisma.courseStudent.count();
      console.log(`✅ CourseStudent table exists (${courseStudentCount} records)\n`);
    } catch (error: any) {
      console.error('❌ CourseStudent table error:', error.message);
    }

    // 5. ทดสอบ Query
    console.log('5. ทดสอบ Query ContentProgress...');
    try {
      const testQuery = await prisma.contentProgress.findMany({
        take: 1,
      });
      console.log('✅ Query successful\n');
    } catch (error: any) {
      console.error('❌ Query error:', error.message);
      console.log('💡 This might indicate the table structure is incorrect\n');
    }

    console.log('✅ Database check completed!');

  } catch (error: any) {
    console.error('❌ Database check failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

