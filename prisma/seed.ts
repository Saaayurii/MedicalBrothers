import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (optional, for development)
  await prisma.conversationLog.deleteMany();
  await prisma.loyaltyPoints.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.review.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.emergencyCall.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.clinicInfo.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.admin.deleteMany();

  // Seed Admin Users with different roles
  const passwordHash = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.admin.create({
    data: {
      username: 'superadmin',
      email: 'superadmin@medicalbrothers.ru',
      passwordHash,
      fullName: 'Супер Администратор',
      role: 'super_admin',
      isActive: true,
    },
  });

  const adminUser = await prisma.admin.create({
    data: {
      username: 'admin',
      email: 'admin@medicalbrothers.ru',
      passwordHash,
      fullName: 'Администратор Клиники',
      role: 'admin',
      isActive: true,
    },
  });

  const registrarUser = await prisma.admin.create({
    data: {
      username: 'registrar',
      email: 'registrar@medicalbrothers.ru',
      passwordHash,
      fullName: 'Регистратор Петрова',
      role: 'registrar',
      isActive: true,
    },
  });

  const nurseUser = await prisma.admin.create({
    data: {
      username: 'nurse',
      email: 'nurse@medicalbrothers.ru',
      passwordHash,
      fullName: 'Медсестра Иванова',
      role: 'nurse',
      isActive: true,
    },
  });

  console.log(`✅ Created 4 admin users with different roles`);

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

  // Create doctor admin accounts
  const doctorAdmin = await prisma.admin.create({
    data: {
      username: 'doctor_ivanov',
      email: 'doctor_ivanov@medicalbrothers.ru',
      passwordHash,
      fullName: doctors[0].name,
      role: 'doctor',
      doctorId: doctors[0].id,
      isActive: true,
    },
  });
  console.log(`✅ Created doctor admin account for ${doctorAdmin.fullName}`);

  // Seed Patients with passwords for login
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        name: 'Алексей Иванов',
        phone: '+79001234567',
        email: 'cc',
        passwordHash,
        dateOfBirth: new Date('1985-05-15'),
        address: 'г. Москва, ул. Ленина, д. 10, кв. 5',
        isActive: true,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Мария Петрова',
        phone: '+79001234568',
        email: 'patient2@example.com',
        passwordHash,
        dateOfBirth: new Date('1990-08-20'),
        address: 'г. Москва, ул. Пушкина, д. 25, кв. 12',
        isActive: true,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Сергей Сидоров',
        phone: '+79001234569',
        email: 'patient3@example.com',
        passwordHash,
        dateOfBirth: new Date('1978-12-10'),
        address: 'г. Москва, пр-т Мира, д. 50, кв. 7',
        isActive: true,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Елена Николаева',
        phone: '+79001234570',
        email: 'patient4@example.com',
        passwordHash,
        dateOfBirth: new Date('1995-03-25'),
        address: 'г. Москва, ул. Гагарина, д. 15, кв. 20',
        isActive: true,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Дмитрий Волков',
        phone: '+79001234571',
        email: 'patient5@example.com',
        passwordHash,
        dateOfBirth: new Date('1982-11-05'),
        address: 'г. Москва, ул. Кирова, д. 8, кв. 3',
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${patients.length} patients`);

  // Seed Time Slots for next 7 days
  const timeSlots = [];
  const today = new Date();
  for (let day = 0; day < 7; day++) {
    const slotDate = new Date(today);
    slotDate.setDate(today.getDate() + day);

    // Skip weekends (Saturday=6, Sunday=0)
    if (slotDate.getDay() === 0 || slotDate.getDay() === 6) continue;

    for (const doctor of doctors) {
      // Create slots from 9:00 to 17:00, every 30 minutes
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotTime = new Date('1970-01-01');
          slotTime.setHours(hour, minute, 0, 0);

          timeSlots.push(
            prisma.timeSlot.create({
              data: {
                doctorId: doctor.id,
                slotDate: slotDate,
                slotTime: slotTime,
                isBooked: false,
                durationMinutes: 30,
              },
            })
          );
        }
      }
    }
  }
  await Promise.all(timeSlots);
  console.log(`✅ Created ${timeSlots.length} time slots for next 7 days`);

  // Seed Appointments
  const allTimeSlots = await prisma.timeSlot.findMany({
    take: 20, // Take first 20 slots for appointments
  });

  const appointments = await Promise.all(
    allTimeSlots.slice(0, 15).map((slot, index) => {
      const patient = patients[index % patients.length];
      const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
      const status = statuses[index % statuses.length];

      return prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: slot.doctorId,
          timeSlotId: slot.id,
          appointmentDate: slot.slotDate,
          appointmentTime: slot.slotTime,
          status: status,
          symptoms: `Симптомы пациента ${index + 1}: головная боль, повышенная температура`,
          notes: `Примечания врача для записи ${index + 1}`,
        },
      });
    })
  );
  console.log(`✅ Created ${appointments.length} appointments`);

  // Mark slots as booked
  await prisma.timeSlot.updateMany({
    where: {
      id: {
        in: allTimeSlots.slice(0, 15).map((slot) => slot.id),
      },
    },
    data: {
      isBooked: true,
    },
  });

  // Seed Consultations
  const consultations = await Promise.all([
    prisma.consultation.create({
      data: {
        patientId: patients[0].id,
        symptoms: 'Боль в груди, одышка',
        aiResponse: 'Рекомендуется консультация кардиолога',
        recommendedSpecialty: 'Кардиолог',
        severityLevel: 'high',
      },
    }),
    prisma.consultation.create({
      data: {
        patientId: patients[1].id,
        symptoms: 'Головная боль, головокружение',
        aiResponse: 'Рекомендуется консультация невролога',
        recommendedSpecialty: 'Невролог',
        severityLevel: 'medium',
      },
    }),
    prisma.consultation.create({
      data: {
        patientId: patients[2].id,
        symptoms: 'Высокая температура, кашель',
        aiResponse: 'Рекомендуется консультация терапевта',
        recommendedSpecialty: 'Терапевт',
        severityLevel: 'medium',
      },
    }),
  ]);
  console.log(`✅ Created ${consultations.length} consultations`);

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
        answer: 'Телефон: +7 (949) 99-99-99, Email: info@medicalbrothers.ru, Адрес: г. Москва, ул. Медицинская, д. 10',
        displayOrder: 6,
      },
    }),
  ]);

  console.log(`✅ Created ${clinicInfo.length} clinic info entries`);

  // Seed Reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        doctorId: doctors[0].id,
        patientId: patients[0].id,
        appointmentId: appointments[0].id,
        rating: 5,
        comment: 'Отличный врач! Очень внимательный и профессиональный. Подробно объяснил диагноз и назначил эффективное лечение.',
        isVerified: true,
        isApproved: true,
      },
    }),
    prisma.review.create({
      data: {
        doctorId: doctors[1].id,
        patientId: patients[1].id,
        rating: 5,
        comment: 'Мария Сидорова - замечательный кардиолог. Помогла разобраться с проблемами сердечного ритма.',
        isVerified: true,
        isApproved: true,
      },
    }),
    prisma.review.create({
      data: {
        doctorId: doctors[2].id,
        patientId: patients[2].id,
        rating: 4,
        comment: 'Хороший терапевт, но было долгое ожидание приёма.',
        isVerified: true,
        isApproved: true,
      },
    }),
    prisma.review.create({
      data: {
        doctorId: doctors[0].id,
        patientId: patients[1].id,
        rating: 5,
        comment: 'Рекомендую! Профессионал своего дела.',
        isVerified: true,
        isApproved: false, // Pending review
      },
    }),
  ]);
  console.log(`✅ Created ${reviews.length} reviews`);

  // Seed Medical Records
  const medicalRecords = await Promise.all([
    prisma.medicalRecord.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctors[0].id,
        recordType: 'diagnosis',
        title: 'Консультация кардиолога',
        description: 'Рекомендован контроль АД ежедневно, повторный приём через 2 недели',
        diagnosis: 'Гипертоническая болезнь 2 степени',
        prescription: 'Амлодипин 5мг 1 раз в день, Лозартан 50мг утром',
        isConfidential: false,
      },
    }),
    prisma.medicalRecord.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctors[1].id,
        recordType: 'prescription',
        title: 'Рецепт кардиолога',
        description: 'ЭКГ контроль через 1 месяц',
        diagnosis: 'Аритмия',
        prescription: 'Бета-блокаторы по схеме',
        isConfidential: false,
      },
    }),
    prisma.medicalRecord.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctors[2].id,
        recordType: 'lab_result',
        title: 'Результаты анализов',
        description: 'Постельный режим, обильное питьё',
        diagnosis: 'ОРВИ',
        labResults: 'Общий анализ крови: лейкоциты повышены',
        isConfidential: false,
      },
    }),
  ]);
  console.log(`✅ Created ${medicalRecords.length} medical records`);

  // Seed Lab Orders
  const labOrders = await Promise.all([
    prisma.labOrder.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctors[0].id,
        orderNumber: 'LAB-2024-001',
        labName: 'Клинический анализ крови',
        testType: 'Развёрнутый анализ крови с лейкоформулой',
        status: 'completed',
        results: 'Гемоглобин 145 г/л, эритроциты 4.8, лейкоциты 6.2',
      },
    }),
    prisma.labOrder.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctors[1].id,
        orderNumber: 'LAB-2024-002',
        labName: 'Биохимический анализ крови',
        testType: 'Глюкоза, холестерин, АЛТ, АСТ',
        status: 'processing',
      },
    }),
    prisma.labOrder.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctors[2].id,
        orderNumber: 'LAB-2024-003',
        labName: 'Общий анализ мочи',
        testType: 'Стандартный анализ мочи',
        status: 'pending',
      },
    }),
  ]);
  console.log(`✅ Created ${labOrders.length} lab orders`);

  // Seed Loyalty Points
  const loyaltyPoints = await Promise.all([
    prisma.loyaltyPoints.create({
      data: {
        patientId: patients[0].id,
        points: 2500,
        tier: 'silver',
      },
    }),
    prisma.loyaltyPoints.create({
      data: {
        patientId: patients[1].id,
        points: 500,
        tier: 'bronze',
      },
    }),
    prisma.loyaltyPoints.create({
      data: {
        patientId: patients[2].id,
        points: 6000,
        tier: 'gold',
      },
    }),
  ]);
  console.log(`✅ Created ${loyaltyPoints.length} loyalty points entries`);

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
