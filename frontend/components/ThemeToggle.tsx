'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { THEME, ThemeMode } from '@/lib/constants';

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const themes: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
    { value: THEME.LIGHT, label: 'Light', icon: Sun },
    { value: THEME.DARK, label: 'Dark', icon: Moon },
    { value: THEME.SYSTEM, label: 'System', icon: Monitor },
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation (WCAG 2.1 AA)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % themes.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + themes.length) % themes.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          handleThemeSelect(themes[focusedIndex].value);
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(themes.length - 1);
        break;
    }
  };

  const handleThemeSelect = (value: ThemeMode) => {
    setTheme(value);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
    
    // Announce theme change to screen readers
    const announcement = `Theme changed to ${value}`;
    announceToScreenReader(announcement);
  };

  // Screen reader announcement utility
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  const currentThemeLabel = themes.find(t => t.value === theme)?.label || 'System';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Theme selector. Current theme: ${currentThemeLabel}. Press Enter to open menu`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        type="button"
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-foreground" aria-hidden="true" />
        ) : (
          <Sun className="w-5 h-5 text-foreground" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-40 bg-card rounded-lg shadow-elevation-3 border border-border overflow-hidden z-50 animate-scale-in"
          role="menu"
          aria-label="Theme options"
        >
          {themes.map(({ value, label, icon: Icon }, index) => (
            <button
              key={value}
              onClick={() => handleThemeSelect(value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-all duration-150 ${
                theme === value 
                  ? 'bg-primary text-primary-foreground font-semibold' 
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              } ${
                focusedIndex === index ? 'ring-2 ring-inset ring-ring' : ''
              }`}
              role="menuitemradio"
              aria-checked={theme === value}
              tabIndex={focusedIndex === index ? 0 : -1}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm font-medium">{label}</span>
              {theme === value && (
                <span className="ml-auto text-xs" aria-hidden="true">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
