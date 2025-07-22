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
  title = "Limited Time Offer",
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  backgroundColor = "#000",
  textColor = "#fff"
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
      <div className="countdown-expired" style={{ backgroundColor, color: textColor }}>
        <h3>Offer Expired!</h3>
        <p>This promotion has ended.</p>
      </div>
    );
  }

  return (
    <div className="countdown-timer" style={{ backgroundColor, color: textColor }}>
      <div className="countdown-header">
        <h2>{title}</h2>
      </div>

      <div className="countdown-display">
        {showDays && (
          <div className="countdown-unit">
            <span className="countdown-number">{timeLeft.days.toString().padStart(2, '0')}</span>
            <span className="countdown-label">Days</span>
          </div>
        )}

        {showHours && (
          <div className="countdown-unit">
            <span className="countdown-number">{timeLeft.hours.toString().padStart(2, '0')}</span>
            <span className="countdown-label">Hours</span>
          </div>
        )}

        {showMinutes && (
          <div className="countdown-unit">
            <span className="countdown-number">{timeLeft.minutes.toString().padStart(2, '0')}</span>
            <span className="countdown-label">Minutes</span>
          </div>
        )}

        {showSeconds && (
          <div className="countdown-unit">
            <span className="countdown-number">{timeLeft.seconds.toString().padStart(2, '0')}</span>
            <span className="countdown-label">Seconds</span>
          </div>
        )}
      </div>

      <div className="countdown-footer">
        <p>Don't miss out!</p>
      </div>
    </div>
  );
}; 