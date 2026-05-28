import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, addYears, subYears, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO, setMonth, setYear } from 'date-fns';

type ViewMode = 'days' | 'months' | 'years';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const [decadeStart, setDecadeStart] = useState(() => Math.floor(new Date().getFullYear() / 10) * 10);
  
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
      setViewMode('days');
      setDecadeStart(Math.floor(currentMonth.getFullYear() / 10) * 10);
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

  const handleSelectDate = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const selectedDate = value ? parseISO(value) : null;

  const renderHeader = () => {
    if (viewMode === 'days') {
      return (
        <div className="flex justify-between items-center mb-4">
          <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)); }} className="p-1 hover:bg-gray-100 transition-colors rounded"><ChevronLeft size={16}/></button>
          <div className="font-bold flex items-center gap-1">
            <button type="button" onClick={(e) => { e.stopPropagation(); setViewMode('months'); }} className="hover:bg-gray-100 px-2 py-1 rounded transition-colors">{format(currentMonth, 'MMMM')}</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setViewMode('years'); setDecadeStart(Math.floor(currentMonth.getFullYear() / 10) * 10); }} className="hover:bg-gray-100 px-2 py-1 rounded transition-colors">{format(currentMonth, 'yyyy')}</button>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)); }} className="p-1 hover:bg-gray-100 transition-colors rounded"><ChevronRight size={16}/></button>
        </div>
      );
    } else if (viewMode === 'months') {
      return (
        <div className="flex justify-between items-center mb-4">
          <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentMonth(subYears(currentMonth, 1)); }} className="p-1 hover:bg-gray-100 transition-colors rounded"><ChevronLeft size={16}/></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setViewMode('years'); setDecadeStart(Math.floor(currentMonth.getFullYear() / 10) * 10); }} className="font-bold hover:bg-gray-100 px-2 py-1 rounded transition-colors">
            {format(currentMonth, 'yyyy')}
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentMonth(addYears(currentMonth, 1)); }} className="p-1 hover:bg-gray-100 transition-colors rounded"><ChevronRight size={16}/></button>
        </div>
      );
    } else {
      return (
        <div className="flex justify-between items-center mb-4">
          <button type="button" onClick={(e) => { e.stopPropagation(); setDecadeStart(decadeStart - 10); }} className="p-1 hover:bg-gray-100 transition-colors rounded"><ChevronLeft size={16}/></button>
          <span className="font-bold px-2 py-1">{decadeStart} - {decadeStart + 9}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); setDecadeStart(decadeStart + 10); }} className="p-1 hover:bg-gray-100 transition-colors rounded"><ChevronRight size={16}/></button>
        </div>
      );
    }
  };

  const renderBody = () => {
    if (viewMode === 'days') {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

      return (
        <>
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
                  onClick={(e) => { e.stopPropagation(); handleSelectDate(day); }}
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
        </>
      );
    } else if (viewMode === 'months') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return (
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => {
            const isSelected = selectedDate && selectedDate.getMonth() === index && selectedDate.getFullYear() === currentMonth.getFullYear();
            return (
              <button
                key={month}
                type="button"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setCurrentMonth(setMonth(currentMonth, index));
                  setViewMode('days');
                }}
                className={`
                  p-4 text-center transition-colors border border-transparent
                  hover:border-gray-300 text-gray-900
                  ${isSelected ? 'bg-black text-white hover:bg-black font-bold shadow-[2px_2px_0_0_#3b82f6]' : ''}
                `}
              >
                {month}
              </button>
            );
          })}
        </div>
      );
    } else {
      const years = Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i);
      return (
        <div className="grid grid-cols-3 gap-2">
          {years.map((year) => {
            const isSelected = selectedDate && selectedDate.getFullYear() === year;
            const isCurrentDecade = year >= decadeStart && year <= decadeStart + 9;
            return (
              <button
                key={year}
                type="button"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setCurrentMonth(setYear(currentMonth, year));
                  setViewMode('months');
                }}
                className={`
                  p-4 text-center transition-colors border border-transparent
                  ${!isCurrentDecade ? 'text-gray-300' : 'text-gray-900 hover:border-gray-300'}
                  ${isSelected ? 'bg-black text-white hover:bg-black font-bold shadow-[2px_2px_0_0_#3b82f6]' : ''}
                `}
              >
                {year}
              </button>
            );
          })}
        </div>
      );
    }
  };

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
            {renderHeader()}
            {renderBody()}
          </div>,
          document.body
        );
      })()}
    </div>
  );
};
