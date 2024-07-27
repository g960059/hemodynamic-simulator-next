import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { AllDefaultParams } from '../utils/presets';
import DeleteMenuItemWithDialog from './DeleteMenuItemWithDialog';
import { nanoid } from 'nanoid';
import { Popover, Dialog, Switch } from '@mui/material';

const FittingPanel = React.memo(({ patients, updatePatientParameters, view, updateView, removeView, isOwner }) => {
  const t = useTranslation();
  const [metrics, setMetrics] = useState(view?.metrics || [
    { value: 52.5, name: "stroke_volume", unit: "ml" },
    { value: 10.3, name: "central_venous_pressure", unit: "mmHg" },
    { value: 20.7, name: "pulmonary_capillary_wedge_pressure", unit: "mmHg" },
    { value: 126.1, name: "systolic_arterial_pressure", unit: "mmHg" },
    { value: 69.5, name: "diastolic_arterial_pressure", unit: "mmHg" },
    { value: 46.6, name: "systolic_pulmonary_arterial_pressure", unit: "mmHg" },
    { value: 21.1, name: "diastolic_pulmonary_arterial_pressure", unit: "mmHg" },
    { value: 55.0, name: "left_ventricular_ejection_fraction", unit: "%" },
    { value: 80.0, name: "HR", unit: "bpm" }
  ]);

  const [paramUpdates, setParamUpdates] = useState(view.paramUpdates || 
    AllDefaultParams.reduce((acc, param) => {
      if (!['Qvs_initial', 'HR', 'Ravs', 'Ravr', 'Rmvr', 'Rmvs', 'Rpvr', 'Rpvs', 'Rtvr', 'Rtvs', 'Rda', 'Cda'].includes(param.name)) {
        acc[param.name] = { value: param.default, range: param.range, fitting: param.fitting };
      }
      return acc;
    }, {})
  );

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef(null);
  const [result, setResult] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [fittingHistory, setFittingHistory] = useState(view.fittingHistory || []);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tempView, setTempView] = useState(null);



  const handleCloseSettings = () => {
    setAnchorEl(null);
  };

  // useEffect(() => {
  //   // viewが変更されたときに、tempViewを更新
  //   if (view) {
  //     setTempView({
  //       ...view,
  //       paramUpdates: view.paramUpdates || {} // paramUpdatesが存在しない場合、空のオブジェクトを設定
  //     });
  //   }
  // }, [view, view.paramUpdates]);


  // useEffect(() => {
  //   setMetrics(view.metrics || []);
  //   setParamUpdates(view.paramUpdates || {});
  //   setFittingHistory(view.fittingHistory || []);
  // }, [view]);

  const handleMetricChange = (index, value) => {
    const newMetrics = metrics.map((metric, i) => 
      i === index ? { ...metric, value: parseFloat(value) } : metric
    );
    setMetrics(newMetrics);
    updateView({ ...view, metrics: newMetrics });
  };

  const handleParamChange = (param, field, value) => {
    const newParamUpdates = {
      ...paramUpdates,
      [param]: {
        ...paramUpdates[param],
        [field]: field === 'fitting' ? value : parseFloat(value)
      }
    };
    setParamUpdates(newParamUpdates);
    updateView({ ...view, paramUpdates: newParamUpdates });
  };

  const handleFittingToggle = (param) => {
    const newParamUpdates = {
      ...paramUpdates,
      [param]: {
        ...paramUpdates[param],
        fitting: !paramUpdates[param].fitting
      }
    };
    setParamUpdates(newParamUpdates);
    updateView({ ...view, paramUpdates: newParamUpdates });
  };

  const applyFittingResult = useCallback(() => {
    if (!selectedPatientId || !result) return;

    const updatedParameters = Object.entries(result.best_parameters.parameters).reduce((acc, [key, value]) => {
      if (!['Ravs', 'Ravr', 'Rmvr', 'Rmvs', 'Rpvr', 'Rpvs', 'Rtvr', 'Rtvs', 'Rda', 'Cda'].includes(key)) {
        acc[key] = value.value;
      }
      return acc;
    }, {});

    if ('Qvs_initial' in updatedParameters) {
      updatedParameters['Volume'] = updatedParameters['Qvs_initial'] + 1233.01570263;
      delete updatedParameters['Qvs_initial'];
    }

    const hrMetric = result?.targetMetrics.find(m => m.name === 'HR');
    if (hrMetric) {
      updatedParameters['HR'] = hrMetric.value;
    }

    updatePatientParameters(selectedPatientId, updatedParameters);
    setOpenResultDialog(false);
    setSelectedPatientId('');
  }, [selectedPatientId, result, updatePatientParameters]);

  const addToFittingHistory = (result) => {
    const newHistoryItem = {
      date: new Date().toISOString(),
      fitness: result.best_fitness,
      targetMetrics: metrics,
      parameters: result.best_parameters.parameters
    };
    const newHistory = [newHistoryItem, ...fittingHistory];
    setFittingHistory(newHistory);
    updateView({ ...view, fittingHistory: newHistory });
  };

  const handleEditDialogOpen = () => {
    // ダイアログを開くときに、viewの深いコピーを作成
    setTempView({
      ...JSON.parse(JSON.stringify(view)),
      metrics: metrics || [],
      paramUpdates: paramUpdates || {}
    });
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setTempView(null);
    setEditDialogOpen(false);
  };

  const handleEditDialogSave = () => {
    if (tempView) {
      setParamUpdates(tempView.paramUpdates);
      updateView(tempView);
    }
    setEditDialogOpen(false);
  };

  const handleTempViewChange = (field, value) => {
    setTempView(prevView => ({
      ...prevView,
      [field]: value
    }));
  };  

  const startFitting = async () => {
    setLoading(true);
    setProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 100));
    }, 370);

    const apiInput = {
      target_metrics: metrics.map(m => [m.value, m.name, 1.0]),
      param_updates: Object.entries(paramUpdates).reduce((acc, [key, value]) => {
        if (key !== 'HR') {
          acc[key] = [value.fitting ? null : value.value, value.fitting ? value.range : null, value.fitting];
        }
        return acc;
      }, {}),
      num_repeats: 1
    };

    apiInput.param_updates['Qvs_initial'] = [749.9842973712131, [200.0, 6000.0], true];
    apiInput.param_updates['HR'] = [metrics.find(m => m.name === 'HR').value, null, false];
    
    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiInput),
      });
      const data = await response.json();
      setResult({...data, targetMetrics: metrics});
      addToFittingHistory(data);
      setOpenResultDialog(true);
    } catch (error) {
      console.error('Error during fitting:', error);
    } finally {
      clearInterval(progressIntervalRef.current);
      setLoading(false);
      setProgress(100);
    }
  };


  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-2 pb-1 pl-4 mb-2 border-solid border-0 border-b border-b-slate-200">
        <div className='draggable cursor-move font-bold text-base md:text-lg pl-1 whitespace-nowrap overflow-x-auto'>{view?.name || "Fitting Panel"}</div>
        <div className='p-1 px-3 -my-2 flex items-center cursor-pointer text-slate-600 hover:text-lightBlue-500 transition' onClick={e => { setAnchorEl(e.currentTarget)}}>
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Target Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric, index) => (
              <div key={metric.name} className="flex items-center">
                <label className="w-2/3 text-sm text-gray-600">{t[metric.name]}:</label>
                <input
                  type="number"
                  value={metric.value}
                  onChange={(e) => handleMetricChange(index, e.target.value)}
                  className="w-1/3 p-1 border rounded text-right"
                />
                <span className="ml-1 text-sm text-gray-500">{metric.unit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={startFitting}
            disabled={loading}
            className={`w-full py-2 px-4 rounded ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold transition duration-300`}
          >
            {loading ? 'Fitting...' : 'Start Fitting'}
          </button>
          {loading && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Fitting History</h3>
          {fittingHistory.length > 0 ? (          
            <div className="space-y-2">
              {fittingHistory.map((item, index) => (
                <div key={index} className="border p-2 rounded">
                  <p className="text-sm text-gray-600">Date: {new Date(item.date).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Fitness: {item.fitness.toFixed(4)}</p>
                  <button
                    onClick={() => {
                      setResult({ best_parameters: { parameters: item.parameters }, best_fitness: item.fitness , targetMetrics: item.targetMetrics});
                      setOpenResultDialog(true);
                    }}
                    className="mt-1 text-sm text-blue-500 hover:text-blue-700"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No fitting history available.</p>
          )}            
        </div>
      </div>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseSettings}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        elevation={0}
        marginThreshold={0}
      >
        <div className="flex flex-col items-center justify-center py-2 bg-white  border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0">
          <div 
            onClick={() => {
              handleEditDialogOpen()
              handleCloseSettings();
            }}
            className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
          >
            <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit Parameters
          </div>          
          <DeleteMenuItemWithDialog raw onDelete={()=>{removeView()}} onClose={handleCloseSettings} message ={"「"+(view?.name || 'Fitting Panel') + "」を削除しようとしています。この操作は戻すことができません。"}>
            <div className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1  text-red-500 hover:bg-red-500 hover:text-white">
              <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>                                
              Delete
            </div>
          </DeleteMenuItemWithDialog>          
        </div>
      </Popover>

      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="md" fullWidth>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Edit Parameters</h2>
          {tempView && (
            <div className="space-y-6">
              {/* Heart Section */}
              <div className="bg-white shadow rounded-lg p-4">
                {['LV', 'RV', 'LA', 'RA'].map(chamber => (
                  <div key={chamber} className="mb-4">
                    <h4 className="text-md font-semibold mb-2 text-gray-600">{t[chamber] || chamber}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['Ees', 'V0', 'alpha', 'beta', 'Tmax', 'tau', 'AV_delay'].map(suffix => {
                        const param = `${chamber}_${suffix}`;
                        return (
                          <ParameterEditItem
                            key={param}
                            param={suffix}
                            data={tempView.paramUpdates[param]||{}}
                            onChange={(field, value) => handleTempViewChange('paramUpdates', {
                              ...tempView.paramUpdates,
                              [param]: { ...(tempView.paramUpdates[param] || {}), [field]: value }
                            })}
                            onFittingToggle={() => handleTempViewChange('paramUpdates', {
                              ...tempView.paramUpdates,
                              [param]: { ...(tempView.paramUpdates[param] || {}), fitting: !(tempView.paramUpdates[param] || {}).fitting }
                            })}
                            unit={getUnitForParam(param)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Systemic Circulation Section */}
              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">体循環</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'Ras', label: '動脈抵抗' },
                    { key: 'Rcs', label: '末梢血管抵抗' },
                    { key: 'Rvs', label: '静脈抵抗' },
                    { key: 'Ras_prox', label: '近位部抵抗' },
                    { key: 'Cas', label: '動脈コンプライアンス' },
                    { key: 'Cvs', label: '静脈コンプライアンス' },
                    { key: 'Cas_prox', label: '近位部コンプライアンス' }
                  ].map(({ key, label }) => (
                    <ParameterEditItem
                      key={key}
                      param={label}
                      data={tempView.paramUpdates[key]}
                      onChange={(field, value) => handleTempViewChange('paramUpdates', {
                        ...tempView.paramUpdates,
                        [key]: { ...(tempView.paramUpdates[key] || {}), [field]: value }
                      })}
                      onFittingToggle={() => handleTempViewChange('paramUpdates', {
                        ...tempView.paramUpdates,
                        [key]: { ...(tempView.paramUpdates[key] || {}), fitting: !(tempView.paramUpdates[key] || {}).fitting }
                      })}
                      unit={getUnitForParam(key)}
                    />
                  ))}
                </div>
              </div>

              {/* Pulmonary Circulation Section */}
              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">肺循環</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'Rcp', label: '動脈抵抗' },
                    { key: 'Rap', label: '末梢血管抵抗' },
                    { key: 'Rvp', label: '静脈抵抗' },
                    { key: 'Rap_prox', label: '近位部抵抗' },
                    { key: 'Cap', label: '動脈コンプライアンス' },
                    { key: 'Cvp', label: '静脈コンプライアンス' },
                    { key: 'Cap_prox', label: '近位部コンプライアンス' }
                  ].map(({ key, label }) => (
                    <ParameterEditItem
                      key={key}
                      param={label}
                      data={tempView.paramUpdates[key]}
                      onChange={(field, value) => handleTempViewChange('paramUpdates', {
                        ...tempView.paramUpdates,
                        [key]: { ...(tempView.paramUpdates[key] || {}), [field]: value }
                      })}
                      onFittingToggle={() => handleTempViewChange('paramUpdates', {
                        ...tempView.paramUpdates,
                        [key]: { ...(tempView.paramUpdates[key] || {}), fitting: !(tempView.paramUpdates[key] || {}).fitting }
                      })}
                      unit={getUnitForParam(key)}
                    />
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={handleEditDialogClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleEditDialogSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Dialog>


      <Dialog open={openResultDialog} onClose={() => setOpenResultDialog(false)} className="rounded-lg">
        <div className="p-6 bg-white rounded-lg max-w-2xl w-full">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Fitting Results</h3>
          <div className="mb-4">
            {/* 基本パラメータセクション */}
            <div className="mb-4">
              <h5 className="text-sm font-semibold mb-1 text-gray-600">基本パラメータ</h5>
              <div className="grid grid-cols-2 gap-2">
                {result && (
                  <>
                    <ParameterItem key="Volume" param="Volume" value={result?.best_parameters.parameters['Qvs_initial']?.value + 1233.01570263} />
                    <ParameterItem key="HR" param="HR" value={result?.best_parameters.parameters['HR']?.value} />
                  </>
                )}
              </div>
            </div>

            {/* 心臓パラメータセクション */}
            <div className="mb-4">
              {result && ['LV', 'RV', 'LA', 'RA'].map(chamber => (
                <div key={chamber} className="mb-4">
                  <h6 className="text-sm font-semibold mb-1 text-gray-600">{t[chamber] || chamber}</h6>
                  <div className="grid grid-cols-2 gap-2">
                    {['Ees', 'V0', 'alpha', 'beta', 'Tmax', 'tau', 'AV_delay'].map(param => {
                      const chamber_param = `${chamber}_${param}`;
                      return result?.best_parameters.parameters[chamber_param] !== undefined ? (
                        <ParameterItem key={chamber_param} param={param} value={result?.best_parameters.parameters[chamber_param]?.value} />
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 体循環セクション */}
            <div className="mb-4">
              <h5 className="text-sm font-semibold mb-1 text-gray-600">体循環</h5>
              <div className="grid grid-cols-2 gap-2">
                {result && [
                  { key: 'Ras', label: '動脈抵抗' },
                  { key: 'Rcs', label: '末梢血管抵抗' },
                  { key: 'Rvs', label: '静脈抵抗' },
                  { key: 'Ras_prox', label: '近位部抵抗' },
                  { key: 'Cas', label: '動脈コンプライアンス' },
                  { key: 'Cvs', label: '静脈コンプライアンス' },
                  { key: 'Cas_prox', label: '近位部コンプライアンス' }
                ].map(({ key, label }) => (
                  <ParameterItem key={key} param={label} unit={key} value={result?.best_parameters.parameters[key]?.value} />
                ))}
              </div>
            </div>

            {/* 肺循環セクション */}
            <div className="mb-4">
              <h5 className="text-sm font-semibold mb-1 text-gray-600">肺循環</h5>
              <div className="grid grid-cols-2 gap-2">
                {result && [
                  { key: 'Rcp', label: '動脈抵抗' },
                  { key: 'Rap', label: '末梢血管抵抗' },
                  { key: 'Rvp', label: '静脈抵抗' },
                  { key: 'Rap_prox', label: '近位部抵抗' },
                  { key: 'Cap', label: '動脈コンプライアンス' },
                  { key: 'Cvp', label: '静脈コンプライアンス' },
                  { key: 'Cap_prox', label: '近位部コンプライアンス' }
                ].map(({ key, label }) => (
                  <ParameterItem key={key} param={label} unit={key} value={result?.best_parameters.parameters[key]?.value} />
                ))}
              </div>
            </div>

          </div>
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2 text-gray-700">Apply to Patient</h4>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setOpenResultDialog(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
            <button
              onClick={applyFittingResult}
              disabled={!selectedPatientId}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                selectedPatientId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Apply to Selected Patient
            </button>
          </div>
        </div>
      </Dialog>
</div>
);
});
export default FittingPanel;


export function getUnitForParam(param) {
  // 容積パラメータ
  if (param.endsWith('V0') || param.includes('volume') || param.includes('Volume')) {
    return 'ml';
  }
  
  // 時間関連パラメータ
  if (param.includes('tau') || param.includes('Tmax') || param.includes('AV_delay')) {
    return 'ms';
  }
  
  // 弾性係数（Elastance）
  if (param.includes('Ees')) {
    return 'mmHg/ml';
  }
  
  // 無次元パラメータ
  if (param.includes('alpha') || param.includes('beta')) {
    return '';
  }
  
  // 心拍数
  if (param === 'HR') {
    return 'bpm';
  }

  
  // 圧力パラメータ
  if (param.startsWith('P') || param.includes('pressure')) {
    return 'mmHg';
  }
  
  // コンプライアンスパラメータ
  if (param.startsWith('C')) {
    return 'ml/mmHg';
  }
  
  // 抵抗パラメータ
  if (param.startsWith('R')) {
    return 'mmHg・ms/ml';
  }
  
  // 容積パラメータ
  if (param.includes('Q') || param.endsWith('_initial')) {
    return 'ml';
  }
  
  // その他のパラメータ（単位が不明な場合）
  return '';
}


export const ParameterItem = ({ param, value, unit }) => {
  const t = useTranslation();
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm  text-gray-700 flex-grow">{t[param] || param}:</span>
      <span className="text-sm text-gray-800">{(Number(value) || 0) < 1 ? (Number(value) || 0)?.toFixed(3) : (Number(value) || 0)?.toFixed(2)}</span>
      <span className="text-xs text-gray-500">{unit || getUnitForParam(param)}</span>
    </div>
)};

const ParameterEditItem = ({ param, data = {}, onChange, onFittingToggle, unit }) => {
  const fitting = data.fitting ?? false; // デフォルト値を false に設定

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{param}</span>
        <button
          onClick={onFittingToggle}
          className={`px-2 py-1 text-xs rounded ${
            fitting
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {fitting ? 'Fitting' : 'Fixed'}
        </button>
      </div>
      {fitting ? (
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={data.range?.[0] ?? ''}
            onChange={(e) => onChange('range', [parseFloat(e.target.value), data.range?.[1] ?? 0])}
            className="w-1/2 p-2 border rounded text-right text-sm"
          />
          <span>-</span>
          <input
            type="number"
            value={data.range?.[1] ?? ''}
            onChange={(e) => onChange('range', [data.range?.[0] ?? 0, parseFloat(e.target.value)])}
            className="w-1/2 p-2 border rounded text-right text-sm"
          />
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={data.value ?? ''}
            onChange={(e) => onChange('value', parseFloat(e.target.value))}
            className="w-full p-2 border rounded text-right text-sm"
          />
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
      )}
    </div>
  );
};