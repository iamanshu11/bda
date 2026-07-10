'use client';

import { motion, type Variants } from 'framer-motion';

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.08 },
  }),
};

/**
 * Scroll-reveal wrapper. Fades + slides children in when they enter the viewport.
 * `index` staggers items in a grid/list.
 */
export function Reveal({
  children,
  index = 0,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article';
}) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      custom={index}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </MotionTag>
  );
}
