import React, { forwardRef, useEffect, useRef, useState } from "react";
import { HTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      label,
      error,
      helperText,
      fullWidth = false,
      className = "",
      disabled = false,
      placeholder = "Select...",
      ...rest
    },
    ref
  ) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    // allow parent ref to point to wrapper
    useEffect(() => {
      if (!ref) return;
      if (typeof ref === "function") ref(wrapperRef.current);
      else if (ref && typeof ref === "object") (ref as React.MutableRefObject<HTMLDivElement | null>).current = wrapperRef.current;
    }, [ref]);

    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    useEffect(() => {
      if (!open) setHighlightedIndex(-1);
    }, [open, options.length]);

    useEffect(() => {
      function onDocClick(e: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const selected = options.find((o) => o.value === value);

    const toggleOpen = () => {
      if (disabled) return;
      setOpen((s) => !s);
    };

    const handleSelect = (opt: SelectOption) => {
      if (disabled) return;
      onChange?.(opt.value);
      setOpen(false);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex((i) => {
          const next = i + 1;
          return next >= options.length ? 0 : next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex((i) => {
          const prev = i - 1;
          return prev < 0 ? options.length - 1 : prev;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (open && highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex]);
        } else {
          setOpen(true);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };

    const baseClasses = `
      px-4 py-2.5 appearance-none
      border rounded-lg 
      font-medium text-sm
      transition-all duration-150
      focus:outline-none
      disabled:opacity-50 disabled:cursor-not-allowed
      ${error ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-300'}
      ${fullWidth ? 'w-full' : 'w-30'}
      ${disabled ? 'bg-gray-100' : 'bg-white hover:border-gray-400'}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div
        ref={wrapperRef}
        className={`${fullWidth ? 'w-full' : ''} relative ${className}`}
        {...rest}
      >
        {label && (
          <label className="block text-sm font-sm text-gray-700 mb-2">
            {label}
          </label>
        )}

        <div
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={onKeyDown}
          onClick={toggleOpen}
          className={`inline-flex items-center justify-between ${baseClasses} ${open ? 'ring-2 ring-purple-100 border-purple-500 shadow-sm' : ''}`}
        >
          <span className="flex-1 text-left pr-2">
            <span className={`block truncate ${selected ? 'text-gray-900' : 'text-gray-500'}`}>
              {selected ? selected.label : placeholder}
            </span>
            {helperText && !error && (
              <span className="block text-xs text-gray-400 mt-0.5">{helperText}</span>
            )}
          </span>

          <div className="flex items-center pl-2">
            <svg
              className={`w-4 h-4 text-gray-600 transform transition-transform ${open ? '-rotate-180' : 'rotate-0'}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Listbox */}
        {open && (
          <ul
            role="listbox"
            aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
            tabIndex={-1}
            className="absolute z-50 mt-2 w-full text-sm bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto py-1"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;
              return (
                <li
                  key={opt.value}
                  id={`option-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseLeave={() => setHighlightedIndex(-1)}
                  onClick={() => handleSelect(opt)}
                  className={`flex items-center justify-between px-4 py-2 cursor-pointer select-none
                    ${isHighlighted ? 'bg-purple-50' : ''}
                    ${isSelected ? 'font-sm text-gray-900' : 'text-gray-700'}
                  `}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879A1 1 0 003.293 9.293l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* error/help text */}
        {!open && helperText && !error && (
          <p className="mt-1 text-xs text-gray-500">{helperText}</p>
        )}
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
