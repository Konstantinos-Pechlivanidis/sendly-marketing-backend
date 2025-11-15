import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import GlassInput from './GlassInput';
import GlassButton from './GlassButton';
import Icon from './Icon';

/**
 * Glass Date Time Picker Component
 * Custom date and time picker with iOS 26 styling
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
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(value ? new Date(value) : null);
  const [tempDate, setTempDate] = useState(value ? new Date(value).toISOString().split('T')[0] : '');
  const [tempTime, setTempTime] = useState(value ? new Date(value).toTimeString().slice(0, 5) : '');
  const pickerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDateTime(date);
      setTempDate(date.toISOString().split('T')[0]);
      setTempTime(date.toTimeString().slice(0, 5));
    } else {
      setSelectedDateTime(null);
      setTempDate('');
      setTempTime('');
    }
  }, [value]);

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

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setTempDate(dateValue);
    updateDateTime(dateValue, tempTime);
  };

  const handleTimeChange = (e) => {
    const timeValue = e.target.value;
    setTempTime(timeValue);
    updateDateTime(tempDate, timeValue);
  };

  const updateDateTime = (dateValue, timeValue) => {
    if (dateValue && timeValue) {
      const [hours, minutes] = timeValue.split(':');
      const date = new Date(dateValue);
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      setSelectedDateTime(date);
      
      const syntheticEvent = {
        target: {
          name,
          value: date.toISOString(),
        },
      };
      onChange(syntheticEvent);
    } else if (dateValue) {
      // Only date selected, use current time or default to 9:00 AM
      const date = new Date(dateValue);
      if (!timeValue) {
        date.setHours(9, 0, 0, 0);
        setTempTime('09:00');
      } else {
        const [hours, minutes] = timeValue.split(':');
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
      setSelectedDateTime(date);
      
      const syntheticEvent = {
        target: {
          name,
          value: date.toISOString(),
        },
      };
      onChange(syntheticEvent);
    } else {
      setSelectedDateTime(null);
      const syntheticEvent = {
        target: {
          name,
          value: '',
        },
      };
      onChange(syntheticEvent);
    }
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
    setTempDate(date.toISOString().split('T')[0]);
    setTempTime(date.toTimeString().slice(0, 5));
    
    const syntheticEvent = {
      target: {
        name,
        value: date.toISOString(),
      },
    };
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  const presets = [
    { id: 'now', label: 'Now' },
    { id: 'tomorrow', label: 'Tomorrow 9:00 AM' },
    { id: 'nextWeek', label: 'Next Week' },
    { id: 'nextMonth', label: 'Next Month' },
  ];

  const displayValue = selectedDateTime ? format(selectedDateTime, 'MMM d, yyyy h:mm a') : '';

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <div className="space-y-2">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-neutral-text-primary">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-neutral-surface-primary backdrop-blur-[24px]
            border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-neutral-border/60 focus:border-ice-primary'}
            text-neutral-text-primary
            focus-ring focus:shadow-glow-ice-light
            spring-smooth shadow-sm
            hover:border-neutral-border hover:shadow-md
            text-left flex items-center justify-between
            ${!displayValue && 'text-neutral-text-secondary'}
          `}
          aria-label={label || 'Select date and time'}
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            <Icon name="calendar" size="sm" variant="ice" />
            <span>{displayValue || placeholder}</span>
          </span>
          <Icon 
            name="arrowRight" 
            size="sm" 
            className={`transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`}
          />
        </button>
        {error && (
          <p id={`${name}-error`} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-6 rounded-xl glass border border-neutral-border/60 z-10 min-w-[400px] shadow-glass-light-lg">
          <div className="space-y-6">
            {/* Preset Buttons */}
            <div>
              <p className="text-xs font-semibold text-neutral-text-secondary uppercase tracking-wider mb-3">Quick Select</p>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <GlassButton
                    key={preset.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => applyPreset(preset.id)}
                    className="justify-start text-left text-xs"
                  >
                    {preset.label}
                  </GlassButton>
                ))}
              </div>
            </div>

            {/* Date and Time Inputs */}
            <div className="pt-4 border-t border-neutral-border/60">
              <p className="text-xs font-semibold text-neutral-text-secondary uppercase tracking-wider mb-3">Custom Date & Time</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-text-secondary mb-2">Date</label>
                  <input
                    type="date"
                    value={tempDate}
                    onChange={handleDateChange}
                    min={minDate ? new Date(minDate).toISOString().split('T')[0] : undefined}
                    max={maxDate ? new Date(maxDate).toISOString().split('T')[0] : undefined}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-surface-primary border border-neutral-border/60 text-neutral-text-primary focus-ring focus:border-ice-primary focus:shadow-glow-ice-light"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-text-secondary mb-2">Time</label>
                  <input
                    type="time"
                    value={tempTime}
                    onChange={handleTimeChange}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-surface-primary border border-neutral-border/60 text-neutral-text-primary focus-ring focus:border-ice-primary focus:shadow-glow-ice-light"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

