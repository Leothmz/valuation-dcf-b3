import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<div className="p-8 text-text-base">Home</div>} />
        <Route path="/dcf" element={<div className="p-8 text-text-base">DCF</div>} />
        <Route path="/watchlist" element={<div className="p-8 text-text-base">Watchlist</div>} />
        <Route path="/ranking" element={<div className="p-8 text-text-base">Ranking</div>} />
        <Route path="/analise" element={<div className="p-8 text-text-base">Análise</div>} />
        <Route path="/fiis" element={<div className="p-8 text-text-base">FIIs</div>} />
        <Route path="/analise-fii" element={<div className="p-8 text-text-base">Análise FII</div>} />
      </Routes>
    </Layout>
  )
}
