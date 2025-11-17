import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import GlassButton from './GlassButton';

/**
 * Glass Time Picker Component
 * Custom time picker with hour and minute selection
 * Matches iOS 26 styling and app UI
 * 
 * Value format: "HH:mm" (e.g., "14:30" for 2:30 PM)
 * 
 * Behavior: Selections are temporary until "Save" is pressed
 */
export default function GlassTimePicker({
  value, // Format: "HH:mm"
  onChange,
  className = '',
}) {
  // Temporary selection state (not applied until Save)
  const [tempHours, setTempHours] = useState(() => {
    if (value && typeof value === 'string' && value.includes(':')) {
      const [h] = value.split(':').map(Number);
      return !isNaN(h) && h >= 0 && h <= 23 ? h : 9;
    }
    return 9;
  });
  
  const [tempMinutes, setTempMinutes] = useState(() => {
    if (value && typeof value === 'string' && value.includes(':')) {
      const [, m] = value.split(':').map(Number);
      return !isNaN(m) && m >= 0 && m <= 59 ? m : 0;
    }
    return 0;
  });
  
  const [isHourPickerOpen, setIsHourPickerOpen] = useState(false);
  const [isMinutePickerOpen, setIsMinutePickerOpen] = useState(false);
  const hourPickerRef = useRef(null);
  const minutePickerRef = useRef(null);

  // Sync temporary state with value prop when it changes externally
  useEffect(() => {
    if (value && typeof value === 'string' && value.includes(':')) {
      const [h, m] = value.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        setTempHours(h);
        setTempMinutes(m);
      }
    } else if (!value || value === '') {
      setTempHours(9);
      setTempMinutes(0);
    }
  }, [value]);

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minute options (0-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  // Handle hour selection - only update temp state, don't close main modal
  const handleHourSelect = (newHour, event) => {
    // Stop all event propagation immediately
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
    }
    
    setTempHours(newHour);
    
    // Close the hour picker modal after a small delay to ensure event is fully processed
    // This prevents the click from propagating to the main modal
    setTimeout(() => {
      setIsHourPickerOpen(false);
    }, 50);
    
    // Don't call onChange - wait for Save button
  };

  // Handle minute selection - only update temp state, don't close main modal
  const handleMinuteSelect = (newMinute, event) => {
    // Stop all event propagation immediately
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
    }
    
    setTempMinutes(newMinute);
    
    // Close the minute picker modal after a small delay to ensure event is fully processed
    // This prevents the click from propagating to the main modal
    setTimeout(() => {
      setIsMinutePickerOpen(false);
    }, 50);
    
    // Don't call onChange - wait for Save button
  };

  // Handle Save - apply the temporary selection
  const handleSave = () => {
    const newTime = `${String(tempHours).padStart(2, '0')}:${String(tempMinutes).padStart(2, '0')}`;
    
    if (onChange && typeof onChange === 'function') {
      onChange({ 
        target: { 
          value: newTime 
        } 
      });
    }
  };

  const formatHour = (h) => {
    if (h === 0) return 12;
    if (h > 12) return h - 12;
    return h;
  };

  const getAmPm = (h) => {
    return h >= 12 ? 'PM' : 'AM';
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isHourPickerOpen || isMinutePickerOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isHourPickerOpen, isMinutePickerOpen]);

  // Determine if we have a valid time selection
  const hasValidTime = (tempHours >= 0 && tempHours <= 23) && (tempMinutes >= 0 && tempMinutes <= 59);
  const displayTime = hasValidTime 
    ? `${String(formatHour(tempHours)).padStart(2, '0')}:${String(tempMinutes).padStart(2, '0')} ${getAmPm(tempHours)}`
    : '';

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Display Selected Time Preview */}
      {hasValidTime && displayTime && (
        <div className="px-4 py-3 rounded-lg bg-ice-primary/10 border border-ice-primary/30 text-center">
          <p className="text-xs text-neutral-text-secondary mb-1 font-medium uppercase tracking-wider">Selected Time</p>
          <p className="text-2xl font-bold text-ice-primary">{displayTime}</p>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        {/* Hour Picker */}
        <div className="flex-1 relative" ref={hourPickerRef}>
          <button
            type="button"
            onClick={() => {
              setIsHourPickerOpen(!isHourPickerOpen);
              setIsMinutePickerOpen(false);
            }}
            className={`w-full px-4 py-3 rounded-xl border text-neutral-text-primary focus-ring focus:shadow-glow-ice-light text-center text-lg font-semibold min-h-[44px] hover:border-neutral-border transition-colors ${
              hasValidTime 
                ? 'bg-ice-primary/10 border-ice-primary/30' 
                : 'bg-neutral-surface-primary border-neutral-border/60'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl">{String(formatHour(tempHours)).padStart(2, '0')}</span>
              <span className="text-xs text-neutral-text-secondary mt-0.5">Hour</span>
            </div>
          </button>

          {isHourPickerOpen && createPortal(
            <div
              data-hour-minute-picker="true"
              className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 animate-fade-in"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsHourPickerOpen(false);
                }
              }}
              onMouseDown={(e) => {
                // Prevent mousedown from propagating to parent modals
                e.stopPropagation();
                e.stopImmediatePropagation();
              }}
              role="presentation"
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-neutral-text-primary/30 backdrop-blur-md animate-fade-in"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHourPickerOpen(false);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                aria-hidden="true"
              />
              
              {/* Modal Content */}
              <div
                className="relative z-10 w-full max-w-xs rounded-xl glass border border-neutral-border/60 shadow-glass-light-lg overflow-hidden animate-scale-in max-h-[80vh] flex flex-col"
                onClick={(e) => {
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-border/60">
                  <h3 className="text-lg font-semibold text-neutral-text-primary">Select Hour</h3>
                  <button
                    onClick={() => setIsHourPickerOpen(false)}
                    className="p-2 rounded-lg hover:bg-neutral-surface-secondary transition-colors focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Close"
                  >
                    <Icon name="close" size="sm" variant="neutral" />
                  </button>
                </div>

                {/* Options List */}
                <div className="overflow-y-auto flex-1 p-2" style={{ maxHeight: 'calc(80vh - 140px)' }}>
                  {hourOptions.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={(e) => {
                        handleHourSelect(hour, e);
                      }}
                      onMouseDown={(e) => {
                        // Also prevent mousedown from propagating
                        e.stopPropagation();
                      }}
                      className={`w-full px-4 py-3 rounded-lg text-base font-medium transition-colors mb-1 ${
                        tempHours === hour
                          ? 'bg-ice-primary text-white shadow-glow-ice-light'
                          : 'text-neutral-text-primary hover:bg-neutral-surface-secondary'
                      }`}
                    >
                      {String(formatHour(hour)).padStart(2, '0')} {getAmPm(hour)}
                    </button>
                  ))}
                </div>
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
            className={`w-full px-4 py-3 rounded-xl border text-neutral-text-primary focus-ring focus:shadow-glow-ice-light text-center text-lg font-semibold min-h-[44px] hover:border-neutral-border transition-colors ${
              hasValidTime 
                ? 'bg-ice-primary/10 border-ice-primary/30' 
                : 'bg-neutral-surface-primary border-neutral-border/60'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl">{String(tempMinutes).padStart(2, '0')}</span>
              <span className="text-xs text-neutral-text-secondary mt-0.5">Minute</span>
            </div>
          </button>

          {isMinutePickerOpen && createPortal(
            <div
              data-hour-minute-picker="true"
              className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 animate-fade-in"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsMinutePickerOpen(false);
                }
              }}
              onMouseDown={(e) => {
                // Prevent mousedown from propagating to parent modals
                e.stopPropagation();
                e.stopImmediatePropagation();
              }}
              role="presentation"
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-neutral-text-primary/30 backdrop-blur-md animate-fade-in"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinutePickerOpen(false);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                aria-hidden="true"
              />
              
              {/* Modal Content */}
              <div
                className="relative z-10 w-full max-w-xs rounded-xl glass border border-neutral-border/60 shadow-glass-light-lg overflow-hidden animate-scale-in max-h-[80vh] flex flex-col"
                onClick={(e) => {
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-border/60">
                  <h3 className="text-lg font-semibold text-neutral-text-primary">Select Minute</h3>
                  <button
                    onClick={() => setIsMinutePickerOpen(false)}
                    className="p-2 rounded-lg hover:bg-neutral-surface-secondary transition-colors focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Close"
                  >
                    <Icon name="close" size="sm" variant="neutral" />
                  </button>
                </div>

                {/* Options List */}
                <div className="overflow-y-auto flex-1 p-2" style={{ maxHeight: 'calc(80vh - 140px)' }}>
                  {minuteOptions.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={(e) => {
                        handleMinuteSelect(minute, e);
                      }}
                      onMouseDown={(e) => {
                        // Also prevent mousedown from propagating
                        e.stopPropagation();
                      }}
                      className={`w-full px-4 py-3 rounded-lg text-base font-medium transition-colors mb-1 ${
                        tempMinutes === minute
                          ? 'bg-ice-primary text-white shadow-glow-ice-light'
                          : 'text-neutral-text-primary hover:bg-neutral-surface-secondary'
                      }`}
                    >
                      {String(minute).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* AM/PM Display */}
        <div className={`px-3 py-3 text-center rounded-xl border min-h-[44px] flex flex-col items-center justify-center ${
          hasValidTime 
            ? 'bg-ice-primary/10 border-ice-primary/30' 
            : 'border-transparent'
        }`}>
          <div className="text-lg font-semibold text-neutral-text-primary">
            {getAmPm(tempHours)}
          </div>
          <div className="text-xs text-neutral-text-secondary mt-0.5">Period</div>
        </div>
      </div>

      {/* Save Button */}
      <GlassButton
        onClick={handleSave}
        variant="primary"
        size="md"
        className="w-full mt-2"
      >
        Save Time
      </GlassButton>
    </div>
  );
}
