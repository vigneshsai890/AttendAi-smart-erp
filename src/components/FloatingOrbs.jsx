import React from 'react';
import { motion } from 'framer-motion';

const orbs = [
  { color: 'rgba(99,102,241,0.25)', size: 600, x: '-10%', y: '-20%', delay: 0, duration: 8 },
  { color: 'rgba(139,92,246,0.2)', size: 400, x: '60%', y: '20%', delay: 2, duration: 10 },
  { color: 'rgba(34,211,238,0.15)', size: 300, x: '20%', y: '70%', delay: 4, duration: 9 },
  { color: 'rgba(99,102,241,0.12)', size: 250, x: '80%', y: '80%', delay: 1, duration: 11 },
];

const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            left: orb.x,
            top: orb.y,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default FloatingOrbs;
