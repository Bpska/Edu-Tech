const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.examHistory.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleared.');

  // Create Admin User
  const bcrypt = require('bcryptjs');
  const adminPasswordHash = await bcrypt.hash('1234567', 10);
  await prisma.user.create({
    data: {
      email: 'bpskar2@gmail.com',
      password_hash: adminPasswordHash,
      name: 'Admin',
      role: 'ADMIN'
    }
  });
  console.log('Admin user created.');

  // Create mock course
  const course1 = await prisma.course.create({
    data: {
      title: 'Fullstack Web Development Series',
      description: 'Master Node.js, Express APIs, React interfaces, and database architectures with PostgreSQL and Prisma.',
      price: 0,
      isPublished: true,
    }
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'System Design Interview & Scaling',
      description: 'Learn modern software design patterns, load balancing, caching, vertical/horizontal scaling, and CDN workflows.',
      price: 499,
      isPublished: true,
    }
  });

  console.log('Courses created.');

  // Create tests for course 1 (Free)
  const test1 = await prisma.test.create({
    data: {
      title: 'React Hooks & State Mastery',
      duration: 15,
      courseId: course1.id,
      totalQuestions: 3,
    }
  });

  await prisma.question.createMany({
    data: [
      {
        testId: test1.id,
        text: 'Which hook should be used to cache a computed value between re-renders?',
        options: JSON.stringify(['useCallback', 'useMemo', 'useRef', 'useEffect']),
        correctAnswerIndex: 1,
      },
      {
        testId: test1.id,
        text: 'What does the secondary argument in useEffect represent?',
        options: JSON.stringify(['Render duration', 'Dependency array', 'Callback triggers', 'Clean-up timers']),
        correctAnswerIndex: 1,
      },
      {
        testId: test1.id,
        text: 'What is the correct syntax to define a custom context hook?',
        options: JSON.stringify(['useContext(MyContext)', 'createContext(MyContext)', 'useContextState(MyContext)', 'useMyContext()']),
        correctAnswerIndex: 0,
      }
    ]
  });

  // Create tests for course 2 (Premium)
  const test2 = await prisma.test.create({
    data: {
      title: 'Database Transactions & Indexing',
      duration: 20,
      courseId: course2.id,
      totalQuestions: 2,
    }
  });

  await prisma.question.createMany({
    data: [
      {
        testId: test2.id,
        text: 'Which SQL keyword resolves issues with dirty reads and non-repeatable reads in transactions?',
        options: JSON.stringify(['TRANSACTION ISOLATION LEVEL', 'COMMIT TRANSACTION', 'ROLLBACK TRANSACTION', 'BEGIN TRANSACTION']),
        correctAnswerIndex: 0,
      },
      {
        testId: test2.id,
        text: 'In Prisma, what is the default database provider used in the prisma/schema.prisma schema configuration?',
        options: JSON.stringify(['mysql', 'sqlite', 'postgresql', 'mongodb']),
        correctAnswerIndex: 2,
      }
    ]
  });

  console.log('Tests and questions seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
