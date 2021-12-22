import React,{useState} from 'react';
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, Slider,Tab, Button, ButtonGroup,ToggleButtonGroup,ToggleButton, Select} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';
import {useTranslation} from '../../hooks/useTranslation'
import {InputRanges} from '../../constants/InputSettings'
import {Refresh} from '@mui/icons-material';
import {DEFAULT_HEMODYANMIC_PROPS} from '../../utils/presets'

const BasicHdps = ['Volume','Ras','LV_Ees','LV_alpha','LV_tau','HR']
const AdvancedHdps = ["Volume","HR","LV_Ees","LV_alpha" ,"LV_Tmax" ,"LV_tau" ,"LV_AV_delay" ,"RV_Ees","RV_alpha" ,"RV_Tmax" ,"RV_tau" ,"RV_AV_delay" ,"LA_Ees","LA_alpha" ,"LA_Tmax" ,"LA_tau" ,"RA_Ees","RA_alpha" ,"RA_Tmax" ,"RA_tau" ,"Ras" ,"Rap" ,"Rvs" ,"Rvp","Cas","Cap" ,"Cvs" ,"Cvp","Ravs","Ravr","Rmvr","Rmvs","Rpvr", "Rpvs", "Rtvr", "Rtvs"]
const ControllerLists = ["お気に入り","心機能","血管","弁膜症","補助循環"]

const ControllerList = React.memo(({getHdps,setHdps}) => {
  const [tabValue, setTabValue] = useState("1");
  const t = useTranslation();
  const hdps = getHdps()
  return ( 
    <Box width={1}>
      {ControllerLists.map(hdp => (
           <Box sx={{bgcolor: 'white', borderRadius: 3, boxShadow: '0 2px 4px -2px rgb(0 0 0 / 10%)', border: '1px solid #5c93bb2b', my:1.5,p:2, pt:1, cursor: 'pointer', '&:hover': {backgroundColor: '#eff6fb99',borderColor: '#cfdce6'}}}>
             <Typography variant="h5">{hdp}</Typography>
           </Box>
      ))}
    </Box>
  )
})

export default ControllerList


