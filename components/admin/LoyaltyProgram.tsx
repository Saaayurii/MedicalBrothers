'use client';

import { useState, useEffect } from 'react';

interface LoyaltyData {
  patientId: number;
  patientName: string;
  points: number;
  tier: string;
  totalEarned: number;
  totalSpent: number;
  recentTransactions: Transaction[];
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function LoyaltyProgram() {
  const [topPatients, setTopPatients] = useState<LoyaltyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalPoints: 0,
    byTier: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
  });

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      // Здесь будет реальный API запрос
      // const response = await fetch('/api/loyalty/stats');
      // const data = await response.json();

      // Временные данные для демонстрации
      setStats({
        totalPatients: 156,
        totalPoints: 45230,
        byTier: { bronze: 98, silver: 42, gold: 12, platinum: 4 },
      });
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-orange-900 text-orange-300',
      silver: 'bg-gray-600 text-gray-100',
      gold: 'bg-yellow-600 text-yellow-100',
      platinum: 'bg-purple-600 text-purple-100',
    };
    return colors[tier] || 'bg-gray-700 text-gray-300';
  };

  const getTierIcon = (tier: string) => {
    const icons: Record<string, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
    };
    return icons[tier] || '⭐';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="cyber-card p-3 sm:p-4 md:p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <p className="text-gray-400 text-[10px] sm:text-sm mb-1">Участников</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{stats.totalPatients}</p>
        </div>
        <div className="cyber-card p-3 sm:p-4 md:p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <p className="text-gray-400 text-[10px] sm:text-sm mb-1">Баллов</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-400">{stats.totalPoints.toLocaleString()}</p>
        </div>
        <div className="cyber-card p-3 sm:p-4 md:p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <p className="text-gray-400 text-[10px] sm:text-sm mb-1">Средний</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400">
            {Math.round(stats.totalPoints / stats.totalPatients)}
          </p>
        </div>
        <div className="cyber-card p-3 sm:p-4 md:p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <p className="text-gray-400 text-[10px] sm:text-sm mb-1">Активность</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-400">87%</p>
        </div>
      </div>

      {/* Tier Distribution */}
      <div className="cyber-card p-3 sm:p-4 md:p-6 bg-gray-800 border border-gray-700 rounded-lg">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4">Распределение по уровням</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {Object.entries(stats.byTier).map(([tier, count]) => (
            <div key={tier} className="text-center p-2 sm:p-3 bg-gray-900 rounded-lg">
              <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">{getTierIcon(tier)}</div>
              <p className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded inline-block mb-1 sm:mb-2 text-xs sm:text-sm ${getTierColor(tier)}`}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{count}</p>
              <p className="text-gray-400 text-[10px] sm:text-sm">
                {Math.round((count / stats.totalPatients) * 100)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Members */}
      <div className="cyber-card p-3 sm:p-4 md:p-6 bg-gray-800 border border-gray-700 rounded-lg">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4">Топ участники</h3>
        <div className="space-y-2 sm:space-y-3">
          {[
            { name: 'Иван Петров', points: 2450, tier: 'gold', totalEarned: 3200 },
            { name: 'Мария Сидорова', points: 1890, tier: 'silver', totalEarned: 2100 },
            { name: 'Алексей Иванов', points: 1650, tier: 'silver', totalEarned: 1900 },
            { name: 'Елена Волкова', points: 1420, tier: 'silver', totalEarned: 1650 },
            { name: 'Дмитрий Козлов', points: 980, tier: 'bronze', totalEarned: 1200 },
          ].map((member, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 md:p-4 bg-gray-900 rounded gap-2 sm:gap-4 hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">#{index + 1}</span>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm sm:text-base truncate">{member.name}</p>
                  <p className="text-gray-400 text-[10px] sm:text-sm">
                    Всего: {member.totalEarned} баллов
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 ml-8 sm:ml-0">
                <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded text-xs sm:text-sm ${getTierColor(member.tier)}`}>
                  {getTierIcon(member.tier)} {member.tier}
                </span>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400">{member.points}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Requirements */}
      <div className="cyber-card p-3 sm:p-4 md:p-6 bg-gray-800 border border-gray-700 rounded-lg">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4">Требования к уровням</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 md:p-4 bg-gray-900 rounded text-center">
            <div className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2">🥉</div>
            <p className="text-white font-semibold text-xs sm:text-sm md:text-base mb-1">Bronze</p>
            <p className="text-gray-400 text-[10px] sm:text-sm">0 - 1,999</p>
          </div>
          <div className="p-2 sm:p-3 md:p-4 bg-gray-900 rounded text-center">
            <div className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2">🥈</div>
            <p className="text-white font-semibold text-xs sm:text-sm md:text-base mb-1">Silver</p>
            <p className="text-gray-400 text-[10px] sm:text-sm">2,000 - 4,999</p>
          </div>
          <div className="p-2 sm:p-3 md:p-4 bg-gray-900 rounded text-center">
            <div className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2">🥇</div>
            <p className="text-white font-semibold text-xs sm:text-sm md:text-base mb-1">Gold</p>
            <p className="text-gray-400 text-[10px] sm:text-sm">5,000 - 9,999</p>
          </div>
          <div className="p-2 sm:p-3 md:p-4 bg-gray-900 rounded text-center">
            <div className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2">💎</div>
            <p className="text-white font-semibold text-xs sm:text-sm md:text-base mb-1">Platinum</p>
            <p className="text-gray-400 text-[10px] sm:text-sm">10,000+</p>
          </div>
        </div>
      </div>
    </div>
  );
}
