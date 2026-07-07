import { useCallback, useEffect, useState, useRef } from "react";
import UseWords from "./UseWords";
import UseCountdownTimer from "./UseCountdownTimer";
import UseTyping from "./UseTyping";
import { countErrors, calculateAccuracyPercentage } from "../utilty/helper";
import { useAuth } from "../src/context/AuthContext";

const useEngine = (
  selectedValue,
  mode,
  includePunctuation = false,
  includeNumbers = false,
  ai = { enabled: false, topic: "", difficulty: "medium" },
) => {
  const { showAuthModal } = useAuth();
  const [state, setState] = useState("start");
  const [errors, setErrors] = useState(0);
  const [wpmHistory, setWpmHistory] = useState([]);

  const wordCount = mode === "words" ? selectedValue : 40;
  const initialTime = mode === "time" ? selectedValue : 30;

  const { words, updateWords, appendWords, loading } = UseWords(
    wordCount,
    includePunctuation,
    includeNumbers,
    ai,
  );

  const { timeLeft, startCountdown, resetCountdown } =
    UseCountdownTimer(initialTime);

  const { typed, cursor, clearTyped, resetTotalTyped, totalTyped, inputRef, focusInput } =
    UseTyping(state !== "finish" && !showAuthModal);

  const correctCharsRef = useRef(0);
  const totalTypedRef = useRef(totalTyped);
  const startTimeRef = useRef(null);
  
  // Track specific characters the user missed
  const mistakesHistoryRef = useRef({});
  const prevTotalTypedRef = useRef(0);

  // Record a net-WPM sample at the given elapsed seconds (deduped per second).
  const recordWpm = useCallback((timeElapsed) => {
    if (timeElapsed <= 0) return;
    const second = Math.round(timeElapsed);
    const netWpm = Math.max(
      0,
      Math.round(correctCharsRef.current / 5 / (timeElapsed / 60)),
    );
    setWpmHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.second === second) {
        // Replace the sample for this second with the latest value.
        return [...prev.slice(0, -1), { second, wpm: netWpm }];
      }
      return [...prev, { second, wpm: netWpm }];
    });
  }, []);

  useEffect(() => {
    totalTypedRef.current = totalTyped;
  }, [totalTyped]);

  const isStarting = state === "start" && cursor > 0;
  const areWordsFinished = cursor >= words.length;

  // FIX: Append new words when user is close to the end (time mode only)
  useEffect(() => {
    if (mode === "time" && state === "run") {
      const charsLeft = words.length - cursor;
      if (charsLeft < 100) {
        appendWords();
      }
    }
  }, [cursor, words.length, mode, state, appendWords]);

  // Track errors and correct chars
  useEffect(() => {
    const wordsReached = words.substring(0, cursor);
    const currentErrors = countErrors(typed, wordsReached);
    setErrors(currentErrors);
    correctCharsRef.current = Math.max(0, totalTyped - currentErrors);
  }, [typed, words, cursor, totalTyped]);

  // Track specific character mistakes for AI coaching
  useEffect(() => {
    if (totalTyped > prevTotalTypedRef.current) {
      // User typed a new character
      const insertedChar = typed[typed.length - 1];
      const expectedChar = words[cursor - 1];
      if (insertedChar !== expectedChar && expectedChar) {
        const key = expectedChar.toLowerCase();
        // Ignore spaces for the AI coach tracker
        if (key !== " " && key !== "\n") {
          mistakesHistoryRef.current[key] = (mistakesHistoryRef.current[key] || 0) + 1;
        }
      }
    }
    prevTotalTypedRef.current = totalTyped;
  }, [totalTyped, typed, cursor, words]);

  // WPM history — sampled once per second from a real elapsed clock, so it
  // works for BOTH time and words modes (words mode has no fixed duration).
  useEffect(() => {
    if (state !== "run") return;
    const id = setInterval(() => {
      if (!startTimeRef.current) return;
      recordWpm((Date.now() - startTimeRef.current) / 1000);
    }, 1000);
    return () => clearInterval(id);
  }, [state, recordWpm]);

  // Finish conditions
  useEffect(() => {
    if (state === "run") {
      if (mode === "time" && timeLeft === 0) setState("finish");
      if (mode === "words" && areWordsFinished) setState("finish");
    }
  }, [timeLeft, areWordsFinished, state, mode]);

  // Record a final WPM sample at the exact finish time.
  useEffect(() => {
    if (state === "finish" && startTimeRef.current) {
      recordWpm((Date.now() - startTimeRef.current) / 1000);
    }
  }, [state, recordWpm]);

  // Auto-start
  useEffect(() => {
    if (showAuthModal) return;
    if (isStarting) {
      setState("run");
      startCountdown();
      startTimeRef.current = Date.now();
    }
  }, [isStarting, startCountdown, showAuthModal]);

  const restart = useCallback(() => {
    resetCountdown();
    resetTotalTyped();
    setErrors(0);
    setState("start");
    setWpmHistory([]);
    correctCharsRef.current = 0;
    startTimeRef.current = null;
    updateWords();
    clearTyped();
  }, [resetCountdown, resetTotalTyped, updateWords, clearTyped]);

  useEffect(() => {
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedValue,
    mode,
    includePunctuation,
    includeNumbers,
    ai.enabled,
    ai.topic,
    ai.difficulty,
  ]);

  const accuracy = calculateAccuracyPercentage(errors, totalTyped);

  return {
    state,
    words,
    timeLeft,
    typed,
    errors,
    totalTyped,
    restart,
    wpmHistory,
    accuracy,
    loading,
    inputRef,
    focusInput,
    mistakes: mistakesHistoryRef.current,
  };
};

export default useEngine;
