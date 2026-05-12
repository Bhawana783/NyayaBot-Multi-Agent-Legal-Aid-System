import React from 'react'

interface DisclaimerProps {
  language?: 'en' | 'hi'
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ language = 'en' }) => {
  const content =
    language === 'hi'
      ? 'NyayaBot कानूनी जानकारी प्रदान करता है, कानूनी सलाह नहीं। आधिकारिक मामलों के लिए किसी वकील से परामर्श लें।'
      : 'NyayaBot provides legal information, not legal advice. Consult a lawyer for official matters.'

  return (
    <div className="border-t border-border-light/70 bg-primary/5 px-4 py-4 dark:border-border-dark/70 sm:px-6">
      <div className="mx-auto max-w-7xl rounded-2xl border border-border-light/70 bg-surface-light/80 px-4 py-3 dark:border-border-dark/70 dark:bg-surface-dark/80 sm:px-5">
        <p className="text-center text-xs leading-relaxed text-muted">
          ⚖️ {content}
        </p>
      </div>
    </div>
  )
}
