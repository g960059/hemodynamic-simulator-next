import React, { useEffect, useState, useCallback, useRef } from 'react';
import Plot from 'react-plotly.js';
import { metrics } from "../utils/metrics";
import { useTranslation } from '../hooks/useTranslation'
import { LinearProgress,CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, Popover } from '@mui/material';
import DeleteMenuItemWithDialog from './DeleteMenuItemWithDialog'
import { nanoid } from 'nanoid';
import GuytonStarlingPlotDialog from './GuytonStarlingPlotDialog'
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import { XyDataSeries } from "scichart/Charting/Model/XyDataSeries";
import { FastLineRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import { EAutoRange } from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import {LightTheme} from '../styles/chartConstants'
import {NumericLabelProvider} from "scichart/Charting/Visuals/Axis/LabelProvider/NumericLabelProvider";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import { EllipsePointMarker } from "scichart/Charting/Visuals/PointMarkers/EllipsePointMarker";
import { XyScatterRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/XyScatterRenderableSeries";


const clonedModels = {};
const modelsToDelete = new Set();
const relationsCache = {};

const GuytonStarlingPlot = ({ engine, view, updateView, removeView, patients }) => {
  const t = useTranslation();
  const [plotData, setPlotData] = useState([]);
  const [plotMode, setPlotMode] = useState(view.options?.plotMode || '3D'); 
  const sciChartSurfaceRef = useRef();
  const wasmContextRef = useRef();
  const [progress, setProgress] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const calculationRef = useRef({});
  const [itemCalculationStatus, setItemCalculationStatus] = useState({});
  const [isInitialCalculation, setIsInitialCalculation] = useState(true);
  const dataRef = useRef({})
  const fastLineSeriesRef = useRef({})



  const calculateTW_SBV = (hdps, metrics) => {
    const { Cvs, Cas, Cas_prox, Rvs, Rcs, Ras, Cvp, Cap, Cap_prox, Rvp, Rcp, Rap } = hdps;
    const TW = (Cvs + Cas + Cas_prox) * Rvs + (Cas + Cas_prox) * Rcs + Cas_prox * Ras +
    (Cvp + Cap + Cap_prox) * Rvp + (Cap + Cap_prox) * Rcp + Cap_prox * Rap;
    const SBV = TW * (metrics.co / 60 + 
      ((hdps.Cvs + hdps.Cas + hdps.Cas_prox) / TW) * metrics.cvp + 
      ((hdps.Cvp + hdps.Cap + hdps.Cap_prox) / TW) * metrics.pcwp);
    return {TW, SBV};
  };

  const estimateRelations = async (cloneModel, originalVolume, itemId) => {
    const hdps = cloneModel.getHdps();
    const cacheKey = JSON.stringify(hdps) + '_' + Math.round(originalVolume / 5) * 5;
  
    // キャッシュが存在し、かつ有効であれば、キャッシュを返す
    if (relationsCache[cacheKey]) {
      return relationsCache[cacheKey];
    }
  
    const volumes = [originalVolume * 0.9, originalVolume * 0.8, originalVolume * 0.7];

    const lvedps = [cloneModel.metrics.lvedp.getMetric()];
    const rvedps = [cloneModel.metrics.rvedp.getMetric()];
    const pcwps = [cloneModel.metrics.pcwp.getMetric()];
    const cvps = [cloneModel.metrics.cvp.getMetric()];

    for (let i = 0; i < volumes.length; i++) {
      const volume = volumes[i];
      cloneModel.setHdps("Volume", volume);
      await new Promise(resolve => setTimeout(resolve, 2000));

      lvedps[i] = cloneModel.metrics.lvedp.getMetric();
      rvedps[i] = cloneModel.metrics.rvedp.getMetric();
      pcwps[i] = cloneModel.metrics.pcwp.getMetric();
      cvps[i] = cloneModel.metrics.cvp.getMetric();

      setProgress(prev => ({
        ...prev,
        [itemId]: Math.min(prev[itemId] + 10, 99) // Adjust the increment as needed
      }));
    }
    cloneModel.setHdps("Volume", originalVolume);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setProgress(prev => ({
      ...prev,
      [itemId]: Math.min(prev[itemId] + 10, 99) // Adjust the increment as needed
    }));

    const linearFit = (x, y) => {
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return { slope, intercept };
    };

    const lvFit = linearFit(pcwps, lvedps);
    const rvFit = linearFit(cvps, rvedps);

    relationsCache[cacheKey] = { lvFit, rvFit };
    return { lvFit, rvFit };
  };

  const plotFrankStarlingCurves = (hdps, lvFit, rvFit, metrics,item) => {
    const { LV_Ees, LV_alpha, LV_beta, RV_Ees, RV_alpha, RV_beta, HR } = hdps;
    
    const pra_range = Array.from({ length: 301 }, (_, i) => i * 0.1);
    const pla_range = Array.from({ length: 501 }, (_, i) => i * 0.1);
    const lv_z_data = pla_range.map(pla => {
      const LV_Ped = lvFit.slope * pla + lvFit.intercept;
      const LV_SV = LV_Ped + LV_beta > 0 ? LV_Ees / (LV_Ees + metrics.lvea)  / LV_alpha * Math.log((LV_Ped + LV_beta) / LV_beta) : 0;
      const LV_SV_effective = metrics.sv ? LV_SV * (metrics.esv / metrics.sv) : 0;
      return LV_SV_effective > 0 ? LV_SV_effective * HR / 1000 : 0;
    });

    const rv_z_data = pra_range.map(pra => {
      const RV_Ped = rvFit.slope * pra + rvFit.intercept;
      const RV_SV = RV_Ped + RV_beta > 0 ? RV_Ees / (RV_Ees + metrics.rvea)  / RV_alpha  * Math.log((RV_Ped + RV_beta) / RV_beta) : 0;
      const RV_SV_effective = metrics.rvsv ? RV_SV * (metrics.esv / metrics.rvsv) : 0;
      return  RV_SV_effective > 0 ? RV_SV_effective * HR / 1000 : 0;
    });

    let fs_curve_x = []
    let fs_curve_y = []
    let fs_curve_z = []

    for (let i = 0; i < pra_range.length; i++) {
      const s = pra_range[i];
      fs_curve_x.push(s)
      fs_curve_z.push(rv_z_data[i])
      fs_curve_y.push( (LV_beta * (Math.exp((LV_Ees + metrics.lvea)/LV_Ees * LV_alpha * (1000 / HR * rv_z_data[i]) * metrics.sv / metrics.esv) - 1) - lvFit.intercept ) / lvFit.slope)
    }
    const hoverTemplate = 'RAP: %{x:.1f} mmHg<br>LAP: %{y:.1f} mmHg<br>CO: %{z:.2f} L/min<extra></extra>';
    const patientName = patients.find(p => p.id === item.patientId)?.name;
    return [
      {
        x: Array(pla_range.length).fill(0),
        y: pla_range,
        z: lv_z_data,
        type: 'scatter3d',
        mode: 'lines',
        opacity: 0.6,
        line: {
          color: item.color,
          width: 7
        },
        name: `${patientName} LV Frank-Starling`,
        patientId: item.patientId,
        hoverinfo: 'x+y+z',
        hovertemplate: hoverTemplate,
        showlegend: false, 
      },
      {
        x: pra_range,
        y: Array(pra_range.length).fill(0),
        z: rv_z_data,
        type: 'scatter3d',
        mode: 'lines',
        opacity: 0.6,
        line: {
          color: item.color,
          width: 7
        },
        name: `${patientName} RV Frank-Starling`,
        patientId: item.patientId,
        hoverinfo: 'x+y+z',
        hovertemplate: hoverTemplate,
        showlegend: false, 
      },
      {
        z: fs_curve_z,
        x: fs_curve_x,
        y: fs_curve_y,
        type: 'scatter3d',
        mode: 'lines',
        opacity: 0.6,
        line: {
          color: item.color,
          width: 7
        },
        name: `${patientName} Frank-Starling曲線`,
        patientId: item.patientId,
        hoverinfo: 'x+y+z',
        hovertemplate: hoverTemplate,
        showlegend: false, 
      }
    ]
  };

  const plotGuyton3DSurface = (hdps, metrics,item) => {
    const {TW, SBV} = calculateTW_SBV(hdps, metrics);

    const pra_range = Array.from({ length: 301 }, (_, i) => i * 0.1);
    const pla_range = Array.from({ length: 501 }, (_, i) => i * 0.1);

    const z_data = pla_range.map(pla => 
      pra_range.map(pra => {
        const CO = (SBV / TW - ((hdps.Cvs + hdps.Cas + hdps.Cas_prox) / TW) * pra - 
                    ((hdps.Cvp + hdps.Cap + hdps.Cap_prox) / TW) * pla) * 60;
        return CO > 0 ? CO : null;
      })
    );
    const patientName = patients.find(p => p.id === item.patientId)?.name;
    return [
      {
        z: z_data,
        x: pra_range,
        y: pla_range,
        type: 'surface',
        colorscale: [[0, `rgba(${parseInt(item.color.slice(1,3),16)}, ${parseInt(item.color.slice(3,5),16)}, ${parseInt(item.color.slice(5,7),16)}, 0.3)`], [1, `rgba(${parseInt(item.color.slice(1,3),16)}, ${parseInt(item.color.slice(3,5),16)}, ${parseInt(item.color.slice(5,7),16)}, 0.3)`]],
        showscale: false,
        hoverinfo: 'x+y+z',
        name: `${patientName} Guyton Surface`,
        patientId: item.patientId,
        hovertemplate: 'RAP: %{x:.1f} mmHg<br>LAP: %{y:.1f} mmHg<br>CO: %{z:.2f} L/min<extra></extra>',
        showlegend: false, 
      },
      {
        x: [metrics.cvp],
        y: [metrics.pcwp],
        z: [metrics.co],
        mode: 'markers',
        type: 'scatter3d',
        marker: {
          size: 5,
          color: item.color,
          symbol: 'circle'
        },
        name: `${patientName} 現在の状態`,
        patientId: item.patientId,
        hoverinfo: 'x+y+z',
        hovertemplate: 'RAP: %{x:.1f} mmHg<br>LAP: %{y:.1f} mmHg<br>CO: %{z:.2f} L/min<extra></extra>',
        showlegend: false, 
      },
    ]
  };
  
  const calculatePlotData = useCallback(async (item, isInitialCalculation = false) => {
    if(calculationRef.current[item.id]) return;
    calculationRef.current[item.id] = true;

    setItemCalculationStatus(prev => ({ ...prev, [item.id]: 'inProgress' }));
    setProgress(prev => ({ ...prev, [item.id]: 0 }));

    
    const updateProgress = (estimatedTime, currentProgress, finalProgress) => {
      const incrementValue = (finalProgress - currentProgress) / (estimatedTime / 100);
      let progress = currentProgress;
      const interval = setInterval(() => {
        progress = Math.min(progress + incrementValue, finalProgress);
        setProgress(prev => ({
          ...prev,
          [item.id]: Math.min(progress, 99)
        }));
        if (progress >= finalProgress) {
          clearInterval(interval);
        }
      }, 10);
    };

    try {
      deleteMarkedModels();
      const patient = patients.find(p => p.id === item.patientId);
      const originalHdps = patient.getHdps();
      const originalVolume = patient.getDataSnapshot().reduce((sum, v) => sum + v, 0);
      
      let needsUpdate = isInitialCalculation || 
                        !item.hdpsSnapshot || 
                        !item.volumeSnapshot || 
                        !item.lvFit || 
                        !item.rvFit || 
                        !item.metrics || 
                        JSON.stringify(originalHdps) !== JSON.stringify(item.hdpsSnapshot) || 
                        Math.abs(originalVolume - item.volumeSnapshot) > 1;


      let hdps, metrics, lvFit, rvFit;

      if (needsUpdate) {
          updateProgress(2000, 0, Math.round(2/9*100));
          let cloneModel = await createClonedModel(item);
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          hdps = cloneModel.getHdps();
          metrics = {
            co: cloneModel.metrics.co.getMetric(),
            cvp: cloneModel.metrics.cvp.getMetric(),
            pcwp: cloneModel.metrics.pcwp.getMetric(),
            lvedp: cloneModel.metrics.lvedp.getMetric(),
            rvedp: cloneModel.metrics.rvedp.getMetric(),
            lvea: cloneModel.metrics.lvea.getMetric(),
            rvea: cloneModel.metrics.rvea.getMetric(),
            rvsv: cloneModel.metrics.rvsv.getMetric(),
            sv: cloneModel.metrics.sv.getMetric(),
            esv: cloneModel.metrics.esv.getMetric(),
          }
          const cacheKey = JSON.stringify(hdps) + '_' + Math.round(originalVolume / 5) * 5;
          const cachedResult = relationsCache[cacheKey];
          
          
          if (cachedResult) {
            updateProgress(500,  Math.round(2/9*100), Math.round(8/9*100));
            ({ lvFit, rvFit } = cachedResult);
          } else {
            ({ lvFit, rvFit } = await estimateRelations(cloneModel, originalVolume, item.id));
          }

          updateView(draft => {
            const itemIndex = draft.items.findIndex(i => i.id === item.id);
            if (itemIndex !== -1) {
              draft.items[itemIndex] = {
                ...draft.items[itemIndex],
                hdpsSnapshot: {...hdps},
                volumeSnapshot: originalVolume,
                lvFit,
                rvFit,
                metrics
              };
            }
          });   
          markClonedModelForDeletion(item.id, item.patientId);
      }else{
        updateProgress(500, 0, Math.round(8/9*100));
        lvFit = item.lvFit;
        rvFit = item.rvFit;
        metrics = item.metrics;
        hdps = item.hdpsSnapshot;
      }
      if (plotMode === '3D') {
        updateProgress(500, Math.round(8/9*100), 100);
        const guytonSurface = plotGuyton3DSurface(hdps, metrics,item);
        const frankStarlingCurves = plotFrankStarlingCurves(hdps, lvFit, rvFit, metrics,item);

        setPlotData(prev => [
          ...prev.filter(data => data.patientId !== item.patientId),
          ...guytonSurface,
          ...frankStarlingCurves
        ]);
      } else {
        updateProgress(500, Math.round(8/9*100), 100);
        delete2DGuytonStarling(item);
        plot2DGuytonStarling(hdps, metrics, lvFit, rvFit, item);
      }      
      if (isInitialCalculation) {
        setIsInitialCalculation(false);
      }
    } catch (error) {
      console.error("Error in calculatePlotData:", error);
    } finally {
      setItemCalculationStatus(prev => ({ ...prev, [item.id]: 'completed' }));
    }
  }, [patients, engine]);

  const plot2DGuytonStarling = (hdps, metrics, lvFit, rvFit, item) => {
    const { LV_Ees, LV_alpha, LV_beta, RV_Ees, RV_alpha, RV_beta, HR } = hdps;
    
    let xData, guytonData, starlingData;
    if (plotMode === '2D-LV') {
      xData = Array.from({ length: 501 }, (_, i) => i * 0.1); // LAP range
      const TWp = (hdps.Cvp + hdps.Cap + hdps.Cap_prox) * hdps.Rvp + (hdps.Cap + hdps.Cap_prox) * hdps.Rcp + hdps.Cap_prox * hdps.Rap;
      const SBVp = TWp * (metrics.co  / 60) + (hdps.Cvp + hdps.Cap + hdps.Cap_prox) * metrics.pcwp;
      guytonData = xData.map(pla => {
        const co = (SBVp - (hdps.Cvp + hdps.Cap + hdps.Cap_prox) * pla) * 60 / TWp;
        return co > 0 ? co : 0;
      });
      starlingData = xData.map(pla => {
        const LV_Ped = lvFit.slope * pla + lvFit.intercept;
        const LV_SV = LV_Ped > 0 ?  LV_Ees / (LV_Ees + metrics.lvea)  / LV_alpha  * Math.log((LV_Ped + LV_beta) / LV_beta) : 0;
        const LV_SV_effective = LV_SV * (metrics.esv / metrics.sv);
        return LV_SV_effective > 0 ? LV_SV_effective * HR / 1000 : 0;
      });
    } else {
      xData = Array.from({ length: 301 }, (_, i) => i * 0.1); // RAP range
      const TWs = (hdps.Cvs + hdps.Cas + hdps.Cas_prox) * hdps.Rvs + (hdps.Cas + hdps.Cas_prox) * hdps.Rcs + hdps.Cas_prox * hdps.Ras;
      const SBVs = TWs * (metrics.co / 60) + (hdps.Cvs + hdps.Cas + hdps.Cas_prox) * metrics.cvp;
      guytonData = xData.map(pra => {
        const co = (SBVs - (hdps.Cvs + hdps.Cas + hdps.Cas_prox) * pra) * 60  / TWs;
        return co > 0 ? co : 0;
      });
      starlingData = xData.map(pra => {
        const RV_Ped = rvFit.slope * pra + rvFit.intercept;
        const RV_SV = (RV_Ped + RV_beta) > 0 ? RV_Ees / (RV_Ees + metrics.rvea) / RV_alpha  * Math.log((RV_Ped + RV_beta) / RV_beta) : 0;
        const RV_SV_effective = RV_SV * (metrics.esv / metrics.rvsv);
        return RV_SV_effective > 0 ? RV_SV_effective * HR / 1000 : 0;
      });
    }
    if(!dataRef.current[item.id]){
      dataRef.current[item.id] = {
        guytonDataSeries: new XyDataSeries(wasmContextRef.current),
        starlingDataSeries: new XyDataSeries(wasmContextRef.current),
        currentPointDataSeries: new XyDataSeries(wasmContextRef.current),
      }
    }
    const { guytonDataSeries, starlingDataSeries, currentPointDataSeries } = dataRef.current[item.id];

    const guytonLine = new FastLineRenderableSeries(wasmContextRef.current, {
      stroke: item.color,
      strokeThickness: 3,
      dataSeries: guytonDataSeries,
    });

    const starlingLine = new FastLineRenderableSeries(wasmContextRef.current, {
      stroke: item.color,
      strokeThickness: 3,
      dataSeries: starlingDataSeries,
    });

    const currentPoint = new XyScatterRenderableSeries(wasmContextRef.current, {
      pointMarker: new EllipsePointMarker(wasmContextRef.current, {
        width: 8,
        height: 8,
        fill: item.color,
        stroke: item.color,
        strokeThickness: 2,
      }),
      dataSeries: currentPointDataSeries,
    });

    fastLineSeriesRef.current[item.id] = {
      guytonLine,
      starlingLine,
      currentPoint,
    }

    guytonDataSeries.appendRange(xData, guytonData);
    starlingDataSeries.appendRange(xData, starlingData);
    currentPointDataSeries.append(plotMode === '2D-LV' ? metrics.pcwp : metrics.cvp, metrics.co);
    
    sciChartSurfaceRef.current.renderableSeries.add(guytonLine);
    sciChartSurfaceRef.current.renderableSeries.add(starlingLine);
    sciChartSurfaceRef.current.renderableSeries.add(currentPoint);
  };

  const delete2DGuytonStarling = (item) => {
    console.log("delete2DGuytonStarling: ", item.id);
    if(dataRef.current[item.id] === undefined) return;
    const { guytonDataSeries, starlingDataSeries, currentPointDataSeries } = dataRef.current[item.id];
    guytonDataSeries?.delete();
    starlingDataSeries?.delete();
    currentPointDataSeries?.delete();
    delete dataRef.current[item.id];
    const { guytonLine, starlingLine, currentPoint } = fastLineSeriesRef.current[item.id];
    sciChartSurfaceRef.current?.renderableSeries.remove(guytonLine);
    sciChartSurfaceRef.current?.renderableSeries.remove(starlingLine);
    sciChartSurfaceRef.current?.renderableSeries.remove(currentPoint);
    delete fastLineSeriesRef.current[item.id];
  }

  const createClonedModel = async (item) => {
    if (clonedModels[item.id + item.patientId]) {
      return clonedModels[item.id + item.patientId];
    }
    const originalModel = engine.getPatient(item.patientId);
    const clonedModelId = nanoid();
    const clonedModelParams = {
      id: clonedModelId,
      name: `${originalModel.name} for Guyton-Starling`,
      initialHdps: JSON.parse(JSON.stringify(originalModel.getHdps())),
      initialData: JSON.parse(JSON.stringify(originalModel.getDataSnapshot())),
      initialTime: JSON.parse(JSON.stringify(originalModel.getTimeSnapshot())),
    };
    engine.register(clonedModelParams);
    const clonedModel = engine.getPatient(clonedModelId);
    clonedModel.setSpeed(10.0);
    clonedModel.setIsModelPlaying(true);

    clonedModel.metrics = {
      co: new metrics.Co(),
      cvp: new metrics.Cvp(),
      pcwp: new metrics.Pcwp(),
      lvedp: new metrics.Lvedp(),
      rvedp: new metrics.Rvedp(),
      lvea: new metrics.LVEa(),
      rvea: new metrics.RVEa(),
      rvsv: new metrics.RVSV(),
      sv: new metrics.Sv(),
      esv: new metrics.ESV(),
    };

    const subscriptionId = clonedModel.subscribe(update(clonedModel));
    clonedModels[item.id + item.patientId] = clonedModel;
    return clonedModel;
  };

  const markClonedModelForDeletion = useCallback((id, patientId) => {
    console.log("markClonedModelForDeletion: ", id, patientId);
    modelsToDelete.add(id + patientId);
  }, []);

  const deleteMarkedModels = useCallback(() => {
    modelsToDelete.forEach(uid => {
      if (clonedModels[uid]) {
        engine.deleteModel(clonedModels[uid].id);
        console.log("delete clonedModel: ", uid);
        delete clonedModels[uid];
      }
    });
    modelsToDelete.clear();
  }, [engine]);


  const update = useCallback((clonedModel) => (data, time, hdps) => {
    Object.values(clonedModel.metrics).forEach(instance => {
      instance.update(data, time, hdps);
    });
  }, []);

  useEffect(() => {
    const calculateAllPlotData = async () => {
      for (const item of view.items) {
        await calculatePlotData(item, true);
      }
    };

    calculateAllPlotData();

  
    const subscriptionIds = view.items.map(item => {
      return engine.subscribeHdpMutationAll(item.patientId)((id,hdpKey, hdpValue) => {
        delete calculationRef.current[item.id];
        markClonedModelForDeletion(item.id, item.patientId);
        if(hdpKey === "Volume" || hdpKey === "HR"){
          setTimeout(() => {
            calculatePlotData(item);
          }, 1000);
        }else{
          calculatePlotData(item);
        }
      });
    });
    return () => {
      view.items.forEach((item, index) => {
        if (subscriptionIds[index]) {
          engine.unsubscribeHdpMutationAll(item.patientId)(subscriptionIds[index]);
        }
        markClonedModelForDeletion(item.id, item.patientId);
      });
    };
  }, [view.items, engine]);

  const handleAddModel = (patientId) => {
    updateView(draft => {
      draft.items.push({ 
        id: nanoid(), 
        patientId, 
        color: getRandomColor(),
        hdpsSnapshot: null,
        volumeSnapshot: null,
        lvFit: null,
        rvFit: null,
        metrics: null
      });
    });
    setDialogOpen(false);
  };

  const initSciChart = async () => {
    SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY);
    SciChartSurface.configure({
      dataUrl: "/scichart2d.data",
      wasmUrl: "/scichart2d.wasm",
    })
    const { sciChartSurface, wasmContext } = await SciChartSurface.create("scichart-root-guyton-starling-" + view.id);
    sciChartSurfaceRef.current = sciChartSurface;
    wasmContextRef.current = wasmContext;
    sciChartSurface.applyTheme(LightTheme)
    const xAxis = new NumericAxis(wasmContext,
      {
        autoRange: EAutoRange.Always,
        drawMinorTickLines:false,
        drawMajorGridLines: false,
        drawMinorGridLines: false,
        labelProvider: new NumericLabelProvider({
          labelPrecision: 1,
        }) 
      }
    )     
    const yAxis = new NumericAxis(wasmContext,
      {
        axisAlignment: EAxisAlignment.Left,
        autoRange: EAutoRange.Always,
        visibleRangeLimit: new NumberRange(0, 20),
        drawMinorTickLines:false, 
        drawMinorGridLines: false,
        axisBorder: {
          borderRight: 1,
          color: "#e5e5e5"
        },
        growBy: new NumberRange(0.1,0.05),
        labelProvider: new NumericLabelProvider({
          labelPrecision: 1,
        }) 
      }
    );

    sciChartSurface.xAxes.add(xAxis);
    sciChartSurface.yAxes.add(yAxis);
  };
  useEffect(() => {
    (async () => {
      console.log("plotMode: ", plotMode);
      if (plotMode !== '3D' && !sciChartSurfaceRef.current) {
        await initSciChart();
      }
      view.items.forEach(item =>{ 
        delete calculationRef.current[item.id];
        calculatePlotData(item, true);
      });
    })();

    return () => {
      view.items.forEach(item => delete2DGuytonStarling(item));
      if (sciChartSurfaceRef.current) {
        sciChartSurfaceRef.current.delete();
        sciChartSurfaceRef.current = null;
      }
    };
  }, [plotMode, view.items]);

  useEffect(() => {
    const subscriptionId = engine?.subscribeAllHdpMutation((patientId, key, value) => {
      if (key === 'DELETE_MODEL') {
        updateView(draft => {
          draft.items = draft.items.filter(item => item.patientId !== patientId);
        });
        if(view.items.filter(item=>item.patientId !== patientId).length === 0){
          removeView()
        }
      }
    });
    return () => {
      engine?.unsubscribeAllHdpMutation(subscriptionId);
    };
  }, [engine]);

  const maxProgress = Math.max(
    ...Object.entries(progress)
      .filter(([id, _]) => itemCalculationStatus[id] === 'inProgress')
      .map(([_, value]) => value)
  );

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-2 pb-1 pl-4 mb-2 border-solid border-0 border-b border-b-slate-200">
        <div className='draggable cursor-move font-bold text-base md:text-lg pl-1 whitespace-nowrap overflow-x-auto'>{view?.name || "Guyton-Starling Plot"}</div>
        <div className='p-1 px-3 -my-2 flex items-center cursor-pointer text-slate-600 hover:text-lightBlue-500 transition' onClick={e => { setAnchorEl(e.currentTarget)}}>
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </div>
      </div>
      {!isInitialCalculation && Object.values(itemCalculationStatus).some(status => status === 'inProgress') && (
        <div className="w-full -mt-2">
          <LinearProgress variant="determinate" value={maxProgress} />
        </div>
      )}

      <div className="flex-grow overflow-hidden">
        <div className={`w-full h-full flex flex-col justify-center items-center ${isInitialCalculation ? "block" : "hidden"}`}>
          <div className="mb-4">循環平衡を計算中...</div>
          <LinearProgress className="w-1/2" variant="determinate" value={maxProgress} />
        </div>
    
        <div className='flex flex-wrap px-4 pt-2 mb-2'>
          {view.items.map((item) => (
            <div key={item.id} className='flex items-center mr-4 mb-2'> 
              <div className='relative'>
                <div className='w-4 h-4 rounded-full mr-2' style={{backgroundColor: item.color}}></div>
                {itemCalculationStatus[item.id] === 'inProgress' && (
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='animate-ping w-3 h-3 rounded-full bg-white'></div>
                  </div>
                )}
              </div>
              <span className='text-md font-medium text-gray-700'>
                {patients.find(p => p.id === item.patientId)?.name || "Unknown Model"}
                {itemCalculationStatus[item.id] === 'inProgress' && (
                  <span className="ml-2 text-xs text-blue-500 animate-pulse">計算中...</span>
                )}
              </span>
            </div>
          ))}
        </div>
        <div className = {`w-full h-full ${isInitialCalculation ? "hidden" : "block"}`}>
          { plotMode === '3D' ? (
            <Plot
              data={plotData}
              layout={{
                autosize: true,
                scene: {
                  xaxis: { title: 'RAP (mmHg)', range: [0, 30], tickfont: { size: 10 } },
                  yaxis: { title: 'LAP (mmHg)', range: [0, 50], tickfont: { size: 10 } },
                  zaxis: { title: 'CO (L/min)', tickfont: { size: 10 } },
                  camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.5 },
                    center: { x: 0, y: 0, z: -0.3 }
                  },
                  aspectratio: { x: 1, y: 2, z: 1 },
                },
                font: { size: 12 },
                margin: { l: 0, r: 0, b: 0, t: 10 },
              }}
              useResizeHandler={true}
              config={{
                displayModeBar: false,  
                displaylogo: false,     
              }}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div id={"scichart-root-guyton-starling-" + view.id} style={{ width: '100%', height:"calc(100% - 80px)", aspectRatio : "auto" }} />
          )}
        </div>
      </div>

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
      >
        <div className='flex flex-col items-center justify-center py-2 bg-white border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0'>
          <div
            onClick={() => { setDialogOpen(true); setAnchorEl(null) }}
            className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
          >
            <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit
          </div>
          <DeleteMenuItemWithDialog
            raw
            onDelete={() => { removeView() }}
            onClose={() => setAnchorEl(null)}
            message={`「${view?.name || "Guyton-Starling Plot"}」を削除しようとしています。この操作は戻すことができません。`}
          >
            <div className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1 text-red-500 hover:bg-red-500 hover:text-white">
              <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete
            </div>
          </DeleteMenuItemWithDialog>
        </div>
      </Popover>
      <GuytonStarlingPlotDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false) }}
        initialView={view}
        updateView={(newView) => { 
          updateView({ id: view.id, ...newView }); 
          setPlotMode(newView.options.plotMode);
        }}
        patients={patients}
      />
    </div>
  );
};

export default GuytonStarlingPlot;