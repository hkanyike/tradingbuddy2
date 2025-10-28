'use client'

import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h2>Something went wrong.</h2>
          {this.state.error?.message && <p>{this.state.error.message}</p>}
        </div>
      )
    }
    return this.props.children
  }
}

