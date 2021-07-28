import React from 'react';
import {Box,Grid} from '@material-ui/core'

import PVPlot from './PVPlot'
import RealTimeChart from './RealTimeChart';

const CombinedChart = ({subscribe,unsubscribe, setIsPlaying,isPlaying, dataTypes, setDataTypes}) => {
  return (
    <Grid container>
      <Grid item xs={6}>
        <PVPlot subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} dataTypes={dataTypes} setDataTypes={setDataTypes}/>
      </Grid>
      <Grid item xs={6}>
        <RealTimeChart subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} dataTypes={dataTypes} setDataTypes={setDataTypes}/>
      </Grid>
    </Grid>
  )
}

export default CombinedChart