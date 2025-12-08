/**
 * Intent Classification System
 *
 * Модульная система классификации намерений пациента
 * для голосового помощника медицинской клиники
 *
 * 4 основные системы обработки:
 * 1. Appointment System - Запись на приём (с БД)
 * 2. Consultation System - Консультация по симптомам
 * 3. Info System - Справочная информация
 * 4. Emergency System - Экстренный вызов
 */

// Экспорт типов
export * from './types';

// Экспорт классификатора
export { classifyIntent, extractSpecialty, extractDateTime } from './classifier';

// Экспорт маршрутизатора
export {
  routeIntent,
  handleAppointment,
  handleConsultation,
  handleInfo,
  handleEmergency,
  handleGreeting,
  handleUnknown,
  type SystemResponse,
  type ConversationContext,
} from './router';
