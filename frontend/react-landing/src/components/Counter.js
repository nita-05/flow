import React, { useEffect, useState } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const Counter = ({ value = 0, duration = 1200, suffix = '' }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let rafId;
    const start = performance.now();
    const target = Number.isFinite(value) ? value : 0;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      setDisplay(Math.floor(eased * target));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  return (
    <span>{display.toLocaleString()} {suffix}</span>
  );
};

export default Counter;


