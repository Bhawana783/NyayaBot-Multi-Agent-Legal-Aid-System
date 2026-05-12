import React from 'react'

interface CaseFormProps {
  onSubmit: (problem: string, language: 'en' | 'hi', isUrgent: boolean) => void
  onReset?: () => void
  isLoading: boolean
  language: 'en' | 'hi'
}

const EXAMPLES = {
  en: 'e.g., My landlord is refusing to return my security deposit despite the lease ending...',
  hi: 'उदा., मेरा मकान मालिक लीज खत्म होने के बाद भी मेरा सुरक्षा जमा वापस नहीं कर रहा है...',
}

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

export const CaseForm: React.FC<CaseFormProps> = ({
  onSubmit,
  onReset,
  isLoading,
  language,
}) => {
  const [problem, setProblem] = React.useState('')
  const [isUrgent, setIsUrgent] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const recognitionRef = React.useRef<any>(null)

  React.useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.language = language === 'hi' ? 'hi-IN' : 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setProblem((prev) => (prev ? prev + ' ' + transcript : transcript))
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }
    }
  }, [language])

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.language =
        language === 'hi' ? 'hi-IN' : 'en-US'
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (problem.trim()) {
      onSubmit(problem, language, isUrgent)
    }
  }

  const handleReset = () => {
    setProblem('')
    setIsUrgent(false)
    setIsListening(false)
    recognitionRef.current?.stop?.()
    onReset?.()
  }

  const characterCount = problem.trim().length
  const canSubmit = characterCount >= 10

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="relative rounded-[1.5rem] border border-border-light bg-white/90 p-1 shadow-sm dark:border-border-dark dark:bg-black/20">
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder={EXAMPLES[language]}
          rows={5}
          disabled={isLoading}
          minLength={10}
          className="w-full resize-none rounded-[1.35rem] border-2 border-transparent bg-transparent px-4 py-4 pr-16 text-sm leading-6 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
        />
        <button
          type="button"
          onClick={handleVoiceInput}
          disabled={isLoading}
          className={`absolute bottom-3 right-3 rounded-full p-2 transition-all ${
            isListening
              ? 'bg-red-500 text-white'
              : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
          } disabled:opacity-50`}
          title="Click to start voice input"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M3 9.5A1.5 1.5 0 014.5 8h11A1.5 1.5 0 0117 9.5v2A1.5 1.5 0 0115.5 13h-11A1.5 1.5 0 013 11.5v-2z" />
            <path d="M14 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-light bg-surface-light/80 px-4 py-3 dark:border-border-dark dark:bg-surface-dark/80">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isUrgent}
            onChange={(e) => setIsUrgent(e.target.checked)}
            disabled={isLoading}
            className="h-5 w-5 cursor-pointer rounded border-border-light text-primary focus:ring-primary disabled:opacity-50"
          />
          <span className="text-sm font-medium text-accent-light dark:text-accent-dark">
            {language === 'hi'
              ? 'यह एक आपातकालीन स्थिति है'
              : 'Is this an emergency?'}
          </span>
        </label>
        <span className="text-xs text-muted">
          {language === 'hi'
            ? 'क्रिटिकल मामलों में समीक्षा चरण कम हो सकता है'
            : 'Critical cases move faster through the workflow'}
        </span>
        {isUrgent && (
          <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
            {language === 'hi' ? 'उच्च प्राथमिकता' : 'High Priority'}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading && !problem.trim()}
          className="rounded-2xl border border-border-light bg-surface-light px-4 py-3 text-sm font-semibold text-accent-light transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-border-dark dark:bg-surface-dark dark:text-accent-dark dark:hover:bg-surface-light/10"
        >
          {language === 'hi' ? 'रीसेट करें' : 'Clear / Reset'}
        </button>
        <button
          type="submit"
          disabled={isLoading || !canSubmit}
          className="rounded-2xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? language === 'hi'
              ? 'विश्लेषण जारी है...'
              : 'Analyzing...'
            : language === 'hi'
              ? 'केस का विश्लेषण करें'
              : 'Analyze case'}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <span>
          {language === 'hi'
            ? 'आप पाठ या वॉयस इनपुट का उपयोग कर सकते हैं'
            : 'You can use text or voice input'}
        </span>
        <span>{characterCount} chars</span>
      </div>
    </form>
  )
}
