import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-bg-1 text-text-base flex items-center justify-center">
            <h1 className="text-2xl font-bold text-cyan">
              Valuation DCF — B3
            </h1>
          </div>
        }
      />
    </Routes>
  )
}
