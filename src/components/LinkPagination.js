import React, { useEffect, useCallback, useState, useRef } from 'react';

// Parse links from text content (format: "URL, Description" or just URLs)
export function parseLinksFromText(text) {
  const links = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for "URL, Description" format
    const commaMatch = trimmed.match(/^(https?:\/\/[^\s,]+)\s*,\s*(.+)$/i);
    if (commaMatch) {
      links.push({
        url: commaMatch[1],
        label: commaMatch[2].trim()
      });
      continue;
    }

    // Check for standalone URLs
    const urlMatch = trimmed.match(/^(https?:\/\/[^\s]+)$/i);
    if (urlMatch) {
      // Use domain + path as label
      try {
        const url = new URL(urlMatch[1]);
        links.push({
          url: urlMatch[1],
          label: url.hostname + (url.pathname !== '/' ? url.pathname : '')
        });
      } catch {
        links.push({
          url: urlMatch[1],
          label: urlMatch[1]
        });
      }
    }
  }

  return links;
}

const AUTO_ADVANCE_SECONDS = 180; // 3 minutes

function LinkPagination({
  links,
  currentIndex,
  onIndexChange,
  onClose,
  darkMode
}) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === links.length - 1;

  // Auto-advance state
  const [autoPlay, setAutoPlay] = useState(() => {
    const saved = localStorage.getItem('linkPaginationAutoPlay');
    return saved === 'true';
  });
  const [timeRemaining, setTimeRemaining] = useState(AUTO_ADVANCE_SECONDS);
  const timerRef = useRef(null);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < links.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }, [currentIndex, links.length, onIndexChange]);

  // Save autoPlay preference
  useEffect(() => {
    localStorage.setItem('linkPaginationAutoPlay', autoPlay.toString());
  }, [autoPlay]);

  // Reset timer when link changes
  useEffect(() => {
    setTimeRemaining(AUTO_ADVANCE_SECONDS);
  }, [currentIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (!autoPlay || isLast) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - advance to next
          handleNext();
          return AUTO_ADVANCE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoPlay, isLast, handleNext]);

  // Format time as M:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handlePrev, handleNext, onClose]);

  if (!links || links.length === 0) return null;

  const currentLink = links[currentIndex];

  const styles = {
    navbar: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '50px',
      background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(240, 240, 240, 0.98)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      zIndex: 1000,
      padding: '0 20px',
      borderBottom: darkMode ? '2px solid rgba(59, 130, 246, 0.5)' : '2px solid rgba(59, 130, 246, 0.7)',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
    },
    navBtn: {
      width: '32px',
      height: '32px',
      background: 'rgba(59, 130, 246, 0.9)',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      color: 'white',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    navBtnDisabled: {
      background: 'rgba(100, 100, 100, 0.5)',
      opacity: 0.4,
      cursor: 'not-allowed',
    },
    labelDisplay: {
      minWidth: '150px',
      maxWidth: '400px',
      padding: '8px 16px',
      background: 'rgba(59, 130, 246, 0.8)',
      color: 'white',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    counter: {
      color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
      fontSize: '12px',
      fontWeight: 'bold',
      minWidth: '40px',
      textAlign: 'center',
    },
    closeBtn: {
      width: '28px',
      height: '28px',
      background: 'rgba(239, 68, 68, 0.9)',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      color: 'white',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: '10px',
    },
    // Auto-play toggle styles
    autoPlayGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginLeft: '15px',
      padding: '4px 10px',
      background: darkMode ? 'rgba(50, 50, 50, 0.8)' : 'rgba(200, 200, 200, 0.8)',
      borderRadius: '20px',
    },
    switch: {
      position: 'relative',
      display: 'inline-block',
      width: '44px',
      height: '24px',
    },
    switchInput: {
      opacity: 0,
      width: 0,
      height: 0,
    },
    slider: {
      position: 'absolute',
      cursor: 'pointer',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#555',
      transition: '0.3s',
      borderRadius: '24px',
    },
    sliderChecked: {
      background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
    },
    sliderKnob: {
      position: 'absolute',
      content: '""',
      height: '18px',
      width: '18px',
      left: '3px',
      bottom: '3px',
      backgroundColor: 'white',
      transition: '0.3s',
      borderRadius: '50%',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    },
    sliderKnobChecked: {
      transform: 'translateX(20px)',
    },
    autoPlayLabel: {
      fontSize: '11px',
      color: darkMode ? '#aaa' : '#555',
      fontWeight: '500',
    },
    timerDisplay: {
      fontSize: '12px',
      color: '#4caf50',
      fontWeight: 'bold',
      minWidth: '35px',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.navbar}>
      <button
        style={{
          ...styles.navBtn,
          ...(isFirst ? styles.navBtnDisabled : {}),
        }}
        onClick={handlePrev}
        disabled={isFirst}
        aria-label="Previous link"
      >
        ◀
      </button>

      <div style={styles.labelDisplay}>
        {currentLink.label}
      </div>

      <span style={styles.counter}>
        {currentIndex + 1}/{links.length}
      </span>

      <button
        style={{
          ...styles.navBtn,
          ...(isLast ? styles.navBtnDisabled : {}),
        }}
        onClick={handleNext}
        disabled={isLast}
        aria-label="Next link"
      >
        ▶
      </button>

      {/* Auto-play toggle */}
      <div style={styles.autoPlayGroup}>
        <span style={styles.autoPlayLabel}>Auto</span>
        <label style={styles.switch}>
          <input
            type="checkbox"
            checked={autoPlay}
            onChange={(e) => setAutoPlay(e.target.checked)}
            style={styles.switchInput}
          />
          <span style={{
            ...styles.slider,
            ...(autoPlay ? styles.sliderChecked : {}),
          }}>
            <span style={{
              ...styles.sliderKnob,
              ...(autoPlay ? styles.sliderKnobChecked : {}),
            }} />
          </span>
        </label>
        {autoPlay && !isLast && (
          <span style={styles.timerDisplay}>{formatTime(timeRemaining)}</span>
        )}
      </div>

      <button
        style={styles.closeBtn}
        onClick={onClose}
        aria-label="Close pagination"
      >
        ✕
      </button>
    </div>
  );
}

export default LinkPagination;
