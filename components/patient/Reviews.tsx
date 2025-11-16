'use client';

import { useState } from 'react';

interface ReviewFormProps {
  doctorId: number;
  doctorName: string;
  appointmentId?: number;
  onSuccess?: () => void;
}

export default function ReviewForm({
  doctorId,
  doctorName,
  appointmentId,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      alert('Пожалуйста, выберите оценку');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          appointmentId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setRating(5);
        setComment('');
        if (onSuccess) onSuccess();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        alert(data.error || 'Не удалось отправить отзыв');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Произошла ошибка при отправке отзыва');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const displayRating = hoveredRating || rating;
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="text-4xl transition-all duration-200 hover:scale-110"
          >
            {star <= displayRating ? (
              <span className="text-yellow-500">★</span>
            ) : (
              <span className="text-gray-600">☆</span>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">
        Оставить отзыв о враче {doctorName}
      </h3>

      {success && (
        <div className="mb-4 p-4 bg-green-900 bg-opacity-30 border border-green-500 rounded text-green-300">
          ✓ Отзыв успешно отправлен!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-300 mb-3">
            Оценка <span className="text-red-500">*</span>
          </label>
          {renderStars()}
          <p className="text-gray-400 text-sm mt-2">
            {rating === 1 && 'Очень плохо'}
            {rating === 2 && 'Плохо'}
            {rating === 3 && 'Нормально'}
            {rating === 4 && 'Хорошо'}
            {rating === 5 && 'Отлично'}
          </p>
        </div>

        <div>
          <label htmlFor="comment" className="block text-gray-300 mb-2">
            Комментарий (необязательно)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            placeholder="Расскажите о вашем опыте посещения врача..."
          />
          <p className="text-gray-500 text-sm mt-1">
            {comment.length}/500 символов
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {submitting ? 'Отправка...' : 'Отправить отзыв'}
        </button>
      </form>
    </div>
  );
}
