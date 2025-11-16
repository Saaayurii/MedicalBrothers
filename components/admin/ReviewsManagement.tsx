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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Управление отзывами</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all' ? 'bg-cyan-600' : 'bg-gray-700'
            } text-white`}
          >
            Все ({reviews.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded ${
              filter === 'pending' ? 'bg-yellow-600' : 'bg-gray-700'
            } text-white`}
          >
            На модерации ({reviews.filter((r) => !r.isApproved).length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded ${
              filter === 'approved' ? 'bg-green-600' : 'bg-gray-700'
            } text-white`}
          >
            Одобренные ({reviews.filter((r) => r.isApproved).length})
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl text-yellow-500">
                    {renderStars(review.rating)}
                  </div>
                  {review.isVerified && (
                    <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded">
                      ✓ Проверено
                    </span>
                  )}
                  {review.isApproved ? (
                    <span className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded">
                      Одобрено
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-900 text-yellow-300 text-xs rounded">
                      На модерации
                    </span>
                  )}
                </div>

                <p className="text-white font-semibold mb-1">
                  Врач: {review.doctor.name}
                  <span className="text-gray-400 text-sm ml-2">
                    ({review.doctor.specialty})
                  </span>
                </p>

                <p className="text-gray-400 text-sm mb-3">
                  Пациент: {review.patient.name || 'Аноним'} •{' '}
                  {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                </p>

                {review.comment && (
                  <p className="text-gray-300 italic">"{review.comment}"</p>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                {!review.isApproved ? (
                  <>
                    <button
                      onClick={() => handleApprove(review.id, true)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleApprove(review.id, false)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      Отклонить
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleApprove(review.id, false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                  >
                    Скрыть
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">Отзывов не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
