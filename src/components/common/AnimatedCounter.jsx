import React, { useEffect, useState } from 'react';

const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Parse numeric value
    const numericTarget = typeof value === 'number' 
      ? value 
      : parseInt(String(value).replace(/[^\d]/g, ''), 10) || 0;
      
    if (numericTarget === 0) {
      setCount(value);
      return;
    }

    let start = 0;
    const end = numericTarget;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutQuad
      const easedProgress = progress * (2 - progress);
      const currentVal = Math.floor(start + easedProgress * (end - start));
      
      if (typeof value === 'string' && value.includes('₹')) {
        setCount(`₹${currentVal.toLocaleString('en-IN')}`);
      } else if (typeof value === 'string' && value.includes('%')) {
        setCount(`${currentVal}%`);
      } else {
        setCount(currentVal.toLocaleString('en-IN'));
      }

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value, duration]);

  return <>{count}</>;
};

export default AnimatedCounter;
