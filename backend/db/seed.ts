import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { ACHIEVEMENT_DEFS } from '../src/constants/gamification';

dotenv.config();

const prisma = new PrismaClient();

const rolePermissions: Record<RoleName, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'users:read',
    'courses:manage',
    'categories:manage',
    'faculty:manage',
    'gallery:manage',
    'testimonials:manage',
    'results:manage',
    'blogs:manage',
    'contact:manage',
    'settings:manage',
  ],
  FACULTY: ['courses:read', 'students:read', 'study-material:manage'],
  STUDENT: ['courses:read', 'profile:manage', 'enrollments:read'],
};

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Roles
  for (const name of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name },
      update: { permissions: rolePermissions[name] },
      create: { name, permissions: rolePermissions[name], description: `${name} role` },
    });
  }
  console.log('  ✓ Roles seeded');

  // 1b. Achievements (gamification)
  for (const a of ACHIEVEMENT_DEFS) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: { title: a.title, description: a.description, icon: a.icon },
      create: { code: a.code, title: a.title, description: a.description, icon: a.icon },
    });
  }
  console.log('  ✓ Achievements seeded');

  // 2. Super admin
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'SUPER_ADMIN' } });
  const email = process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@bokarodefenceacademy.com';
  const password = process.env.SEED_SUPERADMIN_PASSWORD ?? 'Admin@12345';
  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS ?? 12));

  await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Super Admin',
      passwordHash,
      isEmailVerified: true,
      isActive: true,
      roleId: superAdminRole.id,
    },
    create: {
      name: 'Super Admin',
      email,
      passwordHash,
      isEmailVerified: true,
      isActive: true,
      roleId: superAdminRole.id,
    },
  });
  console.log(`  ✓ Super admin ready (${email})`);

  // 3. Course categories
  const categories = [
    { name: 'NDA & CDS', slug: 'nda-cds', iconKey: 'medal', order: 1 },
    { name: 'Army & Navy', slug: 'army-navy', iconKey: 'footprints', order: 2 },
    { name: 'Police & SSC', slug: 'police-ssc', iconKey: 'shield', order: 3 },
    { name: 'Railway', slug: 'railway', iconKey: 'train', order: 4 },
  ];
  for (const c of categories) {
    await prisma.courseCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log('  ✓ Course categories seeded');

  // 4. Sample published courses (so the enroll picker has data)
  const ndaCds = await prisma.courseCategory.findUnique({ where: { slug: 'nda-cds' } });
  const armyNavy = await prisma.courseCategory.findUnique({ where: { slug: 'army-navy' } });
  const policeSsc = await prisma.courseCategory.findUnique({ where: { slug: 'police-ssc' } });

  const courses = [
    {
      title: 'NDA Foundation',
      slug: 'nda-foundation',
      badge: 'Foundation Batch',
      badgeType: 'FOUNDATION' as const,
      shortDesc: '11th + 12th + NDA preparation with integrated coaching.',
      description: 'A complete foundation programme covering the full NDA syllabus alongside school studies.',
      durationWeeks: 48,
      fees: 45000,
      isPublished: true,
      categoryId: ndaCds?.id,
    },
    {
      title: 'Agniveer Guarantee',
      slug: 'agniveer-guarantee',
      badge: 'Guarantee Batch',
      badgeType: 'GUARANTEE' as const,
      shortDesc: 'Intensive training for Agniveer (Army/Navy/Airforce) selection.',
      description: 'Focused physical + written preparation for the Agniveer entry with guaranteed mentoring.',
      durationWeeks: 24,
      fees: 25000,
      isPublished: true,
      categoryId: armyNavy?.id,
    },
    {
      title: 'SSC GD Constable',
      slug: 'ssc-gd-constable',
      badge: 'Guarantee Batch',
      badgeType: 'GUARANTEE' as const,
      shortDesc: 'Comprehensive SSC GD written + physical preparation.',
      description: 'End-to-end preparation for the SSC GD Constable examination.',
      durationWeeks: 20,
      fees: 20000,
      isPublished: true,
      categoryId: policeSsc?.id,
    },
    {
      title: 'CDS Complete',
      slug: 'cds-complete',
      badge: 'Guarantee Batch',
      badgeType: 'GUARANTEE' as const,
      shortDesc: 'Full CDS written coaching with SSB interview guidance.',
      description: 'Covers the CDS written syllabus plus SSB personality development.',
      durationWeeks: 32,
      fees: 38000,
      isPublished: true,
      categoryId: ndaCds?.id,
    },
  ];
  for (const c of courses) {
    await prisma.course.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  console.log('  ✓ Sample courses seeded');

  // 4b. Sample learning modules (for CDS Complete) with quizzes
  const cds = await prisma.course.findUnique({ where: { slug: 'cds-complete' } });
  if (cds) {
    const modules = [
      {
        moduleNumber: 1,
        title: 'Introduction to CDS',
        description: 'Exam pattern, syllabus overview and how to prepare.',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        estimatedDuration: '25 min',
        notes: '<h2>Welcome to CDS</h2><p>The Combined Defence Services (CDS) examination is conducted by the UPSC. In this module you will learn the <strong>exam pattern</strong>, the <em>syllabus</em>, and a preparation roadmap.</p><ul><li>English</li><li>General Knowledge</li><li>Elementary Mathematics</li></ul>',
        questions: [
          { q: 'Who conducts the CDS examination?', a: 'SSC', b: 'UPSC', c: 'IBPS', d: 'RRB', correct: 'B' as const },
          { q: 'How many papers are in CDS (IMA)?', a: '1', b: '2', c: '3', d: '4', correct: 'C' as const },
          { q: 'Which is NOT a CDS subject?', a: 'English', b: 'GK', c: 'Maths', d: 'Biology', correct: 'D' as const },
          { q: 'CDS is conducted how many times a year?', a: 'Once', b: 'Twice', c: 'Thrice', d: 'Four', correct: 'B' as const },
          { q: 'Minimum age for CDS is around?', a: '16', b: '19', c: '25', d: '30', correct: 'B' as const },
        ],
      },
      {
        moduleNumber: 2,
        title: 'Elementary Mathematics - Basics',
        description: 'Number system, HCF/LCM and simplification.',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        estimatedDuration: '40 min',
        notes: '<h2>Number System</h2><p>Understand natural numbers, integers, and the basics of <strong>HCF and LCM</strong>.</p>',
        questions: [
          { q: 'HCF of 12 and 18 is?', a: '6', b: '9', c: '12', d: '3', correct: 'A' as const },
          { q: 'LCM of 4 and 6 is?', a: '10', b: '12', c: '24', d: '2', correct: 'B' as const },
          { q: 'Which is a prime number?', a: '9', b: '15', c: '17', d: '21', correct: 'C' as const },
          { q: '0 is a?', a: 'Prime', b: 'Natural', c: 'Whole', d: 'Negative', correct: 'C' as const },
          { q: 'Smallest 2-digit number?', a: '9', b: '10', c: '11', d: '99', correct: 'B' as const },
        ],
      },
    ];

    for (const m of modules) {
      const existing = await prisma.courseModule.findUnique({
        where: { courseId_moduleNumber: { courseId: cds.id, moduleNumber: m.moduleNumber } },
      });
      if (existing) continue;
      const mod = await prisma.courseModule.create({
        data: {
          courseId: cds.id,
          moduleNumber: m.moduleNumber,
          order: m.moduleNumber,
          title: m.title,
          description: m.description,
          youtubeUrl: m.youtubeUrl,
          estimatedDuration: m.estimatedDuration,
          notes: m.notes,
        },
      });
      const quiz = await prisma.moduleQuiz.create({
        data: { moduleId: mod.id, passingMarks: 3, totalQuestions: m.questions.length },
      });
      await prisma.moduleQuestion.createMany({
        data: m.questions.map((qq, i) => ({
          quizId: quiz.id,
          question: qq.q,
          optionA: qq.a,
          optionB: qq.b,
          optionC: qq.c,
          optionD: qq.d,
          correctOption: qq.correct,
          order: i + 1,
        })),
      });
    }
    console.log('  ✓ Sample learning modules seeded');
  }

  // 5. Hall of Fame samples
  const hof = [
    { name: 'Rohan Singh', rank: 'AIR 42', exam: 'NDA 2023', order: 1 },
    { name: 'Ananya Verma', rank: 'AIR 115', exam: 'AFCAT 2023', order: 2 },
    { name: 'Vikram Aditya', rank: 'AIR 89', exam: 'CDS 2022', order: 3 },
    { name: 'Sneha Reddy', rank: 'AIR 204', exam: 'Navy Tech', order: 4 },
  ];
  for (const h of hof) {
    await prisma.hallOfFame.create({ data: h }).catch(() => undefined);
  }
  console.log('  ✓ Hall of Fame seeded');

  // 6. Command announcement
  const anCount = await prisma.announcement.count();
  if (anCount === 0) {
    await prisma.announcement.create({
      data: {
        title: 'Welcome to the Cadet Command Center',
        body: 'Complete your operations in order, pass each assessment, and climb the ranks. New training missions are added regularly — stay sharp, cadet!',
        pinned: true,
      },
    });
    console.log('  ✓ Announcement seeded');
  }

  // 7. Academies (for academy/state rankings)
  const bdaAcademy = await prisma.academy.upsert({
    where: { name: 'Bokaro Defence Academy' },
    update: {},
    create: { name: 'Bokaro Defence Academy', state: 'Jharkhand', city: 'Bokaro Steel City' },
  });
  await prisma.user.updateMany({
    where: { academyId: null, role: { name: 'STUDENT' } },
    data: { academyId: bdaAcademy.id, state: 'Jharkhand' },
  });
  console.log('  ✓ Academies seeded');

  // 8. Sample quiz battles
  const battleCount = await prisma.quizBattle.count();
  if (battleCount === 0) {
    const ndaCds = await prisma.courseCategory.findUnique({ where: { slug: 'nda-cds' } });
    const battle = await prisma.quizBattle.create({
      data: {
        title: 'NDA Rapid Fire Battle',
        description: 'Test your NDA knowledge against fellow cadets in real time.',
        categoryId: ndaCds?.id,
        status: 'LOBBY',
        xpRewardWinner: 50,
        xpRewardParticipant: 15,
        questions: {
          create: [
            { question: 'Who conducts the NDA examination?', optionA: 'SSC', optionB: 'UPSC', optionC: 'IBPS', optionD: 'RRB', correctOption: 'B', order: 1 },
            { question: 'NDA training academy for Army is at?', optionA: 'Dehradun', optionB: 'Pune', optionC: 'Khadakwasla', optionD: 'Gaya', correctOption: 'A', order: 2 },
            { question: 'Minimum age for NDA (approx)?', optionA: '16', optionB: '16.5', optionC: '17', optionD: '18', correctOption: 'B', order: 3 },
            { question: 'CDS stands for?', optionA: 'Central Defence Service', optionB: 'Combined Defence Services', optionC: 'Civil Defence Scheme', optionD: 'Combat Duty Squad', correctOption: 'B', order: 4 },
            { question: 'SSB interview tests?', optionA: 'Only IQ', optionB: 'Only physical', optionC: 'Personality & OLQs', optionD: 'Only written', correctOption: 'C', order: 5 },
          ],
        },
      },
    });
    await prisma.quizBattle.create({
      data: {
        title: 'Maths Blitz — CDS Edition',
        description: 'Speed maths challenge for CDS aspirants.',
        categoryId: ndaCds?.id,
        status: 'LOBBY',
        xpRewardWinner: 50,
        xpRewardParticipant: 15,
        questions: {
          create: [
            { question: 'HCF of 12 and 18?', optionA: '6', optionB: '9', optionC: '12', optionD: '3', correctOption: 'A', order: 1 },
            { question: 'LCM of 4 and 6?', optionA: '10', optionB: '12', optionC: '24', optionD: '2', correctOption: 'B', order: 2 },
            { question: 'Square of 15?', optionA: '125', optionB: '225', optionC: '250', optionD: '200', correctOption: 'B', order: 3 },
            { question: '15% of 200?', optionA: '20', optionB: '25', optionC: '30', optionD: '35', correctOption: 'C', order: 4 },
            { question: '√144 = ?', optionA: '11', optionB: '12', optionC: '13', optionD: '14', correctOption: 'B', order: 5 },
          ],
        },
      },
    });
    console.log(`  ✓ Quiz battles seeded (${battle.id.slice(0, 8)}…)`);
  }

  console.log('✅ Seeding complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
