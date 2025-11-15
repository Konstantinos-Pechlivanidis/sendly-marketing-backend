import { useState, useEffect, useRef } from 'react';
import GlassButton from './GlassButton';
import Icon from './Icon';
import { format } from 'date-fns';

/**
 * Date Range Picker Component
 * Enhanced date range selector with preset ranges for reports
 */
export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    if (value) {
      onStartDateChange(new Date(value));
    } else {
      onStartDateChange(null);
    }
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    if (value) {
      onEndDateChange(new Date(value));
    } else {
      onEndDateChange(null);
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
        break;
      case 'last30':
        start.setDate(start.getDate() - 30);
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
    
    onStartDateChange(start);
    onEndDateChange(end);
    setIsOpen(false);
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const presets = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last7', label: 'Last 7 days' },
    { id: 'last30', label: 'Last 30 days' },
    { id: 'thisMonth', label: 'This month' },
    { id: 'lastMonth', label: 'Last month' },
  ];

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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

      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 bg-neutral-text-primary/20 backdrop-blur-sm z-[9] lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown Panel */}
          <div className="absolute top-full left-0 right-0 sm:right-auto mt-2 p-4 sm:p-6 rounded-xl glass border border-neutral-border/60 z-10 w-full sm:w-auto sm:min-w-[360px] max-w-full shadow-glass-light-lg">
            <div className="space-y-4 sm:space-y-6">
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

              {/* Custom Date Inputs */}
              <div className="pt-4 border-t border-neutral-border/60">
                <p className="text-xs font-semibold text-neutral-text-secondary uppercase tracking-wider mb-3">Custom Range</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-text-secondary mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formatDate(startDate)}
                      onChange={handleStartDateChange}
                      max={endDate ? formatDate(endDate) : undefined}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-surface-primary border border-neutral-border/60 text-neutral-text-primary focus-ring focus:border-ice-primary focus:shadow-glow-ice-light text-base sm:text-sm min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-text-secondary mb-2">End Date</label>
                    <input
                      type="date"
                      value={formatDate(endDate)}
                      onChange={handleEndDateChange}
                      min={startDate ? formatDate(startDate) : undefined}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-surface-primary border border-neutral-border/60 text-neutral-text-primary focus-ring focus:border-ice-primary focus:shadow-glow-ice-light text-base sm:text-sm min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

