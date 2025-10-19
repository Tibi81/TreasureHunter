import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for typewriter effect
 * @param {string} text - The text to type out
 * @param {number} speed - Speed in milliseconds per character (default: 100)
 * @param {boolean} enabled - Whether the effect is enabled (default: true)
 * @returns {string} - The currently displayed text
 */
const useTypewriter = (text, speed = 100, enabled = true) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef(null);
  const currentTextRef = useRef('');

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // If text hasn't changed, don't restart the effect
    if (currentTextRef.current === text) {
      return;
    }

    // Update the current text reference
    currentTextRef.current = text;

    if (!text || !enabled) {
      setDisplayedText(text || '');
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let index = 0;

    intervalRef.current = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, speed);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, speed, enabled]);

  return { displayedText, isTyping };
};

export default useTypewriter;
