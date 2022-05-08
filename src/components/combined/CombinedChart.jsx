import React from 'react';
import {Box,Grid} from '@mui/material'

import PVPlot from './PVPlot'
import RealTimeChart from './RealTimeChart';

const CombinedChart = ({patient, dataTypes, setDataTypes}) => {
  return (
    <Grid container>
      <Grid item xs={6}>
        <PVPlot patient={patient} dataTypes={dataTypes} setDataTypes={setDataTypes}/>
      </Grid>
      <Grid item xs={6}>
        <RealTimeChart patient={patient} dataTypes={dataTypes} setDataTypes={setDataTypes}/>
      </Grid>
    </Grid>
  )
}

export default CombinedChart