import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
  disabled?: boolean;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({ value, onChange, options, className = '', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      setRect(dropdownRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Also check if the click was inside the portal dropdown
        const portalEl = document.getElementById('dropdown-portal-root');
        if (portalEl && portalEl.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    };
    
    const handleScroll = (e: Event) => {
      // Don't close if they are scrolling the dropdown list itself
      if ((e.target as HTMLElement)?.id === 'dropdown-portal-root') return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full min-h-[44px] flex items-center justify-between bg-white border-2 border-[#e4e4e7] px-3 py-2 font-mono text-sm focus:border-[#3b82f6] outline-none transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate pr-4">{selectedOption?.label}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && rect && createPortal(
        <ul 
          id="dropdown-portal-root"
          className="fixed z-[9999] bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#111827] max-h-60 overflow-y-auto custom-scrollbar"
          style={{
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          }}
        >
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-3 py-2.5 font-mono text-sm cursor-pointer hover:bg-gray-100 transition-colors ${
                value === option.value ? 'bg-gray-100 font-bold' : 'text-gray-700'
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
};
