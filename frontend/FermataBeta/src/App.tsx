// React Component: App
// React components return JSX, which React will turn into HTML and inject into #root

// THIS IS THE HOME PAGE OF FermataBeta
import { useState } from 'react'
import Navbar from './components/Navbar'

function App() {
  return (
    <>
      <Navbar />
    </>
  )
}

export default App
