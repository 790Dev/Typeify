import React, { useEffect } from "react";
import { useCallback, useRef, useState } from "react";

const UseCountdownTimer = (seconds) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const intervalRef = useRef(null);

  const startCountdown = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setTimeLeft(seconds); // Reset to initial time
    intervalRef.current = setInterval(() => {
      setTimeLeft((timeLeft) => {
        if (timeLeft <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return timeLeft - 1;
      });
    }, 1000);
  }, [seconds, setTimeLeft]);

  const resetCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    // Reset timeLeft when seconds prop changes
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { timeLeft, startCountdown, resetCountdown };
};

export default UseCountdownTimer;
