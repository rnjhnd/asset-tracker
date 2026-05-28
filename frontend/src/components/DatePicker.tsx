import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  
  // Try to parse the input value, fallback to today
  const [currentMonth, setCurrentMonth] = useState(() => {
    try {
      return value ? parseISO(value) : new Date();
    } catch {
      return new Date();
    }
  });

  useEffect(() => {
    if (isOpen && containerRef.current) {
      setRect(containerRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const portalEl = document.getElementById('datepicker-portal-root');
        if (portalEl && portalEl.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    };
    
    const handleScroll = (e: Event) => {
      if ((e.target as HTMLElement)?.closest('#datepicker-portal-root')) return;
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

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    const newDate = new Date(currentMonth);
    newDate.setFullYear(newYear);
    setCurrentMonth(newDate);
  };

  const handleSelectDate = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const selectedDate = value ? parseISO(value) : null;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors bg-white hover:bg-gray-50"
      >
        <span>{value ? format(parseISO(value), 'MMM dd, yyyy') : 'Select Date'}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && rect && (() => {
        const showAbove = (window.innerHeight - rect.bottom) < 320;
        return createPortal(
          <div 
            id="datepicker-portal-root"
            className="fixed z-[9999] w-72 bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#111827] p-4 text-sm font-mono"
            style={{
              top: showAbove ? rect.top - 4 : rect.bottom + 4,
              left: Math.min(rect.left, window.innerWidth - 288 - 16),
              transform: showAbove ? 'translateY(-100%)' : 'none'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 transition-colors"><ChevronLeft size={16}/></button>
              <div className="font-bold flex items-center gap-1">
                <span>{format(currentMonth, 'MMMM')}</span>
                <select 
                  value={currentMonth.getFullYear()} 
                  onChange={handleYearChange}
                  className="font-bold outline-none cursor-pointer bg-transparent hover:bg-gray-100 p-1 rounded"
                >
                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 20 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-gray-100 transition-colors"><ChevronRight size={16}/></button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center font-bold text-gray-500 text-xs">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                return (
                  <button
                    key={day.toString()}
                    type="button"
                    onClick={() => handleSelectDate(day)}
                    className={`
                      p-2 text-center transition-colors border border-transparent
                      ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900 hover:border-gray-300'}
                      ${isSelected ? 'bg-black text-white hover:bg-black font-bold shadow-[2px_2px_0_0_#3b82f6]' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
};
