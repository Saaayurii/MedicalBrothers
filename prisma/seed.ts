import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (optional, for development)
  await prisma.conversationLog.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.emergencyCall.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.clinicInfo.deleteMany();

  // Seed Doctors
  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        name: 'Иван Петров',
        specialty: 'Кардиолог',
        experienceYears: 15,
        bio: 'Специалист по сердечно-сосудистым заболеваниям',
        isActive: true,
      },
    }),
    prisma.doctor.create({
      data: {
        name: 'Мария Сидорова',
        specialty: 'Кардиолог',
        experienceYears: 10,
        bio: 'Эксперт в диагностике и лечении аритмий',
        isActive: true,
      },
    }),
    prisma.doctor.create({
      data: {
        name: 'Анна Смирнова',
        specialty: 'Терапевт',
        experienceYears: 12,
        bio: 'Врач общей практики',
        isActive: true,
      },
    }),
    prisma.doctor.create({
      data: {
        name: 'Дмитрий Козлов',
        specialty: 'Невролог',
        experienceYears: 8,
        bio: 'Специалист по заболеваниям нервной системы',
        isActive: true,
      },
    }),
    prisma.doctor.create({
      data: {
        name: 'Елена Волкова',
        specialty: 'Педиатр',
        experienceYears: 20,
        bio: 'Детский врач с большим опытом',
        isActive: true,
      },
    }),
    prisma.doctor.create({
      data: {
        name: 'Сергей Морозов',
        specialty: 'Хирург',
        experienceYears: 18,
        bio: 'Специалист по абдоминальной хирургии',
        isActive: true,
      },
    }),
    prisma.doctor.create({
      data: {
        name: 'Ольга Новикова',
        specialty: 'Эндокринолог',
        experienceYears: 14,
        bio: 'Лечение диабета и гормональных нарушений',
        isActive: true,
      },
    }),
    prisma.doctor.create({
      data: {
        name: 'Александр Попов',
        specialty: 'Офтальмолог',
        experienceYears: 9,
        bio: 'Диагностика и лечение заболеваний глаз',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${doctors.length} doctors`);

  // Seed Doctor Schedules (Monday to Friday, 9:00-17:00)
  const schedules = [];
  for (const doctor of doctors) {
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      schedules.push(
        prisma.doctorSchedule.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek,
            startTime: new Date('1970-01-01T09:00:00Z'),
            endTime: new Date('1970-01-01T17:00:00Z'),
            isAvailable: true,
          },
        })
      );
    }
  }
  await Promise.all(schedules);
  console.log(`✅ Created ${schedules.length} doctor schedules`);

  // Seed Clinic Info
  const clinicInfo = await Promise.all([
    prisma.clinicInfo.create({
      data: {
        category: 'hours',
        question: 'Какой режим работы клиники?',
        answer: 'Мы работаем с понедельника по пятницу с 9:00 до 20:00, в субботу с 10:00 до 16:00. Воскресенье - выходной.',
        displayOrder: 1,
      },
    }),
    prisma.clinicInfo.create({
      data: {
        category: 'services',
        question: 'Какие услуги вы предоставляете?',
        answer: 'Наша клиника предоставляет широкий спектр медицинских услуг: консультации специалистов, диагностика, анализы, УЗИ, ЭКГ, физиотерапия.',
        displayOrder: 2,
      },
    }),
    prisma.clinicInfo.create({
      data: {
        category: 'pricing',
        question: 'Сколько стоит приём кардиолога?',
        answer: 'Первичная консультация кардиолога - 3000 рублей, повторная - 2000 рублей.',
        displayOrder: 3,
      },
    }),
    prisma.clinicInfo.create({
      data: {
        category: 'pricing',
        question: 'Сколько стоит приём терапевта?',
        answer: 'Первичная консультация терапевта - 2000 рублей, повторная - 1500 рублей.',
        displayOrder: 4,
      },
    }),
    prisma.clinicInfo.create({
      data: {
        category: 'faq',
        question: 'Нужна ли подготовка для УЗИ?',
        answer: 'Для УЗИ брюшной полости необходимо прийти натощак (не есть 6-8 часов). Для других видов УЗИ специальная подготовка обычно не требуется.',
        displayOrder: 5,
      },
    }),
    prisma.clinicInfo.create({
      data: {
        category: 'contact',
        question: 'Как с вами связаться?',
        answer: 'Телефон: +7 (800) 123-45-67, Email: info@medicalbrothers.ru, Адрес: г. Москва, ул. Медицинская, д. 10',
        displayOrder: 6,
      },
    }),
  ]);

  console.log(`✅ Created ${clinicInfo.length} clinic info entries`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
