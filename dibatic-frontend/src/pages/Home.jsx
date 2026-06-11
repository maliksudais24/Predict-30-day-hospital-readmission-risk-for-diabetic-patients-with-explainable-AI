import React from 'react'

const Home = () => {
  return (
    <div className="min-h-screen dark:bg-gradient-to-br from-gray-900 to-slate-900 py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <div className="mb-16">
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-6">
            Diabetic Readmission
          </h1>
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Predictor AI
          </h1>
          <p className="mt-8 text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Advanced ML model with XGBoost stacking and SHAP explainability to predict 30-day hospital readmission risk for diabetic patients.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white/70 backdrop-blur-xl dark:bg-gray-800/80 dark:backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/50 dark:border-gray-700/50">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">85%+ Recall</h3>
            <p className="text-gray-600 dark:text-gray-400">Optimized for catching high-risk patients while minimizing missed readmissions.</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl dark:bg-gray-800/80 dark:backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/50 dark:border-gray-700/50">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Full Explainability</h3>
            <p className="text-gray-600 dark:text-gray-400">SHAP values show exactly which features drive each prediction.</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl dark:bg-gray-800/80 dark:backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/50 dark:border-gray-700/50">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Production Ready</h3>
            <p className="text-gray-600 dark:text-gray-400">FastAPI backend + React frontend. Deploy anywhere.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              How it works
            </h2>
            <div className="space-y-4 text-lg text-gray-600 dark:text-gray-400">
              <p>1. Enter patient data or upload CSV in the Predict page</p>
              <p>2. Get instant readmission risk prediction (0 = safe, 1 = high risk)</p>
              <p>3. Navigate to Interpretability for SHAP feature importance - understand WHY</p>
              <p className="font-semibold text-indigo-600 dark:text-indigo-400 mt-8 text-xl">
                Key features driving predictions: prior admissions, medication changes, diagnosis codes, age
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 dark:from-purple-500/40 dark:to-blue-500/40 backdrop-blur-xl rounded-3xl p-8 border border-white/30 dark:border-white/20 shadow-2xl">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/20 p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-white mb-1">74%</div>
                  <div className="text-white/80 text-sm">Recall</div>
                </div>
                <div className="bg-white/20 p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-white mb-1">0.23</div>
                  <div className="text-white/80 text-sm">F1 Score</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">number_inpatient:</span>
                  <span className="font-bold text-green-300">+0.12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">insulin_steady:</span>
                  <span className="font-bold text-red-300">-0.08</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">age:</span>
                  <span className="font-bold text-orange-300">+0.06</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a href="/predict" className="inline-flex items-center px-12 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Start Predicting
        </a>
      </div>
    </div>
  )
}

export default Home

