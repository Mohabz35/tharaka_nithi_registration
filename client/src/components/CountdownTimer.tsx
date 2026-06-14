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
    <div className="bg-gradient-to-r from-[#4a1a2a] to-[#5a2a3a] border-2 border-[#d4af37] text-white py-8 px-8 rounded-lg text-center shadow-lg">
      <p className="text-lg font-bold mb-6 uppercase tracking-widest text-[#d4af37]">Registration Closes In</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#d4af37] bg-opacity-30 border border-[#d4af37] rounded-lg p-5 transform hover:scale-105 transition-transform">
          <div className="text-3xl sm:text-4xl font-bold text-black">{String(timeRemaining.days).padStart(2, "0")}</div>
          <div className="text-xs uppercase tracking-wider mt-2 text-white font-semibold">Days</div>
        </div>
        <div className="bg-[#d4af37] bg-opacity-30 border border-[#d4af37] rounded-lg p-5 transform hover:scale-105 transition-transform">
          <div className="text-3xl sm:text-4xl font-bold text-black">{String(timeRemaining.hours).padStart(2, "0")}</div>
          <div className="text-xs uppercase tracking-wider mt-2 text-white font-semibold">Hours</div>
        </div>
        <div className="bg-[#d4af37] bg-opacity-30 border border-[#d4af37] rounded-lg p-5 transform hover:scale-105 transition-transform">
          <div className="text-3xl sm:text-4xl font-bold text-black">{String(timeRemaining.minutes).padStart(2, "0")}</div>
          <div className="text-xs uppercase tracking-wider mt-2 text-white font-semibold">Minutes</div>
        </div>
        <div className="bg-[#d4af37] bg-opacity-30 border border-[#d4af37] rounded-lg p-5 transform hover:scale-105 transition-transform">
          <div className="text-3xl sm:text-4xl font-bold text-black">{String(timeRemaining.seconds).padStart(2, "0")}</div>
          <div className="text-xs uppercase tracking-wider mt-2 text-white font-semibold">Seconds</div>
        </div>
      </div>
    </div>
  );
}
