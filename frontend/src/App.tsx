import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { DCFPage } from './pages/DCFPage'
import { WatchlistPage } from './pages/WatchlistPage'
import { RankingPage } from './pages/RankingPage'
import { AnalisePage } from './pages/AnalisePage'
import { FIIRankingPage } from './pages/FIIRankingPage'
import { AnaliseFIIPage } from './pages/AnaliseFIIPage'
import { CarteiraPage } from './pages/CarteiraPage'
import { ComparePage } from './pages/ComparePage'
import { SupportPage } from './pages/SupportPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dcf" element={<DCFPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/analise" element={<AnalisePage />} />
        <Route path="/fiis" element={<FIIRankingPage />} />
        <Route path="/analise-fii" element={<AnaliseFIIPage />} />
        <Route path="/carteira" element={<CarteiraPage />} />
        <Route path="/apoiar" element={<SupportPage />} />
      </Routes>
    </Layout>
  )
}
