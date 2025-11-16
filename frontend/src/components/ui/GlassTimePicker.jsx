import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

/**
 * Glass Time Picker Component
 * Custom time picker with hour and minute selection
 * Matches iOS 26 styling and app UI
 */
export default function GlassTimePicker({
  value, // Format: "HH:mm"
  onChange,
  className = '',
}) {
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);
  const [isHourPickerOpen, setIsHourPickerOpen] = useState(false);
  const [isMinutePickerOpen, setIsMinutePickerOpen] = useState(false);
  const hourPickerRef = useRef(null);
  const minutePickerRef = useRef(null);

  // Parse value prop
  useEffect(() => {
    if (value && typeof value === 'string') {
      const [h, m] = value.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        setHours(h >= 0 && h <= 23 ? h : 9);
        setMinutes(m >= 0 && m <= 59 ? m : 0);
      }
    }
  }, [value]);

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minute options (0, 15, 30, 45) or all minutes (0-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  const handleHourChange = (hour) => {
    setHours(hour);
    setIsHourPickerOpen(false);
    const newTime = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    onChange({ target: { value: newTime } });
  };

  const handleMinuteChange = (minute) => {
    setMinutes(minute);
    setIsMinutePickerOpen(false);
    const newTime = `${String(hours).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange({ target: { value: newTime } });
  };

  const formatHour = (h) => {
    if (h === 0) return '12';
    if (h > 12) return String(h - 12);
    return String(h);
  };

  const getAmPm = (h) => {
    return h >= 12 ? 'PM' : 'AM';
  };

  // Calculate dropdown positions
  const [hourPickerPosition, setHourPickerPosition] = useState({ top: 0, left: 0, width: 0 });
  const [minutePickerPosition, setMinutePickerPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isHourPickerOpen && hourPickerRef.current) {
      const rect = hourPickerRef.current.getBoundingClientRect();
      setHourPickerPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isHourPickerOpen]);

  useEffect(() => {
    if (isMinutePickerOpen && minutePickerRef.current) {
      const rect = minutePickerRef.current.getBoundingClientRect();
      setMinutePickerPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isMinutePickerOpen]);

  // Close pickers when clicking outside
  useEffect(() => {
    if (!isHourPickerOpen && !isMinutePickerOpen) return;

    // Use a small delay to prevent immediate closing when opening
    let cleanup = null;
    const timeoutId = setTimeout(() => {
      const handleClickOutside = (event) => {
        if (hourPickerRef.current && !hourPickerRef.current.contains(event.target)) {
          setIsHourPickerOpen(false);
        }
        if (minutePickerRef.current && !minutePickerRef.current.contains(event.target)) {
          setIsMinutePickerOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      
      cleanup = () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (cleanup) {
        cleanup();
      }
    };
  }, [isHourPickerOpen, isMinutePickerOpen]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Hour Picker */}
      <div className="flex-1 relative" ref={hourPickerRef}>
        <button
          type="button"
          onClick={() => {
            setIsHourPickerOpen(!isHourPickerOpen);
            setIsMinutePickerOpen(false);
          }}
          className="w-full px-4 py-3 rounded-xl bg-neutral-surface-primary border border-neutral-border/60 text-neutral-text-primary focus-ring focus:border-ice-primary focus:shadow-glow-ice-light text-center text-lg font-semibold min-h-[44px] hover:border-neutral-border transition-colors"
        >
          <div className="flex flex-col items-center">
            <span className="text-2xl">{String(hours).padStart(2, '0')}</span>
            <span className="text-xs text-neutral-text-secondary mt-0.5">Hour</span>
          </div>
        </button>

        {isHourPickerOpen && createPortal(
          <div
            className="fixed rounded-xl glass border border-neutral-border/60 shadow-glass-light-lg z-[99999] max-h-[200px] overflow-y-auto"
            style={{
              top: `${hourPickerPosition.top}px`,
              left: `${hourPickerPosition.left}px`,
              width: `${hourPickerPosition.width}px`,
              maxWidth: 'calc(100vw - 32px)',
            }}
          >
            <div className="p-2">
              {hourOptions.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleHourChange(hour);
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    hours === hour
                      ? 'bg-ice-primary text-white shadow-glow-ice-light'
                      : 'text-neutral-text-primary hover:bg-neutral-surface-secondary'
                  }`}
                >
                  {String(hour).padStart(2, '0')} {getAmPm(hour)}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Separator */}
      <div className="text-2xl font-bold text-neutral-text-primary py-3">:</div>

      {/* Minute Picker */}
      <div className="flex-1 relative" ref={minutePickerRef}>
        <button
          type="button"
          onClick={() => {
            setIsMinutePickerOpen(!isMinutePickerOpen);
            setIsHourPickerOpen(false);
          }}
          className="w-full px-4 py-3 rounded-xl bg-neutral-surface-primary border border-neutral-border/60 text-neutral-text-primary focus-ring focus:border-ice-primary focus:shadow-glow-ice-light text-center text-lg font-semibold min-h-[44px] hover:border-neutral-border transition-colors"
        >
          <div className="flex flex-col items-center">
            <span className="text-2xl">{String(minutes).padStart(2, '0')}</span>
            <span className="text-xs text-neutral-text-secondary mt-0.5">Minute</span>
          </div>
        </button>

        {isMinutePickerOpen && createPortal(
          <div
            className="fixed rounded-xl glass border border-neutral-border/60 shadow-glass-light-lg z-[99999] max-h-[200px] overflow-y-auto"
            style={{
              top: `${minutePickerPosition.top}px`,
              left: `${minutePickerPosition.left}px`,
              width: `${minutePickerPosition.width}px`,
              maxWidth: 'calc(100vw - 32px)',
            }}
          >
            <div className="p-2">
              {minuteOptions.map((minute) => (
                <button
                  key={minute}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMinuteChange(minute);
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    minutes === minute
                      ? 'bg-ice-primary text-white shadow-glow-ice-light'
                      : 'text-neutral-text-primary hover:bg-neutral-surface-secondary'
                  }`}
                >
                  {String(minute).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* AM/PM Display */}
      <div className="px-3 py-3 text-center">
        <div className="text-lg font-semibold text-neutral-text-primary">
          {getAmPm(hours)}
        </div>
        <div className="text-xs text-neutral-text-secondary mt-0.5">Period</div>
      </div>
    </div>
  );
}

