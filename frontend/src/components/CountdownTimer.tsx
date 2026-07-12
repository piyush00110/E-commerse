import React, { useState, useEffect, useRef } from 'react';

interface Props {
  endDate: Date;
  size?: 'small' | 'large';
}

const CountdownTimer: React.FC<Props> = ({ endDate, size = 'small' }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);
  const endRef = useRef(endDate.getTime());
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      endRef.current = endDate.getTime();
      initialized.current = true;
    }
  }, [endDate]);

  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      const diff = endRef.current - now;
      if (diff <= 0) { setExpired(true); return; }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, []);

  if (expired) return <span className="countdown-expired">Deal ended</span>;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (size === 'large') {
    return (
      <div className="countdown-large">
        <div className="countdown-unit"><span className="countdown-num">{pad(timeLeft.hours)}</span><span>Hours</span></div>
        <span className="countdown-colon">:</span>
        <div className="countdown-unit"><span className="countdown-num">{pad(timeLeft.minutes)}</span><span>Mins</span></div>
        <span className="countdown-colon">:</span>
        <div className="countdown-unit"><span className="countdown-num">{pad(timeLeft.seconds)}</span><span>Secs</span></div>
      </div>
    );
  }

  return (
    <div className="countdown-small">
      <span className="countdown-icon">{'\u23F1'}</span>
      <span>{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
      <span className="countdown-left">left</span>
    </div>
  );
};

export default CountdownTimer;
