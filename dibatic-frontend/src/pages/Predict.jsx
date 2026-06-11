import React, { useState, useEffect } from 'react'
import { usePrediction } from '../contexts/PredictionContext'
import { Link, useNavigate } from 'react-router-dom'

const Predict = () => {
  const [formData, setFormData] = useState({
    race: 'Caucasian',
    gender: 'Male',
    age: '[80-90)',
    time_in_hospital: 10,
    num_lab_procedures: 60,
    num_medications: 22,
    number_outpatient: 4,
    number_emergency: 3,
    number_inpatient: 4,
    number_diagnoses: 12,
    change: 'No',
    diabetesMed: 'Yes',
    A1Cresult: '>8',
    max_glu_serum: '>300',
    diag_1: '250.83',  // Diabetes
    diag_2: '428',     // Heart failure (Circulatory)
    diag_3: '786'      // Respiratory symptoms
    // High-risk defaults for testing - high priors, poor control, multiple issues
  })
  const { predictPatient, predictionResult, loading, error } = usePrediction()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await predictPatient(formData)
    navigate('/interpret')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen dark:bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold mb-4">
            ← Back to Home
          </Link>
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-6">
            Patient Prediction
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Enter patient details to get personalized readmission risk assessment
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Form */}
          <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/90 dark:backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50 dark:border dark:border-gray-700/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Race</label>
                  <select name="race" value={formData.race} onChange={handleInputChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent">
                    <option>Caucasian</option>
                    <option>AfricanAmerican</option>
                    <option>Asian</option>
                    <option>Hispanic</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent">
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Age Group</label>
                  <select name="age" value={formData.age} onChange={handleInputChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent">
                    <option>[80-90)</option>
                    <option>[70-80)</option>
                    <option>[60-70)</option>
                    <option>[50-60)</option>
                    <option>[40-50)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Time in Hospital (days)</label>
                  <input type="number" name="time_in_hospital" value={formData.time_in_hospital} onChange={handleInputChange} min="1" max="14" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Number of Lab Procedures</label>
                  <input type="number" name="num_lab_procedures" value={formData.num_lab_procedures} onChange={handleInputChange} min="0" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Number of Medications</label>
                  <input type="number" name="num_medications" value={formData.num_medications} onChange={handleInputChange} min="0" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Outpatient Visits</label>
                  <input type="number" name="number_outpatient" value={formData.number_outpatient} onChange={handleInputChange} min="0" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Emergency Visits</label>
                  <input type="number" name="number_emergency" value={formData.number_emergency} onChange={handleInputChange} min="0" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Inpatient Admissions</label>
                  <input type="number" name="number_inpatient" value={formData.number_inpatient} onChange={handleInputChange} min="0" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Medication Changed</label>
                  <select name="change" value={formData.change} onChange={handleInputChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent">
                    <option>No</option>
                    <option>Ch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Diabetes Medication</label>
                  <select name="diabetesMed" value={formData.diabetesMed} onChange={handleInputChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent">
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>

                {/* New diagnosis inputs for better predictions */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Primary Diagnosis (diag_1)</label>
                  <input type="text" name="diag_1" value={formData.diag_1 || ''} onChange={handleInputChange} placeholder="e.g. 250.83" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Secondary Diagnosis (diag_2)</label>
                  <input type="text" name="diag_2" value={formData.diag_2 || ''} onChange={handleInputChange} placeholder="e.g. 428" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Tertiary Diagnosis (diag_3)</label>
                  <input type="text" name="diag_3" value={formData.diag_3 || ''} onChange={handleInputChange} placeholder="e.g. 786" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 disabled:cursor-not-allowed dark:shadow-emerald-500/25 dark:hover:shadow-emerald-400/40"
              >
                {loading ? 'Analyzing...' : 'Get Prediction & Explanation'}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-2xl">
                <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Preview - Enhanced prediction design */}
          <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/90 dark:backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50 dark:border dark:border-gray-700/50 h-fit">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Prediction Preview</h3>
            <div className="space-y-6">
              {/* Risk Meter */}
              <div className="w-full p-8 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-3xl shadow-xl border border-emerald-200/30 dark:border-emerald-800/50 mb-6">
                <div className="text-xl font-bold mb-4 text-center text-emerald-500 dark:text-emerald-400">Estimated Risk Level</div>
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-24 h-24 bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center shadow-2xl ring-8 ring-emerald-100/50 dark:ring-emerald-900/50">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">HIGH</span>
                  </div>
                  <div className="min-w-[100px] bg-gradient-to-r dark:from-gray-800/50 dark:to-gray-700/50 p-4 rounded-2xl border dark:border-gray-700 shadow-md">
                    <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">68%</div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Chance of Readmission</div>
                  </div>
                </div>
              </div>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center p-6 dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl dark:border dark:border-gray-700/50">
                <div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formData.number_inpatient}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">Inpatient</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formData.number_emergency}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">Emergency</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formData.age}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">Age Group</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formData.num_medications}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">Medications</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Predict

