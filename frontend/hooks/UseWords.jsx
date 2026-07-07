import React from "react";
import { faker } from "@faker-js/faker";
import { useCallback, useState } from "react";
import { generateText } from "../src/services/text.api";

const generatedWords = (
  count,
  includePunctuation = false,
  includeNumbers = false,
) => {
  let words = faker.word.words(count).toLowerCase();

  if (includePunctuation) {
    const punctuation = [",", ".", "!", "?", ";", ":"];
    const wordsArray = words.split(" ");
    const wordsWithPunctuation = wordsArray.map((word, index) => {
      if (index > 0 && index % 3 === 0 && Math.random() > 0.5) {
        const randomPunct =
          punctuation[Math.floor(Math.random() * punctuation.length)];
        return word + randomPunct;
      }
      return word;
    });
    words = wordsWithPunctuation.join(" ");
  }

  if (includeNumbers) {
    const wordsArray = words.split(" ");
    const wordsWithNumbers = wordsArray.map((word, index) => {
      if (index > 0 && index % 4 === 0 && Math.random() > 0.6) {
        return Math.floor(Math.random() * 1000).toString();
      }
      return word;
    });
    words = wordsWithNumbers.join(" ");
  }

  return words;
};

const UseWords = (
  count,
  includePunctuation = false,
  includeNumbers = false,
  ai = { enabled: false, topic: "", difficulty: "medium" },
) => {
  const [words, setWords] = useState(() =>
    generatedWords(count, includePunctuation, includeNumbers),
  );
  const [loading, setLoading] = useState(false);

  const local = useCallback(
    () => generatedWords(count, includePunctuation, includeNumbers),
    [count, includePunctuation, includeNumbers],
  );

  // Build a fresh word set — from Claude when AI is enabled, otherwise faker.
  // Falls back to faker if the AI request fails so the test never breaks.
  const buildWords = useCallback(async () => {
    if (!ai.enabled) {
      setWords(local());
      return;
    }
    setLoading(true);
    try {
      const text = await generateText({
        count,
        topic: ai.topic,
        difficulty: ai.difficulty,
        includePunctuation,
        includeNumbers,
      });
      setWords(text);
    } catch {
      setWords(local());
    } finally {
      setLoading(false);
    }
  }, [
    ai.enabled,
    ai.topic,
    ai.difficulty,
    count,
    includePunctuation,
    includeNumbers,
    local,
  ]);

  const updateWords = useCallback(() => {
    buildWords();
  }, [buildWords]);

  // Append more words to the end (time mode). Always uses fast local
  // generation so the running test never stalls on a network request.
  const appendWords = useCallback(() => {
    setWords((prev) => prev + " " + local());
  }, [local]);

  React.useEffect(() => {
    buildWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    includePunctuation,
    includeNumbers,
    count,
    ai.enabled,
    ai.topic,
    ai.difficulty,
  ]);

  return { words, updateWords, appendWords, loading };
};

export default UseWords;
