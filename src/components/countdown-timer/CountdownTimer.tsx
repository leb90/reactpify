import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
  title?: string;
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  showSeconds?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

/**
 * CountdownTimer - Countdown timer component
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  title = "Limited Time Offer! ⏰🔥",
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  backgroundColor = "primary",
  textColor = "white"
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) {
    return (
      <div>
        <div className="card text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">⏰</span>
            </div>
            <h3 className="text-2xl font-bold text-red-600 mb-2">Offer Expired!</h3>
            <p className="text-gray-600">This promotion has ended.</p>
          </div>
        </div>
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: 'Days', show: showDays, gradient: 'from-red-500 to-pink-600', shadow: 'shadow-red-500/25' },
    { value: timeLeft.hours, label: 'Hours', show: showHours, gradient: 'from-orange-500 to-yellow-600', shadow: 'shadow-orange-500/25' },
    { value: timeLeft.minutes, label: 'Minutes', show: showMinutes, gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/25' },
    { value: timeLeft.seconds, label: 'Seconds', show: showSeconds, gradient: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/25' },
  ].filter(unit => unit.show);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 shadow-2xl border border-blue-200/50 p-8 md:p-12 text-center">
        {/* Enhanced Header */}
        <div className="mb-10">
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6 shadow-lg">
            <span className="text-3xl animate-pulse">⚡</span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-red-500 animate-ping opacity-20"></div>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-gradient-to-r from-gray-800 via-gray-900 to-black bg-clip-text mb-4">
            {title}
          </h2>
          <p className="text-gray-600 text-xl md:text-2xl font-medium">
            ⏰ Don't miss this unique opportunity!
          </p>
        </div>

        {/* Enhanced Countdown Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-12">
          {timeUnits.map((unit, index) => (
            <div key={unit.label} className="relative group">
              <div className={`
                bg-gradient-to-br ${unit.gradient} text-white rounded-3xl shadow-xl ${unit.shadow} p-8 
                transform hover:scale-110 hover:rotate-1 transition-all duration-500
                relative overflow-hidden border-2 border-white/30
              `}>
                {/* Enhanced background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10"></div>
                <div className="absolute top-3 right-3 w-6 h-6 bg-white/30 rounded-full animate-pulse"></div>
                <div className="absolute bottom-3 left-3 w-4 h-4 bg-white/40 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-white/5 rounded-full blur-xl transform -translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="relative z-10">
                  <div className="text-5xl md:text-6xl font-black mb-3 font-mono tracking-tighter drop-shadow-lg">
                    {unit.value.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm md:text-base font-bold uppercase tracking-widest opacity-95 bg-black/20 rounded-full px-3 py-1">
                    {unit.label}
                  </div>
                </div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
              
              {/* Enhanced connector */}
              {index < timeUnits.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full transform -translate-y-1/2 z-0">
                  <div className="absolute left-1/2 top-1/2 w-3 h-3 bg-gray-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary-200">
          <p className="text-gray-700 mb-4 text-lg font-medium">
            🔥 Take advantage of this offer before it ends!
          </p>
          <button className="btn-primary text-lg px-8 py-3">
            Shop Now!
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full rounded-full transition-all duration-1000 animate-pulse-slow"
              style={{
                width: `${Math.max(10, (timeLeft.seconds / 60) * 100)}%`
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">⏰ Time flies...</p>
        </div>
      </div>
    </div>
  );
}; 