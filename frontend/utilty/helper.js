export const formatPercentage = (percentage) => {
  return percentage.toFixed(0) + "%";
};

export const isKeyboardCodeAllowed = (code) => {
  return (
    code.startsWith("Key") ||
    code.startsWith("Digit") ||
    code === "Backspace" ||
    code === "Space" ||
    code.startsWith("Quote") || // Added to allow punctuation
    code.startsWith("Semicolon") ||
    code.startsWith("Comma") ||
    code.startsWith("Period") ||
    code.startsWith("Slash")
  );
};

export const countErrors = (actual, expected) => {
  const expectedCharacters = expected.split("");

  return expectedCharacters.reduce((errors, expectedChar, i) => {
    const actualChar = actual[i];
    // FIX: actually increment errors if they don't match
    if (actualChar !== expectedChar) {
      return errors + 1;
    }
    return errors;
  }, 0);
};

export const calculateAccuracyPercentage = (errors, total) => {
  if (total > 0) {
    const corrects = total - errors;
    return (corrects / total) * 100;
  }
  return 100; // Default to 100 if nothing typed yet
};