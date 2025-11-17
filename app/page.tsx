import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorks from '@/components/HowItWorks';
import FAQSection from '@/components/FAQSection';

export default function Home() {

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        <Header />

        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12 mt-4 md:mt-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 md:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-pulse-slow leading-tight px-2">
            Медицинский Голосовой Помощник
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-cyan-200/80 mb-4 md:mb-6 px-4">
            Запишитесь на приём, получите консультацию или вызовите скорую помощь
          </p>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-cyan-300/60 mb-6 md:mb-8 px-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-center">Система активна • Работает на AI Qwen 2.5</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 max-w-md sm:max-w-none mx-auto">
            <Link href="/assistant" className="neon-button text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 inline-block text-center">
              🎤 Начать диалог
            </Link>
            <Link
              href="/appointments"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 hover:from-blue-500/40 hover:to-cyan-500/40 border border-blue-500/50 text-white font-semibold rounded-xl transition-all inline-block text-center"
            >
              📅 Мои записи
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
          <Link href="/assistant">
            <QuickActionCard
              icon="📅"
              title="Запись на приём"
              description="Выберите врача и время"
              gradient="from-cyan-500/20 to-blue-600/20"
            />
          </Link>
          <Link href="/assistant">
            <QuickActionCard
              icon="🩺"
              title="Консультация"
              description="Опишите симптомы"
              gradient="from-purple-500/20 to-pink-600/20"
            />
          </Link>
          <Link href="/assistant">
            <QuickActionCard
              icon="ℹ️"
              title="Справка"
              description="Режим работы, цены"
              gradient="from-green-500/20 to-teal-600/20"
            />
          </Link>
          <Link href="/assistant">
            <QuickActionCard
              icon="🚨"
              title="Скорая помощь"
              description="Экстренный вызов"
              gradient="from-red-500/20 to-orange-600/20"
            />
          </Link>
        </div>

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works */}
        <HowItWorks />

        {/* Statistics */}
        <div className="cyber-card p-4 sm:p-6 md:p-8 mb-8 md:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600 px-2">
            Статистика клиники в реальном времени
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <StatCard label="Записей сегодня" value="24" color="cyan" trend="+12%" />
            <StatCard label="Активных врачей" value="12" color="purple" />
            <StatCard label="Консультаций" value="45" color="green" trend="+8%" />
            <StatCard label="Удовлетворённость" value="98%" color="pink" trend="+2%" />
          </div>
        </div>

        {/* FAQ Section */}
        <FAQSection />

        {/* Doctors Info */}
        <div className="cyber-card p-4 sm:p-6 md:p-8 mb-8 md:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-cyan-400">
            Наши специалисты
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <DoctorCard name="Иван Петров" specialty="Кардиолог" experience="15 лет" />
            <DoctorCard name="Мария Сидорова" specialty="Кардиолог" experience="10 лет" />
            <DoctorCard name="Анна Смирнова" specialty="Терапевт" experience="12 лет" />
            <DoctorCard name="Дмитрий Козлов" specialty="Невролог" experience="8 лет" />
            <DoctorCard name="Елена Волкова" specialty="Педиатр" experience="20 лет" />
            <DoctorCard name="Сергей Морозов" specialty="Хирург" experience="18 лет" />
          </div>
        </div>

        {/* CTA Section */}
        <div className="cyber-card p-6 sm:p-8 md:p-12 mb-8 md:mb-12 text-center bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600 px-2">
            Готовы начать?
          </h3>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 md:mb-8 px-4">
            Просто нажмите на микрофон и скажите, чем мы можем вам помочь
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 max-w-md sm:max-w-none mx-auto">
            <Link href="/assistant" className="neon-button text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 inline-block text-center">
              🎤 Говорить с помощником
            </Link>
            <Link
              href="/admin"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/40 hover:to-pink-500/40 border border-purple-500/50 text-white font-semibold rounded-xl transition-all inline-block text-center"
            >
              👨‍💼 Админ-панель
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function QuickActionCard({ icon, title, description, gradient }: {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className={`cyber-card p-4 sm:p-6 hover:scale-105 transform transition-all cursor-pointer bg-gradient-to-br ${gradient} group`}>
      <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-base sm:text-lg font-bold mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-300">{description}</p>
    </div>
  );
}

function StatCard({ label, value, color, trend }: {
  label: string;
  value: string;
  color: string;
  trend?: string;
}) {
  return (
    <div className="text-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
      <div className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 text-${color}-400`}>{value}</div>
      <div className="text-xs sm:text-sm text-gray-400 mb-1">{label}</div>
      {trend && (
        <div className="text-xs text-green-400 flex items-center justify-center gap-1">
          <span>↑</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

function DoctorCard({ name, specialty, experience }: {
  name: string;
  specialty: string;
  experience: string;
}) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 hover:border-cyan-500/50 transition-all">
      <div className="text-2xl sm:text-3xl mb-2">👨‍⚕️</div>
      <h4 className="font-bold text-base sm:text-lg mb-1">{name}</h4>
      <p className="text-cyan-400 text-xs sm:text-sm mb-1">{specialty}</p>
      <p className="text-gray-500 text-xs">Опыт: {experience}</p>
    </div>
  );
}
