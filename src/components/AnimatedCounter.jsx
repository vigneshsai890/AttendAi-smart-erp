import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { gsap } from 'gsap';

const AnimatedCounter = ({
  target,
  suffix = '',
  prefix = '',
  duration = 2,
  className = '',
}) => {
  const counterRef = useRef(null);
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  const animated = useRef(false);

  const setRefs = (node) => {
    counterRef.current = node;
    inViewRef(node);
  };

  useEffect(() => {
    if (inView && !animated.current && counterRef.current) {
      animated.current = true;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = `${prefix}${Math.round(obj.val)}${suffix}`;
          }
        },
      });
    }
  }, [inView, target, duration, suffix, prefix]);

  return (
    <span ref={setRefs} className={className}>
      {prefix}0{suffix}
    </span>
  );
};

export default AnimatedCounter;
