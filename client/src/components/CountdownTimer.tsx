import { useEffect, useState } from "react";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export default function CountdownTimer() {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      // Registration ends July 1, 2026 at 23:59:59
      const registrationDeadline = new Date(2026, 6, 1, 23, 59, 59).getTime();
      const now = new Date().getTime();
      const difference = registrationDeadline - now;

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          isExpired: false,
        });
      }
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, []);

  if (timeRemaining.isExpired) {
    return (
      <div className="bg-red-900 text-white py-4 px-6 rounded-lg text-center font-semibold">
        Registration has ended. Thank you for your interest!
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-burgundy to-gold text-white py-6 px-8 rounded-lg text-center">
      <p className="text-sm font-semibold mb-3 uppercase tracking-wide">Registration Closes In</p>
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white bg-opacity-20 rounded-lg p-4">
          <div className="text-3xl font-bold">{String(timeRemaining.days).padStart(2, "0")}</div>
          <div className="text-xs uppercase tracking-wider mt-1">Days</div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-4">
          <div className="text-3xl font-bold">{String(timeRemaining.hours).padStart(2, "0")}</div>
          <div className="text-xs uppercase tracking-wider mt-1">Hours</div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-4">
          <div className="text-3xl font-bold">{String(timeRemaining.minutes).padStart(2, "0")}</div>
          <div className="text-xs uppercase tracking-wider mt-1">Minutes</div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-4">
          <div className="text-3xl font-bold">{String(timeRemaining.seconds).padStart(2, "0")}</div>
          <div className="text-xs uppercase tracking-wider mt-1">Seconds</div>
        </div>
      </div>
    </div>
  );
}
