import React, { useEffect, useState } from 'react';

export const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [cursorType, setCursorType] = useState('default'); // 'default' | 'view' | 'open' | 'cta' | 'hidden'
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  useEffect(() => {
    // Detect touch device
    if (window.matchMedia('(pointer: fine)').matches) {
      setIsTouchDevice(false);
    } else {
      return;
    }

    const onMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });

      // Determine hover target
      const target = e.target.closest('[data-cursor], button, a, img, input, select');
      if (!target) {
        setCursorType('default');
        return;
      }

      const customCursor = target.getAttribute('data-cursor');
      if (customCursor) {
        setCursorType(customCursor);
      } else if (target.tagName === 'IMG' || target.classList.contains('cursor-view')) {
        setCursorType('view');
      } else if (target.closest('.group') && target.closest('.group').onclick) {
        setCursorType('open');
      } else if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        setCursorType('cta');
      } else {
        setCursorType('default');
      }
    };

    const onMouseLeave = () => {
      setCursorType('hidden');
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  if (isTouchDevice || cursorType === 'hidden') return null;

  return (
    <div
      className="fixed pointer-events-none z-[99999] transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {cursorType === 'default' && (
        <div className="w-2.5 h-2.5 rounded-full bg-[#EDE7DC] opacity-80 mix-blend-difference" />
      )}

      {cursorType === 'view' && (
        <div className="px-2.5 py-1 rounded-full bg-[#080808]/90 border border-[#8E1717] text-[#EDE7DC] font-mono text-[9px] tracking-widest uppercase shadow-lg">
          VIEW
        </div>
      )}

      {cursorType === 'open' && (
        <div className="px-2.5 py-1 rounded-full bg-[#080808]/90 border border-[#EDE7DC] text-[#EDE7DC] font-mono text-[9px] tracking-widest uppercase shadow-lg">
          OPEN
        </div>
      )}

      {cursorType === 'cta' && (
        <div className="w-5 h-5 rounded-full border border-[#8E1717] bg-[#8E1717]/20 flex items-center justify-center text-[10px] text-[#EDE7DC]">
          •
        </div>
      )}
    </div>
  );
};
