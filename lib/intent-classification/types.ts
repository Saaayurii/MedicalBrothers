/**
 * Intent Classification System
 *
 * Классификация намерений пациента на 4 основные системы:
 * 1. APPOINTMENT - Запись на приём (основной функционал с БД)
 * 2. CONSULTATION - Консультация по симптомам
 * 3. INFO - Получение справочной информации
 * 4. EMERGENCY - Экстренный вызов
 */

// Основные типы намерений
export type IntentType =
  | 'appointment'    // Запись на приём к врачу
  | 'consultation'   // Консультация по симптомам
  | 'info'           // Справочная информация
  | 'emergency'      // Экстренный вызов
  | 'greeting'       // Приветствие (вспомогательное)
  | 'unknown';       // Неопределённое намерение

// Уровни уверенности классификации
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// Результат классификации намерения
export interface IntentClassificationResult {
  intent: IntentType;
  confidence: number; // 0-1
  confidenceLevel: ConfidenceLevel;
  subIntent?: string; // Под-намерение (например, "book", "cancel", "reschedule" для appointment)
  entities: ExtractedEntities;
  rawAnalysis?: string;
}

// Извлечённые сущности из запроса
export interface ExtractedEntities {
  // Для записи на приём
  specialty?: string;         // Специальность врача
  doctorName?: string;        // Имя врача
  preferredDate?: string;     // Предпочтительная дата
  preferredTime?: string;     // Предпочтительное время

  // Для консультации
  symptoms?: string[];        // Список симптомов
  bodyPart?: string;          // Часть тела
  duration?: string;          // Длительность симптомов
  severity?: SeverityLevel;   // Тяжесть симптомов

  // Для экстренного вызова
  emergencyType?: EmergencyType;
  location?: string;

  // Общее
  patientName?: string;
  phone?: string;
}

// Уровни тяжести симптомов
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

// Типы экстренных ситуаций
export type EmergencyType =
  | 'cardiac'       // Сердечный приступ
  | 'respiratory'   // Проблемы с дыханием
  | 'trauma'        // Травма
  | 'stroke'        // Инсульт
  | 'bleeding'      // Кровотечение
  | 'poisoning'     // Отравление
  | 'unconscious'   // Потеря сознания
  | 'other';

// ========================================
// СИСТЕМА 1: ЗАПИСЬ НА ПРИЁМ (APPOINTMENT)
// ========================================

export interface AppointmentIntent {
  type: 'appointment';
  subType: 'book' | 'cancel' | 'reschedule' | 'check' | 'list';
  specialty?: string;
  doctorId?: number;
  doctorName?: string;
  preferredDate?: Date;
  preferredTime?: string;
  symptoms?: string;
  appointmentId?: number; // Для отмены/переноса
}

// Специальности врачей
export const MEDICAL_SPECIALTIES = {
  therapist: {
    ru: 'терапевт',
    keywords: ['терапевт', 'общий', 'простуда', 'грипп', 'орви', 'общее состояние'],
    description: 'Врач общей практики',
  },
  cardiologist: {
    ru: 'кардиолог',
    keywords: ['кардиолог', 'сердце', 'давление', 'аритмия', 'боль в груди', 'пульс'],
    description: 'Специалист по сердечно-сосудистой системе',
  },
  neurologist: {
    ru: 'невролог',
    keywords: ['невролог', 'голова', 'головная боль', 'мигрень', 'позвоночник', 'нерв'],
    description: 'Специалист по нервной системе',
  },
  pediatrician: {
    ru: 'педиатр',
    keywords: ['педиатр', 'ребенок', 'ребёнок', 'дети', 'детский'],
    description: 'Детский врач',
  },
  endocrinologist: {
    ru: 'эндокринолог',
    keywords: ['эндокринолог', 'гормоны', 'щитовидка', 'диабет', 'сахар'],
    description: 'Специалист по гормональной системе',
  },
  dermatologist: {
    ru: 'дерматолог',
    keywords: ['дерматолог', 'кожа', 'сыпь', 'прыщи', 'аллергия кожи'],
    description: 'Специалист по кожным заболеваниям',
  },
  ophthalmologist: {
    ru: 'офтальмолог',
    keywords: ['офтальмолог', 'окулист', 'глаз', 'зрение', 'глаза'],
    description: 'Специалист по зрению',
  },
  otolaryngologist: {
    ru: 'лор',
    keywords: ['лор', 'ухо', 'горло', 'нос', 'отоларинголог', 'насморк'],
    description: 'Специалист по ЛОР-органам',
  },
  surgeon: {
    ru: 'хирург',
    keywords: ['хирург', 'операция', 'хирургия', 'удаление'],
    description: 'Хирург',
  },
  gynecologist: {
    ru: 'гинеколог',
    keywords: ['гинеколог', 'женский врач', 'беременность'],
    description: 'Женский врач',
  },
  urologist: {
    ru: 'уролог',
    keywords: ['уролог', 'почки', 'мочевой', 'простата'],
    description: 'Специалист по мочеполовой системе',
  },
  orthopedist: {
    ru: 'ортопед',
    keywords: ['ортопед', 'кости', 'суставы', 'спина', 'колено'],
    description: 'Специалист по опорно-двигательному аппарату',
  },
} as const;

// ========================================
// СИСТЕМА 2: КОНСУЛЬТАЦИЯ (CONSULTATION)
// ========================================

export interface ConsultationIntent {
  type: 'consultation';
  subType: 'symptom_check' | 'general_advice' | 'medication_info' | 'follow_up';
  symptoms: string[];
  bodyPart?: string;
  duration?: string;
  severity: SeverityLevel;
  recommendedSpecialty?: string;
  urgencyScore: number; // 1-10
}

// Ключевые слова для определения тяжести
export const SEVERITY_KEYWORDS = {
  critical: [
    'не могу дышать', 'задыхаюсь', 'боль в груди', 'сердечный приступ',
    'потерял сознание', 'инфаркт', 'инсульт', 'сильное кровотечение',
    'не чувствую руку', 'не чувствую ногу', 'парализовало',
  ],
  high: [
    'сильная боль', 'высокая температура', 'рвота', 'диарея',
    'кровь', 'отёк', 'не могу двигаться', 'острая боль',
    '39 градусов', '40 градусов', 'несколько дней',
  ],
  medium: [
    'болит', 'беспокоит', 'дискомфорт', 'ноет', 'тянет',
    'температура', 'слабость', 'головокружение', 'тошнота',
  ],
  low: [
    'немного болит', 'легкая боль', 'небольшой', 'иногда',
    'редко', 'слегка', 'чуть-чуть',
  ],
};

// ========================================
// СИСТЕМА 3: СПРАВОЧНАЯ ИНФОРМАЦИЯ (INFO)
// ========================================

export interface InfoIntent {
  type: 'info';
  subType:
    | 'working_hours'    // Часы работы
    | 'address'          // Адрес
    | 'services'         // Услуги
    | 'prices'           // Цены
    | 'doctors'          // Врачи
    | 'parking'          // Парковка
    | 'insurance'        // Страховка
    | 'preparation'      // Подготовка к приёму
    | 'documents'        // Необходимые документы
    | 'general';         // Общая информация
  query: string;
}

// Ключевые слова для типов информации
export const INFO_KEYWORDS = {
  working_hours: ['время работы', 'часы работы', 'расписание', 'когда работает', 'во сколько'],
  address: ['адрес', 'где находится', 'как доехать', 'проезд', 'расположение'],
  services: ['услуги', 'что делаете', 'процедуры', 'анализы', 'узи', 'экг'],
  prices: ['цена', 'стоимость', 'сколько стоит', 'прайс', 'тариф'],
  doctors: ['врачи', 'специалисты', 'кто принимает', 'какие врачи'],
  parking: ['парковка', 'где припарковаться', 'стоянка'],
  insurance: ['страховка', 'дмс', 'омс', 'полис'],
  preparation: ['подготовка', 'как подготовиться', 'что нужно сделать перед'],
  documents: ['документы', 'что взять', 'какие документы'],
};

// ========================================
// СИСТЕМА 4: ЭКСТРЕННЫЙ ВЫЗОВ (EMERGENCY)
// ========================================

export interface EmergencyIntent {
  type: 'emergency';
  emergencyType: EmergencyType;
  severity: 'critical' | 'high';
  symptoms: string[];
  location?: string;
  patientInfo?: {
    name?: string;
    age?: number;
    phone?: string;
  };
  dispatchRequired: boolean;
}

// Ключевые слова для экстренных ситуаций
export const EMERGENCY_KEYWORDS = {
  cardiac: [
    'сердечный приступ', 'инфаркт', 'боль в груди', 'сердце болит',
    'не могу дышать сердце', 'сильная боль в груди',
  ],
  respiratory: [
    'не могу дышать', 'задыхаюсь', 'нехватка воздуха', 'астма приступ',
    'перестал дышать', 'синеет',
  ],
  trauma: [
    'авария', 'упал', 'травма', 'перелом', 'ушиб сильный',
    'не могу встать', 'сбила машина',
  ],
  stroke: [
    'инсульт', 'не могу говорить', 'перекосило лицо', 'отнялась рука',
    'отнялась нога', 'парализовало',
  ],
  bleeding: [
    'сильное кровотечение', 'не останавливается кровь', 'истекает кровью',
    'порезался глубоко',
  ],
  poisoning: [
    'отравление', 'отравился', 'выпил что-то', 'съел что-то плохое',
    'тошнит сильно', 'рвота не прекращается',
  ],
  unconscious: [
    'потерял сознание', 'упал в обморок', 'не реагирует',
    'без сознания', 'не отвечает',
  ],
};

// ========================================
// КОНФИГУРАЦИЯ СИСТЕМЫ
// ========================================

export interface IntentSystemConfig {
  // Порог уверенности для автоматической маршрутизации
  confidenceThreshold: {
    high: number;    // >= 0.8
    medium: number;  // >= 0.5
    low: number;     // < 0.5
  };

  // Приоритеты систем (emergency всегда первый)
  systemPriority: IntentType[];

  // Fallback для неопределённых намерений
  defaultFallback: IntentType;
}

export const DEFAULT_CONFIG: IntentSystemConfig = {
  confidenceThreshold: {
    high: 0.8,
    medium: 0.5,
    low: 0,
  },
  systemPriority: ['emergency', 'appointment', 'consultation', 'info', 'greeting', 'unknown'],
  defaultFallback: 'unknown',
};
