import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import GlassCalendar from './GlassCalendar';
import GlassButton from './GlassButton';
import Icon from './Icon';

/**
 * Glass Date Time Picker Component
 * Custom calendar-based date and time picker with iOS 26 styling
 * Uses React Portal for proper z-index handling on mobile
 */
export default function GlassDateTimePicker({
  label,
  name,
  value,
  onChange,
  error,
  placeholder = 'Select date and time',
  required,
  className,
  minDate,
  maxDate,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [tempTime, setTempTime] = useState('09:00');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Parse value prop to Date object
  useEffect(() => {
    if (value && value.trim()) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setSelectedDateTime(date);
          // Extract time in HH:mm format
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          setTempTime(`${hours}:${minutes}`);
        } else {
          setSelectedDateTime(null);
          setTempTime('09:00');
        }
      } catch {
        setSelectedDateTime(null);
        setTempTime('09:00');
      }
    } else {
      setSelectedDateTime(null);
      setTempTime('09:00');
    }
  }, [value]);

  // Calculate dropdown position
  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef.current && isOpen) {
        const rect = buttonRef.current.getBoundingClientRect();
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const width = rect.width;
        const dropdownWidth = Math.min(Math.max(width, 400), 420); // Min 400px, max 420px for calendar + time
        const estimatedDropdownHeight = 500; // Approximate height of calendar + time picker
        
        // Calculate horizontal position (viewport-relative for fixed positioning)
        let adjustedLeft = rect.left;
        if (rect.left + dropdownWidth > viewportWidth) {
          adjustedLeft = viewportWidth - dropdownWidth - 16; // 16px padding from edge
        }
        if (adjustedLeft < 16) {
          adjustedLeft = 16;
        }

        // Calculate vertical position - check if we should open above or below
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const gap = 8; // Gap between button and dropdown
        
        let adjustedTop;
        if (spaceBelow >= estimatedDropdownHeight + gap) {
          // Enough space below - position below the button (viewport-relative)
          adjustedTop = rect.bottom + gap;
        } else if (spaceAbove >= estimatedDropdownHeight + gap) {
          // Not enough space below, but enough above - position above the button
          adjustedTop = rect.top - estimatedDropdownHeight - gap;
        } else {
          // Not enough space either way - position where there's more space
          if (spaceBelow > spaceAbove) {
            // More space below - position below with max-height constraint
            adjustedTop = rect.bottom + gap;
          } else {
            // More space above - position above with max-height constraint
            adjustedTop = rect.top - estimatedDropdownHeight - gap;
          }
          // Ensure it doesn't go outside viewport
          if (adjustedTop < 16) {
            adjustedTop = 16;
          }
          if (adjustedTop + estimatedDropdownHeight > viewportHeight - 16) {
            adjustedTop = viewportHeight - estimatedDropdownHeight - 16;
          }
        }

        setDropdownPosition({
          top: adjustedTop,
          left: adjustedLeft,
          width: dropdownWidth,
        });
      }
    };

    if (isOpen) {
      updatePosition();
      // Update position on scroll and resize to keep it aligned with the button
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Close picker when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    // Use a small delay to prevent immediate closing when opening
    let cleanup = null;
    const timeoutId = setTimeout(() => {
      const handleClickOutside = (event) => {
        if (
          buttonRef.current &&
          dropdownRef.current &&
          !buttonRef.current.contains(event.target) &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
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
  }, [isOpen]);

  const handleDateSelect = (date) => {
    // Update date but keep existing time, or use tempTime if no existing time
    const [hours, minutes] = tempTime.split(':').map(Number);
    const newDateTime = setMilliseconds(
      setSeconds(
        setMinutes(
          setHours(date, hours || 9),
          minutes || 0
        ),
        0
      ),
      0
    );
    setSelectedDateTime(newDateTime);
    updateDateTime(newDateTime);
  };

  const handleTimeChange = (e) => {
    const timeValue = e.target.value;
    setTempTime(timeValue);
    
    if (selectedDateTime) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      const newDateTime = setMilliseconds(
        setSeconds(
          setMinutes(
            setHours(selectedDateTime, hours || 9),
            minutes || 0
          ),
          0
        ),
        0
      );
      setSelectedDateTime(newDateTime);
      updateDateTime(newDateTime);
    } else {
      // If no date selected yet, use today's date with the selected time
      const today = new Date();
      const [hours, minutes] = timeValue.split(':').map(Number);
      const newDateTime = setMilliseconds(
        setSeconds(
          setMinutes(
            setHours(today, hours || 9),
            minutes || 0
          ),
          0
        ),
        0
      );
      setSelectedDateTime(newDateTime);
      updateDateTime(newDateTime);
    }
  };

  const updateDateTime = (dateTime) => {
    const syntheticEvent = {
      target: {
        name,
        value: dateTime.toISOString(),
      },
    };
    onChange(syntheticEvent);
  };

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
    
    setSelectedDateTime(date);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    setTempTime(`${hours}:${minutes}`);
    updateDateTime(date);
    setIsOpen(false);
  };

  const presets = [
    { id: 'now', label: 'Now' },
    { id: 'tomorrow', label: 'Tomorrow 9:00 AM' },
    { id: 'nextWeek', label: 'Next Week' },
    { id: 'nextMonth', label: 'Next Month' },
  ];

  const handleClear = () => {
    setSelectedDateTime(null);
    setTempTime('09:00');
    const syntheticEvent = {
      target: {
        name,
        value: '',
      },
    };
    onChange(syntheticEvent);
  };

  const displayValue = selectedDateTime ? format(selectedDateTime, 'MMM d, yyyy h:mm a') : '';

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
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          onMouseDown={(e) => {
            // Prevent blur when clicking the button
            if (isOpen) {
              e.preventDefault();
            }
          }}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-neutral-surface-primary backdrop-blur-[24px]
            border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-neutral-border/60 focus:border-ice-primary'}
            text-neutral-text-primary
            focus-ring focus:shadow-glow-ice-light
            spring-smooth shadow-sm
            hover:border-neutral-border hover:shadow-md
            text-left flex items-center justify-between
            min-h-[44px]
            ${!displayValue && 'text-neutral-text-secondary'}
          `}
          aria-label={label || 'Select date and time'}
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            <Icon name="calendar" size="sm" variant="ice" />
            <span>{displayValue || placeholder}</span>
          </span>
          <div className="flex items-center gap-2">
            {selectedDateTime && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 rounded hover:bg-neutral-surface-secondary transition-colors"
                aria-label="Clear date and time"
              >
                <Icon name="close" size="xs" variant="neutral" />
              </button>
            )}
            <Icon 
              name="arrowRight" 
              size="sm" 
              className={`transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`}
            />
          </div>
        </button>
        {error && (
          <p id={`${name}-error`} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>

      {isOpen && createPortal(
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-text-primary/20 backdrop-blur-sm z-[99998] lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Date Time Picker Dropdown */}
          <div
            ref={dropdownRef}
            className="fixed rounded-xl glass border border-neutral-border/60 z-[99999] shadow-glass-light-lg overflow-hidden"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: dropdownPosition.width > 0 ? `${dropdownPosition.width}px` : 'auto',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 32px)',
              position: 'fixed', // Explicitly set fixed positioning
            }}
          >
            <div className="p-2 sm:p-3 space-y-3 sm:space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
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
                  selectedDate={selectedDateTime}
                  onDateSelect={handleDateSelect}
                  minDate={minDateObj}
                  maxDate={maxDateObj}
                />
              </div>

              {/* Time Input */}
              <div className="pt-4 border-t border-neutral-border/60">
                <p className="text-xs font-semibold text-neutral-text-secondary uppercase tracking-wider mb-3">Select Time</p>
                <input
                  type="time"
                  value={tempTime}
                  onChange={handleTimeChange}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-surface-primary border border-neutral-border/60 text-neutral-text-primary focus-ring focus:border-ice-primary focus:shadow-glow-ice-light text-base sm:text-sm min-h-[44px]"
                />
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
