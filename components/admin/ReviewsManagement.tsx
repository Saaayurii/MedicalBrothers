'use client';

import { useState, useEffect } from 'react';

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  doctor: {
    id: number;
    name: string;
    specialty: string;
  };
  patient: {
    id: number;
    name: string | null;
  };
}

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviews?limit=50');
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: number, approved: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: approved }),
      });

      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'pending') return !review.isApproved;
    if (filter === 'approved') return review.isApproved;
    return true;
  });

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
    <div className="space-y-4 sm:space-y-6">
      {/* Filters - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm ${
              filter === 'all' ? 'bg-cyan-600' : 'bg-gray-700'
            } text-white transition-colors`}
          >
            Все ({reviews.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm ${
              filter === 'pending' ? 'bg-yellow-600' : 'bg-gray-700'
            } text-white transition-colors`}
          >
            Модерация ({reviews.filter((r) => !r.isApproved).length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm ${
              filter === 'approved' ? 'bg-green-600' : 'bg-gray-700'
            } text-white transition-colors`}
          >
            Одобрены ({reviews.filter((r) => r.isApproved).length})
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="cyber-card p-3 sm:p-4 md:p-6 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                {/* Stars and badges */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="text-lg sm:text-2xl text-yellow-500">
                    {renderStars(review.rating)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {review.isVerified && (
                      <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-green-900 text-green-300 text-[10px] sm:text-xs rounded">
                        Проверено
                      </span>
                    )}
                    {review.isApproved ? (
                      <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-blue-900 text-blue-300 text-[10px] sm:text-xs rounded">
                        Одобрено
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-yellow-900 text-yellow-300 text-[10px] sm:text-xs rounded">
                        Модерация
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-white font-semibold text-sm sm:text-base mb-1 truncate">
                  Врач: {review.doctor.name}
                  <span className="text-gray-400 text-xs sm:text-sm ml-1 sm:ml-2">
                    ({review.doctor.specialty})
                  </span>
                </p>

                <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">
                  {review.patient.name || 'Аноним'} •{' '}
                  {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                </p>

                {review.comment && (
                  <p className="text-gray-300 italic text-xs sm:text-sm line-clamp-3">"{review.comment}"</p>
                )}
              </div>

              {/* Action buttons - responsive */}
              <div className="flex gap-2 flex-shrink-0">
                {!review.isApproved ? (
                  <>
                    <button
                      onClick={() => handleApprove(review.id, true)}
                      className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 transition"
                    >
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleApprove(review.id, false)}
                      className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700 transition"
                    >
                      Отклонить
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleApprove(review.id, false)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-600 text-white rounded text-xs sm:text-sm hover:bg-gray-700 transition"
                  >
                    Скрыть
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="text-center py-8 sm:py-12 text-gray-400">
            <p className="text-base sm:text-xl">Отзывов не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
