import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AgoraLegalPage from './AgoraLegalPage'
import './agora.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found')

createRoot(container).render(
  <StrictMode>
    <AgoraLegalPage page="terms" />
  </StrictMode>,
)
