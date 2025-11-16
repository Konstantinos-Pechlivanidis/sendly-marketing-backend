import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import GlassCalendar from './GlassCalendar';
import Icon from './Icon';

/**
 * Glass Date Picker Component
 * Custom calendar-based date picker with iOS 26 styling
 * Uses React Portal for proper z-index handling on mobile
 */
export default function GlassDatePicker({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder = 'Select date',
  required,
  className,
  minDate,
  maxDate,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Parse value prop to Date object
  useEffect(() => {
    if (value && value.trim()) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          // Set time to midnight (00:00:00) for date-only fields
          const dateOnly = setMilliseconds(setSeconds(setMinutes(setHours(date, 0), 0), 0), 0);
          setSelectedDate(dateOnly);
        } else {
          setSelectedDate(null);
        }
      } catch {
        setSelectedDate(null);
      }
    } else {
      setSelectedDate(null);
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
        const dropdownWidth = Math.min(width, 360); // Max width for calendar
        const estimatedDropdownHeight = 400; // Approximate height of calendar
        
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
          // Call onBlur after closing if provided
          if (onBlur) {
            onBlur();
          }
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
  }, [isOpen, onBlur]);

  const handleDateSelect = (date) => {
    // Ensure time is set to midnight for date-only fields
    const dateOnly = setMilliseconds(setSeconds(setMinutes(setHours(date, 0), 0), 0), 0);
    setSelectedDate(dateOnly);
    
    // Create a synthetic event for onChange
    const syntheticEvent = {
      target: {
        name,
        value: dateOnly.toISOString(),
      },
    };
    onChange(syntheticEvent);
    
    // Close picker after a small delay to allow the click event to complete
    setTimeout(() => {
      setIsOpen(false);
      // Call onBlur after closing if provided
      if (onBlur) {
        onBlur();
      }
    }, 100);
  };

  const handleClear = () => {
    setSelectedDate(null);
    const syntheticEvent = {
      target: {
        name,
        value: '',
      },
    };
    onChange(syntheticEvent);
  };

  const displayValue = selectedDate ? format(selectedDate, 'MMM d, yyyy') : '';

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
          aria-label={label || 'Select date'}
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            <Icon name="calendar" size="sm" variant="ice" />
            <span>{displayValue || placeholder}</span>
          </span>
          <div className="flex items-center gap-2">
            {selectedDate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 rounded hover:bg-neutral-surface-secondary transition-colors"
                aria-label="Clear date"
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
          
          {/* Calendar Dropdown */}
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
            <div className="p-2 sm:p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
              <GlassCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                minDate={minDateObj}
                maxDate={maxDateObj}
              />
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
