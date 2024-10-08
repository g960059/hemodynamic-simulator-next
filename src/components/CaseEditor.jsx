import React, {useState, useEffect, useCallback} from 'react'
import {Button,Dialog,Popover,MenuItem,Select,useMediaQuery, Grow} from '@mui/material'
import PlaySpeedButtonsNext from './PlaySpeedButtonsNext'
import MetricsPanel from './MetricsPanel'
import ControllerPanelNext from './controllers/ControllerPanelNext'
import NotePanel from './NotePanel'
import RealTimeChartNext from './RealTimeChartNext'
import PressureVolumeCurveNext from './PressureVolumeCurveNext'
import ActionRecorderPanel from './ActionRecorderPanel'
import PlotPanel from './PlotPanel'
import FittingPanel from './FittingPanel';
import ModelManager from './ModelManager'
import GuytonStarlingPlot from './GuytonStarlingPlot'

import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { useImmer } from "use-immer";
import {nanoid,calculatePosition} from "../utils/utils"
import {getTimeSeriesPressureFn,  getTimeSeriesFlowFn, paramPresets, controllableHdpTypes, AllHdpOptions}  from "../utils/presets"
import { formatDateDiff } from '../utils/utils'
import EditableText from './EditableText';
import ChartDialog from './ChartDialog';
import MetricsDialog from './MetricsDialog';
import ControllerDialog from './ControllerDialog';
import GuytonStarlingPlotDialog from './GuytonStarlingPlotDialog'
import NoteDialog from './NoteDialog'
import PlotDialog from './PlotDialog'
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation' 
import Link from 'next/link';
import Image from 'next/image'
import { Responsive, WidthProvider } from "react-grid-layout";
import TextareaAutosize from "react-textarea-autosize";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
const ResponsiveReactGridLayout = WidthProvider(Responsive);
import { getRandomColor } from '../styles/chartConstants'


SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY);


const StyledReactGridLayout = styled(ResponsiveReactGridLayout)`
  & .react-grid-item.react-grid-placeholder {
    background: #3ea8ff !important;
  }
`;


const CaseEditor = React.memo(({engine,caseData,setCaseData,patients,setPatients ,views, setViews, isLogin, isOwner, addLike, removeLike, addBookmark, removeBookmark, liked, bookmarked, isEdit}) => {
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [mounted, setMounted] = useState(false);
  const router = useRouter()

  const removeView = useCallback((viewId) => {
    setViews(draft => draft.filter(v => v.id !== viewId));
    setCaseData(draft => {
      draft.layouts.md = draft.layouts.md.filter(item => item.i !== viewId);
      draft.layouts.xs = draft.layouts.xs.filter(item => item.i !== viewId);
    });
  }, [setViews, setCaseData]);

  const updateView = useCallback((viewId, newView) => {
    setViews(draft => {
      const index = draft.findIndex(v => v.id === viewId);
      if (index !== -1) {
        draft[index] = { ...draft[index], ...newView };
      }
    });
  }, [setViews]);

  const updatePatientParameters = (patientId, parameters) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      const updatedPatient = { ...patient };
      Object.entries(parameters).forEach(([key, value]) => {
        updatedPatient.setHdps(key, value);
      });
      setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));
    }
  };

  useEffect(() => {
    if (views?.length>0 || patients?.length>0){setMounted(true);}
  }, []);


  return <div className='w-full pb-3'> 
    <div className='flex flex-col mb-3  mx-3 md:mx-8 md:items-start justify-center'>
      <div className='flex flex-col md:flex-row w-full items-center justify-center'>
        {(!isOwner || !isEdit) ? 
          <div className={`mt-4 ${isOwner && !isEdit && !isUpMd ? "mb-0" : "mb-6"}  text-xl md:text-2xl font-bold text-slate-800 `}>{caseData?.name}</div> :
          <TextareaAutosize
            value={caseData?.name}
            onChange={(e)=>{setCaseData(prev=>({...prev, name: e.target.value}))}}
            placeholder="Title"
            className= {`mt-4 mb-6 text-xl md:text-2xl font-bold text-slate-800 w-full bg-transparent border-none rounded tracking-wide resize-none appearance-none focus:outline-none focus:ring-0 focus:border-transparent `}
            autoFocus
          />
          }
        <div className='flex-grow'></div>
        {isOwner && !isEdit && <Link href={`/canvas/${caseData.id}`} className='py-1 px-1 md:px-4 mb-3 md:mb-0 self-end md:self-auto bg-white shadow stroke-slate-500 text-slate-500 cursor-pointer  text-sm md:text-base rounded-md flex justify-center items-center hover:bg-slate-100 border border-solid border-slate-200 transition'>編集する</Link>}
      </div>
      <div className='w-full flex flex-row items-center justify-center'>
        <div className='flex flex-row items-center justify-center'>
          { caseData.photoURL ?
            <div className="h-10 w-10 rounded-full overflow-hidden cursor-pointer hover:opacity-60" onClick={()=>{router.push(`/users/${caseData.userId}`)}}>
              <Image src={caseData.photoURL} height="40" width="40" alt="userPhoto"/>
            </div> :
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-500" onClick={()=>{router.push(`/users/${caseData.userId}`)}}>
              <span className="text-xs font-medium leading-none text-white">{caseData?.displayName?.length > 0 &&caseData?.displayName[0]}</span>
            </div>
          }
          <div className='ml-2 text-slate-500'>
            <Link href={`/users/${caseData.userId}`} className='text-sm font-medium no-underline hover:underline text-slate-500'>
                {caseData.displayName}
            </Link>
            <div className='flex flex-row items-center justify-between'>
              <span className=' text-xs font-medium '>{ formatDateDiff(new Date(), new Date(caseData.updatedAt?.seconds * 1000)) } </span>
            </div>
          </div>
        </div>          
        <div className="flex-grow"/>
        <div className='flex flex-row justify-center items-center -mr-3'>
        {isUpMd && <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(caseData?.name)}&url=${encodeURIComponent(`https://www.circleheart.dev/${caseData.userId}/canvas/${caseData.id}`)}`}role="button" className={`mr-2 md:mr-3 no-underline bg-slate-100   fill-slate-500 stroke-slate-500 text-slate-500  ${isLogin && "cursor-pointer hover:bg-slate-200 hover:fill-slate-600 hover:stroke-slate-600 hover:text-slate-600"} py-2 md:py-2.5 px-2 md:px-4 text-base rounded-md flex justify-center items-center   border-none transition`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className='w-4 h-4 md:w-5 md:h-5'
              fill="none"
              strokeWidth={2}
              viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
            </svg>
            <span className='pl-1.5 font-bold text-base'>Tweet</span>
          </a>}
          {<button onClick={()=>{if(!isLogin) return; if(liked){removeLike()} else{addLike()}}} className={`mr-2 md:mr-3 ${liked ? "bg-red-100 hover:bg-red-200 fill-red-300 stroke-red-500 text-red-500 hover:fill-red-300 hover:stroke-red-600 hover:text-red-600" : "bg-slate-100   fill-slate-500 stroke-slate-500 text-slate-500 "} ${isLogin && "cursor-pointer"} ${isLogin && !liked && "hover:bg-slate-200 hover:fill-slate-600 hover:stroke-slate-600 hover:text-slate-600"} py-1.5 md:py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center   border-none transition`}>
            <svg xmlns="http://www.w3.org/2000/svg" strokeWidth={2} className='w-4 h-4 md:w-5 md:h-5' fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <span className='pl-1.5 font-bold text-sm md:text-base'>{caseData.totalLikes || 0}</span>
          </button>}  
          {(isLogin) && <button onClick={()=>{if(!isLogin) return; if(bookmarked){removeBookmark()}else{addBookmark()}}} className={`mr-2 md:mr-3 ${bookmarked ? "bg-red-100 hover:bg-red-200 fill-red-300 stroke-red-500 text-red-500 hover:fill-red-300 hover:stroke-red-600 hover:text-red-600" : "bg-slate-100   fill-slate-500 stroke-slate-500 text-slate-500 "} ${isLogin && "cursor-pointer"} ${isLogin && !bookmarked && "hover:bg-slate-200 hover:fill-slate-600 hover:stroke-slate-600 hover:text-slate-600"} py-1.5 md:py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center   border-none transition`}>
            <svg xmlns="http://www.w3.org/2000/svg" strokeWidth={2} className='w-4 h-4 md:w-5 md:h-5' fill={bookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            {isUpMd &&<span className='pl-1 md:pl-1.5 font-bold text-sm md:text-base'>{caseData.totalBookmarks || 0}</span>}
          </button>}
          {!isUpMd && <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(caseData?.name)}&url=${encodeURIComponent(`https://www.circleheart.dev/canvas/${caseData.id}`)}`} role="button" className={`mr-2 md:mr-3 no-underline bg-slate-100   fill-slate-500 stroke-slate-500 text-slate-500  ${isLogin && "cursor-pointer hover:bg-slate-200 hover:fill-slate-600 hover:stroke-slate-600 hover:text-slate-600"} py-2 md:py-2.5 px-2 md:px-4 text-base rounded-md flex justify-center items-center   border-none transition`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className='w-4 h-4 md:w-5 md:h-5'
              fill="none"
              strokeWidth={2}
              viewBox="0 0 24 24">
              <path
                d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
            </svg>
          </a>}          
          <NewAddViewDialog 
            addViewItem={(viewItem)=>{
              let newView = {...viewItem, id:nanoid()}
              setCaseData(draft=>{
                let wMd;
                let hMd;
                switch (viewItem.type) {
                  case "FlowCurve":
                  case "PressureCurve":
                    hMd = 8
                    if (viewItem.options?.timeWindow  >12){
                      wMd = 12
                    }else{
                      wMd = viewItem.options?.timeWindow
                    }
                    break;
                  case "PressureVolumeCurve":
                    hMd = 12
                    wMd = 6
                    break;
                  case "Metrics":
                    if (viewItem.items.length<12){
                      wMd = 1+viewItem.items.length
                      hMd = 3
                    }else{
                      wMd = 12
                      hMd = 6
                    }
                    break;
                  case "Controller":
                    wMd = 4
                    hMd = viewItem.items?.length + 2
                    break;
                  case "PlaySpeed":
                    wMd = 1
                    hMd = 4
                    break;
                  case "Note":
                    wMd = 6
                    hMd = 6
                    break;
                  case "Plot":
                    wMd = 6
                    hMd = 12
                    break;
                  case "FittingPanel":
                    wMd = 6
                    hMd = 12
                    break;
                  case "ModelManager":
                    wMd = 6
                    hMd = 12
                    break;
                  case "GuytonStarlingPlot":
                    wMd = 6
                    hMd = 12
                    break;
                }
                let wXs = 12
                let hXs = 8
                let xsPosition = calculatePosition(draft.layouts.xs,{w:wXs,h:hXs})
                draft.layouts.xs.push({i:newView.id, ...xsPosition, w:wXs, h:hXs})
                let mdPosition = calculatePosition(draft.layouts.md,{w:wMd,h:hMd})
                draft.layouts.md.push({i:newView.id, ...mdPosition, w:wMd, h:hMd})
              })
              setViews(draft=>{draft.push(newView)})
            }} 
            patients={patients}
            addPatient = {(patient)=>{
              const newPatient = {...patient,id:nanoid()}
              engine.register(newPatient);
              setPatients(draft=>{draft.push({...newPatient, ...engine.getPatient(newPatient.id)})})
            }}
          />
        </div>
      </div>
    </div>
    <StyledReactGridLayout
      layouts={caseData?.layouts}
      breakpoints={{ md: 960, xs: 0 }}
      cols={{ md: 12, xs: 12 }}
      margin={[16, 16]}
      measureBeforeMount={false}
      useCSSTransforms={mounted}
      rowHeight={isUpMd ? 30 : 20}
      draggableHandle=".draggable"
      onLayoutChange={(layout,layouts) =>{
        setCaseData(draft=>{
          draft.layouts = layouts
        })
      }}
    >
      { views?.filter(view => view.type !="PlaySpeed").map(view =>
        <div key={view.id}  className={`bg-white border border-solid border-slate-200 rounded ${!["Note","Plot"].includes(view.type) && "overflow-hidden"}`}>
          {view.type === "Controller" && 
            <ControllerPanelNext
              engine={engine}
              key = {view.id + view.type}
              view = {view}
              updateView={(newView) => updateView(view.id, newView)}
              removeView={() => removeView(view.id)}
              patient={patients.find(p=>p.id===view.patientId)}
              patients={patients}
              setPatient={newPatient=>{setPatients(draft=>{draft.findIndex(p=>p.id===view.patientId)===-1? draft.push(newPatient) : draft.splice(draft.findIndex(p=>p.id===view.patientId),1,newPatient);})}}
              isOwner={isOwner}
              isEdit={isEdit}
            />
          }
          {view.type === "PressureCurve" && 
            <RealTimeChartNext 
              key={view.id + view.type}
              engine={engine} patients={patients}
              view={view}
              updateView={(newView) => updateView(view.id, newView)}
              removeView={() => removeView(view.id)}
              getTimeSeriesFn = {getTimeSeriesPressureFn}
              isOwner={isOwner}
              isEdit={isEdit}
            />
          }
          {view.type === "FlowCurve" && 
            <RealTimeChartNext
              key={view.id + view.type}
              engine={engine} patients={patients}
              view={view}
              updateView={(newView) => updateView(view.id, newView)}
              removeView={() => removeView(view.id)}
              getTimeSeriesFn = {getTimeSeriesFlowFn}
              isOwner={isOwner}
              isEdit={isEdit}
            />
          }                  
          {view.type === "PressureVolumeCurve" && 
            <PressureVolumeCurveNext
              key={view.id + view.type}
              engine={engine} 
              view={view} 
              updateView={(newView) => updateView(view.id, newView)}
              removeView={() => removeView(view.id)}
              patients={patients}
              isOwner={isOwner}
              isEdit={isEdit}
            /> 
          }
          {/* {
            view.type === "Tracker" &&
            <Tracker engine={engine} initialView={view} patients = {patients}
              setInitialView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}}
              removeView={()=>{
                setCaseData(draft=>{
                  draft.layouts.md = draft.layouts.md.filter(layoutItem => layoutItem.i != view.id )
                  draft.layouts.xs = draft.layouts.xs.filter(layoutItem => layoutItem.i != view.id )                  
                })
                setViews(draft=>{
                  draft.splice(draft.findIndex(v=>v.id===view.id),1)
                })
              }}
              isOwner={isOwner}
              isEdit={isEdit}            
            />
          } */}
          {
            view.type === "Metrics" &&
              <MetricsPanel 
                engine={engine}
                key={view.id + view.type}
                view={view} 
                patients={patients}
                updateView={(newView) => updateView(view.id, newView)}
                removeView={() => removeView(view.id)}
                isOwner={isOwner}
                isEdit={isEdit}              
              />
          }
          {
            view.type == "Note" && 
              <NotePanel
                key={view.id + view.type}
                view={view}
                updateView={(newView) => updateView(view.id, newView)}
                removeView={() => removeView(view.id)}
                isOwner={isOwner}
                isEdit={isEdit}
                caseData={caseData}
                setCaseData={setCaseData}
              />
          }
          {
            view.type == "ActionRecorder" &&
              <ActionRecorderPanel
                key={view.id + view.type}
                view = {view}
                setViews = {setViews}
                updateView={(newView) => updateView(view.id, newView)}
                removeView={() => removeView(view.id)}
                isOwner={isOwner}
                isEdit={isEdit}
                patients = {patients}
                engine = {engine}
                updateHdp = {(patientId) => (key, value) => {
                  engine.setHdps(patientId)(key, value)
                }}
              />
          }
          {
            view.type == "Plot" && 
              <PlotPanel
                key={view.id + view.type}
                view={view}
                updateView={(newView) => updateView(view.id, newView)}
                removeView={() => removeView(view.id)}
                isOwner={isOwner}
                isEdit={isEdit}
                patients={patients}
                engine={engine}
              />
          }
          { 
            view.type === "FittingPanel" && 
              <FittingPanel
                key={view.id + view.type}
                view={view}
                updateView={(newView) => updateView(view.id, newView)}
                removeView={() => removeView(view.id)}
                isOwner={isOwner}
                isEdit={isEdit}
                patients={patients}
                updatePatientParameters={updatePatientParameters}
              />
          }
          {
            view.type === "ModelManager" &&
            <ModelManager
              key={view.id + view.type}
              view={view}
              updateView={(newView) => updateView(view.id, newView)}
              removeView={() => removeView(view.id)}
              caseData={caseData}
              patients={patients}
              engine={engine}
              setPatients={setPatients}
              isOwner={isOwner}
              isEdit={isEdit}
            />
          }
          {
            view.type === "GuytonStarlingPlot" &&
              <GuytonStarlingPlot
                key={view.id + view.type}
                view={view}
                updateView={(newView) => updateView(view.id, newView)}
                removeView={() => removeView(view.id)}
                patients={patients}
                engine={engine}
              />
          }
        </div>
      )}      
      {
        views?.filter(view => view.type === "PlaySpeed").map(view => 
          <div key={view.id}  className='overflow-hidden'>
            <PlaySpeedButtonsNext 
              key={view.id + view.type}
              engine={engine} 
              removeView = {()=>{
                setCaseData(draft=>{
                  draft.layouts.md = draft.layouts.md.filter(layoutItem => layoutItem.i != view.id )
                  draft.layouts.xs = draft.layouts.xs.filter(layoutItem => layoutItem.i != view.id )                  
                })
                setViews(draft=>{
                  draft.splice(draft.findIndex(v=>v.id===view.id),1)
                })
              }}
              isOwner={isOwner}
            />
          </div>
        )
      }
    </StyledReactGridLayout>
  </div>
})

export default CaseEditor

// const ParamSetsDialog = ({patients, engine, setPatients,setViews,caseData}) => {
//   const [openDialog, setOpenDialog] = useState(false);
//   const [edittingIndex, setEdittingIndex] = useState(null);
//   const [openNewPatient, setOpenNewPatient] = useState(false);
//   const [itemAnchorEl, setItemAnchorEl] = useState(null);
//   const [selectedPatientId, setSelectedPatientId] = useState(null);

//   const removeParamSet = (id) => {
//     setViews(draft => {
//         for (let i = draft.length - 1; i >= 0; i--) {
//           if (draft[i]?.patientId === id) {
//             draft.splice(i, 1);
//             continue; 
//           }
  
//           switch (draft[i].type) {
//             case "PressureCurve":
//             case "FlowCurve":
//             case "PressureVolumeCurve":
//             case "Metrics":
//               draft[i].items = draft[i].items?.filter(item => item.patientId !== id);
//               break;
//           }
//         }
//       }
//     )
//     engine.unregister(id);
//     setPatients(patients.filter(p=>p.id!=id));
//   }
//   return <>
//     <button onClick={()=>{setOpenDialog(true)}} className='mr-2 md:mr-3 bg-slate-100 fill-slate-500 stroke-slate-500 text-slate-500 hover:fill-slate-600 hover:stroke-slate-600 hover:text-slate-600 cursor-pointer py-1 md:py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center hover:bg-slate-200  border-none transition'>
//       {/* <svg xmlns="http://www.w3.org/2000/svg"  strokeWidth={1} height="20px" width="20px" version="1.1" id="Layer_1" viewBox="0 0 490.012 490.012" >
//         <g>
//           <g>
//             <path d="M429.039,38.5h-84.3V20.8c0-11.4-9.4-20.8-20.8-20.8h-157c-11.4,0-20.8,9.4-20.8,20.8v17.7h-85.3    c-5.5-0.4-19.9,4.5-20.8,20.8v409.9c0,11.4,9.4,20.8,20.8,20.8h369.3c13.3,0.5,20.3-14.1,19.8-20.8V59.3    C450.439,54.5,445.539,39.1,429.039,38.5z M187.739,41.6h116.5V77h-116.5L187.739,41.6L187.739,41.6z M409.339,449.4h-328.8V80.1    h65.5v16.6c1.3,17.2,15.6,20.8,20.8,20.8h158.1c10.4,0,19.8-9.4,19.8-20.8V80.1h64.5v369.3H409.339z"/>
//             <path d="M170.039,328.7h149.8c11.4,0,20.8-9.4,20.8-20.8s-9.4-20.8-20.8-20.8h-149.8c-11.4,0-20.8,9.4-20.8,20.8    S158.639,328.7,170.039,328.7z"/>
//             <path d="M322.939,366.2h-149.8c-11.4,0-20.8,9.4-20.8,20.8s9.4,20.8,20.8,20.8h149.8c10.4,0,19.8-9.4,20.8-20.8    C343.739,375.6,334.439,366.2,322.939,366.2z"/>
//             <path d="M213.739,219.5h11.4V231c0,11.4,9.4,20.8,20.8,20.8s20.8-9.4,20.8-20.8v-11.4h11.4c11.4,0,20.8-9.4,20.8-20.8    c0-11.4-9.4-20.8-20.8-20.8h-11.4v-11.4c0-11.4-9.4-20.8-20.8-20.8c-11.4,0-20.8,9.4-20.8,20.8V178h-11.4    c-11.4,0-20.8,9.4-20.8,20.8C192.939,210.1,202.239,219.5,213.739,219.5z"/>
//           </g>
//         </g>
//       </svg> */}
//       <span className='font-bold text-base'>{patients.length || 0} {patients.length <=1 ? "model" : "models"}</span>
//     </button>  
//     <Dialog open={openDialog} onClose={()=>setOpenDialog(false)} sx={{ ".MuiDialog-paper": {m:0}}}>
//       <div className='border-solid border-0 border-b border-slate-200 w-full p-3 pl-4 flex flex-row items-center justify-center'>
//         <div className='text-base font-bold text-center inline-flex items-center'>
//           <svg className='w-6 h-5  mr-1.5 stroke-blue-500' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
//           </svg>                 
//           Edit Models
//         </div>
//         <div className='flex-grow md:w-52'/>
//         <button onClick={()=>setOpenDialog(false)} type="button" class="bg-white cursor-pointer rounded-full pr-2 py-1 border-none inline-flex items-center justify-center ">
//           <svg className='stroke-slate-600 w-4 h-4' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
//             <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//           </svg>
//         </button>
//       </div>

//       <div className='w-full min-h-[320px] px-4 py-2'>
//         {patients.map((p,index) =>  
//           edittingIndex != index ?
//             <div key={p.id} className='w-full border-solid  flex flex-row items-center justify-center border border-slate-200 bg-slate-200 rounded-lg  my-3'>
//               <div onClick={()=>{setEdittingIndex(index)}} className='cursor-pointer bg-white rounded-lg pl-3 w-full flex items-center justify-center hover:bg-slate-100'>
//                 <div className='text-base'>{p?.name}</div>
//                 <div className='flex-grow'></div>
//                 <div className='p-1 py-2 flex items-center' onClick={e => {e.stopPropagation();setSelectedPatientId(p.id); setItemAnchorEl(e.currentTarget)}}>
//                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
//                   </svg>
//                 </div>
//                 <Popover 
//                   open={Boolean(itemAnchorEl)}
//                   anchorEl={itemAnchorEl}
//                   onClose={(e)=>{e.stopPropagation();setItemAnchorEl(null)}}
//                   anchorOrigin={{
//                     vertical: 'bottom',
//                     horizontal: 'right',
//                   }}
//                   transformOrigin={{
//                     vertical: 'top',
//                     horizontal: 'right',
//                   }}
//                   elevation={0}
//                   marginThreshold={0}
//                   disablePortal
//                   PaperProps={{style: {backgroundColor: 'transparent',boxShadow: 'none',width: 'auto',maxWidth: 'none',}}}
//                 >
//                   <div className='flex flex-col items-center justify-center py-2 bg-white border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0'>
//                     <div onClick={()=> {setEdittingIndex(index); setItemAnchorEl(null)}} 
//                       className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
//                     >
//                       <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
//                       </svg>
//                       Edit
//                     </div>
//                     <div onClick={(e)=>{e.stopPropagation(); removeParamSet(selectedPatientId);setItemAnchorEl(null); setSelectedPatientId(null)}} 
//                       className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1 text-red-500 hover:bg-red-500 hover:text-white"
//                     >
//                       <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
//                       </svg>                                
//                       Delete
//                     </div>
//                   </div>
//                 </Popover>                          
//               </div>
//             </div> :
//             <Grow in={edittingIndex == index}>
//               <div>
//                 <ParamSetEditor 
//                   key={p?.id} initialPatient={p}  handleClose={()=>{setEdittingIndex(null)}} 
//                   handleUpdate={(newPatient)=>{setPatients(draft => { 
//                     const insertPatient = {...p,...newPatient}
//                     draft.splice(draft.findIndex(p=>p.id===insertPatient.id),1,insertPatient);
//                     setEdittingIndex(null);
//                   })}} 
//                 />
//               </div>
//             </Grow>
//         )}
//       {!openNewPatient ?
//         <div onClick={()=>{setOpenNewPatient(true)}} className='cursor-pointer py-2 px-4 mt-2 text-base border-solid border border-slate-200 rounded-md flex justify-center items-center hover:bg-slate-100 hover:border-slate-100 text-slate-600 '>
//           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" class="w-6 h-6">
//             <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
//           </svg>
//           Add new model
//         </div> :
//         <Grow in={openNewPatient}>
//           <div>
//             <ParamSetEditor 
//               handleClose={()=>{setOpenNewPatient(false)}} 
//               handleUpdate={(newPatient)=>{
//                 const insertPatient = {...newPatient,id:nanoid()}
//                 engine.register(insertPatient);
//                 setPatients(draft=>{draft.push({...insertPatient,uid:caseData.userId, canvasId: caseData.canvasId , ...engine.getPatient(insertPatient.id)})})
//               }}
//             />
//           </div> 
//         </Grow>
//       }  
//       </div>
 
//       {/* <div className=' w-full p-3 pl-4 flex flex-row items-center justify-center'>
//         <div className='flex-grow'></div>
//         <Button onClick={()=>setOpenDialog(false)} color="inherit">キャンセル</Button>
//         <button 
//           type='button' 
//           onClick={()=>{
//             // addPatient(newPatient);
//             // setNewPatient({id:nanoid(),...paramPresets[newPatient.baseParamSet]})
//             setOpenDialog(false)
//           }} 
//           className=' bg-blue-500 text-white cursor-pointer py-2 px-4 ml-4 text-base rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
//         >
//           追加する
//         </button> 
        
//       </div>            */}
//     </Dialog>      
//   </>
// }

// const ParamSetEditor = ({initialPatient=null, handleClose, handleUpdate }) =>{
//   const [newPatient, setNewPatient] = useImmer(initialPatient || {...paramPresets["Normal"]});
//   return <>
//     <div className='flex flex-col items-center w-full border-solid border border-slate-200  rounded-lg p-2 mt-2'>
//       {!initialPatient && <div className='flex flex-row items-center w-full '>
//         <div className='text-base'>ベースモデル</div>
//         <div className='flex-grow'/>
//         <Select  variant="standard" disableUnderline id="new-patient-base-model" 
//           value={newPatient.baseParamSet} 
//           onChange={e=>{setNewPatient({id:nanoid(),...paramPresets[e.target.value]})}}
//         >
//           {
//             Object.keys(paramPresets).map((baseKey,index)=>{
//               return <MenuItem key={index} value={baseKey}>{baseKey}</MenuItem>
//             })
//           }
//         </Select>
//       </div> }
//       <div className='flex flex-row items-center w-full mt-1'>
//         <div className='text-base'>モデル名</div>
//         <div className='flex-grow'/>
//         <EditableText value={newPatient?.name} updateValue={newTitle=>{setNewPatient(draft=>{draft.name=newTitle})}}  />
//       </div>
                                      
//       <div className=' w-full pl-3 mt-3 flex flex-row items-center justify-center'>
//         <div className='flex-grow'></div>
//         <button type='button' 
//           onClick={handleClose} 
//           className='bg-slate-100 text-slate-700 cursor-pointer py-2 px-3 text-sm rounded-md flex justify-center items-center hover:bg-slate-200 border-none transition'
//         >
//           Cancel
//         </button>
//         <button 
//           type='button' 
//           disabled={!newPatient?.name }
//           onClick={()=>{handleUpdate(newPatient); handleClose()}}
//           className='bg-blue-500 text-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer py-2 px-3 ml-3 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
//         >
//         {initialPatient ? "Update" : "Add"}
//       </button>
//       </div>                
//     </div>  
//     </>

// }

const NewAddViewDialog = ({addViewItem,patients,addPatient})=>{  
  const [anchorEl, setAnchorEl] = useState(null);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [openDialog, setOpenDialog] = useState(null);
  
  const [newPatient, setNewPatient] = useImmer({id:nanoid(), ...paramPresets["Normal"]});


  const selectChartDialog = ()=>{
    setOpenDialog("Chart"); 
    setAnchorEl(null);
  }
  const selectMetricsDialog = ()=>{
    setOpenDialog("Metrics");
    setAnchorEl(null);
  }
  const selectControllerDialog = ()=>{
    setOpenDialog("Controller");
    setAnchorEl(null);
  }
  const selectPlotDialog = ()=>{
    setOpenDialog("Plot");
    setAnchorEl(null);
  }

  const selectNoteDialog = ()=>{
    setOpenDialog("Note");
    setAnchorEl(null);
  }

  const selectFittingPanel = ()=>{
    addViewItem({type: "FittingPanel"});
    setAnchorEl(null);
  };

  const selectModelManagerDialog = () => {
    addViewItem({type: "ModelManager"});
    setAnchorEl(null);
  };

  const selectGuytonStarlingPlotDialog = () => {
    setOpenDialog("GuytonStarling");
    setAnchorEl(null);
  };

  
  return <>
    <button type='button' onClick={e =>{setAnchorEl(e.currentTarget)}} 
      className=' bg-blue-500 text-white cursor-pointer py-1 md:py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      { isUpMd && "Add Contents"  }
    </button>
    <Popover 
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={()=>{setAnchorEl(null)}}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      slotProps={{paper:{className:'grid md:grid-cols-2 gap-2 mt-2 p-2 border border-solid border-slate-200 rounded-md shadow-lg'}}}
    >
      <>
        {/* <button onClick={selectModelDialog} className=' text-gray-800 bg-white cursor-pointer border border-solid border-slate-200  hover:bg-sky-50 transition  font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center'>
          <div className='relative inline-flex items-center justify-center w-9 h-9 mr-2 overflow-hidden bg-sky-100 rounded-full'>
            <svg className='w-6 h-5 stroke-sky-700' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          Model
        </button> */}
        <button onClick={selectModelManagerDialog} className='text-gray-800 bg-white cursor-pointer border border-solid border-slate-200 hover:bg-sky-50 transition font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center'>
          <div className='relative inline-flex items-center justify-center w-9 h-9 mr-2 overflow-hidden bg-sky-100 rounded-full'>
            <svg className='w-6 h-6 stroke-sky-700' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          Model Manager
        </button>           
        <button onClick={selectControllerDialog} className=' text-gray-800 bg-white cursor-pointer border border-solid border-slate-200  hover:bg-sky-50 transition  font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center'>
          <div className='relative inline-flex items-center justify-center w-9 h-9 mr-2 overflow-hidden bg-sky-100 rounded-full'>
            <svg className='w-6 h-5 stroke-sky-700' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          Controller
        </button>        
        <button onClick={selectChartDialog} className=' text-gray-800 bg-white cursor-pointer border border-solid border-slate-200  hover:bg-sky-50 transition font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center '>
          <div className='relative inline-flex items-center justify-center w-9 h-9 mr-2 overflow-hidden bg-sky-100 rounded-full'>
            <svg className='w-6 h-5 stroke-sky-700' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          </div>
          Chart
        </button>
        {/* <button onClick={selectPlotDialog} className=' text-gray-800 bg-white cursor-pointer border border-solid border-slate-200  hover:bg-sky-50 transition font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center '>
          <div className='relative inline-flex items-center justify-center w-9 h-9 mr-2 overflow-hidden bg-sky-100 rounded-full'>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-5 text-sky-700 stroke-sky-700 fill-sky-700 " viewBox="0 0 512 512"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M344 280l88-88M232 216l64 64M80 320l104-104"/><circle cx="456" cy="168" r="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/><circle cx="320" cy="304" r="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/><circle cx="208" cy="192" r="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/><circle cx="56" cy="344" r="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/></svg>
          </div>
          Plot
        </button>         */}
        <button onClick={selectMetricsDialog} className=' text-gray-800 bg-white cursor-pointer border border-solid border-slate-200  hover:bg-sky-50 transition font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center '>
          <div className='relative inline-flex items-center justify-center w-9 h-9 mr-2 overflow-hidden bg-sky-100 rounded-full'>
            <svg className='w-6 h-5 stroke-sky-700' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
            </svg>
          </div>
          Metrics
        </button>  
        {/* <button onClick={()=>{addViewItem({id:nanoid(),type:"PlaySpeed"});setAnchorEl(null)}} className=' text-gray-800 bg-white cursor-pointer border border-solid border-slate-200  hover:bg-sky-50 transition font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center '>
          <div className='relative inline-flex items-center justify-center w-9 h-9 mr-2 overflow-hidden bg-sky-100 rounded-full'>
            <svg className='w-6 h-5 stroke-sky-700' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </div>
          Player
        </button>                */}
        <button onClick={selectNoteDialog} className='text-gray-800 bg-white cursor-pointer border border-solid border-slate-200  hover:bg-sky-50 transition font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center '>
          <div className='relative inline-flex items-center justify-center w-9 h-9 mr-2 overflow-hidden bg-sky-100 rounded-full'>
            <svg className='w-6 h-5 stroke-sky-700' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          Note
        </button>
     
        {/* <button onClick={selectFittingPanel} className=' text-gray-800 bg-white cursor-pointer border border-solid border-slate-200  hover:bg-sky-50 transition font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center '>
            <div className='relative inline-flex items-center justify-center w-9 h-9 mr-2 overflow-hidden bg-sky-100 rounded-full'>
              <svg className='w-6 h-5 stroke-sky-700' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            Fitting Panel
          </button>         */}
        {/* <button className=' text-gray-800 bg-white cursor-pointer border border-solid border-slate-200  hover:bg-sky-50 transition font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center '>
          <div className='relative inline-flex items-center justify-center w-9 h-9 mr-2 overflow-hidden bg-sky-100 rounded-full'>
            <svg className='w-6 h-5 stroke-sky-700' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          Image
        </button>   */}
      </>
      <button onClick={selectGuytonStarlingPlotDialog} className='text-gray-800 bg-white cursor-pointer border border-solid border-slate-200 hover:bg-sky-50 transition font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center'>
        <div className='relative inline-flex items-center justify-center w-9 h-9 mr-2 overflow-hidden bg-sky-100 rounded-full'>
          <svg className='w-6 h-6 stroke-sky-700' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4v16h18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 20l6-6 4 4 8-8" />
            <circle cx="7" cy="8" r="2" fill="none" />
            <circle cx="15" cy="10" r="2" fill="none" />
          </svg>
        </div>
        Guyton-Starling
      </button>
    </Popover>


    {/* ChartDialog */}
    <ChartDialog open={openDialog == "Chart"} onClose={()=>setOpenDialog(null)} updateView={addViewItem} patients={patients}/>

    {/* MetricsDialog */}
    <MetricsDialog open={openDialog == "Metrics"} onClose={()=>setOpenDialog(null)} updateView={addViewItem} patients={patients}/>

    {/* ModelDialog */}
    <Dialog open={openDialog == "Model"} onClose={()=>setOpenDialog(null)} sx={{ ".MuiDialog-paper": {m:0}}}>
      <div className='border-solid border-0 border-b border-slate-200 w-full p-3 pl-4 flex flex-row items-center justify-center'>
        <div className='text-base font-bold text-center inline-flex items-center'>
          <svg className='w-6 h-5  mr-1.5 stroke-blue-500' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>                 
          Add New Model
        </div>
        <div className='flex-grow md:w-52'/>
        <button onClick={()=>setOpenDialog(null)} type="button" className="bg-white cursor-pointer rounded-full pr-2 py-1 border-none inline-flex items-center justify-center ">
          <svg className='stroke-slate-600 w-4 h-4' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className='w-full px-6 py-5'>
        <div >
          <div className='flex flex-row items-center w-full '>
            <div className='text-base'>ベースモデル</div>
            <div className='flex-grow'/>
            <Select  variant="standard" disableUnderline id="new-patient-base-model" 
              value={newPatient.baseParamSet} 
              onChange={e=>{setNewPatient({id:nanoid(),...paramPresets[e.target.value]})}}
            >
              {
                Object.keys(paramPresets).map((baseKey,index)=>{
                  return <MenuItem key={index} value={baseKey}>{baseKey}</MenuItem>
                })
              }
            </Select>
          </div> 
          <div className='flex flex-row items-center w-full mt-1'>
            <div className='text-base'>モデル名</div>
            <div className='flex-grow'/>
            <EditableText value={newPatient?.name} updateValue={newTitle=>{setNewPatient(draft=>{draft.name=newTitle})}}  />
          </div>
        </div>
      </div>
      <div className=' w-full p-3 pl-4 flex flex-row items-center justify-center'>
        <div className='flex-grow'></div>
        <Button onClick={()=>setOpenDialog(null)} color="inherit">キャンセル</Button>
        <button 
          type='button' 
          onClick={()=>{
            addPatient(newPatient);
            setNewPatient({id:nanoid(),...paramPresets[newPatient.baseParamSet]})
            setOpenDialog(null)
          }} 
          className=' bg-blue-500 text-white cursor-pointer py-2 px-4 ml-4 text-base rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
        >
          追加する
        </button> 
        
      </div>           
    </Dialog>      
    
    {/* ControllerDialog */}
    <ControllerDialog open={openDialog == "Controller"} onClose={()=>setOpenDialog(null)} updateView={addViewItem} patients={patients}/>

    {/* NoteDialog */}
    <NoteDialog open={openDialog == "Note"} onClose={()=>setOpenDialog(null)} updateView={addViewItem} patients={patients}/>
    
    {/* PlotDialog */}
    <PlotDialog open={openDialog == "Plot"} onClose={()=>setOpenDialog(null)} updateView={addViewItem} patients={patients}/>
    
    {/* GuytonStarlingPlotDialog */}
    <GuytonStarlingPlotDialog 
      open={openDialog === "GuytonStarling"} 
      onClose={() => setOpenDialog(null)} 
      updateView={(newView) => {
        if (newView.items.length > 0) {
          addViewItem({...newView, type: "GuytonStarlingPlot"});
        }
      }} 
      patients={patients}
    />
  </>
}



// const ControllerEdittor = ({initialItem=null, handleClose, handleUpdate, patient}) =>{
//   const t = useTranslation()
//   const [newItem, setNewItem] = useImmer(initialItem || {label:t[controllableHdpTypes[0]],hdp: controllableHdpTypes[0],mode: "basic",items:[], options:[]});
//   const [edittingIndex, setEdittingIndex] = useState(null);
//   const [openNewOption, setOpenNewOption] = useState();
//   const [optionAnchorEl, setOptionAnchorEl] = useState();
//   return <>
//     <div className='flex flex-col items-center w-full border-solid border border-slate-200  rounded-lg p-2 mt-2'>
//       <div className='flex flex-row items-center w-full'>
//         <div className='text-base'>パラメータ</div>
//         <div className='flex-grow'/>
//         <Select  variant="standard" disableUnderline id="model-new-hdptype" value={newItem.hdp} onChange={e=>{setNewItem(draft=>{draft.hdp=e.target.value; draft.label = t[e.target.value]})}}>
//           {controllableHdpTypes.map(hdpOption=><MenuItem value={hdpOption}>{t[hdpOption]}</MenuItem>)}
//         </Select>
//       </div>
//       <div className='flex flex-row items-center w-full mt-1'>
//         <div className='text-base'>ラベル</div>
//         <div className='flex-grow'/>
//         <EditableText value={newItem.label} updateValue={newLabel=>{setNewItem(draft=>{draft.label=newLabel});}}  />
//       </div> 
//       <div className='flex flex-row items-center w-full mt-1'>
//         <div className='text-base'>入力形式</div>
//         <div className='flex-grow'/>
//         <Select  variant="standard" disableUnderline id="model-new-mode" value={newItem.mode} onChange={e=>{setNewItem(draft=>{draft.mode=e.target.value;})}}>
//           {["basic","advanced", "customized"].map(hdpOption=><MenuItem value={hdpOption}>{t[hdpOption]}</MenuItem>)}
//         </Select>
//       </div>
//       {newItem.mode == "customized" &&
//         <div className='w-full'>
//           <div className='text-slate-500 font-bold mt-3'>カスタム設定</div>
//           <hr class="mb-3 h-px border-0 bg-gray-300" />
//           <div className='w-full '>
//             <DragDropContext onDragEnd={({source:src, destination:dest})=>{
//               if(!dest ) return;
//               setNewItem(draft=>{
//                 const [insertItem] = draft.options.splice(src.index,1);
//                 draft.options.splice(dest.index,0,insertItem);
//                 if(dest.index == edittingIndex) setEdittingIndex(src.index)
//                 else if(src.index == edittingIndex) setEdittingIndex(dest.index)
//               })
//             }}>
//               <Droppable droppableId="droppable">
//                 {(provided) => (
//                   <div
//                     {...provided.droppableProps}
//                     ref={provided.innerRef}
//                     className="space-y-2"
//                   >
//                     {newItem.options.map((item,index)=> ( 
//                       <Draggable key={item.id} draggableId={item.id} index={index}>
//                         {(provided) => (edittingIndex != index ?
//                           <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} 
//                             className='w-full border-solid cursor-grab flex flex-row items-center justify-center border border-slate-200 bg-slate-200 rounded-lg  my-2'
//                           >
//                             <svg className="w-6 h-6 " focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DragIndicatorIcon"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
//                             <div onClick={()=>{setEdittingIndex(index)}} className='cursor-pointer bg-white rounded-lg pl-2 w-full flex items-center justify-center hover:bg-slate-100'>
//                               <div className='text-base'>{item?.label}</div>
//                               <div className='flex-grow'></div>
//                               <div className='p-1 py-2 flex items-center' onClick={e => {e.stopPropagation(); setOptionAnchorEl(e.currentTarget)}}>
//                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
//                                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
//                                 </svg>
//                               </div>
//                               <Popover 
//                                 open={Boolean(optionAnchorEl)}
//                                 anchorEl={optionAnchorEl}
//                                 onClose={(e)=>{e.stopPropagation();setOptionAnchorEl(null)}}
//                                 anchorOrigin={{
//                                   vertical: 'bottom',
//                                   horizontal: 'right',
//                                 }}
//                                 transformOrigin={{
//                                   vertical: 'top',
//                                   horizontal: 'right',
//                                 }}
//                                 elevation={0}
//                                 marginThreshold={0}
//                                 disablePortal
//                                 PaperProps={{style: {backgroundColor: 'transparent',boxShadow: 'none',width: 'auto',maxWidth: 'none',}}}
//                               >
//                                 <div className='flex flex-col items-center justify-center py-2 bg-white border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0'>
//                                   <div onClick={()=> {setEdittingIndex(index); setOptionAnchorEl(null)}} 
//                                     className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
//                                   >
//                                     <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
//                                       <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
//                                     </svg>
//                                     Edit
//                                   </div>
//                                   <div onClick={()=>{setNewItem(draft=>{draft.options.splice(index,1)});setOptionAnchorEl(null);}} 
//                                     className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1 text-red-500 hover:bg-red-500 hover:text-white"
//                                   >
//                                     <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
//                                       <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
//                                     </svg>                                
//                                     Delete
//                                   </div>
//                                 </div>
//                               </Popover>                          
//                             </div>
//                           </div> :
//                           <Grow in={edittingIndex == index}>
//                             <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
//                               <OptionItem key={item.id}
//                                 initialOption={item}
//                                 handleClose={()=>{setEdittingIndex(null)}}
//                                 handleUpdate={(newItem)=>{setNewItem(draft=>{draft = draft.options.splice(index,1,newItem);setEdittingIndex(null);})}}
//                                 hdp = {newItem.hdp}
//                                 initialHdpValue={patient.getInitialHdps()[newItem.hdp]}                                
//                               />
//                             </div>
//                           </Grow>
//                         )}
//                       </Draggable> 
//                     ))}
//                     {provided.placeholder}
//                   </div>
//                 )}
//               </Droppable>
//             </DragDropContext>
//             {!openNewOption ?
//               <div onClick={()=>{setOpenNewOption(true)}} className='cursor-pointer py-2 px-4 mt-2 text-base border-solid border border-slate-200 rounded-md flex justify-center items-center hover:bg-slate-100 hover:border-slate-100 text-slate-600 '>
//                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" class="w-6 h-6">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
//                 </svg>
//                 Add new parameter
//                 {console.log(patient)}
//               </div> :
//               <Grow in={openNewOption}>
//                 <div>
//                   <OptionItem
//                     handleClose={()=>{setOpenNewOption(false)}}
//                     handleUpdate={(newItem)=>{
//                       setNewItem(draft=>{
//                         draft.options.push({...newItem,id:nanoid()});
//                       })
//                       setOpenNewOption(false)
//                     }}
//                     hdp = {newItem.hdp}
//                     initialHdpValue={patient.getInitialHdps()[newItem.hdp]}
//                   />
//                 </div> 
//               </Grow>
//             }  
//           </div>             
//         </div>
//       }
                                               
//       <div className=' w-full pl-3 mt-3 flex flex-row items-center justify-center'>
//         <div className='flex-grow'></div>
//         <button type='button' 
//           onClick={handleClose} 
//           className=' bg-slate-100 text-slate-700 cursor-pointer py-2 px-3 text-sm rounded-md flex justify-center items-center hover:bg-slate-200 border-none transition'
//         >
//           Cancel
//         </button>
//         <button 
//           type='button' 
//           disabled={!newItem?.hdp }
//           onClick={()=>handleUpdate(newItem)}
//           className='bg-blue-500 text-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer py-2 px-3 ml-3 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
//         >
//         Update
//       </button>
//       </div>                
//     </div>  
//     </>
// }

// const OptionItem = ({initialOption, handleClose, handleUpdate,hdp,initialHdpValue}) =>{
//   const t = useTranslation()
//   const [newOption, setNewOption] = useImmer(initialOption || {label:"Normal",value:initialHdpValue});
//   return <>
//     <div className='flex flex-col items-center w-full border-solid border border-slate-200  rounded-lg p-2 mt-2'>
//       <div className='flex flex-row items-center w-full'>
//         <div className='text-base'>Label</div>
//         <div className='flex-grow'/>
//         <EditableText value={newOption.label} updateValue={newLabel=>{setNewOption(draft=>{draft.label=newLabel});}}  />
//       </div>  
//       <div className='flex flex-row items-center w-full mt-1'>
//         <div className='text-base'>Value</div>
//         <div className='flex-grow'/>
//         <EditableText value={newOption.value} updateValue={newValue=>{setNewOption(draft=>{draft.value=newValue});}}  />
//       </div>  
//       <div className=' w-full pl-3 mt-3 flex flex-row items-center justify-center'>
//         <div className='flex-grow'></div>
//         <button type='button' 
//           onClick={handleClose} 
//           className=' bg-slate-100 text-slate-700 cursor-pointer py-2 px-3 text-sm rounded-md flex justify-center items-center hover:bg-slate-200 border-none transition'
//         >
//           Cancel
//         </button>
//         <button 
//           type='button' 
//           disabled={!newOption?.value }
//           onClick={()=>handleUpdate(newOption)}
//           className='bg-blue-500 text-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer py-2 px-3 ml-3 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
//         >
//           {initialOption ? "Update" : "Add"}
//         </button>
//       </div>
//     </div>
//   </>
// }


// const EditableDataForm = ({initialItem=null,viewType,patients, handleClose, handleUpdate, updateText="Add", hasColor=true}) =>{
//   const t = useTranslation()
//   const [newItem, setNewItem] = useImmer(initialItem || {label:t[AllHdpOptions[viewType][0]],hdp: AllHdpOptions[viewType][0],patientId: patients[0].id, ...(hasColor && {color:getRandomColor()})});
//   return <>
//     <div className='flex flex-col items-center w-full border-solid border border-slate-200  rounded-lg p-2 mt-2'>
//       <div className='flex flex-row items-center w-full'>
//         <div className='text-base'>Data</div>
//         <div className='flex-grow'/>
//         <Select  variant="standard" disableUnderline id="chart-new-items" value={newItem.hdp} onChange={e=>{setNewItem(draft=>{draft.hdp=e.target.value; draft.label = t[e.target.value]})}}>
//           {AllHdpOptions[viewType].map(hdpOption=><MenuItem value={hdpOption}>{t[hdpOption]}</MenuItem>)}
//         </Select>
//       </div>
//       <div className='flex flex-row items-center w-full mt-1'>
//         <div className='text-base'>Model</div>
//         <div className='flex-grow'/>
//         <Select  variant="standard" disableUnderline id="chart-new-items" value={newItem.patientId} onChange={e=>{setNewItem(draft=>{draft.patientId=e.target.value})}}>
//           {patients.map(patient=><MenuItem value={patient.id}>{patient?.name || "無題のモデル"}</MenuItem>)}
//         </Select>
//       </div>  
//       <div className='flex flex-row items-center w-full mt-1'>
//         <div className='text-base'>Label</div>
//         <div className='flex-grow'/>
//         <EditableText value={newItem.label} updateValue={newLabel=>{setNewItem(draft=>{draft.label=newLabel});}}  />
//       </div>     
//       {hasColor && 
//         <div className='flex flex-row items-center w-full mt-1'>
//           <div className='text-base'>Color</div>
//           <div className='flex-grow min-w-[32px]'/>
//           <ColorPicker color={newItem.color} onChange={newColor => {setNewItem(draft=>{draft.color=newColor})}} />
//         </div>
//       }                                          
//       <div className=' w-full pl-3 mt-3 flex flex-row items-center justify-center'>
//         <div className='flex-grow'></div>
//         <button type='button' 
//           onClick={handleClose} 
//           className=' bg-slate-100 text-slate-700 cursor-pointer py-2 px-3 text-sm rounded-md flex justify-center items-center hover:bg-slate-200 border-none transition'
//         >
//           Cancel
//         </button>
//         <button 
//           type='button' 
//           disabled={!newItem?.hdp || !newItem?.patientId}
//           onClick={()=>handleUpdate(newItem)}
//           className='bg-blue-500 text-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer py-2 px-3 ml-3 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
//         >
//         {updateText}
//       </button>
//       </div>                
//     </div>  
//     </>
// }


 {/* <Allotment vertical={!isUpMd} className='w-full h-[calc(100vh_-_102px)] md:h-[calc(100vh_-_66px)]'>
      {isUpMd && <div className='overflow-scroll h-[calc(100vh_-_66px)]'>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mx:{xs:2,md:"auto"},mt:{xs:2,md:2},mb:1, maxWidth:"407px"}}>
            <Typography variant="h5" color="secondary" sx={{cursor: "default"}}>Patients</Typography>
            <Button onClick={()=>{setOpenAddPatientDialog(true)}} startIcon={<Add/>} variant='contained' disableElevation className={classes.neumoButton}>比較</Button>                                
          </Stack>
          <Stack justifyContent="center" alignItems="center">
            {caseData.patientIds?.map((patientId,index)=>{
              const patient = patients.find(({id})=>id===patientId);
              if(patient){
                return <Box maxWidth={{xs:"100%",md:"420px"}} width={1} mx={1} ref={(index==patients.length-1)? scrollPatientBottomRef : null}>
                  <ControllerPanelNext
                    key={patient.id}
                    patient={patient} 
                    setPatient={newPatient=>{setPatients(draft=>{draft.findIndex(p=>p.id===patient.id)===-1? draft.push(newPatient) : draft.splice(draft.findIndex(p=>p.id===patient.id),1,newPatient);})}}
                    removePatient={()=>{
                      setViews(draft=>{
                        for(var i=0; i<draft.length; i++){
                          draft[i].items = draft[i].items.filter(item=>item.patientId != patient.id)
                        }
                      })
                      setCaseData(draft=>{draft.patientIds=draft.patientIds.filter(id=>id!=patient.id)})
                      engine.unregister(patient.id);
                      setPatients(patients.filter(p=>p.id!=patient.id));
                    }}
                    clonePatient={()=>{
                      const newPatient = {
                        ...patient,
                        id: nanoid(),   
                        name: patient.name+"の複製",
                      }
                      engine.register(newPatient);
                      setPatients(draft=>{draft.push({...newPatient, ...engine.getPatient(newPatient.id)})})
                      setCaseData(draft=>{draft.patientIds.push(newPatient.id)})
                      setTimeout(()=>{scrollPatientBottomRef.current?.scrollIntoView({behavior: "smooth"});},100)
                    }}
                    setViews={setViews} 
                    patientIndex = {index}
                  />
                </Box>
              }
            })}
          </Stack>
        </div>
      }
      {isUpMd && 
        <Allotment vertical>
          <div className='overflow-y-scroll h-[calc(100vh_-_66px)] pb-10'>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mx:2,mt:2,mb:1}}>
              <Typography variant="h5" color="secondary" sx={{cursor: "default"}}>Views</Typography>
              <NewAddViewDialog 
                addViewItem={(viewItem)=>{
                  setCaseData(draft=>{draft.viewIds.push(viewItem.id)})
                  setViews(draft=>{draft.push(viewItem)})
                }} 
                patients={patients}
              />
            </Stack>
            <Stack alignItems="center" px={1} pb={8}>
              { caseData.viewIds?.map(viewId=>{
                const view = views.find(v=>v.id===viewId);
                if(view){ 
                  return <Box key={view.id} sx={{border:"1px solid #5c93bb2b", borderRadius:"8px",backgroundColor:"white",my:1,mx:1,pt:1,pb:3,boxShadow:"0 10px 20px #4b57a936", overflow:"auto", maxWidth: "1600px", width:1,minWidth:{xs:"auto",md:"400px"}}}>
                  {view.type === "PressureCurve" && 
                    <RealTimeChartNext engine={engine} initialView={view} patients={patients}
                      setInitialView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}} 
                      removeView={()=>{
                        setCaseData(draft=>{
                          draft.viewIds=draft.viewIds.filter(id=>id!=view.id)
                        })
                        setViews(draft=>{
                          draft.splice(draft.findIndex(v=>v.id===view.id),1)
                        })
                      }}
                      getTimeSeriesFn = {getTimeSeriesPressureFn}
                      hdpTypes = {pressureTypes}
                    />
                  }
                  {view.type === "FlowCurve" && 
                    <RealTimeChartNext engine={engine} initialView={view} patients={patients}
                      setInitialView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}} 
                      removeView={()=>{
                        setCaseData(draft=>{
                          draft.viewIds=draft.viewIds.filter(id=>id!=view.id)
                        })
                        setViews(draft=>{
                          draft.splice(draft.findIndex(v=>v.id===view.id),1)
                        })
                      }}
                      getTimeSeriesFn = {getTimeSeriesFlowFn}
                      hdpTypes = {flowTypes}
                    />
                  }                  
                  {view.type === "PressureVolumeCurve" && 
                    <PressureVolumeCurveNext engine={engine} initialView={view} 
                      setInitialView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}} 
                      removeView={()=>{
                        setCaseData(draft=>{
                          draft.viewIds=draft.viewIds.filter(id=>id!=view.id)
                        })
                        setViews(draft=>{
                          draft.splice(draft.findIndex(v=>v.id===view.id),1)
                        })
                      }}
                      patients={patients}/>
                  }
                  {
                    view.type === "Tracker" &&
                    <Tracker engine={engine} initialView={view} patients = {patients}
                      setInitialView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}}
                      removeView={()=>{
                        setCaseData(draft=>{
                          draft.viewIds=draft.viewIds.filter(id=>id!=view.id)
                        })
                        setViews(draft=>{
                          draft.splice(draft.findIndex(v=>v.id===view.id),1)
                        })
                      }
                    }/>
                  }
                </Box>
              }})}
            </Stack> 
          </div>
          <Allotment.Pane preferredSize={120} className='flex justify-center overflow-y-scroll'>
            {
              patients?.length>0  && 
              <div className='overflow-hidden w-full'>
                <OutputPanel outputs = {outputs} setOutputs={setOutputs} patients = {patients}/>
              </div>
            }
          </Allotment.Pane>
        </Allotment>
      }
      {isUpMd && 
        <Allotment.Pane preferredSize={88} className='pt-5 px-3'>
          <PlaySpeedButtonsNext engine={engine} vertical/>
        </Allotment.Pane>
      }   
      {!isUpMd && 
        <Allotment.Pane preferredSize={350}>
          <div className='flex w-full -mb-px'>
            <nav className="flex space-x-8 overflow-x-scroll ">
              <div className='flex w-full'>
                {caseData.viewIds?.map(viewId=>{
                  const view = views.find(v=>v.id===viewId);
                  if(view){ 
                    return <div key={view.id} className='flex-shrink-0 flex-grow-0'>
                      <div className={`btn py-2 px-5 text-sm font-bold mr-px text-center transition-all duration-150 ${selectedView?.id==view?.id ? "bg-white": "text-slate-600"} `} onClick={()=>{
                        setSelectedView(view)
                      }}>
                        {view?.name || "無題のグラフ"}
                      </div>
                    </div>
                  }
                } )}
                <NewAddViewDialog 
                  addViewItem={(viewItem)=>{
                    setCaseData(draft=>{draft.viewIds.push(viewItem.id)})
                    setViews(draft=>{draft.push(viewItem)})
                  }} 
                  patients={patients}
                />
              </div>
            </nav>
            <div className="flex-grow"></div>
            <PlaySpeedButtonsNext engine={engine}/>
          </div>
          <div>
          { caseData.viewIds?.map(viewId=>{
              const view = views.find(v=>v.id===viewId);            
              return  (view?.type === "PressureCurve" && view.id === selectedView?.id && 
                <RealTimeChartNext engine={engine} initialView={view} patients={patients}
                  setInitialView={newView=>{
                    setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===selectedView.id),1,newView)})
                    setSelectedView(newView)
                  }} 
                  removeView={()=>{
                    setCaseData(draft=>{
                      draft.viewIds=draft.viewIds.filter(id=>id!=selectedView.id)
                    })
                    setViews(draft=>{
                      draft.splice(draft.findIndex(v=>v.id===selectedView.id),1)
                    })
                  }}
                  getTimeSeriesFn = {getTimeSeriesPressureFn}
                  hdpTypes = {pressureTypes}
                />) || 
              (view?.type === "FlowCurve" && view.id === selectedView?.id && 
                <RealTimeChartNext engine={engine} initialView={view} patients={patients}
                  setInitialView={newView=>{
                    setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===selectedView.id),1,newView)})
                    setSelectedView(newView)
                  }} 
                  removeView={()=>{
                    setCaseData(draft=>{
                      draft.viewIds=draft.viewIds.filter(id=>id!=selectedView.id)
                    })
                    setViews(draft=>{
                      draft.splice(draft.findIndex(v=>v.id===selectedView.id),1)
                    })
                  }}
                  getTimeSeriesFn = {getTimeSeriesFlowFn}
                  hdpTypes = {flowTypes}
                />) ||                 
              (view?.type === "PressureVolumeCurve" && view.id === selectedView?.id &&
                <PressureVolumeCurveNext engine={engine} initialView={selectedView} 
                  setInitialView={newView=>{
                    setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===selectedView.id),1,newView)})
                    setSelectedView(newView)
                  }} 
                  removeView={()=>{
                    setCaseData(draft=>{
                      draft.viewIds=draft.viewIds.filter(id=>id!=selectedView.id)
                    })
                    setViews(draft=>{
                      draft.splice(draft.findIndex(v=>v.id===selectedView.id),1)
                    })
                  }}
                  patients={patients}
                />
              )  || 
              (view?.type === "Tracker" && view.id !== selectedView?.id &&
                  <Tracker engine={engine} initialView={view} patients={patients}
                    setInitialView={newView=>{
                      setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===selectedView.id),1,newView)})
                      setSelectedView(newView)
                    }}
                    removeView={()=>{
                      setCaseData(draft=>{
                        draft.viewIds=draft.viewIds.filter(id=>id!=selectedView.id)
                      })
                      setViews(draft=>{
                        draft.splice(draft.findIndex(v=>v.id===selectedView.id),1)
                      })
                    }}
                />) || null
            }
          )}
          </div>
        </Allotment.Pane>
      }
      {!isUpMd && 
        <Allotment.Pane preferredSize={88} className='z-20 bg-slate-200'>
          {patients?.length>0 && <OutputPanel outputs = {outputs} patients = {patients} setOutputs={setOutputs}/>}
        </Allotment.Pane>
      }
      {!isUpMd &&
        <div className='z-30'>
          <div className='flex w-full bg-slate-200 -mb-px'>
            <nav className="flex overflow-x-scroll ">
              <div className='flex w-full'>
                {caseData.patientIds?.map((patientId,index)=>{
                  const patient = patients.find(({id})=>id===patientId);
                  if(patient?.id){ 
                    return <div key={patient.id} className='flex-shrink-0 flex-grow-0'>
                      <div className={`btn py-2 px-5 text-sm font-bold mr-px text-center transition-all duration-150 ${selectedPatient?.id==patient.id ? "bg-white": "text-slate-600"} `} onClick={()=>{
                        setSelectedPatient(patient);
                      }}>
                        {patient?.name || "無題の患者"}
                      </div>
                    </div>
                  }
                } )}
              </div>
              <div className={`bg-white px-1.5 m-1.5 mx-2 inline-flex items-center rounded-sm cursor-pointer hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300`} onClick={()=>{setOpenAddPatientDialog(true)}}  >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </nav>
          </div>
          <div>
            {selectedPatient?.id && <ControllerPanelNext
              key={selectedPatient.id}
              patient={selectedPatient} 
              setPatient={newPatient=>{setPatients(draft=>{draft.findIndex(p=>p.id===selectedPatient.id)===-1? draft.push(newPatient) : draft.splice(draft.findIndex(p=>p.id===selectedPatient.id),1,newPatient);})}}
              removePatient={()=>{
                setViews(draft=>{
                  for(var i=0; i<draft.length; i++){
                    draft[i].items = draft[i].items.filter(item=>item.patientId != selectedPatient.id)
                  }
                })
                setCaseData(draft=>{draft.patientIds=draft.patientIds.filter(id=>id!=selectedPatient.id)})
                engine.unregister(selectedPatient.id);
                setPatients(patients.filter(p=>p.id!=selectedPatient.id));
              }}
              clonePatient={()=>{
                const newPatient = {
                  ...selectedPatient,
                  id: nanoid(),   
                  name: selectedPatient.name+"の複製",
                }
                engine.register(newPatient);
                setPatients(draft=>{draft.push({...newPatient, ...engine.getPatient(newPatient.id)})})
                setCaseData(draft=>{draft.patientIds.push(newPatient.id)})
                setTimeout(()=>{scrollPatientBottomRef.current?.scrollIntoView({behavior: "smooth"});},100)
              }}
              setViews={setViews} 
              patientIndex = {patients.findIndex(p=>p.id===selectedPatient.id)}
            />}
          </div>
        </div>
      }                     
    </Allotment> */}


{/* <ToggleButtonGroup
  color="primary"
  value={view.type}
  exclusive
  onChange={(e,newValue)=>{setView(draft=>{
    draft.type= newValue;
    switch (newValue) {
      case "FlowCurve": draft.items =[{hdp:"Ilad",label:"左前下行枝流量",color:getRandomColor(),patientId:patients[0].id,id:nanoid()}] ; break;
      case "PressureCurve": draft.items =[{hdp:"Plv",label:"左室圧",color:getRandomColor(),patientId:patients[0].id,id:nanoid()}]; break;
      case "PressureVolumeCurve": draft.items =[{hdp:"LV",label:"左室",color:getRandomColor(),patientId:patients[0].id,id:nanoid()}]; break;
      case "Tracker" : draft.items =[{xMetric:"Lvedp",yMetric: "Sv",label:"LVEDP vs SV",recordingFrequency :3, color:getRandomColor(),patientId:patients[0].id,id:nanoid()}]; break;
      default: draft.items = [{hdp:"Plv",label:"左室圧",color:getRandomColor(),patientId:patients[0].id,id:nanoid()}];
    }
  })}}
  sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
>
  <ToggleButton value="PressureCurve">圧曲線</ToggleButton>
  <ToggleButton value="FlowCurve">流量曲線</ToggleButton>
  <ToggleButton value="PressureVolumeCurve">圧容量曲線</ToggleButton>
  <ToggleButton value="PressureVolumeVsPressureCurve">圧容量vs圧曲線</ToggleButton>
  <ToggleButton value="Tracker">実験・記録</ToggleButton>
</ToggleButtonGroup>     */}

{/* <Dialog open={openAddPatientDialog} onClose={()=>{setOpenAddPatientDialog(false);setPatientListMode(null)}} sx={{minHeight:'340px',"& .MuiPaper-root":{width:"100%"}}} >
<DialogTitle >
  比較対象を追加する
</DialogTitle>
<DialogContent>
  {
    !patientListMode && <>
      <Typography variant="h6" fontWeight="bold">My Patients</Typography>
      <Masonry columns={{xs:1,md:3}} spacing={2} sx={{mt:.5}}>
        <Box className={classes.shadowBox} minWidth="120px">
          <Typography variant="body1" sx={{backgroundColor:"#edf2f6",px:2,py:1}}>{caseData.emoji +" "+ caseData.name}</Typography>
          <List>
            {
              patients?.map(p=>{return <ListItem disablePadding onClick={()=>{addPatient(p);setOpenAddPatientDialog(false)}}> 
                  <ListItemButton>
                    <ListItemText primary={p.name || "無題の患者"}/>
                  </ListItemButton>
              </ListItem>
            })}
          </List>
        </Box>
      </Masonry>
      <Link underline="hover" sx={{cursor:"pointer",my:1}} onClick={()=>{setPatientListMode("myPatients")}}>see more my patients →</Link>
      <Typography variant="h6" fontWeight="bold" sx={{mt:2}}>Popular</Typography>
      <Masonry columns={{xs:1,md:3}} spacing={2} sx={{mt:.5}}>
        {allCases?.filter(x=>x.patients?.length>0 && x.visibility != "private").slice(0,6).map(c=>{
          return <Box className={classes.shadowBox} minWidth="120px">
              <Stack sx={{backgroundColor:"#edf2f6",px:2,py:1}} >
                <Typography variant="body1">{c.emoji +" "+ (c.name || "無題の症例")}</Typography>
                <Stack direction="row" justifyContent="center" alignItems="center">
                  <Avatar sx={{ width: 16, height: 16 }}>
                    <Image src={c?.photoURL} layout='fill'/>
                  </Avatar>
                  <Typography variant="caption" sx={{mx:1}} >{c.displayName}</Typography>
                  <div style={{flexGrow:1}}/>
                  <FavoriteBorder sx={{color:"#6e7b85",fontSize:16}}/>
                  <Typography variant="caption" sx={{color:"#6e7b85"}}>{c.favs}</Typography>
                </Stack>
              </Stack>
              <List>
                {
                  c.patients?.map(p=>{
                    return( 
                    <ListItem disablePadding onClick={()=>{addPatient(p);setOpenAddPatientDialog(false)}} >
                      <ListItemButton>
                        <ListItemText primary={p.name || "無題の患者"}/>
                      </ListItemButton>
                    </ListItem>
                  )})}
              </List>
            </Box>
          })}  
        </Masonry>                    
      <Link underline="hover" sx={{cursor:"pointer",my:1}} onClick={()=>{setPatientListMode("popular")}}>see more public patients →</Link> 
    </>
  }
  {
    patientListMode && <>
      <ToggleButtonGroup
        color="primary"
        value={patientListMode}
        exclusive
        onChange={(e,newValue)=>{setPatientListMode(newValue)}}
        sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
      >
        <ToggleButton value="myPatients">My Patients</ToggleButton>
        <ToggleButton value="popular">Popular</ToggleButton>
      </ToggleButtonGroup>
    </>
  }
  {patientListMode == "myPatients" && <>
    <Masonry columns={{xs:1,md:3}} spacing={2} sx={{mt:.5}}>
      <Box className={classes.shadowBox} minWidth="120px">
        <Typography variant="body1" sx={{backgroundColor:"#edf2f6",px:2,py:1}}>{caseData.emoji +" "+ caseData.name}</Typography>
        <List>
          {
            patients?.map(p=>{return <ListItem disablePadding onClick={()=>{addPatient(p);setOpenAddPatientDialog(false)}}> 
                <ListItemButton>
                  <ListItemText primary={p.name}/>
                </ListItemButton>
            </ListItem>
          })}
        </List>
      </Box>
      {cases.data?.filter(c=>c.id!=caseData.id).sort((a,b)=>a.updatedAt > b.updatedAt ? -1 : 1).map(c=>{
        return <Box className={classes.shadowBox} minWidth="120px">
            <Typography variant="body1" sx={{backgroundColor:"#edf2f6",px:2,py:1}}>{c.emoji +" "+ c.name}</Typography>
            <List>
              {
                c.patients?.map(p=>{return <ListItem disablePadding onClick={()=>{addPatient(p);setOpenAddPatientDialog(false)}}> 
                    <ListItemButton>
                      <ListItemText primary={p.name}/>
                    </ListItemButton>
                </ListItem>
              })}
            </List>
          </Box>
      })}
    </Masonry>                        
  </>}
  {patientListMode == "popular" && <>
    <Masonry columns={{xs:1,md:3}} spacing={2} sx={{mt:.5}}>
      {allCases.data?.map(c=>{
        return <Box className={classes.shadowBox} minWidth="120px">
            <Stack sx={{backgroundColor:"#edf2f6",px:2,py:1}} >
              <Typography variant="body1">{c.emoji +" "+ c.name}</Typography>
              <Stack direction="row" justifyContent="center" alignItems="center">
                <Avatar sx={{ width: 16, height: 16 }}>
                  <Image src={c?.photoURL} layout='fill'/>
                </Avatar>
                <Typography variant="caption" sx={{mx:1}} >{c.displayName}</Typography>
                <div style={{flexGrow:1}}/>
                <FavoriteBorder sx={{color:"#6e7b85",fontSize:16}}/>
                <Typography variant="caption" sx={{color:"#6e7b85"}}>{c.favs}</Typography>
              </Stack>
            </Stack>
            <List>
              {
                c.patients?.map(p=>{
                  return( 
                  <ListItem disablePadding onClick={()=>{addPatient(p);setOpenAddPatientDialog(false)}} >
                    <ListItemButton>
                      <ListItemText primary={p.name}/>
                    </ListItemButton>
                  </ListItem>
                )})}
            </List>
          </Box>
        })}  
      </Masonry>                           
  </>}
</DialogContent>
</Dialog>       */}