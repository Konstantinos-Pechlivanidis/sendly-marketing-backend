import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import GlassInput from './GlassInput';
import GlassButton from './GlassButton';
import Icon from './Icon';

/**
 * Glass Date Picker Component
 * Custom date picker with iOS 26 styling
 */
export default function GlassDatePicker({
  label,
  name,
  value,
  onChange,
  error,
  placeholder = 'Select date',
  required,
  className,
  minDate,
  maxDate,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [tempDate, setTempDate] = useState(value ? new Date(value).toISOString().split('T')[0] : '');
  const pickerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setTempDate(date.toISOString().split('T')[0]);
    } else {
      setSelectedDate(null);
      setTempDate('');
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
    
    if (dateValue) {
      const date = new Date(dateValue);
      setSelectedDate(date);
      
      // Create a synthetic event for onChange
      const syntheticEvent = {
        target: {
          name,
          value: date.toISOString(),
        },
      };
      onChange(syntheticEvent);
    } else {
      setSelectedDate(null);
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
    const today = new Date();
    let date = new Date();
    
    switch (preset) {
      case 'today':
        date = today;
        break;
      case 'tomorrow':
        date.setDate(today.getDate() + 1);
        break;
      case 'nextWeek':
        date.setDate(today.getDate() + 7);
        break;
      case 'nextMonth':
        date.setMonth(today.getMonth() + 1);
        break;
      default:
        return;
    }
    
    date.setHours(0, 0, 0, 0);
    setSelectedDate(date);
    setTempDate(date.toISOString().split('T')[0]);
    
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
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'nextWeek', label: 'Next Week' },
    { id: 'nextMonth', label: 'Next Month' },
  ];

  const displayValue = selectedDate ? format(selectedDate, 'MMM d, yyyy') : '';

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
          aria-label={label || 'Select date'}
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
        <div className="absolute top-full left-0 mt-2 p-6 rounded-xl glass border border-neutral-border/60 z-10 min-w-[360px] shadow-glass-light-lg">
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

            {/* Date Input */}
            <div className="pt-4 border-t border-neutral-border/60">
              <p className="text-xs font-semibold text-neutral-text-secondary uppercase tracking-wider mb-3">Custom Date</p>
              <input
                type="date"
                value={tempDate}
                onChange={handleDateChange}
                min={minDate ? new Date(minDate).toISOString().split('T')[0] : undefined}
                max={maxDate ? new Date(maxDate).toISOString().split('T')[0] : undefined}
                className="w-full px-4 py-3 rounded-xl bg-neutral-surface-primary border border-neutral-border/60 text-neutral-text-primary focus-ring focus:border-ice-primary focus:shadow-glow-ice-light"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

