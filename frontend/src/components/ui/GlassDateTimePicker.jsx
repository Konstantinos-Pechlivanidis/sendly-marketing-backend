import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { format, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import GlassCalendar from './GlassCalendar';
import GlassButton from './GlassButton';
import GlassTimePicker from './GlassTimePicker';
import Icon from './Icon';

/**
 * Glass Date Time Picker Component
 * Custom calendar-based date and time picker with iOS 26 styling
 * 
 * Architecture:
 * - Date selection opens calendar modal
 * - Time selection opens separate time picker modal
 * - Date and time stored separately to avoid timezone issues
 * - Only combined when creating ISO string for parent
 */
export default function GlassDateTimePicker({
  label,
  name,
  value, // ISO string from parent
  onChange,
  error,
  placeholder = 'Select date and time',
  required,
  className,
  minDate,
  maxDate,
}) {
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // Date object (date only, time ignored)
  const [selectedTime, setSelectedTime] = useState('09:00'); // "HH:mm" format string
  const dateButtonRef = useRef(null);
  const timeButtonRef = useRef(null);
  const dateModalRef = useRef(null);
  const timeModalRef = useRef(null);
  const previousValueRef = useRef(value);

  // Parse value prop and extract date and time separately
  useEffect(() => {
    // Only update if value actually changed
    if (previousValueRef.current === value) {
      return;
    }
    previousValueRef.current = value;
    
    if (value && value.trim()) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          // Extract date (year, month, day) - create a new date with just the date part
          const year = date.getFullYear();
          const month = date.getMonth();
          const day = date.getDate();
          const dateOnly = new Date(year, month, day);
          setSelectedDate(dateOnly);
          
          // Extract time as "HH:mm" - use local time methods
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const timeString = `${hours}:${minutes}`;
          setSelectedTime(timeString);
        } else {
          setSelectedDate(null);
          setSelectedTime('09:00');
        }
      } catch {
        setSelectedDate(null);
        setSelectedTime('09:00');
      }
    } else {
      setSelectedDate(null);
      setSelectedTime('09:00');
    }
  }, [value]);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (isDateModalOpen || isTimeModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isDateModalOpen, isTimeModalOpen]);

  // Close date modal when clicking outside
  useEffect(() => {
    if (!isDateModalOpen) return;

    let cleanup = null;
    const timeoutId = setTimeout(() => {
      const handleClickOutside = (event) => {
        // Don't close if clicking on hour/minute picker modals (they have higher z-index)
        const isHourMinutePicker = event.target.closest('[data-hour-minute-picker="true"]');
        if (isHourMinutePicker) return;

        if (
          dateButtonRef.current &&
          dateModalRef.current &&
          !dateButtonRef.current.contains(event.target) &&
          !dateModalRef.current.contains(event.target)
        ) {
          setIsDateModalOpen(false);
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
  }, [isDateModalOpen]);

  // Close time modal when clicking outside
  // Note: We don't use this for the time modal since it has its own backdrop handler
  // This is kept for consistency but the backdrop onClick handles closing
  useEffect(() => {
    if (!isTimeModalOpen) return;

    let cleanup = null;
    const timeoutId = setTimeout(() => {
      const handleClickOutside = (event) => {
        // Check if click is on hour/minute picker modals (they have higher z-index)
        // If so, don't close the main time modal
        const target = event.target;
        const isHourMinutePicker = target.closest('[data-hour-minute-picker]');
        
        if (
          timeButtonRef.current &&
          timeModalRef.current &&
          !timeButtonRef.current.contains(target) &&
          !timeModalRef.current.contains(target) &&
          !isHourMinutePicker
        ) {
          setIsTimeModalOpen(false);
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
  }, [isTimeModalOpen]);

  // Combine date and time into a single Date object and notify parent
  const updateParent = (date, time) => {
    try {
      // Parse time string
      const [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return;
      
      // Use the provided date, or default to today if no date selected
      let baseDate = date;
      if (!baseDate) {
        baseDate = new Date();
        // If minDate is set and today is before minDate, use minDate instead
        const minDateValue = minDate ? new Date(minDate) : null;
        if (minDateValue && baseDate < minDateValue) {
          baseDate = new Date(minDateValue);
        }
      }
      
      // Create new date-time by combining date and time
      const newDateTime = setMilliseconds(
        setSeconds(
          setMinutes(
            setHours(new Date(baseDate), hours || 9),
            minutes || 0
          ),
          0
        ),
        0
      );
      
      // Convert to ISO string and notify parent
      const isoString = newDateTime.toISOString();
      const syntheticEvent = {
        target: {
          name,
          value: isoString,
        },
      };
      
      if (onChange && typeof onChange === 'function') {
        onChange(syntheticEvent);
      }
    } catch (error) {
      console.error('Error in updateParent:', error);
    }
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    try {
      // Update selected date
      const newDate = new Date(date);
      setSelectedDate(newDate);
      
      // Update parent with new date + current time
      updateParent(newDate, selectedTime);
      
      // Close date modal
      setIsDateModalOpen(false);
    } catch (error) {
      console.error('Error in handleDateSelect:', error);
    }
  };

  // Handle time selection - opens separate modal
  const handleTimeButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTimeModalOpen(true);
  };

  // Handle time change from time picker modal (called when Save is pressed)
  const handleTimeChange = (e) => {
    try {
      const timeValue = e?.target?.value || ''; // Format: "HH:mm"
      if (!timeValue || !timeValue.includes(':')) return;
      
      // Update selected time immediately
      setSelectedTime(timeValue);
      
      // Update parent with current date + new time
      setSelectedDate(currentDate => {
        updateParent(currentDate || new Date(), timeValue);
        return currentDate; // Return unchanged
      });
      
      // Close time modal after Save is pressed
      setIsTimeModalOpen(false);
    } catch (error) {
      console.error('Error in handleTimeChange:', error);
    }
  };

  // Apply preset
  const applyPreset = (preset) => {
    const now = new Date();
    let date = new Date();
    
    switch (preset) {
      case 'now':
        date = now;
        break;
      case 'tomorrow':
        date.setDate(now.getDate() + 1);
        date.setHours(9, 0, 0, 0);
        break;
      case 'nextWeek':
        date.setDate(now.getDate() + 7);
        date.setHours(9, 0, 0, 0);
        break;
      case 'nextMonth':
        date.setMonth(now.getMonth() + 1);
        date.setHours(9, 0, 0, 0);
        break;
      default:
        return;
    }
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateOnly = new Date(year, month, day);
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    setSelectedDate(dateOnly);
    setSelectedTime(timeString);
    updateParent(dateOnly, timeString);
    setIsDateModalOpen(false);
  };

  const presets = [
    { id: 'now', label: 'Now' },
    { id: 'tomorrow', label: 'Tomorrow 9:00 AM' },
    { id: 'nextWeek', label: 'Next Week' },
    { id: 'nextMonth', label: 'Next Month' },
  ];

  const handleClear = () => {
    setSelectedDate(null);
    setSelectedTime('09:00');
    const syntheticEvent = {
      target: {
        name,
        value: '',
      },
    };
    onChange(syntheticEvent);
  };

  // Calculate display value - shows both date and time clearly
  const displayValue = useMemo(() => {
    if (selectedDate) {
      // Combine date and time for display
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const displayDate = new Date(selectedDate);
      displayDate.setHours(hours || 9, minutes || 0, 0, 0);
      return format(displayDate, 'MMM d, yyyy h:mm a');
    }
    // If we have a time selected but no date, show just the time
    if (selectedTime && selectedTime !== '09:00') {
      try {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
        return `Time: ${format(timeDate, 'h:mm a')}`;
      } catch {
        return '';
      }
    }
    return '';
  }, [selectedDate, selectedTime]);

  // Format time for display in button
  const displayTime = useMemo(() => {
    if (selectedTime && selectedTime !== '09:00') {
      try {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
        return format(timeDate, 'h:mm a');
      } catch {
        return 'Select Time';
      }
    }
    return 'Select Time';
  }, [selectedTime]);

  // Parse minDate and maxDate to Date objects if they're strings
  const minDateObj = minDate ? new Date(minDate) : null;
  const maxDateObj = maxDate ? new Date(maxDate) : null;

  return (
    <div className={`relative ${className}`}>
      <div className="space-y-2">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-neutral-text-primary">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {/* Date and Time Selection Buttons */}
        <div className="flex gap-2">
          {/* Date Selection Button */}
          <button
            ref={dateButtonRef}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDateModalOpen(!isDateModalOpen);
            }}
            onMouseDown={(e) => {
              if (isDateModalOpen) {
                e.preventDefault();
              }
            }}
            className={`
              flex-1 px-4 py-3 rounded-xl
              bg-neutral-surface-primary backdrop-blur-[24px]
              border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-neutral-border/60 focus:border-ice-primary'}
              text-neutral-text-primary
              focus-ring focus:shadow-glow-ice-light
              spring-smooth shadow-sm
              hover:border-neutral-border hover:shadow-md
              text-left flex items-center justify-between
              min-h-[44px]
              ${!selectedDate && 'text-neutral-text-secondary'}
            `}
            aria-label="Select date"
            aria-expanded={isDateModalOpen}
          >
            <span className="flex items-center gap-2">
              <Icon name="calendar" size="sm" variant="ice" />
              <span>{selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select Date'}</span>
            </span>
            <Icon 
              name="arrowRight" 
              size="sm" 
              className={`transition-transform ${isDateModalOpen ? 'rotate-90' : '-rotate-90'}`}
            />
          </button>

          {/* Time Selection Button */}
          <button
            ref={timeButtonRef}
            type="button"
            onClick={handleTimeButtonClick}
            className={`
              flex-1 px-4 py-3 rounded-xl
              bg-neutral-surface-primary backdrop-blur-[24px]
              border ${error ? 'border-red-500/50 focus:border-red-500' : selectedTime !== '09:00' ? 'border-ice-primary/50 focus:border-ice-primary' : 'border-neutral-border/60 focus:border-ice-primary'}
              text-neutral-text-primary
              focus-ring focus:shadow-glow-ice-light
              spring-smooth shadow-sm
              hover:border-neutral-border hover:shadow-md
              text-left flex items-center justify-between
              min-h-[44px]
              ${selectedTime === '09:00' && 'text-neutral-text-secondary'}
              ${selectedTime !== '09:00' && 'bg-ice-primary/5'}
            `}
            aria-label="Select time"
            aria-expanded={isTimeModalOpen}
          >
            <span className="flex items-center gap-2">
              <Icon name="schedule" size="sm" variant="ice" />
              <span>{displayTime}</span>
            </span>
            <Icon 
              name="arrowRight" 
              size="sm" 
              className={`transition-transform ${isTimeModalOpen ? 'rotate-90' : '-rotate-90'}`}
            />
          </button>
        </div>

        {/* Display Combined Value */}
        {displayValue && (
          <div className="px-3 py-2 rounded-lg bg-ice-primary/10 border border-ice-primary/30">
            <p className="text-sm text-ice-primary font-medium">
              {displayValue}
            </p>
          </div>
        )}

        {/* Clear Button */}
        {(selectedDate || selectedTime !== '09:00') && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-neutral-text-secondary hover:text-neutral-text-primary transition-colors"
          >
            Clear selection
          </button>
        )}

        {error && (
          <p id={`${name}-error`} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Date Selection Modal */}
      {isDateModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDateModalOpen(false);
            }
          }}
          role="presentation"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-neutral-text-primary/30 backdrop-blur-md animate-fade-in"
            onClick={() => setIsDateModalOpen(false)}
            aria-hidden="true"
          />
          
          {/* Modal Content */}
          <div
            ref={dateModalRef}
            className="relative z-10 w-full max-w-lg rounded-xl glass border border-neutral-border/60 shadow-glass-light-lg overflow-hidden animate-scale-in max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-border/60">
              <h3 className="text-lg font-semibold text-neutral-text-primary">Select Date</h3>
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="p-2 rounded-lg hover:bg-neutral-surface-secondary transition-colors focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <Icon name="close" size="sm" variant="neutral" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {/* Preset Buttons */}
              <div>
                <p className="text-xs font-semibold text-neutral-text-secondary uppercase tracking-wider mb-3">Quick Select</p>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <GlassButton
                      key={preset.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => applyPreset(preset.id)}
                      className="justify-start text-left text-xs min-h-[44px]"
                    >
                      {preset.label}
                    </GlassButton>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <div className="pt-4 border-t border-neutral-border/60">
                <p className="text-xs font-semibold text-neutral-text-secondary uppercase tracking-wider mb-3">Select Date</p>
                <GlassCalendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  minDate={minDateObj}
                  maxDate={maxDateObj}
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Time Selection Modal - Separate Modal */}
      {isTimeModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            // Only close if clicking directly on the backdrop, not on child elements
            if (e.target === e.currentTarget) {
              setIsTimeModalOpen(false);
            }
          }}
          onMouseDown={(e) => {
            // Prevent mousedown from closing modal if clicking inside
            if (e.target !== e.currentTarget) {
              e.stopPropagation();
            }
          }}
          role="presentation"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-neutral-text-primary/30 backdrop-blur-md animate-fade-in"
            onClick={(e) => {
              // Only close if clicking directly on backdrop
              if (e.target === e.currentTarget) {
                setIsTimeModalOpen(false);
              }
            }}
            onMouseDown={(e) => {
              // Prevent mousedown from propagating
              if (e.target !== e.currentTarget) {
                e.stopPropagation();
              }
            }}
            aria-hidden="true"
          />
          
          {/* Modal Content */}
          <div
            ref={timeModalRef}
            className="relative z-10 w-full max-w-md rounded-xl glass border border-neutral-border/60 shadow-glass-light-lg overflow-hidden animate-scale-in max-h-[90vh] flex flex-col"
            onClick={(e) => {
              e.stopPropagation();
              // Prevent clicks inside modal from closing it
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-border/60">
              <h3 className="text-lg font-semibold text-neutral-text-primary">Select Time</h3>
              <button
                onClick={() => setIsTimeModalOpen(false)}
                className="p-2 rounded-lg hover:bg-neutral-surface-secondary transition-colors focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <Icon name="close" size="sm" variant="neutral" />
              </button>
            </div>

            {/* Time Picker */}
            <div 
              className="p-4 sm:p-6 overflow-y-auto flex-1" 
              style={{ maxHeight: 'calc(90vh - 80px)' }}
              onClick={(e) => {
                // Prevent clicks inside time picker from closing modal
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                // Prevent mousedown from closing modal
                e.stopPropagation();
              }}
            >
              <GlassTimePicker
                value={selectedTime}
                onChange={handleTimeChange}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
