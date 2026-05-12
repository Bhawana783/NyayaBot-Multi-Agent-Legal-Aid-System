import React, { useState, useCallback, useEffect } from 'react'
import { Header } from '../components/Header'
import { CaseForm } from '../components/CaseForm'
import { AgentTrace } from '../components/AgentTrace'
import { DraftViewer } from '../components/DraftViewer'
import { Disclaimer } from '../components/Disclaimer'
import {
  analyzeCase,
  fetchDashboard,
  fetchHealth,
  StreamEvent,
  CorpusDashboard,
} from '../lib/stream'

interface DraftOutput {
  case_type: string
  jurisdiction: string
  urgency: string
  language: string
  retrieved_laws: Array<{
    source: string
    section: string | null
    content: string
    relevance_score: number
  }>
  drafted_document: string
  review_notes: string
  cited_sections: string[]
  confidence_score: number
}

export const Home: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'hi'>('en')
  const [isLoading, setIsLoading] = useState(false)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [completedNodes, setCompletedNodes] = useState<string[]>([])
  const [finalOutput, setFinalOutput] = useState<DraftOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<CorpusDashboard | null>(null)
  const [systemStatus, setSystemStatus] = useState<{
    status: 'ok' | 'error'
    qdrant: 'connected' | 'disconnected'
    message?: string | null
  } | null>(null)
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      setIsDashboardLoading(true)

      try {
        const [dashboardData, healthData] = await Promise.all([
          fetchDashboard(),
          fetchHealth(),
        ])

        if (!cancelled) {
          setDashboard(dashboardData)
          setSystemStatus(healthData)
        }
      } catch (loadError) {
        if (!cancelled) {
          setSystemStatus({
            status: 'error',
            qdrant: 'disconnected',
            message:
              loadError instanceof Error
                ? loadError.message
                : 'Unable to load dashboard data',
          })
        }
      } finally {
        if (!cancelled) {
          setIsDashboardLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = useCallback(
    async (problem: string, lang: 'en' | 'hi', urgent: boolean) => {
      setIsLoading(true)
      setActiveNode(null)
      setCompletedNodes([])
      setFinalOutput(null)
      setError(null)

      try {
        const response = await analyzeCase(problem, lang, urgent)

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')

          // Keep last incomplete line in buffer
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6)) as StreamEvent
                handleStreamEvent(event)
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }

        setIsLoading(false)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'An error occurred during case analysis'
        )
        setIsLoading(false)
      }
    },
    []
  )

  const handleStreamEvent = (event: StreamEvent) => {
    if (event.event === 'agent_start') {
      setActiveNode(event.node)
    } else if (event.event === 'agent_done') {
      setCompletedNodes((prev) => [...new Set([...prev, event.node])])
      setActiveNode(null)
    } else if (event.event === 'final') {
      try {
        const output = JSON.parse(event.content) as DraftOutput
        setFinalOutput(output)
      } catch (e) {
        setError('Failed to parse final output')
      }
    } else if (event.event === 'error') {
      setError(event.content)
    }
  }

  const handleReset = () => {
    setActiveNode(null)
    setCompletedNodes([])
    setFinalOutput(null)
    setError(null)
    setIsLoading(false)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background-light text-accent-light dark:bg-background-dark dark:text-accent-dark">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 left-[-8rem] h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-[-6rem] top-20 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-processing/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <Header
          onLanguageChange={setLanguage}
          currentLanguage={language}
          qdrantStatus={systemStatus?.qdrant}
          corpusCount={dashboard?.corpus_count}
        />

        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
            <section className="space-y-12">
              <div className="overflow-hidden rounded-[2rem] border border-border-light/80 bg-surface-light/90 p-8 shadow-[0_24px_80px_rgba(26,35,126,0.12)] backdrop-blur dark:border-border-dark/80 dark:bg-surface-dark/90">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {language === 'hi' ? 'लाइव कानूनी स्रोत' : 'Live legal corpus'}
                  </span>
                  <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                    {systemStatus?.qdrant === 'connected'
                      ? language === 'hi'
                        ? 'डेटा स्टोर जुड़ा है'
                        : 'Vector store connected'
                      : isDashboardLoading
                        ? language === 'hi'
                          ? 'कनेक्शन जाँच रहा है'
                          : 'Checking connection'
                        : language === 'hi'
                          ? 'ऑफ़लाइन मोड'
                          : 'Offline mode'}
                  </span>
                </div>

                <div className="mt-8 space-y-4">
                  <h2 className="font-serif text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-5xl">
                    {language === 'hi'
                      ? 'स्पष्ट, तेज़ कानूनी सहायता'
                      : 'Clear, fast legal guidance'}
                  </h2>
                  <p className="max-w-2xl text-base leading-7 text-muted">
                    {language === 'hi'
                      ? 'आपके कानूनी मामले को वर्गीकृत करें, सटीक स्रोत खोजें, और पेशेवर दस्तावेज़ बनाएं।'
                      : 'Classify your legal matter, retrieve precise sources, and generate professional documentation.'}
                  </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border-light bg-white/80 p-5 dark:border-border-dark dark:bg-black/20">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted font-medium">
                      {language === 'hi' ? 'दस्तावेज़' : 'Documents'}
                    </div>
                    <div className="mt-3 text-3xl font-bold text-accent-light dark:text-accent-dark">
                      {dashboard?.corpus_count ?? '—'}
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      {language === 'hi'
                        ? 'कानूनी ग्रंथ'
                        : 'legal texts'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border-light bg-white/80 p-5 dark:border-border-dark dark:bg-black/20">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted font-medium">
                      {language === 'hi' ? 'विषय' : 'Topics'}
                    </div>
                    <div className="mt-3 text-3xl font-bold text-accent-light dark:text-accent-dark">
                      {dashboard?.top_categories.length ?? '—'}
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      {language === 'hi'
                        ? 'कवरेज'
                        : 'coverage'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border-light bg-white/80 p-5 dark:border-border-dark dark:bg-black/20">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted font-medium">
                      {language === 'hi' ? 'स्थिति' : 'Status'}
                    </div>
                    <div className="mt-3 text-3xl font-bold text-secondary">
                      {systemStatus?.status === 'ok' ? '✓' : '○'}
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      {language === 'hi'
                        ? systemStatus?.status === 'ok' ? 'सक्रिय' : 'सत्यापन'
                        : systemStatus?.status === 'ok' ? 'Active' : 'Checking'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-[2rem] border border-border-light/80 bg-surface-light/90 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-border-dark/80 dark:bg-surface-dark/90">
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl font-bold text-primary">
                    {language === 'hi'
                      ? 'अपनी कानूनी समस्या बताएं'
                      : 'Describe your legal matter'}
                  </h2>
                  <p className="text-sm text-muted">
                    {language === 'hi'
                      ? 'विस्तार से बताएं, बेहतर विश्लेषण पाएं'
                      : 'More detail = better analysis'}
                  </p>
                </div>

                <CaseForm
                  onSubmit={handleSubmit}
                  onReset={handleReset}
                  isLoading={isLoading}
                  language={language}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(dashboard?.featured_sources ?? []).slice(0, 2).map((source) => (
                  <article
                    key={source.file_name}
                    className="rounded-[1.5rem] border border-border-light/80 bg-surface-light/90 p-6 shadow-lg dark:border-border-dark/80 dark:bg-surface-dark/90"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {source.category}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.2em] text-muted font-medium">
                        {language === 'hi' ? 'स्रोत' : 'source'}
                      </span>
                    </div>
                    <h3 className="mt-4 font-serif text-lg font-bold text-primary">
                      {source.title}
                    </h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
                      {source.summary}
                    </p>
                  </article>
                ))}
              </div>

              <div className="space-y-4 rounded-[2rem] border border-border-light/80 bg-surface-light/90 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-border-dark/80 dark:bg-surface-dark/90">
                <h2 className="font-serif text-2xl font-bold text-primary">
                  {language === 'hi'
                    ? 'सरकारी स्रोत'
                    : 'Official sources'}
                </h2>

                <div className="grid gap-3">
                  {(dashboard?.official_sources ?? []).slice(0, 3).map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group rounded-xl border border-border-light bg-white/80 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:border-border-dark dark:bg-black/20"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-primary truncate">
                            {source.title}
                          </div>
                          <div className="mt-0.5 text-xs text-muted truncate">
                            {source.source}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-secondary transition-transform group-hover:translate-x-0.5 flex-shrink-0">
                          →
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              {(isLoading || completedNodes.length > 0) && (
                <div className="rounded-[2rem] border border-border-light/80 bg-surface-light/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-border-dark/80 dark:bg-surface-dark/90">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        {language === 'hi' ? 'वर्कफ़्लो' : 'Workflow'}
                      </div>
                      <div className="mt-1 font-serif text-xl font-bold text-primary">
                        {language === 'hi' ? 'एजेंट प्रगति' : 'Agent progress'}
                      </div>
                    </div>
                    {isLoading && (
                      <span className="rounded-full bg-processing/10 px-3 py-1 text-xs font-semibold text-processing">
                        {language === 'hi' ? 'प्रोसेसिंग' : 'Processing'}
                      </span>
                    )}
                  </div>
                  <AgentTrace
                    activeNode={activeNode}
                    completedNodes={completedNodes}
                    language={language}
                  />
                </div>
              )}

              {error && (
                <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm italic text-red-700 shadow-sm dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
                  {error}
                </div>
              )}

              {finalOutput && (
                <div className="rounded-[2rem] border border-border-light/80 bg-surface-light/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-border-dark/80 dark:bg-surface-dark/90">
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-bold text-primary">
                      {language === 'hi'
                        ? 'आपके केस का विश्लेषण'
                        : 'Your legal analysis'}
                    </h3>
                    <p className="text-sm text-muted">
                      {language === 'hi'
                        ? 'नीचे दिया गया दस्तावेज़ आपके कानूनी मामले का एक व्यापक विश्लेषण है'
                        : 'The draft below combines retrieval, reasoning, and review into a single client-ready output'}
                    </p>
                  </div>

                  <div className="mt-6">
                    <DraftViewer
                      document={finalOutput.drafted_document}
                      citedSections={finalOutput.cited_sections}
                      caseType={finalOutput.case_type}
                      jurisdiction={finalOutput.jurisdiction}
                      urgency={finalOutput.urgency}
                      confidenceScore={finalOutput.confidence_score}
                      language={language}
                    />
                  </div>
                </div>
              )}
            </aside>
          </div>
        </main>

        <Disclaimer language={language} />
      </div>
    </div>
  )
}
