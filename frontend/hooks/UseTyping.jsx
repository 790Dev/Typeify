import { useCallback, useEffect, useRef, useState } from "react";
import { isKeyboardCodeAllowed } from "../utilty/helper";

const UseTyping = (enabled) => {
  const [cursor, setCursor] = useState(0);
  const [typed, setTyped] = useState("");
  const [totalTyped, setTotalTyped] = useState(0);

  // Hidden input that captures typing. Focusing it summons the mobile
  // on-screen keyboard, and `beforeinput` works reliably across desktop
  // and mobile keyboards (unlike `keydown`, which Android often reports
  // as "Unidentified").
  const inputRef = useRef(null);
  // Timestamps used to dedupe a single backspace that may arrive via BOTH
  // keydown and beforeinput (e.g. on desktop / iOS).
  const lastKeydownDeleteRef = useRef(0);
  const lastInputDeleteRef = useRef(0);

  const insertChar = useCallback((ch) => {
    setTyped((prev) => prev + ch);
    setCursor((c) => c + 1);
    setTotalTyped((prev) => prev + 1);
  }, []);

  const deleteChar = useCallback(() => {
    setTyped((prev) => prev.slice(0, -1));
    setCursor((c) => Math.max(c - 1, 0));
    setTotalTyped((prev) => Math.max(prev - 1, 0));
  }, []);

  // Primary capture: `beforeinput` on the focused hidden input.
  const handleBeforeInput = useCallback(
    (e) => {
      if (!enabled) return;
      const { inputType, data } = e;

      if (
        inputType === "insertText" ||
        inputType === "insertCompositionText" ||
        inputType === "insertFromPaste"
      ) {
        if (data) {
          for (const ch of data) {
            // ignore newlines; keep only printable characters + space
            if (ch === "\n" || ch === "\r") continue;
            insertChar(ch);
          }
        }
      } else if (
        inputType === "deleteContentBackward" ||
        inputType === "deleteWordBackward"
      ) {
        // Skip if a keydown Backspace just handled this same press.
        if (Date.now() - lastKeydownDeleteRef.current > 60) {
          lastInputDeleteRef.current = Date.now();
          deleteChar();
        }
      }

      // We fully manage state ourselves; keep the input empty.
      if (e.cancelable) e.preventDefault();
    },
    [enabled, insertChar, deleteChar],
  );

  // Backspace is reported reliably via keydown on every platform (including
  // Android/iOS virtual keyboards, where beforeinput "delete" often doesn't
  // fire on an empty input). Letter inserts are left to beforeinput so they
  // aren't double-counted when the input is focused.
  const keydownHandler = useCallback(
    (e) => {
      if (!enabled) return;

      // Ignore keystrokes when the user is typing into any other input or textarea (e.g. custom topic input)
      const activeEl = document.activeElement;
      const target = e.target;
      const isOtherInput =
        (activeEl && activeEl !== inputRef.current && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable)) ||
        (target && target !== inputRef.current && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable));

      if (isOtherInput) return;

      const { key, code } = e;

      if (key === "Backspace") {
        // Skip if a beforeinput delete just handled this press.
        if (Date.now() - lastInputDeleteRef.current > 60) {
          lastKeydownDeleteRef.current = Date.now();
          deleteChar();
        }
        return;
      }

      // Inserts via keydown only when the hidden input ISN'T focused
      // (otherwise beforeinput already handles them).
      if (document.activeElement === inputRef.current) return;
      if (!isKeyboardCodeAllowed(code)) return;
      if (key.length === 1) insertChar(key);
    },
    [enabled, insertChar, deleteChar],
  );

  const clearTyped = useCallback(() => {
    setTyped("");
    setCursor(0);
  }, []);

  const resetTotalTyped = useCallback(() => {
    setTotalTyped(0);
  }, []);

  // Keep the hidden input focused so the keyboard stays open while a test
  // is active. Never steal focus if the user is typing into another input (e.g. custom topic).
  const focusInput = useCallback(() => {
    if (enabled && inputRef.current) {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        activeEl !== inputRef.current &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable)
      ) {
        return;
      }
      inputRef.current.focus();
    }
  }, [enabled]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.addEventListener("beforeinput", handleBeforeInput);
    return () => el.removeEventListener("beforeinput", handleBeforeInput);
  }, [handleBeforeInput]);

  useEffect(() => {
    window.addEventListener("keydown", keydownHandler);
    return () => window.removeEventListener("keydown", keydownHandler);
  }, [keydownHandler]);

  // Focus on enable (e.g. when a fresh test starts).
  useEffect(() => {
    if (enabled) focusInput();
  }, [enabled, focusInput]);

  return {
    typed,
    cursor,
    clearTyped,
    resetTotalTyped,
    totalTyped,
    inputRef,
    focusInput,
  };
};

export default UseTyping;
