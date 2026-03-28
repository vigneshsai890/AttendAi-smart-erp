import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const TiltCard = ({ children, className = '', intensity = 15, glowColor = 'rgba(99,102,241,0.3)' }) => {
  const cardRef = useRef(null);
  const animFrameRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    animFrameRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;

      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
      cardRef.current.style.boxShadow = `0 20px 60px ${glowColor}, 0 0 0 1px rgba(255,255,255,0.05)`;
    });
  }, [intensity, glowColor]);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    cardRef.current.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
    cardRef.current.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
    setTimeout(() => {
      if (cardRef.current) cardRef.current.style.transition = '';
    }, 500);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
      }}
    >
      {children}
    </motion.div>
  );
};

export default TiltCard;
