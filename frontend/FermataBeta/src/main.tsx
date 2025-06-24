import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 1. Finds the div with id="root" in index.html
// 2. createRoot creates a React DOM tree (Tree of react components, compares changes from old and new DOM, and updates only the parts of the real DOM)
// 3. Render the App component into the root div
createRoot(document.getElementById('root')!).render(
  // StrictMode enables additional checks and warnings during development (for clean coding) 
  <StrictMode>
    <App />
  </StrictMode>,
)
