import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AuthProvider from './context/AuthContext.jsx'
import { OrderProvider } from './context/OrderContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <OrderProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </OrderProvider>
    </AuthProvider>
  </StrictMode>,
)
