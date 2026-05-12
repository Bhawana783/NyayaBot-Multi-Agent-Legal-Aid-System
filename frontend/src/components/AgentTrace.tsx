import React from 'react'

interface StepIndicatorProps {
  label: string
  isActive: boolean
  isComplete: boolean
  step: number
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  label,
  isActive,
  isComplete,
  step,
}) => (
  <div className="flex flex-col items-center gap-2 text-center">
    <div
      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold transition-all ${
        isComplete
          ? 'bg-secondary border-secondary text-white'
          : isActive
            ? 'border-processing bg-processing bg-opacity-10 text-processing animate-pulse-subtle'
            : 'border-border-light dark:border-border-dark text-muted'
      }`}
    >
      {isComplete ? '✓' : step}
    </div>
    <span className="text-center text-xs font-medium text-accent-light dark:text-accent-dark">
      {label}
    </span>
  </div>
)

interface AgentTraceProps {
  activeNode: string | null
  completedNodes: string[]
  language?: 'en' | 'hi'
}

const STEP_LABELS = {
  en: {
    intake: 'Analyzing',
    retrieval: 'Finding Laws',
    draft: 'Drafting',
    review: 'Reviewing',
    complete: 'Complete',
  },
  hi: {
    intake: 'विश्लेषण',
    retrieval: 'कानून खोजना',
    draft: 'ड्राफ्ट',
    review: 'समीक्षा',
    complete: 'पूर्ण',
  },
}

export const AgentTrace: React.FC<AgentTraceProps> = ({
  activeNode,
  completedNodes,
  language = 'en',
}) => {
  const steps = ['intake', 'retrieval', 'draft', 'review']
  const labels = STEP_LABELS[language]
  const progress = Math.round(
    (completedNodes.length / (steps.length + 1)) * 100
  )

  return (
    <div className="space-y-4">
      <div className="h-1 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 sm:gap-2 px-1 sm:px-2">
        {steps.map((step, idx) => (
          <div key={step} className="flex justify-center">
            <StepIndicator
              label={labels[step as keyof typeof labels]}
              isActive={activeNode === step}
              isComplete={completedNodes.includes(step)}
              step={idx + 1}
            />
          </div>
        ))}
        <div className="flex justify-center">
          <StepIndicator
            label={labels.complete}
            isActive={false}
            isComplete={completedNodes.length === steps.length}
            step={steps.length + 1}
          />
        </div>
      </div>

      {activeNode && (
        <p className="text-center text-xs font-500 text-processing animate-pulse">
          {language === 'hi' ? '⏳ कृपया प्रतीक्षा करें...' : '⏳ Please wait...'}
        </p>
      )}
    </div>
  )
}
