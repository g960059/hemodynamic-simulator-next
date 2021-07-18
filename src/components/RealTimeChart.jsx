import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box, Typography, Stack} from '@material-ui/core'
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import {FastLineRenderableSeries} from "scichart/charting/visuals/RenderableSeries/FastLineRenderableSeries";
import {XyDataSeries} from "scichart/charting/Model/XyDataSeries";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import {EAutoRange} from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import {FiberManualRecord} from "@material-ui/icons"
import {LightTheme, COLORS, ALPHA_COLORS} from '../styles/chartConstants'
import {e, P} from '../utils/pvFunc'

const TIME_WINDOW = 6000
const TIME_WINDOW_GAP = 200

const getTimeSeriesFn = ({ 
  Rcs,Rcp,Ras,Rvs,Rap,Rvp,Ras_prox,Rap_prox,Rmv,Rtv,Cas,Cvs,Cap,Cvp,Cas_prox,Cap_prox,
  LV_Ees,LV_V0,LV_alpha,LV_beta,LV_Tmax,LV_tau,LV_AV_delay,
  LA_Ees,LA_V0,LA_alpha,LA_beta,LA_Tmax,LA_tau,LA_AV_delay,
  RV_Ees,RV_V0,RV_alpha,RV_beta,RV_Tmax,RV_tau,RV_AV_delay,
  RA_Ees,RA_V0,RA_alpha,RA_beta,RA_Tmax,RA_tau,RA_AV_delay,HR,
  Ravs, Ravr, Rmvr, Rmvs, Rpvr, Rpvs, Rtvr, Rtvs,
}) => {
  const Plv = x => x['Plv']
  const Pla = x => x['Pla']
  const Prv = x => x['Prv']
  const Pra = x => x['Pra']
  const Iasp = x => x['Iasp']
  const Iapp = x=> x['Iapp']
  const AoP = x => x['AoP']
  const PAP = x=>x['PAP']
  return {Plv, Pla, Prv, Pra, Iasp,Iapp, AoP, PAP}
}

const RealTimeChart = React.memo(({subscribe, setIsPlaying, dataTypes}) =>{
  const [loading, setLoading] = useState(true);
  const [sciChartSurface, setSciChartSurface] = useState();
  const dataRef = useRef({})


  const initSciChart = async () => {
    const { sciChartSurface, wasmContext } = await SciChartSurface.create(
      "scichart-root"
    );
    SciChartSurface.setRuntimeLicenseKey(process.env.LICENCE_KEY);
    sciChartSurface.applyTheme(LightTheme)
    const xAxis = new NumericAxis(wasmContext,{autoRange: EAutoRange.Never,visibleRange:new NumberRange(0, TIME_WINDOW), drawLabels:false});
    const yAxis = new NumericAxis(wasmContext,{axisAlignment: EAxisAlignment.Left,autoRange: EAutoRange.Always,drawMinorTickLines:false});
    xAxis.drawMajorGridLines =false;
    sciChartSurface.xAxes.add(xAxis);
    sciChartSurface.yAxes.add(yAxis);

    for(let i=0; i<dataTypes.length; i++){
      const dataType = dataTypes[i]
      const dataSeries = dataRef.current[dataType]
      for(let j=0; j<2; j++){
        (dataRef.current[dataType] || (dataRef.current[dataType]=[]))[j] = new XyDataSeries(wasmContext);
        sciChartSurface.renderableSeries.add(
          new FastLineRenderableSeries(wasmContext, { 
            stroke: COLORS[i],
            strokeThickness: 3,
            dataSeries: dataRef.current[dataType][j]
          })
        )
      }
    }
    sciChartSurface.zoomExtents();
    return {sciChartSurface,wasmContext}
  }  
  const subscribeChart = () => {
    subscribe(
      (data, time, hdprops) => {
        const newTime = time % TIME_WINDOW
        const _time = data['t']?.map(x=>x%TIME_WINDOW)
       
        for(let i=0; i<dataTypes.length; i++){
          const dataType = dataTypes[i]
          const dataSeries = dataRef.current[dataType]
          const _data = getTimeSeriesFn(hdprops)[dataType](data)
          const j = time % (TIME_WINDOW * 2) < TIME_WINDOW ? 0 : 1;
          const k = j ? 0 : 1;
          dataSeries[j].appendRange(_time, _data)
          const indiceRange1 = dataSeries[j].getIndicesRange(new NumberRange(newTime, TIME_WINDOW))
          if(indiceRange1.max - indiceRange1.min > 0){
            dataSeries[j].removeRange(indiceRange1.min, indiceRange1.max - indiceRange1.min)
          }
          const indiceRange2 = dataSeries[k].getIndicesRange(new NumberRange(0,newTime+TIME_WINDOW_GAP))
          if(indiceRange2.max - indiceRange2.min > 0){
            dataSeries[k].removeRange(indiceRange2.min, indiceRange2.max - indiceRange2.min)
          }
        }
      }
    )
  }

  useEffect(() => {
    (async ()=>{
      const res = await initSciChart()
      setSciChartSurface(res.SciChartSurface)
      subscribeChart()
      setIsPlaying(true)
      if(res){
        setLoading(false)
      }
    })();
    return sciChartSurface?.delete()
  }, []);

  return (
    <Box>
      <Box>
        <Stack direction='horizontal'><FiberManualRecord/>Pressure1</Stack>
      </Box>
      <Box display='flex' justifyContent='center' alignItems='center' style={{ width: '100%',aspectRatio: '16/9' }}>
        <div id="scichart-root" style={{width: '100%',height:'100%',opacity: loading ? 0 : 1}}></div>
      </Box>
    </Box>
  )
})

export default RealTimeChart

