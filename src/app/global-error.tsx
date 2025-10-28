'use client'

import React from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  console.error('GlobalError:', error)
  return (
    <html>
      <body style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
        <h1>Something went wrong</h1>
        {error?.message && <p>{error.message}</p>}
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}

