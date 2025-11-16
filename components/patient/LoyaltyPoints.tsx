'use client';

import { useState, useEffect } from 'react';

interface LoyaltyData {
  points: number;
  tier: string;
  totalEarned: number;
  totalSpent: number;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function LoyaltyPoints() {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyData();
    fetchTransactions();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch('/api/loyalty');
      const data = await response.json();
      setLoyalty(data);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/loyalty/transactions?limit=10');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const getTierInfo = (tier: string) => {
    const info: Record<string, { name: string; icon: string; color: string; next?: string }> = {
      bronze: { name: 'Bronze', icon: '🥉', color: 'text-orange-400', next: '2,000' },
      silver: { name: 'Silver', icon: '🥈', color: 'text-gray-300', next: '5,000' },
      gold: { name: 'Gold', icon: '🥇', color: 'text-yellow-400', next: '10,000' },
      platinum: { name: 'Platinum', icon: '💎', color: 'text-purple-400' },
    };
    return info[tier] || info.bronze;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!loyalty) {
    return <div className="text-center text-gray-400 p-8">Не удалось загрузить данные</div>;
  }

  const tierInfo = getTierInfo(loyalty.tier);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Программа лояльности</h2>

      {/* Current Status */}
      <div className="cyber-card p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{tierInfo.icon}</div>
          <h3 className={`text-3xl font-bold ${tierInfo.color} mb-2`}>{tierInfo.name}</h3>
          <p className="text-gray-400">Ваш текущий уровень</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-gray-800 rounded">
            <p className="text-gray-400 text-sm mb-1">Текущий баланс</p>
            <p className="text-3xl font-bold text-cyan-400">{loyalty.points}</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded">
            <p className="text-gray-400 text-sm mb-1">Всего заработано</p>
            <p className="text-2xl font-bold text-green-400">{loyalty.totalEarned}</p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded">
            <p className="text-gray-400 text-sm mb-1">Всего потрачено</p>
            <p className="text-2xl font-bold text-red-400">{loyalty.totalSpent}</p>
          </div>
        </div>

        {tierInfo.next && (
          <div className="text-center">
            <p className="text-gray-400 mb-2">
              До следующего уровня: {parseInt(tierInfo.next) - loyalty.totalEarned} баллов
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((loyalty.totalEarned / parseInt(tierInfo.next)) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* How to Earn Points */}
      <div className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Как заработать баллы</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-900 rounded">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-white font-semibold">Завершение визита</p>
              <p className="text-gray-400 text-sm">+100 баллов за каждый визит</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-900 rounded">
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-white font-semibold">Приведи друга</p>
              <p className="text-gray-400 text-sm">+200 баллов за каждого реферала</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-900 rounded">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-white font-semibold">Оставь отзыв</p>
              <p className="text-gray-400 text-sm">+50 баллов за отзыв</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">История операций</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Пока нет операций</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-900 rounded hover:bg-gray-750 transition"
              >
                <div>
                  <p className="text-white font-semibold">{transaction.description}</p>
                  <p className="text-gray-400 text-sm">
                    {new Date(transaction.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <span
                  className={`text-xl font-bold ${
                    transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
