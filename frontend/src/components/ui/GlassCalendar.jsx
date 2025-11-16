import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isBefore, isAfter } from 'date-fns';
import GlassButton from './GlassButton';
import Icon from './Icon';

/**
 * Glass Calendar Component
 * Custom calendar grid UI with iOS 26 styling
 * Used internally by date picker components
 */
export default function GlassCalendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  className = '',
}) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday = 0
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isDateDisabled = (date) => {
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  };

  const handleDateClick = (date) => {
    if (!isDateDisabled(date)) {
      onDateSelect(date);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    if (!isDateDisabled(today)) {
      onDateSelect(today);
    }
  };

  return (
    <div className={`glass rounded-xl border border-neutral-border/60 p-4 sm:p-6 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-neutral-surface-secondary transition-colors"
          aria-label="Previous month"
        >
          <Icon name="arrowLeft" size="sm" variant="ice" />
        </button>
        <h3 className="text-base sm:text-lg font-semibold text-neutral-text-primary">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-neutral-surface-secondary transition-colors"
          aria-label="Next month"
        >
          <Icon name="arrowRight" size="sm" variant="ice" />
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-xs font-semibold text-neutral-text-secondary text-center py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const isDisabled = isDateDisabled(day);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={`
                aspect-square min-h-[36px] sm:min-h-[44px] rounded-lg
                text-sm font-medium
                transition-all spring-smooth
                ${!isCurrentMonth ? 'text-neutral-text-tertiary opacity-40' : 'text-neutral-text-primary'}
                ${isSelected
                  ? 'bg-ice-primary text-white shadow-glow-ice-light'
                  : isToday
                    ? 'bg-ice-primary/10 text-ice-primary border border-ice-primary/30'
                    : isDisabled
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-neutral-surface-secondary'
                }
                ${!isDisabled && !isSelected && 'hover:scale-105'}
              `}
              aria-label={format(day, 'MMMM d, yyyy')}
              aria-selected={isSelected}
              aria-disabled={isDisabled}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Today Button */}
      <div className="mt-4 sm:mt-6 pt-4 border-t border-neutral-border/60">
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={goToToday}
          className="w-full justify-center"
        >
          Go to Today
        </GlassButton>
      </div>
    </div>
  );
}

