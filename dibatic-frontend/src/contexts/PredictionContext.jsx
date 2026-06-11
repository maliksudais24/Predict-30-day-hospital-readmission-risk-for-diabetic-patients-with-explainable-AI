import { createContext, useContext, useState, useCallback } from 'react'

const PredictionContext = createContext()

export const usePrediction = () => {
  const context = useContext(PredictionContext)
  if (!context) {
    throw new Error('usePrediction must be used within PredictionProvider')
  }
  return context
}

export const PredictionProvider = ({ children }) => {
  const [predictionResult, setPredictionResult] = useState(null)
  const [shapExplanation, setShapExplanation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const predictPatient = useCallback(async (patientData) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:8000/predict_single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const result = await response.json()
      setPredictionResult(result)
      
      // Get SHAP explanation
      const shapResponse = await fetch('http://localhost:8000/shap_explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      })

      if (shapResponse.ok) {
        const shapData = await shapResponse.json()
        setShapExplanation(shapData)
      }
      
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearPrediction = useCallback(() => {
    setPredictionResult(null)
    setShapExplanation(null)
    setError(null)
  }, [])

  return (
    <PredictionContext.Provider value={{
      predictionResult,
      shapExplanation,
      loading,
      error,
      predictPatient,
      clearPrediction
    }}>
      {children}
    </PredictionContext.Provider>
  )
}
