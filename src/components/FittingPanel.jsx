// src/components/FittingPanel.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { nanoid } from 'nanoid';
import { AllDefaultParams } from '../utils/presets';



const FittingPanel = ({ patients, updatePatientParameters }) => {
  const t = useTranslation();
  const [metrics, setMetrics] = useState([
    { value: 52.5, name: "stroke_volume", weight: 1.0 },
    { value: 10.3, name: "central_venous_pressure", weight: 20.0 },
    { value: 20.7, name: "pulmonary_capillary_wedge_pressure", weight: 4.0 },
    { value: 126.1, name: "systolic_arterial_pressure", weight: 0.8 },
    { value: 69.5, name: "diastolic_arterial_pressure", weight: 1.0 },
    { value: 46.6, name: "systolic_pulmonary_arterial_pressure", weight: 2.0 },
    { value: 21.1, name: "diastolic_pulmonary_arterial_pressure", weight: 2.0 },
    { value: 55.0, name: "left_ventricular_ejection_fraction", weight: 1.0 }
  ]);
  const [paramUpdates, setParamUpdates] = useState(
    AllDefaultParams?.reduce((acc, param) => {
      acc[param.name] = { value: param.default, range: param.range, fitting: param.fitting };
      return acc;
    }, {})
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [openResultDialog, setOpenResultDialog] = useState(false);

  const handleMetricChange = (index, field, value) => {
    setMetrics(prevMetrics => {
      const newMetrics = [...prevMetrics];
      newMetrics[index][field] = value;
      return newMetrics;
    });
  };

  const handleParamChange = (param, field, value) => {
    setParamUpdates(prevParams => ({
      ...prevParams,
      [param]: {
        ...prevParams[param],
        [field]: value
      }
    }));
  };

  const startFitting = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_metrics: metrics.map(m => [m.value, m.name, m.weight]),
          param_updates: Object.fromEntries(
            Object.entries(paramUpdates).map(([key, val]) => [
              key,
              [val.value, val.fitting ? val.range : null, val.fitting]
            ])
          ),
          num_repeats: 1
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      setResult(data);
      setOpenResultDialog(true);
    } catch (error) {
      console.error('Error:', error);
      // エラーメッセージをユーザーに表示する処理をここに追加
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full overflow-hidden bg-white shadow-md rounded-lg">
      <div className="flex items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Fitting Panel</h2>
      </div>
      <div className="p-4 h-[calc(100%-60px)] overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700">Target Metrics</h3>
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="number"
                value={metric.value}
                onChange={(e) => handleMetricChange(index, 'value', parseFloat(e.target.value))}
                className="w-24 p-2 border border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">{t[metric.name]}</span>
              <input
                type="number"
                value={metric.weight}
                onChange={(e) => handleMetricChange(index, 'weight', parseFloat(e.target.value))}
                className="w-16 p-2 border border-gray-300 rounded"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          <h3 className="text-md font-medium text-gray-700">Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(paramUpdates).map(([param, details]) => (
              <div key={param} className="p-4 border border-gray-200 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{param}</span>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={details.fitting}
                      onChange={(e) => handleParamChange(param, 'fitting', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-600">Fitting</span>
                  </label>
                </div>
                {details.fitting ? (
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={details.range[0]}
                      onChange={(e) => handleParamChange(param, 'range', [parseFloat(e.target.value), details.range[1]])}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={details.range[1]}
                      onChange={(e) => handleParamChange(param, 'range', [details.range[0], parseFloat(e.target.value)])}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Max"
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    value={details.value}
                    onChange={(e) => handleParamChange(param, 'value', parseFloat(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Value"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={startFitting}
          disabled={loading}
          className="mt-6 w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Fitting in progress...' : 'Start Fitting'}
        </button>
      </div>
      {openResultDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Fitting Results</h3>
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(result.best_parameters.parameters).map(([key, param]) => (
                <div key={key} className="flex justify-between py-2 border-b">
                  <span>{key}</span>
                  <span>{param.value.toFixed(4)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <select
                onChange={(e) => updatePatientParameters(result.best_parameters.parameters, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4"
              >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  updatePatientParameters(result.best_parameters.parameters);
                  setOpenResultDialog(false);
                }}
                className="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600"
              >
                Apply to Patient
              </button>
            </div>
            <button
              onClick={() => setOpenResultDialog(false)}
              className="mt-4 w-full bg-gray-300 text-gray-800 p-3 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FittingPanel;