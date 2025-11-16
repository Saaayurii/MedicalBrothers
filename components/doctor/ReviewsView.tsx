'use client';

import { useState, useEffect } from 'react';

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
  patient: {
    name: string | null;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  verifiedReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewsViewProps {
  doctorId: number;
}

export default function ReviewsView({ doctorId }: ReviewsViewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [doctorId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?doctorId=${doctorId}&limit=20`);
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/stats?doctorId=${doctorId}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Отзывы о вас</h2>

      {stats && (
        <>
          {/* Statistics */}
          <div className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Средняя оценка</p>
                <p className="text-4xl font-bold text-yellow-500">{stats.averageRating.toFixed(1)}</p>
                <p className="text-yellow-500 text-2xl">{renderStars(Math.round(stats.averageRating))}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Всего отзывов</p>
                <p className="text-4xl font-bold text-cyan-400">{stats.totalReviews}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Проверенных</p>
                <p className="text-4xl font-bold text-green-400">{stats.verifiedReviews}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Процент проверенных</p>
                <p className="text-4xl font-bold text-purple-400">
                  {stats.totalReviews > 0
                    ? Math.round((stats.verifiedReviews / stats.totalReviews) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Распределение оценок</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-4">
                  <span className="text-yellow-500 text-lg w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-yellow-500 h-4 transition-all duration-500"
                      style={{
                        width: `${stats.totalReviews > 0
                          ? (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100
                          : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-gray-400 w-12 text-right">
                    {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Последние отзывы</h3>
        {reviews.length === 0 ? (
          <div className="cyber-card p-12 bg-gray-800 border border-gray-700 rounded-lg text-center">
            <p className="text-gray-400 text-lg">Пока нет отзывов</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl text-yellow-500">
                      {renderStars(review.rating)}
                    </span>
                    {review.isVerified && (
                      <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded">
                        ✓ Проверено
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {review.patient.name || 'Аноним'} •{' '}
                    {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-300 italic">"{review.comment}"</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
