import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

/**
 * Glass Select Custom Component
 * Fully custom select dropdown with iOS 26 styling
 * Does not use native select element
 */
export default function GlassSelectCustom({
  label,
  name,
  value,
  onChange,
  error,
  options = [],
  placeholder = 'Select an option',
  required,
  className,
  searchable = false,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find(opt => {
    const optValue = typeof opt === 'object' ? opt.value : opt;
    return optValue === value;
  });

  const displayValue = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : '';

  // Filter options if searchable
  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => {
        const label = typeof opt === 'object' ? opt.label : opt;
        return label.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input if searchable
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, searchable]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    const syntheticEvent = {
      target: {
        name,
        value: optionValue,
      },
    };
    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
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
          aria-label={label || 'Select option'}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="flex items-center gap-2 flex-1 min-w-0">
            <span className="truncate">{displayValue || placeholder}</span>
          </span>
          <Icon 
            name="arrowRight" 
            size="sm" 
            className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : '-rotate-90'}`}
          />
        </button>
        {error && (
          <p id={`${name}-error`} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl glass border border-neutral-border/60 z-10 shadow-glass-light-lg overflow-hidden">
          {/* Search Input (if searchable) */}
          {searchable && (
            <div className="p-3 border-b border-neutral-border/60">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search options..."
                className="w-full px-3 py-2 rounded-lg bg-neutral-surface-primary border border-neutral-border/60 text-neutral-text-primary text-sm focus-ring focus:border-ice-primary"
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-neutral-text-secondary text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                const isSelected = optionValue === value;

                return (
                  <button
                    key={optionValue || index}
                    type="button"
                    onClick={() => handleSelect(optionValue)}
                    className={`
                      w-full px-4 py-3 text-left text-sm
                      transition-colors
                      ${isSelected 
                        ? 'bg-ice-primary/10 text-ice-primary font-medium' 
                        : 'text-neutral-text-primary hover:bg-neutral-surface-secondary'
                      }
                      ${index !== filteredOptions.length - 1 ? 'border-b border-neutral-border/30' : ''}
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center justify-between">
                      <span>{optionLabel}</span>
                      {isSelected && (
                        <Icon name="check" size="sm" variant="ice" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

