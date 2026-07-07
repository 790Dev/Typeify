import React, { useRef } from "react";
import { MdRefresh } from "react-icons/md";

const RestartButton = ({ onRestart, className = "" }) => {
  const buttonRef = useRef(null); // reference to the button element

  const handleClick = () => {
    // Remove focus from the button after clicking
    if (buttonRef.current) buttonRef.current.blur();

    // Call the restart function passed from the parent
    onRestart();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      title="Restart test"
      aria-label="Restart test"
      className={`group grid h-11 w-16 place-items-center rounded-xl text-sub-alt transition-all duration-200 hover:bg-surface-2 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${className}`}
    >
      <MdRefresh className="h-6 w-6 transition-transform duration-300 group-hover:rotate-180" />
    </button>
  );
};

export default RestartButton;
