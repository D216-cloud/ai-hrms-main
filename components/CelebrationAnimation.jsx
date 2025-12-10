"use client";

import { useEffect, useState, useMemo } from "react";
import { Sparkles, Trophy, Star } from "lucide-react";

export function CelebrationAnimation({ isVisible }) {
  const [particlePositions, setParticlePositions] = useState([]);

  useEffect(() => {
    if (isVisible) {
      // Generate particles once when animation becomes visible
      setParticlePositions(
        Array.from({ length: 30 }).map((_, i) => ({
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 100,
          duration: 2 + Math.random() * 2,
          type: i % 3,
        }))
      );
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Confetti explosion */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particlePositions.map((particle) => (
          <div
            key={particle.id}
            className="fixed animate-pulse"
            style={{
              left: particle.left + "%",
              top: particle.top + "%",
              animation: `float-up ${particle.duration}s ease-out infinite`,
            }}
          >
            {particle.type === 0 ? (
              <Sparkles className="w-4 h-4 text-yellow-400" />
            ) : particle.type === 1 ? (
              <Star className="w-4 h-4 text-blue-400" />
            ) : (
              <Trophy className="w-4 h-4 text-purple-400" />
            )}
          </div>
        ))}
      </div>

      {/* Center celebration message */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative animate-in zoom-in duration-500">
          <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-2xl blur-3xl opacity-30 animate-pulse"></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 text-center max-w-sm border-2 border-purple-600">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500 animate-bounce" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Fantastic! 🎉</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Your profile is 100% complete!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">You&apos;re all set to start your job search</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) translateX(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-500px) rotateZ(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
