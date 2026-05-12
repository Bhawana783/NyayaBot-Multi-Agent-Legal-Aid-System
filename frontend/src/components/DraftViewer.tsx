import React from 'react'

interface DraftViewerProps {
  document: string
  citedSections: string[]
  caseType?: string
  jurisdiction?: string
  urgency?: string
  confidenceScore?: number
  language?: 'en' | 'hi'
}

const LABELS = {
  en: {
    document: 'Legal Document',
    citedLaws: 'Cited Laws & Sections',
    copy: 'Copy document',
    copied: 'Copied ✓',
  },
  hi: {
    document: 'कानूनी दस्तावेज़',
    citedLaws: 'उद्धृत कानून और धारा',
    copy: 'दस्तावेज़ कॉपी करें',
    copied: 'कॉपी किया गया ✓',
  },
}

export const DraftViewer: React.FC<DraftViewerProps> = ({
  document,
  citedSections,
  caseType,
  jurisdiction,
  urgency,
  confidenceScore,
  language = 'en',
}) => {
  const [copied, setCopied] = React.useState(false)
  const labels = LABELS[language]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(document)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const lines = document.split('\n')

  const urgencyColor =
    urgency === 'critical' || urgency === 'high'
      ? 'bg-warning bg-opacity-10 border-warning'
      : 'bg-secondary bg-opacity-10 border-secondary'

  const score = typeof confidenceScore === 'number' ? confidenceScore : null
  const scorePercent = score !== null ? Math.round(score * 100) : null
  const isLowConfidence = score !== null && score < 0.65
  const lineCount = lines.length

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-light bg-white/80 p-4 dark:border-border-dark dark:bg-black/20">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">
            {language === 'hi' ? 'विश्वास स्तर' : 'Confidence'}
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">
            {scorePercent !== null ? `${scorePercent}%` : '—'}
          </div>
        </div>
        <div className="rounded-2xl border border-border-light bg-white/80 p-4 dark:border-border-dark dark:bg-black/20">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">
            {language === 'hi' ? 'धाराएँ' : 'Citations'}
          </div>
          <div className="mt-2 text-2xl font-bold text-secondary">
            {citedSections.length}
          </div>
        </div>
        <div className="rounded-2xl border border-border-light bg-white/80 p-4 dark:border-border-dark dark:bg-black/20">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">
            {language === 'hi' ? 'लाइनें' : 'Lines'}
          </div>
          <div className="mt-2 text-2xl font-bold text-processing">{lineCount}</div>
        </div>
      </div>

      {scorePercent !== null && (
        <div
          className={`rounded-2xl border px-4 py-4 text-sm ${
            isLowConfidence
              ? 'border-warning bg-warning/10 text-warning'
              : 'border-secondary bg-secondary/10 text-secondary'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">
              {language === 'hi' ? 'विश्वास स्तर' : 'Confidence Score'}
            </span>
            <span className="font-bold">{scorePercent}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60">
            <div
              className={`h-full rounded-full ${
                isLowConfidence ? 'bg-warning' : 'bg-secondary'
              }`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          {isLowConfidence && (
            <p className="mt-2 text-xs font-500">
              {language === 'hi'
                ? 'यह उत्तर कम आत्मविश्वास के साथ तैयार हुआ है. कृपया किसी वकील से पुष्टि करें.'
                : 'This analysis is low confidence. Please confirm with a human lawyer.'}
            </p>
          )}
        </div>
      )}

      {(caseType || jurisdiction || urgency) && (
        <div className={`rounded-2xl border-l-4 px-4 py-3 ${urgencyColor}`}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-600 text-primary">⚖️</span>
            {caseType && (
              <span className="text-accent-light dark:text-accent-dark">
                {caseType}
              </span>
            )}
            {jurisdiction && (
              <>
                <span className="text-muted">·</span>
                <span className="text-accent-light dark:text-accent-dark">
                  {jurisdiction}
                </span>
              </>
            )}
            {urgency && (
              <>
                <span className="text-muted">·</span>
                <span className="font-medium text-accent-light dark:text-accent-dark">
                  {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-primary">{labels.document}</h3>
          <button
            onClick={handleCopy}
            className="rounded-full border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10"
          >
            {copied ? labels.copied : labels.copy}
          </button>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <div className="max-h-[32rem] overflow-y-auto">
            <div className="font-mono text-xs leading-relaxed">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex border-b border-border-light transition-colors last:border-b-0 hover:bg-primary/5 dark:border-border-dark"
                >
                  <div className="sticky left-0 w-12 select-none border-r border-border-light bg-background-light px-3 py-2 text-right text-muted dark:border-border-dark dark:bg-background-dark">
                    {idx + 1}
                  </div>
                  <div className="flex-1 break-words px-4 py-2 whitespace-pre-wrap text-black dark:text-white">
                    {line || '\u00A0'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {citedSections.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-primary">{labels.citedLaws}</h4>
          <div className="flex flex-wrap gap-2">
            {citedSections.map((section, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full border border-primary border-opacity-30 bg-primary bg-opacity-10 text-xs font-medium text-primary"
              >
                § {section}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
