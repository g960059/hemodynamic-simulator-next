import React,{useState, useEffect, useRef} from 'react';
import {Box,Grid, Typography, MenuItem,Select, Popover,  Slider, ToggleButtonGroup,ToggleButton,Dialog,DialogContent,DialogTitle,} from '@mui/material'

import {useTranslation} from '../../hooks/useTranslation'
import {InputRanges,VDOptions} from '../../constants/InputSettings'
import EditableText from "../EditableText";
import DeleteMenuItemWithDialog from "../DeleteMenuItemWithDialog";
import ControllerDialog from '../ControllerDialog';
import {z} from 'zod'


const Severity = ["Trivial","Mild","Moderate","Severe"]

const Hdps = [
  'Volume',"HR",
  'LV_Ees', 'LV_alpha', 'LV_Tmax', 'LV_tau', 'LV_AV_delay', 'LA_Ees', 'LA_alpha', 'LA_Tmax', 'LA_tau', 'LA_AV_delay', 'RV_Ees', 'RV_alpha', 'RV_Tmax', 'RV_tau', 'RV_AV_delay', 'RA_Ees', 'RA_alpha', 'RA_Tmax', 'RA_tau', 'RA_AV_delay',
  "Ras","Rap","Rvs","Rvp","Ras_prox","Rap_prox","Rcs","Rcp","Cas","Cap","Cvs","Cvp",
  'Ravs', 'Ravr', 'Rmvs', 'Rmvr', 'Rtvs', 'Rtvr', 'Rpvs', 'Rpvr',
  "ECMO","Impella"
]

const ControllerPanel = React.memo(({engine,view,updateView,removeView, patient, patients, isOwner,}) => {
  const t = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const subscriptionId = engine?.subscribeAllHdpMutation((patientId, key, value) => {
      if (key === 'DELETE_MODEL') {
        if(patient.id == patientId){
          removeView()
        }
      }
    });
    return () => {
      engine?.unsubscribeAllHdpMutation(subscriptionId);
    };
  }, [engine]);

  return (
    <div className='w-full h-full overflow-hidden'>
      <div className='flex items-center p-2 pb-1 pl-4 mb-2 border-solid border-0 border-b border-b-slate-200 relative h-10'>
        <div className='draggable cursor-move font-bold text-base md:text-lg pl-1 whitespace-nowrap overflow-x-auto'>{view?.name || "Controller Panel"}</div>
        <div className='draggable cursor-move flex-grow h-full'></div>
        <div className='p-1 px-3 -my-2 flex items-center cursor-pointer text-slate-600 hover:text-lightBlue-500 transition' onClick={e => { setAnchorEl(e.currentTarget);}}>
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </div>
      </div>
      <Popover 
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={(e)=>{setAnchorEl(null)}}
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
        PaperProps={{style: {backgroundColor: 'transparent'}}}
      >
        <div className='flex flex-col items-center justify-start py-2 bg-white  border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0'>
          <div onClick={()=> {setDialogOpen(true); setAnchorEl(null)}} 
            className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
          >
            <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit
          </div>

          <DeleteMenuItemWithDialog raw onDelete={()=>{removeView(); setAnchorEl();}} onClose={()=>setAnchorEl(null)} message ={"「"+(view?.name || "Metrics") + "」を削除しようとしています。この操作は戻すことができません。"}>
            <div className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1  text-red-500 hover:bg-red-500 hover:text-white">
              <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>                                
              Delete
            </div>
          </DeleteMenuItemWithDialog>
        </div>
      </Popover>   
      {view.items?.length>0 &&
        <div className='w-full px-4 py-2 h-[calc(100%_-_50px)] relative overflow-auto space-y-3'>
          {
            view.items?.map((controllerItem)=> (
              <InputItem 
                controllerItem={controllerItem} 
                patient = {patient}
              />
            ))
          }
        </div>
      }
      {/* <Dialog open={openInfoDialog} onClose={()=>{setOpenInfoDialog(false)}} maxWidth='md' sx={{"& .MuiDialog-paper":{width: "100%"}}}>
        <DialogTitle className='font-bold'>{patient?.name || "無題の患者"}のパラメータ</DialogTitle>
        <DialogContent>
          <div className='w-full md:grid md:grid-cols-2 md:gap-x-10'>
            {
              Object.entries([patient.getInitialHdps(), patient.getHdps()]
                .flatMap(Object.entries)
                .reduce((o,[k,v])=>( {...o, [k]: (o[k]?[...o[k],v]:[v])}),{})).filter(x=>Hdps.includes(x[0])).sort((a,b)=> Hdps.findIndex(hdp=>hdp===a[0]) - Hdps.findIndex(hdp=>hdp===b[0]))
                .map(([k,v])=> (<div className='flex flex-row items-center'>
                  <div className=' mr-2'>{t[k] || k}</div>
                  <div className='flex-grow'></div>
                  {v[0] === v[1] ? 
                    <div className='text-slate-600'>{v[0]}</div> :
                    <><div className='text-slate-600'>{v[0]} → </div><div className='font-bold'>{v[1]}</div></>}
                  <div className='text-xs ml-1 text-slate-600'>{InputRanges[k]?.unit}</div>
                </div>))
            }
          </div>
        </DialogContent>
      </Dialog> */}
      <ControllerDialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} initialView={view} updateView={(newView)=>{updateView({id:view.id, ...newView});}} patients={patients} />

    </div>
  )
})

export default ControllerPanel


export const InputItem =  React.memo(({patient, controllerItem}) => {
  const {hdp, mode, options} = controllerItem
  const {initialHdps, getHdps, setHdps} = patient

  if(hdp == "Impella") return <ImpellaButton key={controllerItem.id} hdps={getHdps()} setHdps={setHdps} />;
  if(hdp == "ECMO") return <EcmoButton key={controllerItem.id}  hdps={getHdps()} setHdps={setHdps} />;
  // if(hdp == "IabpFreq") return <IabpButton key={controllerItem.id} patient={patient} controllerItem={controllerItem}/>;
  // if(["Ravs","Rmvs","Rtvs","Rpvs","Ravr","Rmvr","Rtvr","Rpvr"].includes(hdp)) return <BasicToggleButtons  key={controllerItem.id} hdp={hdp} initialHdps={initialHdps} hdps={getHdps()} setHdps={setHdps}/>
  return <>
    {mode=="basic" && <BasicInputs key={controllerItem.id } patient={patient} controllerItem={controllerItem} />}
    {mode=="advanced" && <AdvancedInputs key={controllerItem.id } patient={patient} controllerItem={controllerItem} />}
    {mode=="customized" && <CustomizedInputs key={controllerItem.id } patient={patient} controllerItem={controllerItem} />}
    {mode=="auto" && <AutoInputs key={controllerItem.id } patient={patient} controllerItem={controllerItem} />}
  </>  
})

export const BasicInputs = React.memo(({patient, controllerItem}) => {
  const {hdp} = controllerItem
  const {initialHdps, getHdps, setHdps, subscribeHdpMutation, unsubscribeHdpMutation} = patient
  const subscriptionIdRef = useRef();

  const t = useTranslation();
  const [value, setValue] = useState(getHdps()[hdp]);
  const display = () => {
    const ratio = value/initialHdps[hdp] - 1
    if(hdp == 'HR') return `${t[hdp]} (${Math.round(value)} bpm)`
    if(value == initialHdps[hdp]) return `${t[hdp]}`
    if(hdp.includes('alpha') || hdp.includes('tau')) return `${t[hdp]} (${ratio>0 ? "-": "+"}${Math.round(Math.abs((ratio*100)))}%)`
    return `${t[hdp]} (${ratio>0 ? "+": ""}${Math.round(ratio*100)}%)`
  }
  const onHandle = (changeRatio)=>()=>{
    if(changeRatio == 0){
      setHdps(hdp, initialHdps[hdp])
    }else if(hdp === 'HR'){
        setHdps(hdp, Math.round(value + initialHdps[hdp]*changeRatio/100));
    }else{
        const newVal = value + initialHdps[hdp]*Number(changeRatio)/100
        setHdps(hdp, newVal);
    }
  }
  useEffect(() => {
    subscriptionIdRef.current = subscribeHdpMutation([hdp])((_,hdpValue)=>{setValue(hdpValue)})
    return () => {
      unsubscribeHdpMutation(subscriptionIdRef.current)
    }
  }, [patient, controllerItem]);
  return <>
    <div className='flex flex-row items-center justify-between flex-wrap'>
      <span className=' text-base whitespace-nowrap'>
        {controllerItem?.label || t[hdp]}
      </span>  
      <div className='inline-flex rounded-md overflow-hidden border-solid border border-slate-200 text-sm font-semibold'>
        <button onClick={onHandle(-(controllerItem?.changeRatio || 10))} className="px-1.5 py-1 border-0 cursor-pointer border-r border-solid border-slate-200 bg-white text-slate-500 focus:z-10 hover:bg-slate-100 transition" >-{controllerItem?.changeRatio || 10}%</button>
        <button onClick={onHandle(0)} className="px-1.5 py-1 border-0 cursor-pointer border-r border-solid border-slate-200 bg-white text-slate-500 focus:z-10 hover:bg-slate-100 transition" >
          <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5' viewBox="0 0 512 512"><path d="M320 146s24.36-12-64-12a160 160 0 10160 160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 58l80 80-80 80"/></svg>
        </button>
        <button  onClick={onHandle(controllerItem?.changeRatio || 10)} className="px-1.5 py-1 border-0 cursor-pointer bg-white text-slate-500 focus:z-10 hover:bg-slate-100 transition">+{controllerItem?.changeRatio || 10}%</button>
      </div>        
    </div>
  </>
})

export const AdvancedInputs = React.memo(({patient, controllerItem}) => {
  const t = useTranslation();
  const {hdp} = controllerItem
  const {initialHdps, getHdps, setHdps, subscribeHdpMutation, unsubscribeHdpMutation} = patient
  const subscriptionIdRef = useRef();
  const [value, setValue] = useState(getHdps()[hdp]);
  const [errorMessage, setErrorMessage] = useState(null);
  const numericParser = z.number()
  useEffect(() => {
    subscriptionIdRef.current = subscribeHdpMutation([hdp])((_,hdpValue)=>{setValue(hdpValue)})
    setValue(getHdps()[hdp])
    return () => {
      unsubscribeHdpMutation(subscriptionIdRef.current)
    }
  }, [patient, controllerItem]);
  return <div className='w-full'>
    <div className='flex flex-row items-center justify-between w-full' >
      <div className='text-sm'>{t[hdp]}</div>
      {/* <ReactiveInput variant="standard" value={value} updateValue={v=>{setValue(v);setHdps(hdp,v)}} unit={InputRanges[hdp].unit}/> */}
      <div>
        <div className='w-32 group flex flex-row items-center justify-center rounded-md bg-slate-100  outline outline-slate-200 hover:outline-blue-500 focus-within:outline-blue-500 pointer-events-none'>
          <EditableText 
            value={value} 
            updateValue={v=>{
              const res = numericParser.safeParse(Number(v))
              if(res.success){
                setErrorMessage(null)
                setHdps(hdp,res.data)
              }else{
                setErrorMessage("有効な数値を入力してください")
              }
            }} 
            className={"pointer-events-auto w-full flex-grow text-right appearance-none px-2 py-1 text-sm border-none bg-slate-100 focus:outline-none focus:border-none "}
          />
          <div className='mr-1 text-xs text-slate-500 pointer-events-none'>{InputRanges[hdp].unit}</div>
        </div>
        {errorMessage && <p className='text-xs text-red-500' >{errorMessage}</p>}
      </div>
    </div>
    <div className='flex flex-row items-center justify-center w-full mb-2 space-x-3' >
      <span className=' text-slate-500 text-sm'>x0.25</span>
        <Slider 
          value={Math.log2(value)}
          min={isFinite(Math.log2(initialHdps[hdp]/4)) ? Math.log2(initialHdps[hdp]/4) : InputRanges[hdp].min } 
          max={isFinite(Math.log2(initialHdps[hdp]*4)) ? Math.log2(initialHdps[hdp]*4) : InputRanges[hdp].max} 
          step={isFinite((Math.log2(initialHdps[hdp])/100)) && (Math.log2(initialHdps[hdp])/100) != 0 ? Math.log2(InputRanges[hdp].max)/100 : 0.01} 
          valueLabelDisplay="auto"
          valueLabelFormat={v => 2**v>100 ? (2**v).toFixed() : (2**v).toPrecision(3)}
          onChange = {(e,v)=> {const fv =2**v>100 ? (2**v).toFixed() : (2**v).toPrecision(3);  setValue(fv);}}
          onChangeCommitted={(e,v)=>{const fv =2**v>100 ? (2**v).toFixed() : (2**v).toPrecision(3);  setHdps(hdp,fv)}}
          className='flex-grow'
          sx={{
            '& .MuiSlider-thumb': {
              height: 16,
              width: 16,
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
        <span className=' text-slate-500 text-sm'>x4.0</span>
    </div>
  </div>
})

export const CustomizedInputs = React.memo(({patient, controllerItem}) => {
  const t = useTranslation();
  const {hdp,options} = controllerItem
  const {getHdps, setHdps, subscribeHdpMutation, unsubscribeHdpMutation} = patient
  const subscriptionIdRef = useRef();
  const [value, setValue] = useState(getHdps()[hdp]);
  useEffect(() => {
    subscriptionIdRef.current = subscribeHdpMutation([hdp])((_,hdpValue)=>{setValue(hdpValue)})
    return () => {
      unsubscribeHdpMutation(subscriptionIdRef.current)
    }
  }, [patient, controllerItem]);
  return (
    <div className='flex flex-row items-center justify-between flex-wrap'>
      <span className=' text-base whitespace-nowrap'>
        {controllerItem?.label || t[hdp]}
      </span>
      <div className='inline-flex rounded-md overflow-hidden border-solid border border-slate-200 text-sm font-semibold'>
        {
          options.map((option)=>(
            <button 
              key={option?.id} 
              onClick={()=>{setHdps(hdp,option.value)}}
              className={`px-1.5 py-1 border-0 cursor-pointer border-r border-solid border-slate-200 ${option.value !=value ? "bg-white text-slate-500 focus:z-10 hover:bg-slate-50" : " bg-blue-100 text-blue-500 hover:bg-blue-50 focus:z-10"} transition`}
            >
              {option.label}
            </button>
          ))
        }
      </div>
      {/* <ToggleButtonGroup
        color="primary"
        value={value}
        exclusive
        onChange={(e,v)=>{setValue(v);setHdps(hdp,v);}}
        size="small"
        sx ={{'& .MuiToggleButton-root':{pb:'2px',pt:'3px',px:1}}}
      > {
        options.map((option,i) => (
          <ToggleButton value={option.value}>{option.label}</ToggleButton>
        ))
      }
      </ToggleButtonGroup>  */}
    </div>
  )  
})


export const AutoInputs = React.memo(({patient, controllerItem}) => {
  const t = useTranslation();
  const {hdp, duration: duration_ms, steps, startValue, targetValue} = controllerItem
  const duration = duration_ms * 1000;
  const {initialHdps, getHdps, setHdps, subscribeHdpMutation, unsubscribeHdpMutation} = patient
  const subscriptionIdRef = useRef();
  const [value, setValue] = useState(getHdps()[hdp]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeoutIds, setTimeoutIds] = useState([]);
  const [replayDirection, setReplayDirection] = useState("forward");
  const timeStep = duration / steps;

  const replayAction = () => {
    if(elapsedTime >= duration){
      if(replayDirection == "forward"){
        setReplayDirection("backward");
      }else{
        setReplayDirection("forward");
      }
      setTimeoutIds([]);
      setElapsedTime(0);
    }
    const consumedSteps = Math.floor(elapsedTime / timeStep);
    const remainingSteps = steps - consumedSteps;
    const startTime = elapsedTime - consumedSteps * timeStep;
    const stepValue = (targetValue-startValue)/steps;
    const computedValueAndTime = (step) => ({value: (replayDirection == "forward" ? startValue + stepValue * (consumedSteps+step+1) : targetValue - stepValue * (consumedSteps+step+1)), time: (step+1) * timeStep- startTime});
    const computedValuesAndTimes = [...Array(remainingSteps).keys()].map(i => computedValueAndTime(i));
    computedValuesAndTimes.forEach(({value:tmpValue,time:TmpTime}, i) => {
      const timeoutId = setTimeout(() => {
        setHdps(hdp,tmpValue);
        setElapsedTime(TmpTime+elapsedTime);
      }, TmpTime );
      setTimeoutIds((prev) => [...prev, timeoutId]);
    });
  }

  const stopAction = () => {
    setTimeoutIds((prev) => {
      prev.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      return [];
    });
  };

  useEffect(() => {
    subscriptionIdRef.current = subscribeHdpMutation([hdp])((_,hdpValue)=>{setValue(hdpValue)})
    return () => {
      unsubscribeHdpMutation(subscriptionIdRef.current)
    }
  }, [patient, controllerItem]);

  useEffect(() => {
    if(elapsedTime >= duration){
      stopAction();
      setElapsedTime(0);
      if(replayDirection == "forward"){
        setReplayDirection("backward");
      }else{
        setReplayDirection("forward");
      }
    } 
  }, [elapsedTime]);


  return <div className='w-full'>
    <div className='flex flex-row items-center justify-between w-full' >
      <div className='text-sm '>{controllerItem?.label ||  t[hdp]}</div>
      <div className='flex-grow'></div>
      {timeoutIds?.length > 0  ? 
        <button className='border border-solid px-1.5 py-0.5 flex flex-row justify-center items-center rounded-md border-slate-200 stroke-slate-500 hover:stroke-slate-700 hover:bg-slate-100' onClick={stopAction} type="button">
          <svg className='w-5 h-5 text-slate-500 stroke-slate-500 fill-slate-500' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z" fill="none" stroke-miterlimit="10" stroke-width="32" stroke="currentColor"/><path d="M310.4 336H201.6a25.62 25.62 0 01-25.6-25.6V201.6a25.62 25.62 0 0125.6-25.6h108.8a25.62 25.62 0 0125.6 25.6v108.8a25.62 25.62 0 01-25.6 25.6z"/></svg>
        </button>
         :
        replayDirection == "backward" ?
          <button className='border border-solid px-1.5 py-0.5 flex flex-row justify-center items-center rounded-md border-slate-200 stroke-slate-500 hover:stroke-slate-700 hover:bg-slate-100' onClick={replayAction} type="button">
              <svg className='w-5 h-5 text-slate-500 stroke-slate-500 fill-slate-500' xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 512 512"><path d="M256 448c106 0 192-86 192-192S362 64 256 64 64 150 64 256s86 192 192 192z" fill="none" stroke-miterlimit="10" stroke-width="32" stroke="currentColor"/><path d="M192 176a16 16 0 0116 16v53l111.68-67.46a10.78 10.78 0 0116.32 9.33v138.26a10.78 10.78 0 01-16.32 9.31L208 267v53a16 16 0 01-32 0V192a16 16 0 0116-16z"/></svg>
          </button> :            
        <>
          <button className='border border-solid px-1.5 py-0.5 flex flex-row justify-center items-center rounded-md border-slate-200 stroke-slate-500 hover:stroke-slate-700 hover:bg-slate-100' onClick={replayAction} type="button">
            <svg className='w-5 h-5 text-slate-500 stroke-slate-500 fill-slate-500' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M112 111v290c0 17.44 17 28.52 31 20.16l247.9-148.37c12.12-7.25 12.12-26.33 0-33.58L143 90.84c-14-8.36-31 2.72-31 20.16z" fill="none" stroke-miterlimit="10" stroke-width="32" stroke="currentColor"/></svg>
          </button>
        </>
      }      
      <div class="w-32 ml-2 bg-gray-200 rounded-full dark:bg-gray-700">
        <div 
          class="bg-blue-500 text-xs h-4 font-medium text-sky-100 text-center p-0.5 leading-none rounded-full" 
          style={{ width: `${replayDirection == "forward" ? elapsedTime/duration*100 : 100- elapsedTime/duration*100}%` }}>
          {(replayDirection == "forward" ) ? Math.round(elapsedTime/duration*100) : Math.round(100- elapsedTime/duration*100)}%
        </div>
      </div>        
    </div>
    <div className='flex flex-row items-center justify-center w-full mb-2 space-x-3' >
  
    </div>
  </div>
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

export const IabpButton = React.memo(({patient,controllerItem}) => {
  const {getHdps, setHdps, subscribeHdpMutation, unsubscribeHdpMutation} = patient
  const subscriptionIdRef = useRef();
  const [value, setValue] = useState(getHdps()[hdp]);
  useEffect(() => {
    subscriptionIdRef.current = subscribeHdpMutation([hdp])((_,hdpValue)=>{setValue(hdpValue)})
    return () => {
      unsubscribeHdpMutation(subscriptionIdRef.current)
    }
  }, [patient, controllerItem]);
 


  return <>
    <Grid container justifyContent="space-between" alignItems="center" display='flex' sx={{mb:1}}>
      <Grid item xs={12} justifyContent="space-between" alignItems="center" display='flex' sx={{mb:.5}}>
        <Typography variant='subtitle1'>アシスト比</Typography>
      </Grid>
      {/* <Grid itex xs={12}  justifyContent="space-between" alignItems="center" display='flex'>
        <ToggleButtonGroup
          color="primary"
          value={iabpFreq}
          exclusive
          onChange={handleFreq}
          size="small"
          sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
        >
          <ToggleButton value={0}>Off</ToggleButton>
          <ToggleButton value={1}>1:1</ToggleButton>
          <ToggleButton value={2}>2:1</ToggleButton>
          <ToggleButton value={3}>3:1</ToggleButton>
        </ToggleButtonGroup>   
      </Grid> */}
      <div className='inline-flex rounded-md overflow-hidden border-solid border border-slate-200 text-sm font-semibold'>
        {
          [0,1,2,3].map((freq)=>(
            <button 
              key={freq} 
              onClick={()=>{setHdps("IabpFreq",freq)}}
              className={`px-1.5 py-1 border-0 cursor-pointer border-r border-solid border-slate-200 ${freq !=value ? "bg-white text-slate-500 focus:z-10 hover:bg-slate-50" : " bg-blue-100 text-blue-500 hover:bg-blue-50 focus:z-10"} transition`}
            >
              {freq == 0 ? "Off" : freq+":1"}
            </button>
          ))
        }
      </div>      
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




// export const AddControllerItem = React.memo(({addItem})=>{
//   const [anchorEl, setAnchorEl] = useState(null);
//   const t = useTranslation();
//   const [controllerItem, setControllerItem] = useImmer({hdp:"",mode:"basic",options:[]});
//   const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
//   const onClickSave = ()=>{
//     if(controllerItem.hdp?.value){
//       addItem({...controllerItem,hdp:controllerItem.hdp.value});
//     }
//     setControllerItem({hdp:"",mode:"basic",options:[],id:nanoid()});
//     setAnchorEl(null)
//   }
//   return <>
//     <ListItem button sx={{"&.MuiListItem-root:hover":{backgroundColor:"#fef0f5"}}} onClick={e=>{setAnchorEl(e.currentTarget)}}>
//       <ListItemIcon><Add color="primary"/></ListItemIcon><ListItemText primary="入力を追加" primaryTypographyProps={{color:"primary"}}/>
//     </ListItem>
//     <Popover
//       open={Boolean(anchorEl)}
//       anchorEl={anchorEl}
//       onClose={()=>{setAnchorEl(null)}}
//       anchorOrigin={{
//         vertical: 'bottom',
//         horizontal: 'left',
//       }}
//     >
//       <Box p={1}>
//         <Stack direction={'column'} justifyContent='center' alignItems='flex-start' spacing={2} p={1} >
//           <Stack direction={'row'} justifyContent='flex-start' alignItems={'center'} spacing={1}>
//             <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>項目</Typography>
//             <Autocomplete 
//               value={controllerItem.hdp} 
//               onChange={(event,newValue)=>{setControllerItem(draft=>{draft.hdp=newValue})}}
//               options={
//                 Hdps.map(hdp=>({label:t[hdp],value:hdp}))
//               }
//               renderInput={(params) => <TextField {...params} value={t[params.value]} />}
//               disableClearable
//               size="small"
//               sx={{minWidth:"240px"}}
//             />        
//           </Stack>
//           <Stack direction={'row'} justifyContent='flex-start' alignItems={'center'} spacing={1}>
//             <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>モード</Typography>
//             <ToggleButtonGroup
//               color="primary"
//               value={controllerItem.mode}
//               exclusive
//               onChange={(e,newValue)=>{setControllerItem(draft=>{draft.mode=newValue})}}
//               size="small"
//               sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
//             >
//               <ToggleButton value="basic">基本</ToggleButton>
//               <ToggleButton value="advanced">詳細</ToggleButton>
//               <ToggleButton value="customized">カスタマイズ</ToggleButton>
//             </ToggleButtonGroup>    
//           </Stack>
//           {
//             controllerItem.mode==="customized" && 
//             <Stack direction={'column'} justifyContent='flex-start' alignItems={'flex-start'} spacing={0.5}>
//               <CustomizedOptionCreater createOption={newOption => setControllerItem(draft=>{draft.options.push(newOption)})} initialOption={{label: "無題のラベル",value:DEFAULT_HEMODYANMIC_PROPS[controllerItem?.hdp?.value]}} unit={InputRanges[controllerItem?.hdp?.value]?.unit}/>
//                 <DragDropContext onDragEnd={({source,destination}) => {
//                   if(!destination || source.index==destination.index) return;
//                   setControllerItem(draft => {
//                     const [insertItem] = draft.options.splice(source.index,1)
//                     draft.options.splice(destination.index,0,insertItem)
//                   })
//                 }}>
//                   <Droppable droppableId="customized-item-creator">
//                     {(provided) => (
//                       <Stack {...provided.droppableProps} ref={provided.innerRef} width={1} alignItems="flex-start">
//                         {controllerItem.options.map((option, index)=>(
//                             <Draggable key={JSON.stringify(option)+index} draggableId={JSON.stringify(option)+index} index={index}>
//                               {(provided) => (
//                                 <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
//                                   <CustomizedOptionItem option={option} updateOption={newOption => setControllerItem(draft=>{draft.options[index]=newOption})} deleteOption={()=>{setControllerItem(draft=>{draft.options.splice(index,1)})}} unit={InputRanges[controllerItem?.hdp?.value]?.unit}  />
//                                 </Box>
//                               )}
//                             </Draggable>                            
//                           ))}                        
//                         {provided.placeholder}
//                       </Stack>
//                     )}
//                   </Droppable>
//                 </DragDropContext>
//             </Stack>
//           }
//         </Stack>
//         { controllerItem.hdp.value && controllerItem.mode &&
//           <Stack direction='column' justifyContent='center' alignItems='flex-start' position="relative" spacing={1} py={1} px={2} mt={1} sx={{border:"1px solid #cfdce6", borderRadius:"8px", color:"#757575"}}>
//             <Box position="absolute" zIndex={100} width={1} height={1}></Box>
//             <Typography variant={isUpMd ?'caption':'subtitle1'} ml="3px" width={70} color="secondary">Preview</Typography>
//             <PreviewItem hdp={controllerItem.hdp.value} mode={controllerItem.mode} options={controllerItem.options}/>
//           </Stack>
//         }
//         <Stack direction="row" width="100%" justifyContent="flex-end" alignItems="center" spacing={1} sx={{pt:1}}>
//           <Button onClick={()=>{setControllerItem({hdp:"",mode:"basic",options:[]});setAnchorEl(null);}} color='secondary'>Cancel</Button>
//           <Button onClick={onClickSave} variant="contained">追加する</Button>
//         </Stack>
//       </Box>
//     </Popover>    
//   </>
// })

// export const CustomizedOptionCreater = React.memo(({createOption,initialOption, unit=""})=>{
//   const [option, setOption] = useImmer(initialOption);
//   const [editing, setEditing] = useState(false);
//   if(!editing){
//     return <Button onClick={()=>{setEditing(true)}}>オプションを追加する</Button>
//   }else{
//     return (
//       <Stack direction={'row'} justifyContent='flex-start' alignItems={'center'} spacing={1} sx={{p:1}}>
//         <ReactiveInput type="text" value={option.label} updateValue={ newVal => setOption(draft=>{draft.label=newVal})}/>
//         <ReactiveInput variant='standard' value={option.value} updateValue={ newVal => setOption(draft=>{draft.value=newVal})} unit={unit} sx={{"& input":{padding: "8px",maxWidth:"90px"}, pr:.5}}/>
//         <Button onClick={()=>{createOption(option); setOption(initialOption); setEditing(false)}}>追加</Button>
//       </Stack>
//     )
//   }
// })

// export const CustomizedOptionItem = React.memo(({option:initialOption, updateOption,deleteOption,unit=""})=>{
//   const [option, setOption] = useImmer(initialOption);
//   const [editing, setEditing] = useState(false);
//   if(editing){
//     return (          
//       <Stack direction={'row'} justifyContent='flex-start' alignItems={'center'} spacing={1} sx={{px:1}}>
//         <ReactiveInput type="text" value={option.label} updateValue={ newVal => setOption(draft=>{draft.label=newVal})}/>
//         <ReactiveInput variant='standard' value={option.value} updateValue={ newVal => setOption(draft=>{draft.value=newVal})} unit={unit} sx={{"& input":{padding: "8px",maxWidth:"90px"}, pr:.5}}/>
//         <Button color="secondary" onClick={()=>{setOption(initialOption);setEditing(false)}}>キャンセル</Button>
//         <Button variant="contained" onClick={()=>{updateOption(option);setEditing(false)}}>更新する</Button>
//       </Stack>
//     )
//   }else{
//     return <Stack direction='row' justifyContent='center' alignItems="center" spacing={1} sx={{px:1}}>
//       <IconButton><DragIndicator/></IconButton>
//       <Typography variant='subtitle1' onClick={()=>{setEditing(true)}}>{option.label + "  " + option.value + unit}</Typography>
//       <IconButton edge="end" aria-label="delete" onClick={deleteOption}>
//         <Delete/>
//       </IconButton>
//     </Stack> 
//   }
// })

// export const PreviewItem = React.memo(({hdp,mode,options})=>{
//   const t = useTranslation();
//   return <>
//     {mode==="basic" && 
//       <Grid container justifyContent="center" alignItems="center" display='flex' sx={{mb:1}}>
//         <Grid item xs={6.5}>
//           <Typography variant='subtitle1'>{t[hdp]}</Typography>
//         </Grid>
//         <Grid item xs={5.5} justifyContent="flex-end" alignItems="center" display='flex'>
//           <ButtonGroup  size="small" color="secondary" 
//             sx={{
//               "& .MuiButtonGroup-groupedOutlined":{
//                 border: "1px solid rgba(0, 0, 0, 0.12)",color: "rgba(0, 0, 0, 0.54)",
//                 "&:hover":{
//                   backgroundColor: "rgba(239, 246, 251, 0.6)",
//                   borderColor: "rgb(207, 220, 230) !important"
//                 },
//               }
//             }}>
//             <Button>-10%</Button>
//             <Button><Refresh/></Button>
//             <Button>+10%</Button>
//           </ButtonGroup>
//         </Grid>
//       </Grid>
//     }
//     {mode==="advanced" && <>
//       <Grid container justifyContent="center" alignItems="center" display='flex' >
//         <Grid item xs={7}>
//           <Typography variant='subtitle1'>{t[hdp]}</Typography>
//         </Grid>
//         <Grid item xs={5} justifyContent="flex-end" alignItems="center" display='flex'>
//           <ReactiveInput variant="standard" unit={InputRanges[hdp]?.unit}/>
//         </Grid>
//       </Grid>
//       <Grid container justifyContent="center" alignItems="center" display='flex' sx={{mb:1}}>
//         <Grid item xs={2} justifyContent="flex-start" alignItems="center" display='flex' >
//           <Typography variant="subtitle2" color="gray">x0.25</Typography>
//         </Grid>
//         <Grid item xs={8} justifyContent="center" alignItems="center" display='flex' >
//           <Slider 
//             sx={{
//               '& .MuiSlider-thumb': {
//                 height: 24,
//                 width: 24,
//                 backgroundColor: '#fff',
//                 border: '2px solid currentColor',
//                 '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
//                   boxShadow: 'inherit',
//                 },
//                 '&:before': {
//                   display: 'none',
//                 }
//               },
//               '& .MuiSlider-track': {
//                 height: 4,
//                 backgroundColor: "#3ea8ff",
//                 border:'none'
//               },
//               '& .MuiSlider-rail': {
//                 color: '#d8d8d8',
//                 height: 3,
//               },
//             }}
//           />   
//         </Grid>
//         <Grid item xs={2} justifyContent="flex-end" alignItems="center" display='flex' >
//           <Typography variant="subtitle2" color="gray">x4.0</Typography>
//         </Grid>
//       </Grid>    
//     </>
//     }
//     {mode==="customized" && 
//       <>
//         <Grid container justifyContent="flex-start" alignItems="center" display='flex' sx={{mb:1}}>
//           <Grid item xs={6.5}>
//             <Typography variant='subtitle1'>{t[hdp]}</Typography>
//           </Grid>
//           <Grid item justifyContent="flex-end" alignItems="center" display='flex'>
//             <ToggleButtonGroup
//               value={0}
//               color="primary"
//               size="small"
//               sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
//             >
//               {options.map((option,index)=><ToggleButton value={index}>{option.label}</ToggleButton>)}
//             </ToggleButtonGroup>
//           </Grid>
//         </Grid>      
//       </>    
//     }
//   </>
// })

// export const EditControllerItem = ({initialItem,updateItem, deleteItem}) => {
//   const [anchorEl, setAnchorEl] = useState(null);
//   const classes = useStyles();
//   const t = useTranslation();
//   const [controllerItem, setControllerItem] = useImmer({...initialItem,hdp:{label:t[initialItem.hdp],value:initialItem.hdp}});
//   const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
//   const onClickSave = ()=>{
//     updateItem({...controllerItem,hdp:controllerItem.hdp.value});
//     setAnchorEl(null)
//   }
//   return <>
//     <ListItem onClick={e=>{setAnchorEl(e.currentTarget)}} className={classes.firestoreList} secondaryAction={
//       <IconButton edge="end" aria-label="delete" onClick={deleteItem}>
//         <Delete/>
//       </IconButton>
//     }>
//       <ListItemIcon ><DragIndicator/></ListItemIcon>                      
//       <ListItemText primary={t[controllerItem.hdp.value]} sx={{cursor:"pointer"}}/>
//     </ListItem>    
//     <Popover
//       open={Boolean(anchorEl)}
//       anchorEl={anchorEl}
//       onClose={()=>{setAnchorEl(null)}}
//       anchorOrigin={{
//         vertical: 'bottom',
//         horizontal: 'left',
//       }}
//     >
//       <Box p={1}>
//         <Stack direction='column' justifyContent='center' alignItems='flex-start' spacing={2} p={1} >
//           <Stack direction='row' justifyContent='flex-start' alignItems='center' spacing={1}>
//             <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>項目</Typography>
//             <Autocomplete 
//               value={controllerItem.hdp} 
//               onChange={(event,newValue)=>{setControllerItem(draft=>{draft.hdp=newValue})}}
//               options={
//                 Hdps.map(hdp=>({label:t[hdp],value:hdp}))
//               }
//               renderInput={(params) => <TextField {...params} value={t[params.value]} />}
//               disableClearable
//               size="small"
//               sx={{minWidth:"240px"}}
//             />        
//           </Stack>
//           <Stack direction='row' justifyContent='flex-start' alignItems='center' spacing={1}>
//             <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>モード</Typography>
//             <ToggleButtonGroup
//               color="primary"
//               value={controllerItem.mode}
//               exclusive
//               onChange={(e,newValue)=>{setControllerItem(draft=>{draft.mode=newValue})}}
//               size="small"
//               sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
//             >
//               <ToggleButton value="basic">基本</ToggleButton>
//               <ToggleButton value="advanced">詳細</ToggleButton>
//               <ToggleButton value="customized">カスタマイズ</ToggleButton>
//             </ToggleButtonGroup>    
//           </Stack>
//           {
//             controllerItem.mode==="customized" && 
//             <Stack direction={'column'} justifyContent='flex-start' alignItems={'flex-start'} spacing={0.5}>
//               <CustomizedOptionCreater createOption={newOption => setControllerItem(draft=>{draft.options.push(newOption)})} initialOption={{label: "無題のラベル",value:DEFAULT_HEMODYANMIC_PROPS[controllerItem?.hdp?.value]}} unit={InputRanges[controllerItem?.hdp?.value]?.unit}/>
//                 <DragDropContext onDragEnd={({source,destination}) => {
//                   if(!destination || source.index==destination.index) return;
//                   setControllerItem(draft => {
//                     const [insertItem] = draft.options.splice(source.index,1)
//                     draft.options.splice(destination.index,0,insertItem)
//                   })
//                 }}>
//                   <Droppable droppableId="customized-item-creator">
//                     {(provided) => (
//                       <Stack {...provided.droppableProps} ref={provided.innerRef} width={1} alignItems="flex-start">
//                         {controllerItem.options?.map((option, index)=>(
//                             <Draggable key={JSON.stringify(option)+index} draggableId={JSON.stringify(option)+index} index={index}>
//                               {(provided) => (
//                                 <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
//                                   <CustomizedOptionItem option={option} updateOption={newOption => setControllerItem(draft=>{draft.options[index]=newOption})} deleteOption={()=>{setControllerItem(draft=>{draft.options.splice(index,1)})}} unit={InputRanges[controllerItem?.hdp?.value]?.unit}  />
//                                 </Box>
//                               )}
//                             </Draggable>                            
//                           ))}                        
//                         {provided.placeholder}
//                       </Stack>
//                     )}
//                   </Droppable>
//                 </DragDropContext>
//             </Stack>
//           }
//         </Stack>
//         { controllerItem.hdp.value && controllerItem.mode &&
//           <Stack direction='column' justifyContent='center' alignItems='flex-start' position="relative" spacing={1} py={1} px={2} mt={1} sx={{border:"1px solid #cfdce6", borderRadius:"8px", color:"#757575"}}>
//             <Box position="absolute" zIndex={100} width={1} height={1}></Box>
//             <Typography variant={isUpMd ?'caption':'subtitle1'} ml="3px" width={70} color="secondary">Preview</Typography>
//             <PreviewItem hdp={controllerItem.hdp.value} mode={controllerItem.mode} options={controllerItem.options}/>
//           </Stack>
//         }
//         <Stack direction="row" width="100%" justifyContent="center" alignItems="center" spacing={1} sx={{pt:1}}>
//           <IconButton edge="end" aria-label="delete" onClick={()=>{deleteItem();setAnchorEl(null)}}>
//             <Delete/>
//           </IconButton>
//           <Box sx={{flexGrow:1}}></Box>       
//           <Button onClick={()=>{setControllerItem({...initialItem,hdp:{label:t[initialItem.hdp],value:initialItem.hdp}});setAnchorEl(null);}}>Cancel</Button>
//           <Button onClick={onClickSave} variant="contained">更新する</Button>
//         </Stack>
//       </Box>
//     </Popover>    
//   </>  
// }

// export const ControllerEditor = ({initialController,updateController})=>{
//   const classes = useStyles()
//   const t = useTranslation();
//   const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
//   const [controller, setController] = useImmer(initialController);
//   const [controllerNameEditing, setControllerNameEditing] = useState(false);
//   const [dialogParentNameEditing, setDialogParentNameEditing] = useState(false);
//   const [dialogChildNameEditing, setDialogChildNameEditing] = useState(false);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [selectedParentIndex, setSelectedParentIndex] = useState(null);
//   const [selectedChildIndex, setSelectedChildIndex] = useState(null);
//   console.log(selectedParentIndex, selectedChildIndex)
//   return <>
//     <Tooltip title="コントローラーを編集する">
//       <IconButton onClick={()=>{setDialogOpen(true)}} size="small" className={classes.faintNeumoButton} sx={{mr:1}}><EditOutlined/></IconButton>
//     </Tooltip>
//     <Dialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} maxWidth='md' sx={{"& .MuiDialog-paper":{width: "100%"}}}>
//       <DialogContent>
//         <Grid container sx={{border: "1px solid #5c93bb2b",borderRadius: "15px"}} disablePadding>
//           <Grid item xs={12} px={2} py={1} sx={{backgroundColor:"whitesmoke"}}>
//             <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
//               <Link onClick={()=>{setSelectedChildIndex(null);setSelectedParentIndex(null)}} component="button" variant="body1" href="#" underline="hover" color="inherit" sx={{"&:hover":{color:"#f16a95"}}}>
//                 <div className='px-1.5 m-1.5 mx-0  inline-flex items-center'>
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-slate-500" viewBox="0 0 20 20" fill="currentColor">
//                     <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
//                   </svg>
//                 </div>
//               </Link>
//               {selectedParentIndex!=null && <Link onClick={()=>{setSelectedChildIndex(null)}} component="button" variant="body1" href="#" underline="hover" color="inherit" sx={{"&:hover":{color:"#f16a95"}}}>{controller.controllers[selectedParentIndex]?.name}</Link>}
//               {selectedParentIndex!=null && selectedChildIndex != null && <Link variant="body1" href="#" underline="none" color="inherit" >{controller.controllers[selectedParentIndex].controllers[selectedChildIndex]?.name}</Link>}
//             </Breadcrumbs>
//           </Grid>
//           <Grid item xs={12}>
//             <Divider flexItem/>
//           </Grid>
//           <Slide direction={"right"} in={isUpMd || selectedParentIndex==null} mountOnEnter unmountOnExit>
//             <Grid item xs={12} md={4} sx={{display: !isUpMd && selectedParentIndex!=null && "none"}}>
//               <List sx={{"& .MuiListItemIcon-root":{minWidth: "32px"}}} disablePadding>               
//                 {/* <ListItem sx={{backgroundColor:"whitesmoke"}}>
//                 {
//                   controllerNameEditing ? 
//                     <ReactiveInput 
//                       value={controller?.name} 
//                       updateValue={newName=>{
//                         setController({...controller,name:newName});
//                         setControllerNameEditing(false)
//                       }} 
//                       type="text" autoFocus/> :
//                     <Typography variant="h6" fontWeight="bold" onClick={()=>{setControllerNameEditing(true)}} sx={{width:1,cursor:"pointer","&:hover":{backgroundColor:"rgba(0, 0, 0, 0.04)"}}}>{controller?.name}</Typography>
//                 }                  
//                 </ListItem> */}
//                 <Divider/>
//                 <ListItem 
//                   button sx={{"&.MuiListItem-root:hover":{backgroundColor:"#fef0f5"}}} 
//                   onClick={()=>{
//                     const id=nanoid(); 
//                     setController(draft=>{draft.controllers.push({id,name:"無題のタブ",items:[],controllers:[]});setSelectedParentIndex(draft.controllers.length-1);setDialogParentNameEditing(true)});
//                   }}
//                 >
//                   <ListItemIcon ><Add color="primary"/></ListItemIcon><ListItemText primary="タブを追加" primaryTypographyProps={{color:"primary"}}/>
//                 </ListItem>
//                 <DragDropContext onDragEnd={({source,destination}) => {
//                   if(!destination || source.index==destination.index) return;
//                   setController(draft => {
//                     const [insertItem] = draft.controllers.splice(source.index,1)
//                     draft.controllers.splice(destination.index,0,insertItem)
//                     setSelectedParentIndex(destination.index)
//                   })
//                 }} >
//                   <Droppable droppableId="root-tab">
//                     {(provided) => (
//                       <Box {...provided.droppableProps} ref={provided.innerRef} width={1}>
//                         {controller.controllers.map((controllerItem, index)=>(
//                             <Draggable key={controllerItem.id} draggableId={controllerItem.id} index={index}>
//                               {(provided) => (  
//                                 <ListItem 
//                                   className={classes.firestoreList} 
//                                   button 
//                                   selected={index==selectedParentIndex} 
//                                   onClick={()=>{setSelectedParentIndex(index); setSelectedChildIndex(null)}}
//                                   ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
//                                 >
//                                   <ListItemIcon ><DragIndicator/></ListItemIcon>
//                                   <ListItemText primary={controllerItem.name} sx={{cursor:"pointer"}}/>
//                                   {index==selectedParentIndex ? <ChevronRight sx={{display:"block"}}/> : null}
//                                 </ListItem>
//                               )}
//                             </Draggable>                            
//                           ))}                        
//                         {provided.placeholder}
//                       </Box>
//                     )}
//                   </Droppable>
//                 </DragDropContext>
//                 <Divider/>                
//                 <AddControllerItem addItem={newItem => {setController(draft=>{draft.items.push(newItem)})}}/>
//                 <DragDropContext onDragEnd={({source,destination}) => {
//                   if(!destination || source.index==destination.index) return;
//                   setController(draft => {
//                     const [insertItem] = draft.items.splice(source.index,1)
//                     draft.items.splice(destination.index,0,insertItem)
//                   })
//                 }} >
//                   <Droppable droppableId="root-item">
//                     {(provided) => (
//                       <Box {...provided.droppableProps} ref={provided.innerRef} width={1}>
//                         {controller.items?.map((controllerItem, index)=>(
//                           <Draggable key={controllerItem.id} draggableId={controllerItem.id} index={index}>
//                             {(provided) => (
//                               <div
//                                 ref={provided.innerRef} 
//                                 {...provided.draggableProps} {...provided.dragHandleProps}
//                               >
//                                 <EditControllerItem 
//                                   initialItem={controllerItem} 
//                                   updateItem={newItem => {setController(draft=>{if(draft?.items){draft.items[index]=newItem}})}}
//                                   deleteItem={()=>{setController(draft=>{draft?.items.splice(index,1)});}}
//                                 />    
//                               </div>
//                             )}
//                           </Draggable>                            
//                         ))}                        
//                         {provided.placeholder}
//                       </Box>
//                     )}
//                   </Droppable>
//                 </DragDropContext>         
//               </List>
//             </Grid>
//           </Slide>
//           <Divider orientation="vertical" flexItem/>
//           <Slide direction="left" in={isUpMd || selectedParentIndex!=null} mountOnEnter unmountOnExit>
//             <Grid item xs={12} md={4} sx={{display: !isUpMd && (selectedParentIndex==null || selectedParentIndex!=null && selectedChildIndex!=null) && "none"}}>
//               <List sx={{"& .MuiListItemIcon-root":{minWidth: "32px"}}} disablePadding>
//                 {selectedParentIndex != null && <ListItem sx={{backgroundColor:"whitesmoke"}} className={isUpMd && classes.secondaryActionHidden} secondaryAction={
//                   <IconButton edge="end" aria-label="delete" onClick={()=>{setController(draft=>{draft.controllers.splice(selectedParentIndex,1)});setSelectedParentIndex(null);setSelectedChildIndex(null)}}>
//                     <Delete/>
//                   </IconButton>
//                 }>
//                   {
//                     dialogParentNameEditing ? 
//                       <ReactiveInput 
//                         value={controller.controllers[selectedParentIndex].name} 
//                         updateValue={newName=>{
//                           setController(draft=>{draft.controllers[selectedParentIndex].name=newName})
//                           setDialogParentNameEditing(false)
//                         }} 
//                         type="text" autoFocus/> :
//                       <Typography variant="h6" fontWeight="bold" onClick={()=>{setDialogParentNameEditing(true)}} sx={{width:1,cursor:"pointer","&:hover":{backgroundColor:"rgba(0, 0, 0, 0.04)"}}}>{controller.controllers[selectedParentIndex]?.name}</Typography>
//                   }
//                 </ListItem>}
//                 <Divider/>
//                 <ListItem button 
//                   sx={{"&.MuiListItem-root:hover":{backgroundColor:"#fef0f5"}}}
//                   onClick={()=>{
//                     const id=nanoid(); 
//                     setController(draft=>{draft.controllers[selectedParentIndex].controllers.push({id,name:"無題のタブ",items:[],controllers:[]});setSelectedChildIndex(draft.controllers[selectedParentIndex].controllers.length-1);setDialogChildNameEditing(true)});
//                   }}
//                 >
//                   <ListItemIcon ><Add color="primary"/></ListItemIcon><ListItemText primary="タブを追加" primaryTypographyProps={{color:"primary"}}/>
//                 </ListItem>
//                 <DragDropContext onDragEnd={({source,destination}) => {
//                   if(!destination || source.index==destination.index) return;
//                   setController(draft => {
//                     const [insertItem] = draft.controllers[selectedParentIndex].controllers.splice(source.index,1)
//                     draft.controllers[selectedParentIndex].controllers.splice(destination.index,0,insertItem)
//                     setSelectedChildIndex(destination.index)
//                   })
//                 }} >
//                   <Droppable droppableId="parent-tab">
//                     {(provided) => (
//                       <Box {...provided.droppableProps} ref={provided.innerRef} width={1}>
//                         {controller.controllers[selectedParentIndex]?.controllers.map((controllerItem, index)=>(
//                             <Draggable key={controllerItem.id} draggableId={controllerItem.id} index={index}>
//                               {(provided) => (  
//                                 <ListItem 
//                                   className={classes.firestoreList} 
//                                   button 
//                                   selected={index==selectedChildIndex} 
//                                   onClick={()=>{setSelectedChildIndex(index)}}
//                                   ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
//                                 >
//                                   <ListItemIcon ><DragIndicator/></ListItemIcon>
//                                   <ListItemText primary={controllerItem.name} sx={{cursor:"pointer"}}/>
//                                   {index==selectedChildIndex ? <ChevronRight sx={{display:"block"}}/> : null}
//                                 </ListItem>
//                               )}
//                             </Draggable>                            
//                           ))}                        
//                         {provided.placeholder}
//                       </Box>
//                     )}
//                   </Droppable>
//                 </DragDropContext>
//                 <Divider/>
//                 <AddControllerItem addItem={newItem => {setController(draft=>{draft.controllers[selectedParentIndex].items.push(newItem)})}}/>                
                
//                 <DragDropContext onDragEnd={({source,destination}) => {
//                   if(!destination || source.index==destination.index) return;
//                   setController(draft => {
//                     const [insertItem] = draft.controllers[selectedParentIndex]?.items.splice(source.index,1)
//                     draft.controllers[selectedParentIndex]?.items.splice(destination.index,0,insertItem)
//                   })
//                 }} >
//                   <Droppable droppableId="parent-item">
//                     {(provided) => (
//                       <Box {...provided.droppableProps} ref={provided.innerRef} width={1}>
//                         {controller.controllers[selectedParentIndex]?.items?.map((controllerItem, index)=>(
//                           <Draggable key={controllerItem.id} draggableId={controllerItem.id} index={index}>
//                             {(provided) => (
//                               <div
//                                 ref={provided.innerRef} 
//                                 {...provided.draggableProps} {...provided.dragHandleProps}
//                               >
//                                 <EditControllerItem 
//                                   initialItem={controllerItem} 
//                                   updateItem={newItem => {setController(draft=>{draft.controllers[selectedParentIndex].items[index]=newItem})}}
//                                   deleteItem={()=>{setController(draft=>{draft.controllers[selectedParentIndex].items.splice(index,1)});}}
//                                 />     
//                               </div>
//                             )}
//                           </Draggable>                            
//                         ))}                        
//                         {provided.placeholder}
//                       </Box>
//                     )}
//                   </Droppable>
//                 </DragDropContext>
//               </List>
//             </Grid>
//           </Slide> 
//           <Divider orientation="vertical" flexItem/>
//           <Slide direction="left" in={isUpMd || selectedChildIndex!=null && selectedParentIndex!=null} mountOnEnter unmountOnExit>
//             <Grid item xs={12} md={3.9} sx={{display: !isUpMd || selectedChildIndex==null && "none"}}>
//               <List disablePadding>
//                 <ListItem sx={{backgroundColor:"whitesmoke"}} className={isUpMd && classes.secondaryActionHidden} secondaryAction={
//                   <IconButton edge="end" aria-label="delete" onClick={()=>{setController(draft=>{draft.controllers[selectedParentIndex].controllers.splice(selectedChildIndex,1)});setSelectedChildIndex(null)}}>
//                     <Delete/>
//                   </IconButton>
//                 }>
//                   {
//                     dialogChildNameEditing ? 
//                       <ReactiveInput 
//                         value={controller.controllers[selectedParentIndex].controllers[selectedChildIndex]?.name} 
//                         updateValue={newName=>{
//                           setController(draft=>{draft.controllers[selectedParentIndex].controllers[selectedChildIndex].name=newName})
//                           setDialogChildNameEditing(false)
//                         }} 
//                         type="text" autoFocus/> :
//                       <Typography variant="h6" fontWeight="bold" onClick={()=>{setDialogChildNameEditing(true)}} sx={{width:1,cursor:"pointer","&:hover":{backgroundColor:"rgba(0, 0, 0, 0.04)"}}}>{controller.controllers[selectedParentIndex]?.controllers[selectedChildIndex]?.name}</Typography>
//                   }
//                 </ListItem> 
//                 <Divider/> 
//                 <AddControllerItem addItem={newItem => {setController(draft=>{draft.controllers[selectedParentIndex].controllers[selectedChildIndex].items.push(newItem)})}}/>
//                 <DragDropContext onDragEnd={({source,destination}) => {
//                   if(!destination || source.index==destination.index) return;
//                   setController(draft => {
//                     const [insertItem] = draft.controllers[selectedParentIndex].controllers[selectedChildIndex]?.items.splice(source.index,1)
//                     draft.controllers[selectedParentIndex].controllers[selectedChildIndex]?.items.splice(destination.index,0,insertItem)
//                   })
//                 }} >
//                   <Droppable droppableId="child-item">
//                     {(provided) => (
//                       <Box {...provided.droppableProps} ref={provided.innerRef} width={1}>
//                         {controller.controllers[selectedParentIndex]?.controllers[selectedChildIndex]?.items?.map((controllerItem, index)=>(
//                           <Draggable key={controllerItem.id} draggableId={controllerItem.id} index={index}>
//                             {(provided) => (
//                               <div
//                                 ref={provided.innerRef} 
//                                 {...provided.draggableProps} {...provided.dragHandleProps}
//                               >
//                               <EditControllerItem 
//                                 initialItem={controllerItem} 
//                                 updateItem={newItem => {setController(draft=>{draft.controllers[selectedParentIndex].controllers[selectedChildIndex].items[index]=newItem})}}
//                                 deleteItem={()=>{setController(draft=>{draft.controllers[selectedParentIndex].controllers[selectedChildIndex].items.splice(index,1)});}}
//                               />
//                               </div>
//                             )}
//                           </Draggable>                            
//                         ))}                        
//                         {provided.placeholder}
//                       </Box>
//                     )}
//                   </Droppable>
//                 </DragDropContext>      
//               </List>
//             </Grid> 
//           </Slide>
//         </Grid>
//       </DialogContent>
//       <DialogActions>
//         <Stack direction="row" spacing={2}>
//           <Button color="secondary" onClick={()=>{setController(initialController);setDialogOpen(false)}}>Cancel</Button>
//           <Button variant="contained" onClick={()=>{updateController(controller);setDialogOpen(false)}}>{t["Save"]}</Button>
//         </Stack>
//       </DialogActions>
//     </Dialog>  
//   </>
// }

// const useStyles = makeStyles((theme) =>({

//   firestoreList: {
//     "&.Mui-selected":{
//       backgroundColor:"rgba(0, 0, 0, 0.04)", 
//       "&:hover":{
//         backgroundColor:"rgba(0, 0, 0, 0.04)"
//       }
//     },
//     "& .MuiListItemIcon-root .MuiSvgIcon-root":{
//       display:"none"
//     },
//     "&.MuiListItem-root:hover .MuiListItemIcon-root .MuiSvgIcon-root":{
//       display:"block"
//     },
//     "& .MuiListItemSecondaryAction-root .MuiButtonBase-root":{
//       display:"none"
//     },
//     "&.MuiListItem-root:hover .MuiListItemSecondaryAction-root .MuiButtonBase-root":{
//       display:"block"
//     }
//   },
//   secondaryActionHidden: {
//     "& .MuiListItemSecondaryAction-root .MuiButtonBase-root":{
//       display:"none"
//     },
//     "&.MuiListItem-root:hover .MuiListItemSecondaryAction-root .MuiButtonBase-root":{
//       display:"block"
//     }
//   }
// }),
// );