import React, { useState, useEffect, useRef } from 'react';

const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const toggle = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setVisible(window.scrollY > 400);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', toggle, { passive: true });
    return () => window.removeEventListener('scroll', toggle);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button className="back-to-top" onClick={scrollToTop} title="Back to top">
      {'\u2191'}
    </button>
  );
};

export default BackToTop;
