import Link from 'next/link';

export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        {/* Loading Animation */}
        <div className="mb-8">
          <div className="relative w-32 h-32 mx-auto">
            {/* Spinning Circle */}
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>

            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center text-5xl">
              🏥
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold mb-2 text-cyan-400">
          Загрузка...
        </h2>
        <p className="text-gray-400">
          Пожалуйста, подождите
        </p>

        {/* Animated Dots */}
        <div className="mt-6 flex justify-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </main>
  );
}
