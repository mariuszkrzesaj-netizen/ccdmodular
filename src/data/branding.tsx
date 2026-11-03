import React from 'react';

export const DEMO_COMPANY = "[ NAZWA TWOJEJ FIRMY / PRODUCENTA ]";
export const DEMO_ADDRESS = "ul. Przemysłowa 1, 00-000 Twoje Miasto";
export const DEMO_CONTACT = "+48 000 000 000 | kontakt@twojadomena.pl | www.twojadomena.pl";
export const DEMO_COPYRIGHT = "© 2026 System Konfiguracji B2B — Wersja Demonstracyjna dla Producentów Przyczep";

export const WORKSHOP_DOC_HEADER = "DOKUMENTACJA WARSZTATOWA — [NAZWA TWOJEJ FIRMY]";
export const WORKSHOP_LOGO_PLACEHOLDER = "[MIEJSCE NA LOGO ZAKŁADU]";
export const WORKSHOP_DOC_FOOTER = "GENERATOR TECHNOLOGICZNY B2B — WERSJA POKAZOWA DLA FABRYK I ZAKŁADÓW PRODUKCYJNYCH";

interface LogoPlaceholderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({
  className = '',
  size = 'md',
  compact = false,
}) => {
  const sizeClasses = {
    sm: 'h-7 text-[9px] px-2 gap-1.5',
    md: 'h-9 text-[10px] px-2.5 gap-2',
    lg: 'h-11 text-xs px-3.5 gap-2.5',
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center font-mono font-bold tracking-wider rounded-xl border border-dashed border-amber-500/60 bg-amber-500/10 text-amber-300 shadow-sm ${sizeClasses} ${className}`}
      title="W tym miejscu pojawia się logo Twojego zakładu produkcyjnego"
    >
      <svg
        className={
          size === 'sm'
            ? 'w-4 h-4 text-amber-400 shrink-0'
            : size === 'lg'
            ? 'w-5 h-5 text-amber-400 shrink-0'
            : 'w-4.5 h-4.5 text-amber-400 shrink-0'
        }
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 15h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a3 3 0 0 0-3 3v7z" />
        <path d="M14 5v5h4" />
        <circle cx="7" cy="18" r="2.5" />
        <circle cx="15" cy="18" r="2.5" />
        <path d="M20 15h2.5" />
      </svg>
      <span>{compact ? '[ TWOJE LOGO ]' : '[ TWOJE LOGO ]'}</span>
    </div>
  );
};
