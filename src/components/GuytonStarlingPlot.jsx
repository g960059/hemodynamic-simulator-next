import React, { useEffect, useState, useCallback, useRef } from 'react';
import Plot from 'react-plotly.js';
import {metrics} from "../utils/metrics"
import { LinearProgress } from '@mui/material';

const GuytonStarlingPlot = ({ model }) => {
  const [plotData, setPlotData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const instancesRef = useRef({});
  const subscriptionIdRef = useRef();
  const currentSpeedRef = useRef(null);
  const startTimeRef = useRef(0);
  const waitTimeRef = useRef(14000);
  const initialVolumeRef = useRef(null);

  const calculateTW = useCallback((hdps) => {
    const { Cvs, Cas, Cas_prox, Rvs, Rcs, Ras, Cvp, Cap, Cap_prox, Rvp, Rcp, Rap } = hdps;
    return (Cvs + Cas + Cas_prox) * Rvs + (Cas + Cas_prox) * Rcs + Cas_prox * Ras +
           (Cvp + Cap + Cap_prox) * Rvp + (Cap + Cap_prox) * Rcp + Cap_prox * Rap;
  }, []);

  const estimatePedRelations = useCallback(async () => {
    const currentVolume = model.getDataSnapshot().reduce((sum, v) => sum + v, 0);
    const volumes = [currentVolume * 0.8, currentVolume * 0.6, currentVolume * 0.4];
    model.setSpeed(10.0)
    await new Promise(resolve => setTimeout(resolve, 3000));
    const lvedps = [instancesRef.current.lvedp.getMetric()];
    const rvedps = [instancesRef.current.rvedp.getMetric()];
    const pcwps = [instancesRef.current.pcwp.getMetric()];
    const cvps = [instancesRef.current.cvp.getMetric()];


    for (let i = 0; i < volumes.length; i++) {
      const volume = volumes[i];
      model.setHdps("Volume", volume);
      await new Promise(resolve => setTimeout(resolve, 4000));
      lvedps[i] = instancesRef.current.lvedp.getMetric();
      rvedps[i] = instancesRef.current.rvedp.getMetric();
      pcwps[i] = instancesRef.current.pcwp.getMetric();
      cvps[i] = instancesRef.current.cvp.getMetric();
    }

    // 元のVolumeとSpeedに戻す
    model.setHdps("Volume", currentVolume);
    model.setSpeed(currentSpeedRef.current)

    // 最小二乗法による直線近似
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

    console.log("PED Relations:", { lvedps, pcwps, lvFit, rvedps, cvps, rvFit });

    return { lvFit, rvFit };
  }, [model]);

  const calculateFrankStarlingCurves = useCallback(async (hdps) => {
    const { lvFit, rvFit } = await estimatePedRelations();

    const { LV_Ees, LV_alpha, LV_beta, RV_Ees, RV_alpha, RV_beta } = hdps;
    const HR = instancesRef.current.hr.getMetric();
    const currentLVEa = instancesRef.current.lvea.getMetric();
    const currentRVEa = instancesRef.current.rvea.getMetric();

    const pra_range = Array.from({ length: 201 }, (_, i) => i * 0.1);
    const pla_range = Array.from({ length: 401 }, (_, i) => i * 0.1);

    const lv_z_data = pla_range.map(pla => {
      const LV_Ped = lvFit.slope * pla + lvFit.intercept;
      return LV_Ees / (LV_Ees + currentLVEa) * HR / LV_alpha / 1000 * Math.log((LV_Ped + LV_beta) / LV_beta);
    });

    const rv_z_data = pra_range.map(pra => {
      const RV_Ped = rvFit.slope * pra + rvFit.intercept;
      return RV_Ees / (RV_Ees + currentRVEa) * HR / RV_alpha / 1000 * Math.log((RV_Ped + RV_beta) / RV_beta);
    });

    // Frank-Starling平面のデータを生成
    const fs_plane_data = [];
    for (let i = 0; i < pra_range.length; i++) {
      for (let j = 0; j < pla_range.length; j++) {
        fs_plane_data.push([pra_range[i], pla_range[j], (lv_z_data[j] + rv_z_data[i]) / 2]);
      }
    }

    setPlotData(prev => [
      ...(prev || []),
      {
        x: Array(pla_range.length).fill(0),
        y: pla_range,
        z: lv_z_data,
        type: 'scatter3d',
        mode: 'lines',
        line: { color: 'red', width: 10 },
        name: 'LV Frank-Starling',
      },
      {
        x: pra_range,
        y: Array(pra_range.length).fill(0),
        z: rv_z_data,
        type: 'scatter3d',
        mode: 'lines',
        line: { color: 'blue', width: 10 },
        name: 'RV Frank-Starling',
      },
      {
        x: fs_plane_data.map(d => d[0]),
        y: fs_plane_data.map(d => d[1]),
        z: fs_plane_data.map(d => d[2]),
        type: 'surface',
        colorscale: [[0, 'rgba(255, 0, 0, 0.1)'], [1, 'rgba(0, 0, 255, 0.1)']],
        showscale: false,
        name: 'Frank-Starling平面',
        hoverinfo: 'none',
      }
    ]);


  }, []);

  useEffect(() => {
    setIsLoading(true);
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTimeRef.current;
      const progressPercentage = Math.min((elapsedTime / waitTimeRef.current) * 100, 100);
      setProgress(progressPercentage);

      if (elapsedTime >= waitTimeRef.current) {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const calculateGuyton3DSurface = useCallback( async (hdps) => {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const currentCO = instancesRef.current.co.getMetric();
    const currentCVP = instancesRef.current.cvp.getMetric();
    const currentPCWP = instancesRef.current.pcwp.getMetric();

    const TW = calculateTW(hdps);

    // SBVを逆算
    const SBV = TW * (currentCO / 60 + 
      ((hdps.Cvs + hdps.Cas + hdps.Cas_prox) / TW) * currentCVP + 
      ((hdps.Cvp + hdps.Cap + hdps.Cap_prox) / TW) * currentPCWP);

    const pra_range = Array.from({ length: 201 }, (_, i) => i * 0.1);
    const pla_range = Array.from({ length: 401 }, (_, i) => i * 0.1);

    const z_data = pla_range.map(pla => 
      pra_range.map(pra => {
        const CO = (SBV / TW - ((hdps.Cvs + hdps.Cas + hdps.Cas_prox) / TW) * pra - 
                    ((hdps.Cvp + hdps.Cap + hdps.Cap_prox) / TW) * pla) * 60;
        return CO > 0 ? CO : null;
      })
    );

    setPlotData(prev => [
      ...(prev || []),
      {
        z: z_data,
        x: pra_range,
        y: pla_range,
        type: 'surface',
        colorscale: [[0, 'rgba(100, 180, 255, 0.3)'], [1, 'rgba(100, 180, 255, 0.3)']],
        showscale: false,
        hoverinfo: 'x+y+z',
        hovertemplate: 'RAP: %{x:.1f} mmHg<br>LAP: %{y:.1f} mmHg<br>CO: %{z:.2f} L/min<extra></extra>',
      },
      {
        x: [currentCVP],
        y: [currentPCWP],
        z: [currentCO],
        mode: 'markers',
        type: 'scatter3d',
        marker: {
          size: 2,
          color: 'orange',
          symbol: 'circle'
        },
        name: '現在の状態',
        hoverinfo: 'x+y+z',
        hovertemplate: 'RAP: %{x:.1f} mmHg<br>LAP: %{y:.1f} mmHg<br>CO: %{z:.2f} L/min<extra></extra>',
      },
    ]);
    
  }, [])



  const update = useCallback((data, time, hdps) => {
    Object.values(instancesRef.current).forEach(instance => {
      instance.update(data, time, hdps);
    });
  }, []);


  useEffect(() => {
    if (!model) return;
    currentSpeedRef.current = model.speed;

    instancesRef.current = {
      co: new metrics.Co(),
      cvp: new metrics.Cvp(),
      pcwp: new metrics.Pcwp(),
      lvedp: new metrics.Lvedp(),
      rvedp: new metrics.Rvedp(),
      lvea: new metrics.LVEa(),
      rvea: new metrics.RVEa(),
      hr: new metrics.Hr()
    };

    initialVolumeRef.current = model.getDataSnapshot().reduce((sum, v) => sum + v, 0);

    startTimeRef.current = Date.now();
    subscriptionIdRef.current = model.subscribe(update);

    const hdps = model.getHdps();
    calculateGuyton3DSurface(hdps);
    calculateFrankStarlingCurves(hdps);

    return () => {
      if (subscriptionIdRef.current) {
        model.unsubscribe(subscriptionIdRef.current);
      }
      model.setSpeed(currentSpeedRef.current)
    };
  }, []);




  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <div className="mb-4">循環平衡を計算中...</div>
        <LinearProgress className="w-1/2" variant="determinate" value={progress} />
      </div>
    );
  }

  if (!plotData) return null;

  return (
    <Plot
      data={plotData}
      layout={{
        title: '循環平衡',
        autosize: true,
        width: 600,
        height: 600,
        scene: {
          xaxis: { title: 'RAP (mmHg)', range: [0, 20], tickfont: { size: 10 } },
          yaxis: { title: 'LAP (mmHg)', range: [0, 40], tickfont: { size: 10 } },
          zaxis: { title: 'CO (L/min)', tickfont: { size: 10 } },
          camera: {
            eye: { x: 1.5, y: 1.5, z: 1.5 },
            center: { x: 0, y: 0, z: -0.3 }
          },
          aspectratio: { x: 1, y: 2, z: 1 },
        },
        font: { size: 12 },
        margin: { l: 0, r: 0, b: 0, t: 40 },
      }}
      useResizeHandler={true}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default GuytonStarlingPlot;