"use client";

import { AnimatePresence, motion, useInView, type Variants } from "motion/react";
import { useRef } from "react";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: { hidden: { y: number }; visible: { y: number } };
  duration?: number;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: `${number}px`;
  blur?: string;
}

// Same blur+slide-up reveal as BlurFade, but staggered one word at a time
// by wrapping each word in its own BlurFade with an incremental delay.
export function BlurFadeText({
  text,
  as: Wrapper = "span",
  className,
  wordClassName,
  duration = 0.3,
  delay = 0,
  yOffset = 4,
  staggerDelay = 0.03,
}: {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  wordClassName?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
  staggerDelay?: number;
}) {
  const words = text.split(" ");
  return (
    <Wrapper className={className}>
      {words.map((word, i) => (
        <BlurFade
          key={`${word}-${i}`}
          delay={delay + i * staggerDelay}
          duration={duration}
          yOffset={yOffset}
          className={wordClassName ? `inline-block ${wordClassName}` : "inline-block"}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </BlurFade>
      ))}
    </Wrapper>
  );
}

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: "blur(0px)" },
  };
  const combinedVariants = variant ?? defaultVariants;

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        exit="hidden"
        variants={combinedVariants}
        transition={{
          delay: 0.04 + delay,
          duration,
          ease: "easeOut",
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
