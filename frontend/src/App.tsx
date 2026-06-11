import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DCFPage } from './pages/DCFPage'
import { WatchlistPage } from './pages/WatchlistPage'
import { RankingPage } from './pages/RankingPage'
import { AnalisePage } from './pages/AnalisePage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<div className="p-8 text-text-base">Home</div>} />
        <Route path="/dcf" element={<DCFPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/analise" element={<AnalisePage />} />
        <Route path="/fiis" element={<div className="p-8 text-text-base">FIIs</div>} />
        <Route path="/analise-fii" element={<div className="p-8 text-text-base">Análise FII</div>} />
      </Routes>
    </Layout>
  )
}
