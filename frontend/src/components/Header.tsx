import React from 'react'

interface HeaderProps {
  onLanguageChange?: (language: 'en' | 'hi') => void
  currentLanguage?: 'en' | 'hi'
  qdrantStatus?: 'connected' | 'disconnected'
  corpusCount?: number
}

export const Header: React.FC<HeaderProps> = ({
  onLanguageChange,
  currentLanguage = 'en',
  qdrantStatus,
  corpusCount,
}) => (
  <header className="relative z-10 border-b border-white/10 bg-primary/95 px-4 py-4 text-white shadow-[0_12px_40px_rgba(26,35,126,0.22)] backdrop-blur sm:px-6">
    <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">NyayaBot</h1>
        </div>
        <p className="max-w-xl text-sm leading-6 text-white/80 sm:text-base">
          AI legal guidance for people who need a clean answer fast.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Qdrant status and corpus count removed for cleaner navbar */}
        {onLanguageChange && (
          <div className="flex gap-1 rounded-full border border-white/15 bg-white/10 p-1">
            <button
              onClick={() => onLanguageChange('en')}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition-all ${
                currentLanguage === 'en'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-white/85 hover:bg-white/10'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition-all ${
                currentLanguage === 'hi'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-white/85 hover:bg-white/10'
              }`}
            >
              HI
            </button>
          </div>
        )}
      </div>
    </div>
  </header>
)
