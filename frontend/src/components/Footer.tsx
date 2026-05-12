import React from 'react'

export const Footer: React.FC = () => (
  <footer className="px-6 py-4 border-t border-border-light dark:border-border-dark text-xs text-muted text-center bg-surface-light dark:bg-surface-dark">
    <p className="mb-2">
      Built with{' '}
      <span className="text-primary font-medium">LangGraph</span>,{' '}
      <span className="text-secondary font-medium">FastAPI</span>, and{' '}
      <span className="text-primary font-medium">React 18</span>
    </p>
    <p className="text-muted">
      © 2024 NyayaBot. Empowering legal access for all.
    </p>
  </footer>
)
