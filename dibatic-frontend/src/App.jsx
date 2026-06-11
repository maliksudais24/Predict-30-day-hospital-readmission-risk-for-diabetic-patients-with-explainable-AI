import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink
} from 'react-router-dom'
import { PredictionProvider } from './contexts/PredictionContext'
import Home from './pages/Home'
import Predict from './pages/Predict'
import Interpret from './pages/Interpret'
import './App.css'

function App() {
  return (
    <PredictionProvider>
      <Router>
        <div className="App dark:bg-gray-900 min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/interpret" element={<Interpret />} />
          </Routes>
        </div>
      </Router>
    </PredictionProvider>
  )
}

export default App
