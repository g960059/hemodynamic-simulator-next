import React,{useState, useEffect} from 'react';
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, Slider,Tab, Button, ButtonGroup,ToggleButtonGroup,ToggleButton, Select,Dialog,DialogContent,DialogContentText,DialogTitle,DialogActions} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';
import { makeStyles } from '@mui/styles';

import {useTranslation} from '../../hooks/useTranslation'
import {InputRanges,VDOptions} from '../../constants/InputSettings'
import {Refresh,ExpandLess,ExpandMore,DragIndicator,Delete,Edit,Check} from '@mui/icons-material';
import ReactiveInput from "../ReactiveInput";
import { DragDropContext,Droppable,Draggable} from 'react-beautiful-dnd';
import { authState} from 'rxfire/auth';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collectionData, docData,collection as collectionRef } from 'rxfire/firestore';
import {collection,doc,query,where,setDoc,addDoc,updateDoc } from 'firebase/firestore';
import {auth,db} from "../../utils/firebase"
import { concatMap,map,tap,switchMap,filter} from "rxjs/operators";
import {useObservable} from "../../hooks/useObservable"

const Vessels = ["Ra","Rv","Ca","Cv","Rc"]
const AdvancedVessels = ["Ras","Rap","Rvs","Rvp","Ras_prox","Rap_prox","Rcs","Rcp","Cas","Cap","Cvs","Cvp"]
const CardiacFns = ["Ees","alpha" ,"Tmax" ,"tau" ,"AV_delay"]
const Severity = ["Trivial","Mild","Moderate","Severe"]
const DefaultInputs = ['Volume','HR','Ras','LV_Ees','LV_alpha','LV_tau']

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
      }
    }
  }),
);

const BasicController = React.memo(({patient, mode}) => {
  const {getHdps,setHdps,initialHdps} = patient
  const [tabValue, setTabValue] = useState("1");
  const t = useTranslation();
  const hdps = getHdps()
  return ( 
    <Box width={1}>
      <TabContext value={tabValue}>
        <TabList onChange={(e,v)=>{setTabValue(v)}} variant="scrollable" scrollButtons="auto">
          <Tab label={t["Favorites"]} value="1" />
          <Tab label={t["CardiacFn"]} value="2" />
          <Tab label={t["Vessels"]} value="3"/>
          <Tab label={t["Valves"]} value="4"/>
          <Tab label={t["assisted_circulation"]} value="5"/>
        </TabList>
        <TabPanel value="1" sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
          <FavsPanel initialHdps={initialHdps} hdps={hdps} setHdps={setHdps} mode={mode}/>
        </TabPanel>
        <TabPanel value="2" sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
          <CardiacFnsPanel initialHdps={initialHdps} hdps={hdps} setHdps={setHdps} mode={mode}/>
        </TabPanel>
        <TabPanel value="3" sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
          <VesselsPanel initialHdps={initialHdps} hdps={hdps} setHdps={setHdps} mode={mode}/>
        </TabPanel>
        <TabPanel value="4" sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
          <ValvesPanel initialHdps={initialHdps} hdps={hdps} setHdps={setHdps} mode={mode}/>
        </TabPanel>
        <TabPanel value="5" sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
          <EcmoButton hdps={hdps} setHdps={setHdps}/>
          <ImpellaButton hdps={hdps} setHdps={setHdps}/>
        </TabPanel>
      </TabContext>      
    </Box>
  )
})

export default BasicController

const user$ = authState(auth);
const controllers$ = user$.pipe(
  filter(user=>!!user),
  concatMap(user =>collectionData(collection(db, 'users',user?.uid,'controllers'),{idField: 'id'})),
)
const favs$ = controllers$.pipe(
  map(controllers => controllers.filter(x=>x?.name=="Favorites")[0]),
)


export const FavsPanel =  React.memo(({hdps,setHdps,initialHdps, mode}) => {
  const t = useTranslation();
  const classes = useStyles();
  const [editFavs, setEditFavs] = useState(false);

  const {data: user} = useObservable("user",user$,{initialData:null})
  const {data: controllers} = useObservable("controllers",controllers$, {initialData:null});
  const {data: favs} = useObservable("favs",favs$, {initialData:DefaultInputs})
  const setFavorites = setter => {
    const ref = doc(db,"users",user?.uid,"controllers",favs?.id)
    updateDoc(ref,{items:setter(favs.items)})
  }
  useEffect(() => {
    if(user&&controllers){
      if(controllers.filter(x=>x.name=="Favorites").length==0){
        addDoc(collection(db,"users",user?.uid,"controllers"),{name:"Favorites",items:DefaultInputs})
      }
    }
  }, [user,controllers]);
  useEffect(() => {
    // Favoritesは存在するが、itemsがない場合
    if(user&&favs&&favs.id){
      const ref = doc(db,"users",user?.uid,"controllers",favs?.id)
      if(!favs.hasOwnProperty("items")){
        updateDoc(ref,{items:DefaultInputs})
      }
    }
  }, [user,favs]);

  if(editFavs){
    return <FavEditor favorites={user ? favs.items: DefaultInput} setFavorites={setFavorites} setEditFavs={setEditFavs}/>
  }else{
    return <Stack justifyContent="center" alignItems="center" sx={{width:"100%"}}>
      {(user ? favs?.items : DefaultInputs)?.map(hdp=>{
        if(hdp == "Impella") return <ImpellaButton hdps={hdps} setHdps={setHdps} key={hdp}/>;
        if(hdp == "ECMO") return <Box sx={{mb:1,width:1}} key={hdp}><EcmoButton hdps={hdps} setHdps={setHdps} /></Box>;
        if(["Ravs","Rmvs","Rtvs","Rpvs","Ravr","Rmvr","Rtvr","Rpvr"].includes(hdp)) return <Box sx={{mt:1,width:1}} key={hdp}><BasicToggleButtons hdp={hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps}/></Box>
        if(mode == "basic"){
          return <BasicInputs hdp={hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps} key={hdp}/>
        }else{
          return <AdvancedInputs hdp={hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps} key={hdp}/>
        }      
      })}
      {user ?      
        <Button className={classes.neumoButton} variant="outlined" onClick={()=>{setEditFavs(true)}} sx={{mt:3}}>
          <Edit sx={{mr:.5}}/>
          {t['FavoritesEdit']}
        </Button> :
        <>
          <Button className={classes.neumoButton} variant="outlined" onClick={()=>{signInWithPopup(auth,new GoogleAuthProvider())}} sx={{mt:3}}>
            <Edit sx={{mr:.5}}/>
            {t["LoginToEditFavs"]}
          </Button>

        </>
      }

    </Stack>
  }
})


export const FavEditor = React.memo(({favorites, setFavorites,setEditFavs})=>{
  const t = useTranslation();
  const classes = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const handleDragEnd = ({source,destination}) => {
    if(!destination || source.index==destination.index) return;
    setFavorites(prev => {
      let vec = [...prev];
      const [insertItem] = vec.splice(source.index,1)
      vec.splice(destination.index,0,insertItem)
      return vec;
    })
  }
  const handleDelete = index => () => {
    setFavorites(prev => {
      let vec = [...prev];
      vec.splice(index,1);
      return vec
    })
  }
  return (
    <Stack justifyContent="center" alignItems="center" sx={{width:"100%"}}>
      <DragDropContext onDragEnd={handleDragEnd} >
        <Droppable droppableId="favorites-list">
          {(provided) => (
            <Box {...provided.droppableProps} ref={provided.innerRef} width={1}>
              {favorites.map((item,index) => (
                <Draggable key={item} draggableId={item} index={index}>
                  {(provided) => (  
                    <Stack className={classes.neumoButton} direction="row" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
                          sx={{justifyContent:"space-between",alignItems:"center", mb: "12px",padding: "3px 13px"}}>
                      <Stack direction="row">
                        <DragIndicator/>
                        <Typography variant="subtitle1" sx={{ml:.5}}>{t[item]}</Typography>
                      </Stack>
                      <IconButton size="small" onClick={handleDelete(index)}><Delete/></IconButton>
                    </Stack>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
      <Stack direction="row" justifyContent="flex-start" width={1}>
        <Button variant="outlined" onClick={()=>{setDialogOpen(true)}} sx={{width:1,mt:1}}>
          {t['AddControl']}
        </Button>  
      </Stack>
      <Button variant="contained" onClick={()=>{setEditFavs(false)}} sx={{mt:3}}>
          {t['EditComplete']}
      </Button> 
      <Dialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} maxWidth="md">
        <DialogTitle sx={{fontWeight:"bold"}}>{t['FavEditorTitle']}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Divider sx={{pr:{md:3}}}>{t["Basic"]}</Divider>
              <Grid container>
                {['Volume',"HR"].map(item=>{
                  const flag = favorites?.includes(item)
                  return <Grid item xs={6} justifyContent="flex-start">
                    <Button 
                      startIcon={flag&&<Check/>} 
                      sx={{color:!flag&&"gray"}} 
                      onClick={()=>!flag ? setFavorites(prev=>([...prev,item])):setFavorites(prev=>prev.filter(x=>x!=item))}
                    >{t[item]}</Button>
                  </Grid>
              })}
              </Grid>
              <Divider sx={{pr:{md:3},mt:2}}>{t["CardiacFn"]}</Divider>
              <Grid container>
                { ["LV","LA","RV","RA"].map(chamber=>
                  CardiacFns.map(item=>{
                    const itemKey = chamber+"_"+item;
                    const flag = favorites?.includes(itemKey);
                    return (
                      <Grid item xs={6} justifyContent="flex-start">
                        <Button startIcon={flag&&<Check/>} sx={{color:!flag&&"gray"}} 
                          onClick={()=>!flag ? setFavorites(prev=>([...prev,itemKey])):setFavorites(prev=>prev.filter(x=>x!=itemKey))}
                        >{t[itemKey]}</Button>
                      </Grid>
                    )
                  })
                )}
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Divider>{t["Vessels"]}</Divider>
                <Grid container>
                { AdvancedVessels.map(itemKey =>{
                    const flag = favorites?.includes(itemKey);
                    return (
                      <Grid item xs={6} justifyContent="flex-start">
                        <Button startIcon={flag&&<Check/>} 
                          sx={{color:!flag&&"gray"}} 
                          onClick={()=>!flag ? setFavorites(prev=>([...prev,itemKey])):setFavorites(prev=>prev.filter(x=>x!=itemKey))}
                        >{t[itemKey]}</Button>
                      </Grid>
                    )
                  }
                )}                
                </Grid>
              <Divider sx={{mt:2}}>{t["Valves"]}</Divider>
                <Grid container>
                {["av","mv","tv","pv"].map(valve=>['s','r'].map(d => {
                  const itemKey = "R"+valve+d;
                  const flag = favorites?.includes(itemKey);
                  return (
                    <Grid item xs={6} justifyContent="flex-start">
                      <Button startIcon={flag&&<Check/>} 
                        sx={{color:!flag&&"gray"}} 
                        onClick={()=>!flag ? setFavorites(prev=>([...prev,itemKey])):setFavorites(prev=>prev.filter(x=>x!=itemKey))}
                      >{t[itemKey]}</Button>
                    </Grid>
                  )
                }))}                  
              </Grid>
              <Divider sx={{mt:2}}>{t["assisted_circulation"]}</Divider>
                <Grid container>
                { ["ECMO","Impella"].map(item=>{
                  const flag = favorites?.includes(item);
                  return <Grid item xs={6} justifyContent="flex-start">
                      <Button startIcon={flag&&<Check/>} 
                        sx={{color:!flag&&"gray"}} 
                        onClick={()=>!flag ? setFavorites(prev=>([...prev,item])):setFavorites(prev=>prev.filter(x=>x!=item))}
                      >{item}</Button>
                    </Grid>
                  }
                )}                 
              </Grid>              
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{justifyContent:"center",pb:2}}>
          <Button variant="contained" onClick={()=>{setDialogOpen(false)}}>{t["EditComplete"]}</Button>
        </DialogActions>
      </Dialog> 
    </Stack>
  )
})

export const BasicInputs = React.memo(({hdp,initialHdps, hdps,setHdps}) => {
  const t = useTranslation();
  console.log(hdp, hdps[hdp])
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
        setHdps(hdp, prev + initialHdps[hdp]*changeValue/100);
        return prev + initialHdps[hdp]*changeValue/100
      })
    }
  }
  useEffect(() => {
    setValue(hdps[hdp])
  }, [hdps,hdp]);
  return <>
    <Grid container justifyContent="center" alignItems="center" display='flex' sx={{mb:1}}>
      <Grid item xs={6}>
        <Typography variant='subtitle1'>{display()}</Typography>
      </Grid>
      <Grid item xs={6} justifyContent="flex-end" alignItems="center" display='flex'>
        <ButtonGroup variant="outlined" size="small">
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
      <Grid item xs={1.5} justifyContent="flex-start" alignItems="center" display='flex' >
        <Typography variant="caption" color="gray">x0.25</Typography>
      </Grid>
      <Grid item xs={9.2} justifyContent="center" alignItems="center" display='flex' >
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
      <Grid item xs={1.3} justifyContent="flex-end" alignItems="center" display='flex' >
        <Typography variant="caption" color="gray">x4.0</Typography>
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

export const CardiacFnsPanel =  React.memo(({hdps,setHdps,initialHdps, mode}) => {
  const t = useTranslation();
  const [chamber, setChamber] = useState('LV');
  const handleChamber = e => {setChamber(e.target.value);}
  return (
    <>
      <ToggleButtonGroup
        color="primary"
        value={chamber}
        exclusive
        onChange={handleChamber}
        size="small"
        sx ={{width:1,'& .MuiToggleButton-root':{pb:'2px',pt:'3px',flexGrow:1}, mb:2}}
      >
        <ToggleButton value="LV">{t["LV"]}</ToggleButton>
        <ToggleButton value="LA">{t["LA"]}</ToggleButton>
        <ToggleButton value="RV">{t["RV"]}</ToggleButton>
        <ToggleButton value="RA">{t["RA"]}</ToggleButton>
      </ToggleButtonGroup>  
      <Stack justifyContent="center" alignItems="center" sx={{width:"100%"}}>
        {CardiacFns.filter(hdp => chamber=="LA"||chamber=="RA" ? hdp!="AV_delay" : true).map(hdp=>(
          mode == "basic" ? 
            <BasicInputs hdp={chamber + "_" + hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps}/> :
            <AdvancedInputs hdp={chamber + "_" + hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps}/> 
        ))}
      </Stack>
    </>
  )
})

export const VesselsPanel =  React.memo(({hdps,setHdps,initialHdps, mode}) => {
  const t = useTranslation();
  const [chamber, setChamber] = useState('s');
  const handleChamber = e => {setChamber(e.target.value);}
  return (
    <>
      <ToggleButtonGroup
        color="primary"
        value={chamber}
        exclusive
        onChange={handleChamber}
        size="small"
        sx ={{width:1,'& .MuiToggleButton-root':{pb:'2px',pt:'3px',flexGrow:1}, mb:2}}
      >
        <ToggleButton value="s">{t["Systemic"]}</ToggleButton>
        <ToggleButton value="p">{t["Pulmonary"]}</ToggleButton>
      </ToggleButtonGroup>  
      <Stack justifyContent="center" alignItems="center" sx={{width:"100%"}}>
        { Vessels.map(hdp=>( 
            mode == "basic" ? 
              <BasicInputs hdp={hdp+chamber} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps}/>:
              <AdvancedInputs hdp={hdp+chamber} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps}/>            
        ))}
      </Stack>
    </>
  )
})

export const ValvesPanel =  React.memo(({hdps,setHdps,initialHdps, mode}) => {
  const t = useTranslation();
  // const [valve, setValve] = useState('av');
  // const handleValve = e => {setValve(e.target.value);}
  return (
    <>
      {/* <ToggleButtonGroup
        color="primary"
        value={valve}
        exclusive
        onChange={handleValve}
        size="small"
        sx ={{width:1,'& .MuiToggleButton-root':{pb:'2px',pt:'3px',flexGrow:1}, mb:2}}
      >
        <ToggleButton value="av">{t["AorticValve"]}</ToggleButton>
        <ToggleButton value="mv">{t["MitralValve"]}</ToggleButton>
        <ToggleButton value="tv">{t["TricuspidValve"]}</ToggleButton>
        <ToggleButton value="pv">{t["PulmonaryValve"]}</ToggleButton>
      </ToggleButtonGroup>   */}
      <Stack justifyContent="center" alignItems="center" sx={{width:"100%"}}>
        {["av","mv","tv","pv"].map(valve=>['s','r'].map(d => (
            <BasicToggleButtons hdp={"R"+valve+d} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps}/> 
        )))}
      </Stack>
    </>
  )
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