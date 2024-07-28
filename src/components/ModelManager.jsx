import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { nanoid } from 'nanoid';
import { PlayArrow, Pause, Delete, Edit, FileCopy, Add, FilterList, Search , ExpandMore, History, Notifications, Tune , CloudDownload, Close} from '@mui/icons-material';
import { useImmer } from 'use-immer';
import { paramPresets } from '../utils/presets';
import { Popover, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, AccordionDetails, Tab, Tabs, Switch, LinearProgress, Slider, Checkbox, FormControlLabel} from '@mui/material';
import { getUnitForParam, ParameterItem } from './FittingPanel';
import { AllDefaultParams } from '../utils/presets';
import DeleteMenuItemWithDialog from './DeleteMenuItemWithDialog';
import { format } from 'date-fns';
import EditableText from './EditableText';
import { metrics, metricCategories, Time } from '../utils/metrics';

const ModelManager = ({ view, updateView, removeView, patients, engine, setPatients,caseData, isOwner, isEdit }) => {
  const t = useTranslation();
  const [showOnlyRunning, setShowOnlyRunning] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [selectedBaseModel, setSelectedBaseModel] = useState('Normal');

  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorSettingsEl, setAnchorSettingsEl] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [targetMetrics, setTargetMetrics] = useState([
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
  const [targetParams, setTargetParams] = useState({});
  const [loading, setLoading] = useState(false);


  const [fittingHistory, setFittingHistory] = useState([]);

  const [showHistory, setShowHistory] = useState(false);
  const [showNewModelDialog, setShowNewModelDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [contentHeight, setContentHeight] = useState({});
  const contentRef = useRef({});

  const [exportOptions, setExportOptions] = useState({
    duration: 10,
    selectedMetrics: [],
  });

  const [exportingModelId, setExportingModelId] = useState(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processType, setProcessType] = useState(null);
  const [processProgress, setProcessProgress] = useState(0);
  


  const handleAccordionToggle = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const toggleCategory = (category) => {
    setExpandedCategory(prev => prev === category ? null : category);
  };

  const updateTargetParmas = (model) => {
    if (model) {
      const modelParams = model.getHdps();
      setTargetParams(AllDefaultParams.reduce((acc, param) => {
        if (!['Qvs_initial', 'HR', 'Ravs', 'Ravr', 'Rmvr', 'Rmvs', 'Rpvr', 'Rpvs', 'Rtvr', 'Rtvs', 'Rda', 'Cda'].includes(param.name)) {
          acc[param.name] = { value: modelParams[param.name], range: param.range, fitting: param.name === 'Qvs_initial' };
        }
        return acc;
      }, {}));
    } else {
      setTargetParams(AllDefaultParams.reduce((acc, param) => {
        if (!['Qvs_initial', 'HR', 'Ravs', 'Ravr', 'Rmvr', 'Rmvs', 'Rpvr', 'Rpvs', 'Rtvr', 'Rtvs', 'Rda', 'Cda'].includes(param.name)) {
          acc[param.name] = { value: param.default, range: param.range, fitting: param.fitting };
        }
        return acc;
      }, {}));
    }
  };


  const updatePatientParameters = (patientId, updatedParameters) => {
    setPatients((prevPatients) =>
      prevPatients.map((patient) =>
        patient.id === patientId
          ? { ...patient, parameters: { ...patient.parameters, ...updatedParameters } }
          : patient
      )
    );
  };  


  const handleStatusChange = useCallback((id, isPlaying) => {
    engine.setIsModelPlaying(id)(isPlaying);
    setPatients(prev => prev.map(patient => 
      patient.id === id ? { ...patient, isPlaying } : patient
    ));
  }, [engine, setPatients]);

  const handleSpeedChange = useCallback((id, speed) => {
    engine.setSpeed(id)(speed);
    setPatients(prev => prev.map(patient => 
      patient.id === id ? { ...patient, speed } : patient
    ));
  }, [engine, setPatients]);

  const handleDeleteModel = useCallback((id) => {
    engine.deleteModel(id);
    setPatients(patients.filter(patient => patient.id !== id));
  }, [engine, setPatients]);


  const createModelFromPreset = useCallback(() => {
    const newModel = {
      id: nanoid(),
      ...paramPresets[selectedBaseModel],
      name: newModelName || `New Model (${paramPresets[selectedBaseModel].name})`,
    };
    engine.register(newModel);
    setPatients(draft=>{draft.push({...newModel,uid:caseData.userId,  canvasId: caseData.canvasId , ...engine.getPatient(newModel.id)})})
  }, [newModelName, selectedBaseModel, engine, setPatients]);

  const handleDuplicateModel = useCallback((id) => {
    const tmpPlaying = engine.isPlaying;
    engine.setIsPlaying(false);
    const originalModel = patients.find(patient => patient.id === id);
    if (originalModel) {
      const newModel = {
        id: nanoid(),
        name: `${originalModel.name} (Copy)`,
        initialHdps: JSON.parse(JSON.stringify(originalModel.getHdps())),
        initialData: JSON.parse(JSON.stringify(originalModel.getDataSnapshot())),
        initialTime: JSON.parse(JSON.stringify(originalModel.getTimeSnapshot())),
      };
      engine.register(newModel);
      setPatients(draft => { draft.push({ ...newModel, uid: caseData.userId, canvasId: caseData.canvasId, ...engine.getPatient(newModel.id) }) });
      engine.setIsPlaying(tmpPlaying);
    }
  }, [patients, engine, setPatients, caseData.userId, caseData.canvasId]);

  const filteredPatients = patients.filter(patient => !showOnlyRunning || patient.isPlaying);
  const runningModels = patients.filter(patient => patient.isPlaying);

  const handleModelNameChange = (patientId, newName) => {
    setPatients(draft => {
      const patient = draft.find(p => p.id === patientId);
      if (patient) {
        patient.name = newName;
      }
    });
    setIsEditing(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPatient(null);
    setIsEditing(false);
  };

  const createFromFittingResult = (result, targetModel=null) => {

    const updatedParameters = Object.entries(result.parameters).reduce((acc, [key, value]) => {
      if (!['Ravs', 'Ravr', 'Rmvr', 'Rmvs', 'Rpvr', 'Rpvs', 'Rtvr', 'Rtvs', 'Rda', 'Cda'].includes(key)) {
        acc[key] = value.value;
      }
      return acc;
    }, {});
    updatedParameters['Volume'] = targetModel?  updatedParameters['Qvs_initial'] + 1233.01570263 :  updatedParameters['Qvs_initial'] + 1370.8;
    delete updatedParameters['Qvs_initial'];
    updatedParameters["HR"] = result.targetMetrics.find(m => m.name === 'HR').value;

    if (targetModel) {
      Object.entries(updatedParameters).forEach(([key, value]) => {
        targetModel.setHdps(key, value);
      });
    } else {
      const newModel = {
        id: nanoid(),
        ...paramPresets["Normal"],
        name: `${newModelName || 'Optimized New Model'}`,
      }
      engine.register(newModel);
      const registerdNewModel = engine.getPatient(newModel.id)
      setPatients(draft => { draft.push({ ...newModel, uid: caseData.userId, canvasId: caseData.canvasId, ...engine.getPatient(newModel.id) }) });
      Object.entries(updatedParameters).forEach(([key, value]) => {
        registerdNewModel.setHdps(key, value);
      });
    }
  
  };

  const handleMetricChange = (index, value) => {
    const newMetrics = targetMetrics.map((metric, i) => 
      i === index ? { ...metric, value: parseFloat(value) } : metric
    );
    setTargetMetrics(newMetrics);
  };

  const convertCategoryKey = (category, key) => {
    return (category === 'pulmonaryCirculation' || category === 'systemicCirculation') ? key : `${category}_${key}`;
  }

  const handleParamChange = (param, field, value) => {
    const newParamUpdates = {
      ...targetParams,
      [param]: {
        ...targetParams[param],
        [field]: field === 'fitting' ? value : parseFloat(value)
      }
    };
    setTargetParams(newParamUpdates);
  };

  const handleFitting = async () => {
    setIsProcessing(true);
    setProcessType('optimize');
    setProcessProgress(0);

    const updateProgress = () => {
      setProcessProgress(prev => Math.min(prev + 1, 99));
    };

    const progressInterval = setInterval(updateProgress, 370);


    const apiInput = {
      target_metrics: targetMetrics.map(m => [m.value, m.name, 1.0]),
      param_updates: Object.entries(targetParams).reduce((acc, [key, value]) => {
        if (key !== 'HR') {
          acc[key] = [value.fitting ? null : value.value, value.fitting ? value.range : null, value.fitting];
        }
        return acc;
      }, {}),
      num_repeats: 1
    };

    apiInput.param_updates['Qvs_initial'] = [749.9842973712131, [200.0, 6000.0], true];
    apiInput.param_updates['HR'] = [targetMetrics.find(m => m.name === 'HR').value, null, false];
    
    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiInput),
      });
      const data = await response.json();

      const newHistoryItem = {
        date: new Date().toISOString(),
        fitness: data.best_fitness,
        targetMetrics: targetMetrics,
        parameters: data.best_parameters.parameters
      };
      const newHistory = [newHistoryItem, ...fittingHistory];
      setFittingHistory(newHistory);
      setShowHistory(true); 
    } catch (error) {
      console.error('Error during fitting:', error);
    } finally {
      clearInterval(progressInterval);
      setProcessProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessType(null);
        setProcessProgress(0);
      }, 500);
    }
  };  


  const handleNewModelDialogClose = () => {
    setShowNewModelDialog(false); 
    updateTargetParmas(null); 
    setNewModelName(''); 
    setSelectedBaseModel('Normal');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOptimizeModel = (patient) => {
    console.log(targetParams);
    console.log(patient.getHdps());
    updateTargetParmas(patient);
    console.log(targetParams)
    setTabValue(1);
    setShowNewModelDialog(true);
    setAnchorEl(null);
  };

  // 以下、Export用

  const handleExportOpen = (patientId) => {
    setExportingModelId(patientId);
    setShowExportDialog(true);
  };

  const handleExportClose = () => {
    setShowExportDialog(false);
    setExportingModelId(null);
  };

  const handleExportOptionChange = (option, value) => {
    if (option === 'selectedMetrics') {
      setExportOptions(prev => ({
        ...prev,
        selectedMetrics: prev.selectedMetrics.includes(value)
          ? prev.selectedMetrics.filter(m => m !== value)
          : [...prev.selectedMetrics, value]
      }));
    } else {
      setExportOptions(prev => ({ ...prev, [option]: value }));
    }
  };

  const startExport = async () => {
    setIsProcessing(true);
    setProcessType('export');
    setProcessProgress(0);
    handleExportClose();
  
    const model = patients.find(p => p.id === exportingModelId);
    if (!model) return;
  
    const metricsInstances = {
      t: new Time(),
    };
    exportOptions.selectedMetrics.forEach(metricName => {
      if (metrics[metricName]) {
        metricsInstances[metricName] = new metrics[metricName]();
      }
    });
  
    const subscriptionId = nanoid();
    let unsubscribeId;
    const startTime = Date.now();
    let lastUpdateTime = startTime;
    const updateInterval = 100; // ミリ秒単位でのプログレス更新間隔
    const samplingInterval = exportOptions.samplingInterval || 1000; // サンプリング間隔
  
    const recordedData = {
      t: [],
      ...Object.fromEntries(exportOptions.selectedMetrics.map(metricName => [metricName, []]))
    };
  
    const exportPromise = new Promise((resolve, reject) => {
      const updateProgress = () => {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - startTime) / 1000;
        const progress = Math.min((elapsedTime / exportOptions.duration) * 100, 99);
        setProcessProgress(progress);
  
        if (elapsedTime >= exportOptions.duration) {
          resolve();
        } else {
          setTimeout(updateProgress, updateInterval);
        }
      };
  
      updateProgress();
  
      unsubscribeId = model.subscribe((newData, time, hdprops) => {
        metricsInstances.t.update(newData, time, hdprops);
        Object.values(metricsInstances).forEach(instance => {
          instance.update(newData, time, hdprops);
        });
  
        const currentTime = Date.now();
        if (currentTime - lastUpdateTime >= samplingInterval) {
          lastUpdateTime = currentTime;
          recordedData.t.push(time);
          exportOptions.selectedMetrics.forEach(metricName => {
            recordedData[metricName].push(metricsInstances[metricName].getMetric());
          });
          const elapsedTime = (currentTime - startTime) / 1000;
          const progress = Math.min((elapsedTime / exportOptions.duration) * 100, 99);
          setProcessProgress(progress);
        }
      }, subscriptionId);
    });
  
    try {
      await exportPromise;
      const csvContent = generateCSV(recordedData, exportOptions);
      downloadCSV(csvContent, `${model.name}_export.csv`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      if (unsubscribeId) {
        model.unsubscribe(unsubscribeId);
      }
      setProcessProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessType(null);
        setProcessProgress(0);
      }, 500);
    }
  };
  
  const generateCSV = (recordedData, options) => {
    const headers = ['Time', ...options.selectedMetrics];
    let csvContent = headers.join(',') + '\n';
  
    const timePoints = recordedData.t.length;
  
    for (let i = 0; i < timePoints; i++) {
      const row = [recordedData.t[i]];
      options.selectedMetrics.forEach(metricName => {
        const value = recordedData[metricName][i];
        row.push(value);
      });
      csvContent += row.join(',') + '\n';
    }
  
    return csvContent;
  };

  const downloadCSV = (content, fileName) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };



  useEffect(() => {
    if (expandedCategory) {
      const updateHeight = () => {
        if (contentRef.current[expandedCategory]) {
          setContentHeight(prev => ({
            ...prev,
            [expandedCategory]: contentRef.current[expandedCategory].scrollHeight
          }));
        }
      };

      updateHeight();
      window.addEventListener('resize', updateHeight);

      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [expandedCategory]);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-white rounded-lg shadow">
      <div className="flex items-center p-2 pb-1 pl-4 border-solid border-0 border-b border-b-slate-200 relative">
        <div className="draggable cursor-move font-bold flex-grow text-base md:text-lg pl-1 whitespace-nowrap overflow-x-auto">
          {t['Models']}
        </div>
        <div
          className="p-1 px-3 -my-2 flex items-center cursor-pointer text-slate-600 hover:text-lightBlue-500 transition"
          onClick={(e) => {
            setAnchorSettingsEl(e.currentTarget);
          }}
        >
          <svg
            className="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
            />
          </svg>
        </div>
      </div>
      <div className="flex justify-between items-center p-4 py-2 bg-gray-50">
        <div className="flex items-center space-x-1">
          <Switch
            checked={showOnlyRunning}
            onChange={(e) => setShowOnlyRunning(e.target.checked)}
            color="primary"
            size="small"
          />
          <span className="text-sm text-gray-500">only show running</span>
        </div>
        <div className="flex items-center space-x-2">
          {fittingHistory.length > 0 && (
            <button
              className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline md:ml-1">Fitting History</span>
            </button>
          )}
          <button
            className={`flex items-center px-3 py-1 rounded-md transition-colors ${
              isProcessing 
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-sky-700'
            }`}
            onClick={() => {
              if (!isProcessing) {
                updateTargetParmas(null);
                setShowNewModelDialog(true);
              }
            }}
            disabled={isProcessing && processType === "optimize"}
          >
            {isProcessing && processType === "optimize" ? (
              <>
                <span className="animate-pulse">Fitting...</span>
              </>
            ) : (
              <>
                <Add className="w-4 h-4" />
                <span className="hidden md:inline md:ml-1">New Model</span>
              </>
            )}
          </button>
        </div>
      </div>
      {/* プログレスバーと警告メッセージ */}
      {isProcessing && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
            {processType === 'optimize' ? 'Optimizing...' : 'Exporting...'} Don't close the window.
          </div>
          <div className="w-full bg-gray-200 h-2">
            <div
              className="bg-blue-600 h-2 transition-all duration-300 ease-in-out"
              style={{ width: `${processProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      <div className="flex-grow overflow-y-auto">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className="p-4 border-b border-gray-200 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{patient.name}</span>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    patient.isPlaying
                      ? 'text-green-800 bg-green-100'
                      : 'text-gray-800 bg-gray-100'
                  }`}
                >
                  {patient.isPlaying ? t['Running'] : t['Stopped']}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    handleStatusChange(patient.id, !patient.isPlaying)
                  }
                >
                  {patient.isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <PlayArrow className="w-5 h-5" />
                  )}
                </button>
                <select
                  className=" cursor-pointer font-bold text-slate-500 hover:text-blue-600 appearance-none bg-transparent border-none px-0 py-2 mr-0 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-0 text-center"
                  value={patient.speed}
                  onChange={(e) =>
                    handleSpeedChange(patient.id, parseFloat(e.target.value))
                  }
                >
                  {[0.25, 0.5, 1, 2, 5].map((speed) => (
                    <option key={speed} value={speed} className="text-center">
                      x{speed}
                    </option>
                  ))}
                </select>
                <button
                  className="p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-gray-100 transition-colors focus-visible:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPatient(patient);
                    setAnchorEl(e.currentTarget);
                  }}
                >
                  <svg
                    className="w-6 h-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                    />
                  </svg>
                </button>
                <Popover
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  onClose={() => setAnchorEl(null)}
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
                  slotProps={{ paper: { sx: { background: 'transparent' } } }}
                >
                  <div className="flex flex-col items-center justify-center py-2 bg-white border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0">
                    <button
                      className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDialogOpen(true);
                        setAnchorEl(null);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-3" />
                      {t['View Details']}
                    </button>
                    <button
                      className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptimizeModel(selectedPatient);
                      }}
                      disabled={isProcessing}
                    >
                      <Tune className="w-4 h-4 mr-3" />
                      {t['Optimize']}
                    </button>
                    <button
                      className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateModel(patient.id);
                        setAnchorEl(null);
                      }}
                    >
                      <FileCopy className="w-4 h-4 mr-3" />
                      {t['Duplicate']}
                    </button>
                    <button
                      className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportOpen(patient.id);
                        setAnchorEl(null);
                      }}
                    >
                      <CloudDownload className="w-4 h-4 mr-3" />
                      {t['Export']}
                    </button>            
                  </div>
                </Popover>
                <button
                  className="p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                  onClick={() => handleDeleteModel(patient.id)}
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ExportDialog
        open={showExportDialog}
        onClose={handleExportClose}
        exportOptions={exportOptions}
        handleExportOptionChange={handleExportOptionChange}
        startExport={startExport}
        isExporting={isProcessing}
      />
      {selectedPatient && (
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          className="rounded-lg"
        >
          <DialogTitle className="flex items-center justify-between">
            <div className="w-full group flex flex-row items-center justify-start">
              {isEditing ? (
                <EditableText
                  value={patients.find(p => p.id === selectedPatient.id)?.name}
                  updateValue={(newName) =>
                    handleModelNameChange(selectedPatient.id, newName)
                  }
                  className="pointer-events-auto w-full flex-grow appearance-none px-2 py-1 text-lg font-semibold border-none bg-slate-100 focus:outline-none focus:border-none"
                  autoFocus
                  onBlur={() => setIsEditing(false)}
                />
              ) : (
                <>
                  <span className="text-xl font-bold">
                    {patients.find(p => p.id === selectedPatient.id)?.name}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-2 p-1 text-gray-500 hover:text-blue-500 focus:outline-none"
                  >
                    <Edit fontSize="small" className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </DialogTitle>
          <DialogContent>
            <ParameterDetails
              parameters={getParametersFromModel(selectedPatient)}
            />
          </DialogContent>
          <DialogActions>
            <button
              onClick={handleCloseDialog}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog
        open={showNewModelDialog}
        onClose={handleNewModelDialogClose}
        sx={{ '.MuiDialog-paper': { m: 0, minHeight: '80vh' } }}
        maxWidth="md"
        fullWidth
      >
        <div className="sticky top-0 md:min-w-[460px] bg-white border-solid border-0 border-b border-slate-200 w-full p-2 pb-0 pl-4 flex flex-row items-center justify-center">
          <div className="text-base font-bold text-center inline-flex items-center">
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={t['Preset']} />
              <Tab label={t['Optimize']} />
            </Tabs>
          </div>
          <div className="md:w-60 flex-grow" />
          <button
            onClick={handleNewModelDialogClose}
            type="button"
            className="bg-white cursor-pointer rounded-full pr-2 py-1 border-none inline-flex items-center justify-center "
          >
            <svg
              className="stroke-slate-600 w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <DialogContent>
          <div className="h-full overflow-y-auto">
            {tabValue === 0 && (
              <div className="md:p-6 md:pt-2">
                <h2 className="text-xl font-bold mb-4">
                  Create Model from Preset
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      className="w-full flex-grow appearance-none px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Presets
                    </label>
                    <select
                      value={selectedBaseModel}
                      onChange={(e) => setSelectedBaseModel(e.target.value)}
                      className="w-full flex-grow appearance-none px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(paramPresets).map((preset) => (
                        <option key={preset} value={preset}>
                          {preset}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            {tabValue === 1 && (
              <div className="md:p-6 md:pt-2">
                <h2 className="text-xl font-bold mb-4">
                  {selectedPatient ? `Optimze from ${selectedPatient.name}` : 'Optimze'}
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Target Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {targetMetrics.map((metric, index) => (
                        <div
                          key={metric.name}
                          className="bg-white rounded-md shadow-sm py-1 md:p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                              {t[metric.name]}
                            </div>
                            <div className="ml-2 group w-36 flex flex-row items-center justify-center rounded-md bg-slate-100 outline outline-slate-200 hover:outline-blue-500 focus-within:outline-blue-500 pointer-events-none">
                              <input
                                type="number"
                                value={metric.value}
                                onChange={(e) =>
                                  handleMetricChange(index, e.target.value)
                                }
                                className=" pointer-events-auto w-full flex-grow text-right appearance-none px-2 py-1 text-sm border-none bg-slate-100 focus:outline-none focus:border-none"
                                step={getStepForMetric(metric.name)}
                              />
                              <div className="mr-1 text-xs text-slate-500 pointer-events-none md:whitespace-nowrap">
                                {metric.unit}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Target Parameters
                    </h3>
                    {Object.entries(categorizeParameters(targetParams)).map(
                      ([category, params]) =>
                        category !== 'basic' && (
                          <div key={category} className="mb-2">
                            <button
                              className="w-full flex justify-between items-center py-2 px-4 bg-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={() => handleAccordionToggle(category)}
                            >
                              <h5 className="text-sm font-semibold">
                                {sectionLabels[category]}
                              </h5>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                                  expandedCategory === category ? 'transform rotate-180' : ''
                                }`}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                                />
                              </svg>
                            </button>
                            <div 
                              className="overflow-hidden transition-all duration-300 ease-in-out"
                              style={{
                                maxHeight: expandedCategory === category ? `${contentHeight[category]}px` : '0px',
                                opacity: expandedCategory === category ? 1 : 0
                              }}
                            >
                              <div ref={el => contentRef.current[category] = el} data-category={category}>
                                <div className="py-4">
                                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(params).map(
                                      ([key, { value, unit, fitting, range }]) => (
                                        <div
                                          key={key}
                                          className="bg-white rounded-md shadow-sm p-3"
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">
                                              {getLabelForParam(key)}
                                            </span>
                                            <button
                                              onClick={() =>
                                                handleParamChange(
                                                  convertCategoryKey(category, key),
                                                  'fitting',
                                                  !fitting
                                                )
                                              }
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
                                              <div className="w-36 group flex flex-row items-center justify-center rounded-md bg-slate-100 outline outline-slate-200 hover:outline-blue-500 focus-within:outline-blue-500 pointer-events-none">
                                                <input
                                                  type="number"
                                                  value={range[0]}
                                                  onChange={(e) =>
                                                    handleParamChange(
                                                      convertCategoryKey(
                                                        category,
                                                        key
                                                      ),
                                                      'range',
                                                      [
                                                        parseFloat(e.target.value),
                                                        range[1],
                                                      ]
                                                    )
                                                  }
                                                  className="pointer-events-auto w-full flex-grow text-right appearance-none px-2 py-1 text-sm border-none bg-slate-100 focus:outline-none focus:border-none"
                                                  step={getStepForParam(
                                                    convertCategoryKey(
                                                      category,
                                                      key
                                                    )
                                                  )}
                                                />
                                                <div className="mr-1 text-xs text-slate-500 pointer-events-none md:whitespace-nowrap">
                                                  {unit}
                                                </div>
                                              </div>
                                              <span>〜</span>
                                              <div className="w-36 group flex flex-row items-center justify-center rounded-md bg-slate-100 outline outline-slate-200 hover:outline-blue-500 focus-within:outline-blue-500 pointer-events-none">
                                                <input
                                                  type="number"
                                                  value={range[1]}
                                                  onChange={(e) =>
                                                    handleParamChange(
                                                      convertCategoryKey(
                                                        category,
                                                        key
                                                      ),
                                                      'range',
                                                      [
                                                        range[0],
                                                        parseFloat(e.target.value),
                                                      ]
                                                    )
                                                  }
                                                  className="pointer-events-auto w-full flex-grow text-right appearance-none px-2 py-1 text-sm border-none bg-slate-100 focus:outline-none focus:border-none"
                                                  step={getStepForParam(
                                                    convertCategoryKey(
                                                      category,
                                                      key
                                                    )
                                                  )}
                                                />
                                                <div className="mr-1 text-xs text-slate-500 pointer-events-none md:whitespace-nowrap">
                                                  {unit}
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="w-36 group flex flex-row items-center justify-center rounded-md bg-slate-100 outline outline-slate-200 hover:outline-blue-500 focus-within:outline-blue-500 pointer-events-none">
                                              <input
                                                type="number"
                                                value={value}
                                                onChange={(e) =>
                                                  handleParamChange(
                                                    convertCategoryKey(
                                                      category,
                                                      key
                                                    ),
                                                    'value',
                                                    parseFloat(e.target.value)
                                                  )
                                                }
                                                className="pointer-events-auto w-full flex-grow text-right appearance-none px-2 py-1 text-sm border-none bg-slate-100 focus:outline-none focus:border-none"
                                                step={getStepForParam(
                                                  convertCategoryKey(category, key)
                                                )}
                                              />
                                              <div className="mr-1 text-xs text-slate-500 pointer-events-none md:whitespace-nowrap">
                                                {unit}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={handleNewModelDialogClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (tabValue === 0) {
                createModelFromPreset(selectedBaseModel);
              } else {
                handleFitting();
              }
              handleNewModelDialogClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
          >
            {tabValue === 0 ? t['Create'] : 'Optimize'}
          </button>
        </DialogActions>
      </Dialog>
      <HistoryDialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
        history={fittingHistory}
        createFromFittingResult={createFromFittingResult}
        runningModels={runningModels}
      />
      <Popover
        open={Boolean(anchorSettingsEl)}
        anchorEl={anchorSettingsEl}
        onClose={() => {
          setAnchorSettingsEl(null);
        }}
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
          <DeleteMenuItemWithDialog
            raw
            onDelete={() => {
              removeView();
            }}
            onClose={() => {
              setAnchorSettingsEl(null);
            }}
            message={
              '「' +
              (view?.name || 'Model Manger') +
              '」を削除しようとしています。この操作は戻すことができません。'
            }
          >
            <div className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1  text-red-500 hover:bg-red-500 hover:text-white">
              <svg
                className="w-4 h-4 mr-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              Delete
            </div>
          </DeleteMenuItemWithDialog>
        </div>
      </Popover>
    </div>
  );
};

export default ModelManager;


const getParametersFromModel = (patient) => {
  const hdps = patient?.getHdps() || Object.keys(patient).reduce((acc, key) => {
    acc[key] = patient[key].value;
    return acc;
  }, {})
  const volume =  patient?.getDataSnapshot().reduce((a, b) => a + b, 0) || hdps?.Qvs_initial + 1233.01570263 || hdps?.Volume;
  return { ...hdps, Volume: volume };
};

const getPrametersFromParamsets = (params) => {
  if (!params) {
    return {};
  }
  const newParams ={};
  Object.keys(params).forEach((key) => {
    newParams[key] = params[key].value;
  });
  newParams.Volume =  newParams?.Qvs_initial + 1233.01570263 || newParams?.Volume;
  return newParams;

};

const categorizeParameters = (params) => {
  const categories = {
    basic: {},
    LV: {},
    RV: {},
    LA: {},
    RA: {},
    systemicCirculation: {},
    pulmonaryCirculation: {},
  };

  Object.entries(params).forEach(([key, value]) => {
    const unit = getUnitForParam(key);
    const paramWithUnit = typeof value === 'object' ? { ...value, unit } : {value, unit};

    if (key.startsWith('LV')) {
      categories.LV[key.replace('LV_', '')] = paramWithUnit;
    } else if (key.startsWith('RV')) {
      categories.RV[key.replace('RV_', '')] = paramWithUnit;
    } else if (key.startsWith('LA')) {
      categories.LA[key.replace('LA_', '')] = paramWithUnit;
    } else if (key.startsWith('RA')) {
      categories.RA[key.replace('RA_', '')] = paramWithUnit;
    } else if (['Ras', 'Rvs', 'Ras_prox', 'Rcs', 'Cas', 'Cvs'].includes(key)) {
      categories.systemicCirculation[key] = paramWithUnit;
    } else if (['Rap', 'Rvp', 'Rap_prox', 'Rcp', 'Cap', 'Cvp'].includes(key)) {
      categories.pulmonaryCirculation[key] = paramWithUnit;
    } else if (['Volume', 'HR'].includes(key)) {
      categories.basic[key] = paramWithUnit;
    }
  });

  return categories;
};

const getLabelForParam = (param) => {
  const labels = {
    Rcp: '動脈抵抗',
    Ras: '動脈抵抗',
    Rap: '末梢血管抵抗',
    Rcs: '末梢血管抵抗',
    Rvp: '静脈抵抗',
    Rvs: '静脈抵抗',
    Rap_prox: '近位部抵抗',
    Ras_prox: '近位部抵抗',
    Cap: '動脈コンプライアンス',
    Cas: '動脈コンプライアンス',
    Cvs: '静脈コンプライアンス',
    Cvp: '静脈コンプライアンス',
    Cap_prox: '近位部コンプライアンス',
    Cas_prox: '近位部コンプライアンス',
  };
  return labels[param] || param;
};  

const sectionLabels = {
  basic: '基本',
  LV: '左室',
  RV: '右室',
  LA: '左房',
  RA: '右房',
  systemicCirculation: '体循環',
  pulmonaryCirculation: '肺循環',
};

const ParameterDetails = ({parameters}) => {
  return (
    <div>
      {Object.entries(categorizeParameters(parameters)).map(([category, params]) => (
        <div key={category} className="mb-4">
          <h5 className="text-sm font-semibold mb-2 text-gray-600">{sectionLabels[category]}</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(params).map(([key, { value, unit }]) => (
              <ParameterItem key={key} param={getLabelForParam(key)} value={value} unit={unit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const getStepForParam = (param) => {
  const defaultParam = AllDefaultParams.find(p => p.name === param);
  if (!defaultParam) return 0.1; // デフォルト値が見つからない場合

  const defaultValue = defaultParam.default;
  
  if (defaultValue >= 100) return 1; // 100以上の値は1刻み
  if (defaultValue >= 10) return 0.1; // 10以上100未満の値は0.1刻み
  if (defaultValue >= 1) return 0.01; // 1以上10未満の値は0.01刻み
  if (defaultValue >= 0.1) return 0.001; // 0.1以上1未満の値は0.001刻み
  return 0.0001; // 0.1未満の値は0.0001刻み
};

const getStepForMetric = (metricName) => {
  switch (metricName) {
    case 'stroke_volume':
    case 'systolic_arterial_pressure':
    case 'diastolic_arterial_pressure':
    case 'systolic_pulmonary_arterial_pressure':
    case 'diastolic_pulmonary_arterial_pressure':
    case 'central_venous_pressure':
    case 'pulmonary_capillary_wedge_pressure':
    case 'left_ventricular_ejection_fraction':
      return 0.1;
    case 'HR':
      return 1;
    default:
      return 0.1;
  }
};


const HistoryDialog = ({ open, onClose, history, createFromFittingResult, runningModels }) => {
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [selectedRunningModel, setSelectedRunningModel] = useState(null);
  const t = useTranslation();

  useEffect(() => {
    if (history.length > 0) {
      const latestHistory = history.reduce((latest, item) => {
        return new Date(item.date) > new Date(latest.date) ? item : latest;
      }, history[0]);
      setSelectedHistory(latestHistory);
    }
  }, [history]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ ".MuiDialog-paper": {m:0}}}>
      <div className='sticky top-0 md:min-w-[460px] bg-white border-solid border-0 border-b border-slate-200 w-full p-3 pl-4 flex flex-row items-center justify-center'>
        <div className='text-base font-bold text-center inline-flex items-center'>
          Fitting History 
        </div>
        <div className='md:w-60 flex-grow'/>
        <button onClick={onClose} type="button" className="bg-white cursor-pointer rounded-full pr-2 py-1 border-none inline-flex items-center justify-center ">
          <svg className='stroke-slate-600 w-4 h-4' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <DialogContent className="flex flex-col h-[70vh]">
        <div className="flex flex-grow overflow-hidden">
          <div className="w-1/3 border-r pr-4 overflow-y-auto">
            {history.map((item, index) => (
              <div
                key={index}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  selectedHistory === item ? 'bg-blue-100' : ''
                }`}
                onClick={() => setSelectedHistory(item)}
              >
                <div>{format(new Date(item.date), 'yyyy/MM/dd HH:mm')}</div>
                <div>Fitness: {item.fitness.toFixed(4)}</div>
              </div>
            ))}
          </div>
          <div className="w-2/3 pl-4 overflow-y-auto">
            {selectedHistory && (
              <>
                <div className="mb-4">
                  <h4 className="font-bold mb-2">Target Metrics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedHistory.targetMetrics.map((metric, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm  text-gray-700 flex-grow">{t[metric.name]}:</span>
                        <span className="text-right text-sm text-gray-800">{metric.value} </span>
                        <span className="text-right text-gray-500 text-xs">{metric.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Paramters</h4>
                  <ParameterDetails parameters={getPrametersFromParamsets(selectedHistory.parameters)} />
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
      <DialogActions className="flex justify-between items-center p-4 bg-gray-100">
        <div className="flex items-center">
          <span className="mr-2">Apply to:</span>
          <select
            value={selectedRunningModel?.id || ''}
            onChange={(e) => setSelectedRunningModel(runningModels.find(m => m.id === e.target.value))}
            className="p-2 border rounded"
          >
            <option value="">Select</option>
            {runningModels.map((model) => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-sky-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={() => {createFromFittingResult(selectedHistory, selectedRunningModel); onClose();}}
            disabled={!selectedHistory || !selectedRunningModel}
          >
            Apply to selected model
          </button>
          <button
            className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={() => {createFromFittingResult(selectedHistory); onClose();}}
            disabled={!selectedHistory}
          >
            Create new model
          </button>
        </div>
      </DialogActions>
    </Dialog>
  );
};

const ExportDialog = ({ open, onClose, exportOptions, handleExportOptionChange, startExport, isExporting }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [contentHeight, setContentHeight] = useState({});

  const contentRef = useRef({});

  const toggleCategory = (category) => {
    setExpandedCategory(prev => prev === category ? null : category);
  };

  useEffect(() => {
    if (expandedCategory) {
      const updateHeight = () => {
        if (contentRef.current[expandedCategory]) {
          setContentHeight(prev => ({
            ...prev,
            [expandedCategory]: contentRef.current[expandedCategory].scrollHeight
          }));
        }
      };

      updateHeight();
      window.addEventListener('resize', updateHeight);

      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [expandedCategory]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        style: { minHeight: '80vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
      }}
    >
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
        <h2 className="text-lg font-semibold flex items-center">
          <CloudDownload className="w-5 h-5 mr-2 text-blue-500" />
          エクスポート設定
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <Close className="w-5 h-5" />
        </button>
      </div>

      <DialogContent className="flex-grow overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">記録時間</h3>
          <Slider
            value={exportOptions.duration}
            onChange={(_, value) => handleExportOptionChange('duration', value)}
            min={1}
            max={60}
            step={1}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}秒`}
            className="text-blue-500"
          />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>1秒</span>
            <span>{exportOptions.duration}秒</span>
            <span>60秒</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">エクスポート項目</h3>
          {Object.entries(metricCategories).map(([category, metricList]) => (
            <div key={category} className="mb-2">
              <button
                className="w-full flex justify-between items-center py-2 px-4 bg-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => toggleCategory(category)}
              >
                <h5 className="text-sm font-semibold">{category}</h5>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                    expandedCategory === category ? 'transform rotate-180' : ''
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              <div 
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: expandedCategory === category ? `${contentHeight[category]}px` : '0px',
                  opacity: expandedCategory === category ? 1 : 0
                }}
              >
                <div ref={el => contentRef.current[category] = el} data-category={category}>
                  <div className="py-4"> 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {metricList.map((metric) => (
                        <div key={metric} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`metric-${metric}`}
                            checked={exportOptions.selectedMetrics.includes(metric)}
                            onChange={() => handleExportOptionChange('selectedMetrics', metric)}
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          <label htmlFor={`metric-${metric}`} className="text-sm text-gray-700">
                            {metric}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end space-x-2 z-10">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={startExport}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
        >
          エクスポート開始
        </button>
      </div>
    </Dialog>
  );
};