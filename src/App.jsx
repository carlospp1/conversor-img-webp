import { useState } from 'react'
import { SingleConversion } from './pages/SingleConversion'
import { MultipleConversion } from './pages/MultipleConversion'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('single');

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <nav className="main-nav">
            <div 
              className={`nav-item ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
            >
              Conversión Individual
            </div>
            <div 
              className={`nav-item ${activeTab === 'multiple' ? 'active' : ''}`}
              onClick={() => setActiveTab('multiple')}
            >
              Conversión Múltiple
            </div>
          </nav>
        </div>
      </header>
      
      <main className="main-content">
        {activeTab === 'single' ? <SingleConversion /> : <MultipleConversion />}
      </main>
    </div>
  )
}

export default App
