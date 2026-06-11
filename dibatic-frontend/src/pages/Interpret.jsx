import React from 'react'
import { usePrediction } from '../contexts/PredictionContext'
import { Link } from 'react-router-dom'

const Interpret = () => {
  const { predictionResult, shapExplanation, clearPrediction } = usePrediction()

  if (!predictionResult || !shapExplanation) {
    return (
      <div className="min-h-screen dark:bg-gradient-to-br from-rose-950/80 to-red-950/80 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Link to="/predict" className="inline-flex items-center text-rose-400 hover:text-rose-300 font-semibold mb-8">
            ← Back to Predict
          </Link>
          <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 dark:backdrop-blur-xl rounded-3xl p-16 shadow-2xl border border-white/50 dark:border-gray-700/50">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">No Prediction Data</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Make a prediction first on the Predict page</p>
            <Link to="/predict" className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              Go to Predict
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const riskColor = predictionResult.prediction === 1 ? 'from-red-500 to-rose-600' : 'from-emerald-500 to-teal-600'
  const riskText = predictionResult.prediction === 1 ? 'High Risk' : 'Low Risk'

  return (
    <div className="min-h-screen dark:bg-gradient-to-br from-gray-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Link to="/predict" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold mb-4">
            ← New Prediction
          </Link>
          <button 
            onClick={clearPrediction}
            className="ml-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-medium transition-colors"
          >
            Clear Results
          </button>
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-gray-800 to-slate-700 dark:from-gray-200 dark:to-gray-300 bg-clip-text text-transparent mb-6">
            Explainability Analysis
          </h1>
        </div>

        {/* Prediction Summary */}
        <div className="bg-white/90 backdrop-blur-xl dark:bg-gray-800/90 dark:backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/70 dark:border-gray-700/70 mb-12">
          <div className="text-center mb-12">
            <div className={`inline-flex items-center px-8 py-4 rounded-full text-2xl font-bold shadow-2xl ${
              predictionResult.prediction === 1 
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
            }`}>
              <svg className={`w-8 h-8 mr-3 ${predictionResult.prediction === 1 ? 'text-red-200' : 'text-emerald-200'}`} fill="currentColor" viewBox="0 0 20 20">
                {predictionResult.prediction === 1 ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {riskText}
              <span className="ml-2"> | </span>
              <span className={`font-bold ${predictionResult.prediction === 1 ? 'text-red-200' : 'text-emerald-200'}`}>
                {predictionResult.prediction === 1 ? 'Will Readmit' : 'Will Not Readmit'}
              </span>
              <span className="ml-4 text-lg opacity-90">({(predictionResult.probability*100).toFixed(1)}%)</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Risk Score</h3>
              <div className="text-4xl font-black text-slate-700 dark:text-slate-200">{(predictionResult.probability*100).toFixed(1)}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Probability of readmission less than 30 days</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Decision Threshold</h3>
              <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{(predictionResult.threshold*100).toFixed(1)}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Model cutoff</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">SHAP Base Value</h3>
              <div className="text-4xl font-black text-purple-600 dark:text-purple-400">{shapExplanation.base_value.toFixed(4)}</div>
              <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Average prediction</div>
            </div>
          </div>
        </div>

        {/* SHAP Waterfall */}
        <div className="bg-white/90 backdrop-blur-xl dark:bg-gray-800/90 dark:backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/70 dark:border-gray-700/70 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">Why This Prediction?</h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {shapExplanation.shap_explanation.slice(0, 10).map((item, index) => (
                <div key={index} className={`flex items-center p-4 rounded-xl shadow-sm border-l-4 ${
                  item.impact === 'increased' 
                    ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-400 dark:border-red-600' 
                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-400 dark:border-emerald-600'
                }`}>
                  <div className={`w-3 h-3 rounded-full mr-4 ${
                    item.impact === 'increased' ? 'bg-red-500' : 'bg-emerald-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.feature}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Value: {item.value}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${
                      item.impact === 'increased' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {item.shap_value > 0 ? '+' : ''}{item.shap_value.toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                      {item.impact.toUpperCase()} risk
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Model Performance */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/90 backdrop-blur-xl dark:bg-gray-800/90 dark:backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/70 dark:border-gray-700/70">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Model Performance</h3>
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">74.5%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Recall</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">23%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">F1 Score</div>
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-xl dark:bg-gray-800/90 dark:backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/70 dark:border-gray-700/70">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Next Steps</h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• Review top SHAP features above</li>
              <li>• High risk patients need follow-up care</li>
              <li>• Focus on medication adherence, discharge planning</li>
              <li>• Reassess after treatment changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interpret

