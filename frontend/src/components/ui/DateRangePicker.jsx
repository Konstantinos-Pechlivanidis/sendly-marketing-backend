import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import GlassCalendar from './GlassCalendar';
import GlassButton from './GlassButton';
import Icon from './Icon';

/**
 * Date Range Picker Component
 * Enhanced date range selector with calendar UI and preset ranges for reports
 * Uses React Portal for proper z-index handling on mobile
 */
export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePicker, setActivePicker] = useState('start'); // 'start' or 'end'
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync temp dates with props
  useEffect(() => {
    setTempStartDate(startDate);
  }, [startDate]);

  useEffect(() => {
    setTempEndDate(endDate);
  }, [endDate]);

  // Calculate dropdown position
  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef.current && isOpen) {
        const rect = buttonRef.current.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
        
        // Calculate position below the button
        const top = rect.bottom + scrollY + 8; // 8px gap
        const left = rect.left + scrollX;
        const width = rect.width;

        // Check if dropdown would go off-screen
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const dropdownWidth = Math.min(Math.max(width, 360), 420); // Min 360px, max 420px
        
        // Adjust horizontal position
        let adjustedLeft = left;
        if (left + dropdownWidth > viewportWidth) {
          adjustedLeft = viewportWidth - dropdownWidth - 16; // 16px padding from edge
        }
        if (adjustedLeft < 16) {
          adjustedLeft = 16;
        }

        // Adjust vertical position if dropdown would go off-screen
        let adjustedTop = top;
        const estimatedDropdownHeight = 600; // Approximate height of the dropdown
        if (top + estimatedDropdownHeight > viewportHeight + scrollY) {
          // Position above the button if there's not enough space below
          adjustedTop = rect.top + scrollY - estimatedDropdownHeight - 8;
          // Ensure it doesn't go above viewport
          if (adjustedTop < scrollY + 16) {
            adjustedTop = scrollY + 16;
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

  const handleStartDateSelect = (date) => {
    // Set to start of day
    const startOfDayDate = setMilliseconds(
      setSeconds(
        setMinutes(
          setHours(date, 0),
          0
        ),
        0
      ),
      0
    );
    setTempStartDate(startOfDayDate);
    onStartDateChange(startOfDayDate);
    
    // If end date is before start date, update end date
    if (tempEndDate && startOfDayDate > tempEndDate) {
      const endOfDayDate = setMilliseconds(
        setSeconds(
          setMinutes(
            setHours(date, 23),
            59
          ),
          59
        ),
        999
      );
      setTempEndDate(endOfDayDate);
      onEndDateChange(endOfDayDate);
    }
  };

  const handleEndDateSelect = (date) => {
    // Set to end of day
    const endOfDayDate = setMilliseconds(
      setSeconds(
        setMinutes(
          setHours(date, 23),
          59
        ),
        59
      ),
      999
    );
    setTempEndDate(endOfDayDate);
    onEndDateChange(endOfDayDate);
    
    // If start date is after end date, update start date
    if (tempStartDate && endOfDayDate < tempStartDate) {
      const startOfDayDate = setMilliseconds(
        setSeconds(
          setMinutes(
            setHours(date, 0),
            0
          ),
          0
        ),
        0
      );
      setTempStartDate(startOfDayDate);
      onStartDateChange(startOfDayDate);
    }
  };

  const applyPreset = (preset) => {
    const end = new Date();
    const start = new Date();
    
    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last7':
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last30':
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setDate(0); // Last day of previous month
        end.setHours(23, 59, 59, 999);
        break;
      default:
        return;
    }
    
    setTempStartDate(start);
    setTempEndDate(end);
    onStartDateChange(start);
    onEndDateChange(end);
    setIsOpen(false);
  };

  const presets = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last7', label: 'Last 7 days' },
    { id: 'last30', label: 'Last 30 days' },
    { id: 'thisMonth', label: 'This month' },
    { id: 'lastMonth', label: 'Last month' },
  ];

  const formatDisplayDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
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
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-surface-primary border border-neutral-border/60 hover:border-ice-primary focus-ring focus:shadow-glow-ice-light spring-smooth shadow-sm text-sm text-neutral-text-primary font-medium min-h-[44px] w-full sm:w-auto"
        aria-label="Select date range"
        aria-expanded={isOpen}
      >
        <Icon name="calendar" size="sm" variant="ice" />
        <span>
          {startDate && endDate
            ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
            : 'Select date range'}
        </span>
        <Icon 
          name="arrowRight" 
          size="sm" 
          className={`transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`}
        />
      </button>

      {isOpen && createPortal(
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-text-primary/20 backdrop-blur-sm z-[99998] lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Date Range Picker Dropdown */}
          <div
            ref={dropdownRef}
            className="fixed rounded-xl glass border border-neutral-border/60 z-[99999] shadow-glass-light-lg overflow-hidden"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: dropdownPosition.width > 0 ? `${dropdownPosition.width}px` : 'auto',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 32px)',
            }}
          >
            <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
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

              {/* Date Range Selection */}
              <div className="pt-4 border-t border-neutral-border/60">
                <p className="text-xs font-semibold text-neutral-text-secondary uppercase tracking-wider mb-3">Custom Range</p>
                
                {/* Tabs for Start/End Date */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setActivePicker('start')}
                    className={`
                      flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${activePicker === 'start'
                        ? 'bg-ice-primary/10 text-ice-primary border border-ice-primary/30'
                        : 'bg-neutral-surface-secondary text-neutral-text-secondary hover:bg-neutral-surface-primary'
                      }
                    `}
                  >
                    Start Date
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePicker('end')}
                    className={`
                      flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${activePicker === 'end'
                        ? 'bg-ice-primary/10 text-ice-primary border border-ice-primary/30'
                        : 'bg-neutral-surface-secondary text-neutral-text-secondary hover:bg-neutral-surface-primary'
                      }
                    `}
                  >
                    End Date
                  </button>
                </div>

                {/* Calendar */}
                {activePicker === 'start' ? (
                  <GlassCalendar
                    selectedDate={tempStartDate}
                    onDateSelect={handleStartDateSelect}
                    maxDate={tempEndDate || undefined}
                  />
                ) : (
                  <GlassCalendar
                    selectedDate={tempEndDate}
                    onDateSelect={handleEndDateSelect}
                    minDate={tempStartDate || undefined}
                  />
                )}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
