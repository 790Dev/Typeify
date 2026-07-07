import React, { useRef, useLayoutEffect, useEffect, useState } from "react";
import { motion } from "framer-motion";

const LINE_HEIGHT = 1.6; // unitless; also drives the 3-line viewport height

const UserTypings = ({ userInput, words, className = "" }) => {
  const charRefs = useRef([]);
  const containerRef = useRef(null);
  const [caretPos, setCaretPos] = useState(null);

  const typed = userInput.split("");
  const allChars = words.split("");

  const measureCaret = () => {
    const index = typed.length;
    const container = containerRef.current;
    if (!container) return;

    const ref =
      index === 0 ? charRefs.current[0] : charRefs.current[index - 1];
    if (!ref) return;

    const cRect = container.getBoundingClientRect();
    const rRect = ref.getBoundingClientRect();
    const scroll = container.scrollTop;

    // Content-relative coords (independent of current scroll) so the caret
    // stays glued to its character as the viewport scrolls.
    const top = rRect.top - cRect.top + scroll;
    const left = (index === 0 ? rRect.left : rRect.right) - cRect.left;
    setCaretPos({ left, top, height: rRect.height });

    // Keep the active line as the middle of the 3-line viewport: scroll so
    // exactly one line stays visible above the caret.
    const desired = Math.max(0, top - rRect.height);
    if (Math.abs(container.scrollTop - desired) > 1) {
      container.scrollTop = desired;
    }
  };

  useLayoutEffect(() => {
    measureCaret();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed.length, words]);

  useEffect(() => {
    window.addEventListener("resize", measureCaret);
    return () => window.removeEventListener("resize", measureCaret);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed.length]);

  return (
    <div
      ref={containerRef}
      className={`relative font-mono tracking-tight ${className}`}
      style={{
        lineHeight: LINE_HEIGHT,
        height: `${LINE_HEIGHT * 3}em`,
        overflow: "hidden",
      }}
    >
      {allChars.map((char, index) => {
        const typedChar = typed[index];
        const isTyped = typedChar !== undefined;
        const isCorrect = typedChar === char;
        const isWrongSpace = char === " " && isTyped && !isCorrect;

        let color = "var(--color-sub)";
        if (isTyped && isCorrect) color = "var(--color-accent-soft)";
        if (isTyped && !isCorrect && char !== " ") color = "var(--color-error)";

        return (
          <span
            key={index}
            ref={(el) => (charRefs.current[index] = el)}
            style={{
              color,
              backgroundColor: isWrongSpace
                ? "rgba(239,68,68,0.4)"
                : "transparent",
            }}
          >
            {char}
          </span>
        );
      })}

      {/* OUTER div — handles smooth position (spring) */}
      {caretPos && (
        <motion.div
          animate={{
            left: caretPos.left,
            top: caretPos.top,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 38,
            mass: 0.3,
          }}
          style={{
            position: "absolute",
            left: caretPos.left,
            top: caretPos.top,
            width: "2px",
            height: caretPos.height,
            pointerEvents: "none",
          }}
        >
          {/* INNER div — handles blink only, no position */}
          <motion.div
            animate={{ opacity: [1, 1, 0, 0, 1] }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "linear",
              times: [0, 0.4, 0.5, 0.9, 1],
            }}
            style={{
              width: "2px",
              height: "100%",
              backgroundColor: "#facc15",
              borderRadius: "2px",
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default UserTypings;
