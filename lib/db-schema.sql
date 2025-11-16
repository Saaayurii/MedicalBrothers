-- Medical Voice Assistant Database Schema

-- Create database (run separately if needed)
-- CREATE DATABASE medical_clinic;

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  experience_years INTEGER,
  bio TEXT,
  photo_url VARCHAR(500),
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctor schedules
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time slots for appointments
CREATE TABLE IF NOT EXISTS time_slots (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id, slot_date, slot_time)
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  date_of_birth DATE,
  address TEXT,
  medical_history TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  time_slot_id INTEGER REFERENCES time_slots(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show
  symptoms TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultations history
CREATE TABLE IF NOT EXISTS consultations (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  symptoms TEXT NOT NULL,
  ai_response TEXT,
  recommended_specialty VARCHAR(100),
  severity_level VARCHAR(50), -- low, medium, high, emergency
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency calls
CREATE TABLE IF NOT EXISTS emergency_calls (
  id SERIAL PRIMARY KEY,
  patient_name VARCHAR(255),
  phone VARCHAR(20),
  description TEXT NOT NULL,
  location TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, dispatched, completed
  priority VARCHAR(50) DEFAULT 'high', -- low, medium, high, critical
  dispatcher_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinic information (FAQ, services, etc.)
CREATE TABLE IF NOT EXISTS clinic_info (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL, -- hours, services, pricing, faq, etc.
  question TEXT,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation logs
CREATE TABLE IF NOT EXISTS conversation_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  user_input TEXT NOT NULL,
  ai_response TEXT,
  intent VARCHAR(100), -- appointment, consultation, info, emergency
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data

-- Sample doctors
INSERT INTO doctors (name, specialty, experience_years, bio, is_active) VALUES
('Иван Петров', 'Кардиолог', 15, 'Специалист по сердечно-сосудистым заболеваниям', true),
('Мария Сидорова', 'Кардиолог', 10, 'Эксперт в диагностике и лечении аритмий', true),
('Анна Смирнова', 'Терапевт', 12, 'Врач общей практики', true),
('Дмитрий Козлов', 'Невролог', 8, 'Специалист по заболеваниям нервной системы', true),
('Елена Волкова', 'Педиатр', 20, 'Детский врач с большим опытом', true),
('Сергей Морозов', 'Хирург', 18, 'Специалист по абдоминальной хирургии', true),
('Ольга Новикова', 'Эндокринолог', 14, 'Лечение диабета и гормональных нарушений', true),
('Александр Попов', 'Офтальмолог', 9, 'Диагностика и лечение заболеваний глаз', true)
ON CONFLICT DO NOTHING;

-- Sample schedules (Monday to Friday, 9:00-17:00)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time)
SELECT d.id, dow, '09:00'::TIME, '17:00'::TIME
FROM doctors d
CROSS JOIN generate_series(1, 5) as dow
ON CONFLICT DO NOTHING;

-- Sample clinic info
INSERT INTO clinic_info (category, question, answer, display_order) VALUES
('hours', 'Какой режим работы клиники?', 'Мы работаем с понедельника по пятницу с 9:00 до 20:00, в субботу с 10:00 до 16:00. Воскресенье - выходной.', 1),
('services', 'Какие услуги вы предоставляете?', 'Наша клиника предоставляет широкий спектр медицинских услуг: консультации специалистов, диагностика, анализы, УЗИ, ЭКГ, физиотерапия.', 2),
('pricing', 'Сколько стоит приём кардиолога?', 'Первичная консультация кардиолога - 3000 рублей, повторная - 2000 рублей.', 3),
('pricing', 'Сколько стоит приём терапевта?', 'Первичная консультация терапевта - 2000 рублей, повторная - 1500 рублей.', 4),
('faq', 'Нужна ли подготовка для УЗИ?', 'Для УЗИ брюшной полости необходимо прийти натощак (не есть 6-8 часов). Для других видов УЗИ специальная подготовка обычно не требуется.', 5),
('contact', 'Как с вами связаться?', 'Телефон: +7 (800) 123-45-67, Email: info@medicalbrothers.ru, Адрес: г. Москва, ул. Медицинская, д. 10', 6)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_doctor_date ON time_slots(doctor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_consultations_created ON consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_status ON emergency_calls(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_session ON conversation_logs(session_id);
