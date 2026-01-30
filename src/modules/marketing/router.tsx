import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages'

interface MarketingRouterProps {
  orgSlug?: string
}

export default function MarketingRouter({ orgSlug }: MarketingRouterProps) {
  return (
    <Routes>
      <Route path="/" element={<LandingPage orgSlug={orgSlug} />} />
    </Routes>
  )
}
