import React,{useState, useEffect,useReducer} from 'react';
import {Box,Grid, Typography, Stack,MenuItem,Divider,Select, Popover, IconButton, Slider,Tab, Button, ButtonGroup,ToggleButtonGroup,ToggleButton,Dialog,DialogContent,DialogTitle,DialogActions, DialogContentText,Tooltip,Autocomplete,TextField} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';
import { makeStyles } from '@mui/styles';

import {useTranslation} from '../../hooks/useTranslation'
import {InputRanges,VDOptions} from '../../constants/InputSettings'
import {Refresh,SwitchAccount,Edit,CloudUpload,Add,ArrowForward,ExpandMore,Check} from '@mui/icons-material';
import ReactiveInput from "../ReactiveInput";
import Switch from "../Switch";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collectionData, docData,collection as collectionRef } from 'rxfire/firestore';
import {collection,doc,query,where,setDoc,addDoc,updateDoc,serverTimestamp } from 'firebase/firestore';
import {auth,db} from "../../utils/firebase"
import { concatMap,map,tap,switchMap,filter} from "rxjs/operators";
import {useObservable} from "reactfire"
import {user$,patients$,selectedPatient$,patientsRef$,userRef$} from "../../hooks/usePvLoop"
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'
import {shallowCompare} from '../../utils/utils'
import {DEFAULT_CONTROLLER} from '../../utils/presets'

const Severity = ["Trivial","Mild","Moderate","Severe"]

const useStyles = makeStyles((theme) =>({
    neumoButton: {
      transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
      color: "rgb(69, 90, 100)",
      boxShadow: "rgb(0 0 0 / 10%) 0px 2px 4px -2px",
      backgroundColor: "white",
      border: "1px solid rgba(92, 147, 187, 0.17)",
      "&:hover":{
        backgroundColor: "rgba(239, 246, 251, 0.6)",
        borderColor: "rgb(207, 220, 230)"
      },
      "& .MuiOutlinedInput-notchedOutline": {border:"none"}
    },
    shadowBox: {
      backgroundColor: "white",
      boxShadow: "rgb(0 10 60 / 20%) 0px 3px 6px -2px",
      border: "1px solid rgba(239, 246, 251, 0.6)"
    }
  }),
);




const ControllerPanel = React.memo(({patient, mode}) => {
  const classes = useStyles()
  const t = useTranslation();
  const [controller, setController] = useState(DEFAULT_CONTROLLER[0]);
  const [tabValue, setTabValue] = useState(0);
  const [patientNameEditing, setPatientNameEditing] = useState(false);
  const [patientName, setPatientName] = useState(patient?.name || "Untitled");
  const [visibility, setVisibility] = useState(patient?.visibility || 'private');
  const [emoji, setEmoji] = useState(patient?.emoji || "😊");
  const [openPublishDialog, setOpenPublishDialog] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [tags, setTags] = useState(patient?.tags || []);
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);
  
  const patientsRef = useObservable("patientsRef",patientsRef$)
  const user = useObservable("user",user$)

  const saveAsNewPatient = () => {
    if(patientsRef.status="success" && patientsRef.data){
      addDoc(patientsRef.data,{
        name: patientName,
        visibility,
        hdps: patient.getHdps(),
        initialData: patient.getDataSnapshot(),
        initialTime: patient.getTimeSnapshot(),
        emoji,
        tags,
        updatedAt: serverTimestamp(),
        uid: user?.data?.uid,
        displayName: user?.data?.displayName,
        photoURL: user?.data?.photoURL,
        favs:0,
      })
    }
  }
  const updatePatient = () => {
    if(patientsRef.status="success" && patientsRef.data){
      updateDoc(doc(db,'users',user.data.uid,'patients',patient.id),{
        ...(patient.name!=patientName)&&{name:patientName},
        ...(patient.visibility!=visibility)&&{visibility},
        ...(!shallowCompare(patient.getHdps(),patient.initialHdps))&&{hdps:patient.getHdps()},
        initialData: patient.getDataSnapshot(),
        initialTime: patient.getTimeSnapshot(),
        ...(patient.emoji!=emoji)&&{emoji},
        ...(patient.tags!=tags)&&{tags},
        updatedAt: serverTimestamp(),
      })
    }
  }
  const isChanged = patient.name!=patientName || patient.visibility!=visibility || !shallowCompare(patient.getHdps(),patient.initialHdps)
  useEffect(() => {
    if(patient){
      setVisibility(patient?.visibility || 'private');
      setEmoji(patient?.emoji || "😊")
      setTags(patient?.tags || [])
      setPatientName(patient?.name || "Untitled")
    }
  }, [patient.id]);

  return <Box p={1}>
    <Box p={2} className={classes.shadowBox}>
      <Stack direction="row" justifyContent="space-between" px={1}>
        {
          patientNameEditing ? 
            <ReactiveInput value={patientName} updateValue={newName=>{setPatientName(newName);setPatientNameEditing(false)}} type="text" autoFocus/> :
            <Typography variant="h5" fontWeight="bold" onClick={()=>{setPatientNameEditing(true)}}>{patientName}</Typography>
        }
        <Stack direction="row" sx={{mr:-3}} justifyContent="center" alignItems="center">
          {/* <Stack direction="row" spacing={.5} justifyContent="center" alignItems="center" sx={{mr:1}}>
            <Switch checked={visibility=="public"} onChange={e=>{const newVal = e.target.checked ? "public":"private"; setVisibility(newVal)}}/>
            <Typography variant='caption' sx={{color: visibility=="public" ? "black": "gray"}}>{t["Publish"]}</Typography>
          </Stack>
          <Button 
            variant='contained' 
            disableElevation 
            sx={{fontWeight:'bold'}} 
            onClick={visibility=="private" ? ()=>{updatePatient();forceUpdate()} : ()=>{setOpenPublishDialog(true)}}
            disabled={!isChanged}
            endIcon = {!isChanged&&<Check/>}
          >
              {isChanged ? (visibility=="private" ? t["Save"] : t["Publish"]) : t["Saved"]}
          </Button> */}
          <IconButton sx={{ml:.5}}><ExpandMore/></IconButton>
        </Stack>
        <Dialog open={openPublishDialog} onClose={()=>setOpenPublishDialog(false)} sx={{minHeight:'340px'}}>
          <DialogTitle >
            Settings
          </DialogTitle>
          <DialogContent>
            <Stack direction="row" sx={{backgroundColor:"#edf2f6",borderRadius:"10px",color:"#6e7b85",mb:2,mt:1,p:2,position:"relative",alignItems:"center"}}>
              <Box onClick={e=>{setEmojiAnchorEl(e.currentTarget)}} sx={{fontSize:"50px",cursor:"pointer"}}>{emoji}</Box>
              <Popover open={Boolean(emojiAnchorEl)} anchorEl={emojiAnchorEl} onClose={()=>{setEmojiAnchorEl(null)}} anchorOrigin={{vertical: 'bottom',horizontal:'left'}}>
                <Picker emoji={emoji} onSelect={newEmoji=>{setEmoji(newEmoji.native)}} showPreview={false} showSkinTones={false}/>
              </Popover>
              <Divider orientation="vertical" flexItem sx={{mx:2}}/>
              <Typography variant='subtitle2'>アイキャッチ絵文字を変更する</Typography>
            </Stack>
            <Typography variant='subtitle1' fontWeight="bold">Title</Typography>
            <ReactiveInput value={patientName} updateValue={newName=>{setPatientName(newName);setPatientNameEditing(false);forceUpdate()}} type="text" autoFocus/>
            <Typography variant='subtitle1' fontWeight="bold" sx={{mt:2}}>Tags</Typography>
            <Stack direction="column">
              <Typography variant="caption" color="#6e7b85">関連するタグを選んでください。</Typography>
              <Typography variant="caption" color="#6e7b85">最初のタグが一覧で表示されます。</Typography>
            </Stack>
            <Box mt={1}>
              <Autocomplete 
                freeSolo multiple value={tags} 
                onChange={(e,newTags)=>{setTags(newTags)}} 
                options={[]}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                  />)}
                sx={{ "&.MuiAutocomplete-root":{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '4px',
                  border: '1px solid #5c93bb2b',
                  '&:hover': {
                    borderColor: '#3ea8ff',
                  },
                  "& .MuiOutlinedInput-root":{padding:"3px 9px"},
                  "& .MuiInput-input": {border: 'none',padding: '8px 0 8px 16px'},
                  "& p.MuiTypography-root":{
                    fontSize: "0.7rem"
                  },
                  "& .Mui-focused .MuiOutlinedInput-notchedOutline":{border:"none"}
                }}}
                />
            </Box>
          </DialogContent>
          <DialogActions sx={{display:"flex", justifyContent:"center",mb:2}}>
            <Button onClick={()=>saveAsNewPatient()} variant='contained' disableElevation>
              {t["Publish"]}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
      <TabContext value={controller.id}>
        <TabList 
          onChange={(e,v)=>{setController(DEFAULT_CONTROLLER.find(c=>c.id==v));setTabValue(0)}} 
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
          sx={{mx:-2,"& .MuiTabs-scrollButtons.Mui-disabled": {opacity: 0.3}}}
          >
          {DEFAULT_CONTROLLER.map(item=><Tab label={item.name} value={item.id} />)}
        </TabList>
        <Box width={1} sx={{borderTop: 1, borderColor: 'divider',mt:'-1px',mx:1}}/>
        {DEFAULT_CONTROLLER.map(item=>
          <TabPanel value={item.id} sx={{px:1,pt:2}}>
            <Box>
              {
                item.tabs.length>1 ? 
                <ToggleButtonGroup
                    color="primary"
                    value={tabValue}
                    exclusive
                    onChange={(e,v)=>{setTabValue(v)}}
                    size="small"
                    sx ={{width:1,'& .MuiToggleButton-root':{pb:'2px',pt:'3px',flexGrow:1}, mb:2}}
                  >
                  {item.tabs.map((tab,index)=>(
                    <ToggleButton value={index}>{tab.name}</ToggleButton>
                  ))}
                </ToggleButtonGroup> :
                <Box width={1} pt={1}/>
              }
              {item.tabs[tabValue]?.hdps.map(hdp => (
                <InputItem hdp={hdp} patient={patient} mode={mode} forceUpdate={forceUpdate}/>
              ))}
            </Box>
          </TabPanel>
        )}
      </TabContext>
    </Box>
    {/* <Box p={2} className={classes.shadowBox} mt={2}>
      <Typography variant="h6" color="secondary" fontWeight="bold" sx={{verticalAlign:"middle", display:"inline-flex", lineHeight:"1.5"}}><Add/>比較</Typography>
    </Box> */}
  </Box>
})

export default ControllerPanel


export const InputItem =  React.memo(({hdp,patient, mode,forceUpdate}) => {
  const {getHdps,setHdps: setHdps_,initialHdps} = patient;
  const hdps = getHdps();
  const setHdps = (k,v) => {setHdps_(k,v);setTimeout(()=>{forceUpdate()},200)}
  if(hdp == "Impella") return <ImpellaButton hdps={hdps} setHdps={setHdps} key={hdp}/>;
  if(hdp == "ECMO") return <Box sx={{mb:1,width:1}} key={hdp}><EcmoButton hdps={hdps} setHdps={setHdps} /></Box>;
  if(["Ravs","Rmvs","Rtvs","Rpvs","Ravr","Rmvr","Rtvr","Rpvr"].includes(hdp)) return <Box sx={{mt:1,width:1}} key={hdp}><BasicToggleButtons hdp={hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps}/></Box>
  if(mode == "basic"){
    return <BasicInputs hdp={hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps} key={hdp}/>
  }else{
    return <AdvancedInputs hdp={hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps} key={hdp}/>
  }      
})


export const BasicInputs = React.memo(({hdp,initialHdps, hdps,setHdps}) => {
  const t = useTranslation();
  const [value, setValue] = useState(hdps[hdp]);
  const display = () => {
    const ratio = value/initialHdps[hdp] - 1
    if(hdp == 'HR') return `${t[hdp]} (${Math.round(value)} bpm)`
    if(value == initialHdps[hdp]) return `${t[hdp]}`
    if(hdp.includes('alpha') || hdp.includes('tau')) return `${t[hdp]} (${ratio>0 ? "-": "+"}${Math.round(Math.abs((ratio*100)))}%)`
    return `${t[hdp]} (${ratio>0 ? "+": ""}${Math.round(ratio*100)}%)`
  }
  const onHandle = (changeValue)=>()=>{
    if(hdp.includes('alpha') || hdp.includes('tau')){changeValue = -changeValue}
    if(changeValue == 0){
      setValue(initialHdps[hdp]);
      setHdps(hdp, initialHdps[hdp])
    }else if(hdp === 'HR'){
      setValue(prev=> { 
        setHdps(hdp, Math.round(prev + initialHdps[hdp]*changeValue/100));
        return Math.round(prev + initialHdps[hdp]*changeValue/100)
      })
    }else{
      setValue(prev=> { 
        const newVal = Number(prev) + initialHdps[hdp]*Number(changeValue)/100
        setHdps(hdp, newVal);
        return newVal
      })
    }
  }
  useEffect(() => {
    setValue(hdps[hdp])
  }, [hdps,hdp]);
  return <>
    <Grid container justifyContent="center" alignItems="center" display='flex' sx={{mb:1}}>
      <Grid item xs={6.5}>
        <Typography variant='subtitle1'>{display()}</Typography>
      </Grid>
      <Grid item xs={5.5} justifyContent="flex-end" alignItems="center" display='flex'>
        <ButtonGroup  size="small" color="secondary" 
          sx={{
            "& .MuiButtonGroup-groupedOutlined":{
              border: "1px solid rgba(0, 0, 0, 0.12)",color: "rgba(0, 0, 0, 0.54)",
              "&:hover":{
                backgroundColor: "rgba(239, 246, 251, 0.6)",
                borderColor: "rgb(207, 220, 230) !important"
              },
            }
          }}>
          <Button onClick={onHandle(-10)}>-10%</Button>
          <Button onClick={onHandle(0)}><Refresh/></Button>
          <Button onClick={onHandle(10)}>+10%</Button>
        </ButtonGroup>
      </Grid>
    </Grid>
  </>
})

export const AdvancedInputs = React.memo(({hdp,initialHdps, hdps,setHdps}) => {
  const t = useTranslation();
  const [value, setValue] = useState(hdps[hdp]);
  useEffect(() => {
    setValue(hdps[hdp])
  }, [hdps,hdp]);
  return <>
    <Grid container justifyContent="center" alignItems="center" display='flex' >
      <Grid item xs={7}>
        <Typography variant='subtitle1'>{t[hdp]}</Typography>
      </Grid>
      <Grid item xs={5} justifyContent="flex-end" alignItems="center" display='flex'>
        <ReactiveInput variant="standard" value={value} updateValue={v=>{setValue(v);setHdps(hdp,v)}} unit={InputRanges[hdp].unit}/>
      </Grid>
    </Grid>
    <Grid container justifyContent="center" alignItems="center" display='flex' sx={{mb:1}}>
      <Grid item xs={2} justifyContent="flex-start" alignItems="center" display='flex' >
        <Typography variant="subtitle2" color="gray">x0.25</Typography>
      </Grid>
      <Grid item xs={8} justifyContent="center" alignItems="center" display='flex' >
        <Slider 
          value={Math.log2(value)}
          min={Math.log2(initialHdps[hdp]/4)} 
          max={Math.log2(initialHdps[hdp]*4)} 
          step={(Math.log2(initialHdps[hdp])/100)} 
          valueLabelDisplay="auto"
          valueLabelFormat={v => 2**v>100 ? (2**v).toFixed() : (2**v).toPrecision(3)}
          onChange = {(e,v)=> {const fv =2**v>100 ? (2**v).toFixed() : (2**v).toPrecision(3);  setValue(fv);}}
          onChangeCommitted={(e,v)=>{const fv =2**v>100 ? (2**v).toFixed() : (2**v).toPrecision(3);  setValue(fv);setHdps(hdp,fv)}}
          sx={{
            '& .MuiSlider-thumb': {
              height: 24,
              width: 24,
              backgroundColor: '#fff',
              border: '2px solid currentColor',
              '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                boxShadow: 'inherit',
              },
              '&:before': {
                display: 'none',
              }
            },
            '& .MuiSlider-track': {
              height: 4,
              backgroundColor: "#3ea8ff",
              border:'none'
            },
            '& .MuiSlider-rail': {
              color: '#d8d8d8',
              height: 3,
            },
          }}
        />   
      </Grid>
      <Grid item xs={2} justifyContent="flex-end" alignItems="center" display='flex' >
        <Typography variant="subtitle2" color="gray">x4.0</Typography>
      </Grid>
    </Grid>
  </>
})

export const ImpellaButton = React.memo(({hdps,setHdps}) => {
  const t = useTranslation();
  const [type, setType] = useState(hdps["impella_type"]);
  const [level, setLevel] = useState(hdps["impella_aux_level"]);
  const handleChange = (e, newType) =>{
    if(newType=='None'){
      setType("None");
      setHdps("impella_type","None");
    }else{
      setType(newType);
      setHdps("impella_aux_level",level);
      setHdps("impella_type",newType);
    }
  }
  const handleLevel = e => {
    setLevel(e.target.value);
    if (type !='None') {
      setHdps("impella_aux_level",e.target.value);
    }
  }

  return <>
    <Grid container justifyContent="space-between" alignItems="center" display='flex' sx={{mb:1}}>
      <Grid item xs={12} justifyContent="space-between" alignItems="center" display='flex' sx={{mb:.5}}>
        <Typography variant='subtitle1'>Impella</Typography>
      </Grid>
      <Grid itex xs={12}  justifyContent="space-between" alignItems="center" display='flex'>
        <ToggleButtonGroup
          color="primary"
          value={type}
          exclusive
          onChange={handleChange}
          size="small"
          sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
        >
          <ToggleButton value="None">Off</ToggleButton>
          <ToggleButton value="2.5">2.5</ToggleButton>
          <ToggleButton value="CP">CP</ToggleButton>
          <ToggleButton value="5.0">5.0</ToggleButton>
        </ToggleButtonGroup>
        {
          type != "None" && <Grid item justifyContent="space-between" alignItems="center" display='flex'>
            <Typography variant="subtitle2" sx={{pr:.5}}>{t["auxiliary_level"]}</Typography>
            <Select
              labelId="impella-level-select-label"
              id="impella-level-select"
              value={level}
              onChange={handleLevel}
              size="small"
              sx={{"& .MuiSelect-outlined":{padding: "5px 14px"}}}
            >
              {
                [...Array(9).keys()].map(i => 
                  <MenuItem value={"P"+(i+1)}>{"P"+(i+1)}</MenuItem> 
                )
              }
            </Select>
          </Grid>
        }        
      </Grid>
    </Grid>
  </>
})

export const EcmoButton = React.memo(({hdps,setHdps}) => {
  const t = useTranslation();
  const [ecmoSpeed, setEcmoSpeed] = useState(hdps["ecmo_speed"]);
  const [isRunning, setIsRunning] = useState(false);

  const handleChange = (e, v) =>{
    if(v){
      setIsRunning(v);
      if(ecmoSpeed==0){
        setEcmoSpeed(5000);
        setHdps("ecmo_speed",5000);
      }else{
        setHdps("ecmo_speed",ecmoSpeed);
      }
    }else{
      setIsRunning(v);
      setHdps("ecmo_speed",0);
    }
  }
  const handleSpeed = e => {
    setEcmoSpeed(e.target.value);
    setHdps("ecmo_speed",e.target.value);
  }

  return <>
    <Grid container justifyContent="space-between" alignItems="center" display='flex' sx={{mb:1}}>
      <Grid item xs={12} justifyContent="space-between" alignItems="center" display='flex' sx={{mb:.5}}>
        <Typography variant='subtitle1'>VA-ECMO</Typography>
      </Grid>
      <Grid itex xs={12}  justifyContent="space-between" alignItems="center" display='flex'>
        <ToggleButtonGroup
          color="primary"
          value={isRunning}
          exclusive
          onChange={handleChange}
          size="small"
          sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
        >
          <ToggleButton value={false}>Off</ToggleButton>
          <ToggleButton value={true}>On</ToggleButton>
        </ToggleButtonGroup>   
        {
          isRunning && <Grid item justifyContent="space-between" alignItems="center" display='flex'>
            <Typography variant="subtitle2" sx={{pr:.5}}>{t["ecmo_speed"]}</Typography>
            <Select
              labelId="ecmo-speed-select-label"
              id="ecmo-speed-select"
              value={ecmoSpeed}
              onChange={handleSpeed}
              size="small"
              sx={{"& .MuiSelect-outlined":{padding: "5px 14px"}}}
            >
              {
                [...Array(7).keys()].map(i => 
                  <MenuItem value={(i+1)*1000}>{(i+1)*1000} rpm</MenuItem> 
                )
              }
            </Select>
          </Grid>
        }              
      </Grid>
    </Grid>
  </>
})

export const BasicToggleButtons = React.memo(({hdp,initialHdps, hdps,setHdps}) => {
  const t = useTranslation();
  const [value, setValue] = useState(hdps[hdp]);
  useEffect(() => {
    setValue(hdps[hdp])
  }, [hdps,hdp]);
  
  return <>
    <Box sx={{mb:2, display:'flex', justifyContent:"space-between", alignItems:"center", width:1}} >
      <Typography variant='subtitle1'>{t[hdp]}</Typography>
      <ToggleButtonGroup
        color="primary"
        value={value}
        exclusive
        onChange={(e,v)=>{setValue(v);setHdps(hdp,v);}}
        size="small"
        sx ={{'& .MuiToggleButton-root':{pb:'2px',pt:'3px',px:1}}}
      > {
        VDOptions[hdp.slice(1)].map((option,i) => (
          <ToggleButton value={option}>{t[Severity[i]]}</ToggleButton>
        ))
      }
      </ToggleButtonGroup> 
    </Box>
  </>
})