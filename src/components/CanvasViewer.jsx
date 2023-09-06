import React, {useRef, useState, useEffect, useCallback} from 'react'
import {useMediaQuery} from '@mui/material'
import PlaySpeedButtonsNext from './PlaySpeedButtonsNext'
import MetricsPanel from './MetricsPanel'
import ControllerPanelNext from './controllers/ControllerPanelNext'

import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import dynamic from 'next/dynamic'
import {getTimeSeriesPressureFn,  getTimeSeriesFlowFn}  from "../utils/presets"
import { formatDateDiff } from '../utils/utils'

import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation' 
import Link from 'next/link';
import Image from 'next/image'
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
const ResponsiveReactGridLayout = WidthProvider(Responsive);
import NoteViewer from './NoteViewer'

const RealTimeChartNext = dynamic(()=>import('./RealTimeChartNext'), {ssr: false});
const PressureVolumeCurveNext = dynamic(()=>import('./PressureVolumeCurveNext'), {ssr: false,});
const Tracker = dynamic (()=>import('./Tracker'), {ssr: false,});
// const CombinedChart = dynamic(()=>import('./combined/CombinedChart'), {ssr: false,});

SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY);


const StyledReactGridLayout = styled(ResponsiveReactGridLayout)`
  & .react-grid-item.react-grid-placeholder {
    background: #3ea8ff !important;
  }
`;


const CanvasViewer = React.memo(({engine,caseData,setCaseData,patients,setPatients ,views, setViews, isLogin, isOwner, addLike, removeLike, addBookmark, removeBookmark, liked, bookmarked, isEdit}) => {

  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [mounted, setMounted] = useState(false);
  const router = useRouter()

  useEffect(() => {
    if (views?.length>0 || patients?.length>0){setMounted(true);}
  }, []);


  return <div className='w-full pb-3'> 
    <div className='flex flex-col mb-3  mx-3 md:mx-8 md:items-start justify-center'>
      <div className='flex flex-col md:flex-row w-full items-center justify-center'>
        <div className=' mt-8 md:my-8 text-xl md:text-2xl font-bold text-slate-800 '>{caseData?.name}</div>
        <div className='flex-grow'></div>
        {isOwner && <Link href={`/canvas/${caseData.id}`} className='py-1 px-1 md:px-4 mb-3 md:mb-0 self-end md:self-auto bg-white shadow stroke-slate-500 text-slate-500 cursor-pointer  text-sm md:text-base rounded-md flex justify-center items-center hover:bg-slate-100 border border-solid border-slate-200 transition'>編集する</Link>}
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
            <svg xmlns="http://www.w3.org/2000/svg" strokeWidth={2} className='w-4 h-4 md:w-5 md:h-5' fill={!liked  && "none"} viewBox="0 0 24 24" >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <span className='pl-1.5 font-bold text-sm md:text-base'>{caseData.totalLikes || 0}</span>
          </button>}  
          {(isLogin) && <button onClick={()=>{if(!isLogin) return; if(bookmarked){removeBookmark()}else{addBookmark()}}} className={`mr-2 md:mr-3 ${bookmarked ? "bg-red-100 hover:bg-red-200 fill-red-300 stroke-red-500 text-red-500 hover:fill-red-300 hover:stroke-red-600 hover:text-red-600" : "bg-slate-100   fill-slate-500 stroke-slate-500 text-slate-500 "} ${isLogin && "cursor-pointer"} ${isLogin && !bookmarked && "hover:bg-slate-200 hover:fill-slate-600 hover:stroke-slate-600 hover:text-slate-600"} py-1.5 md:py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center   border-none transition`}>
            <svg xmlns="http://www.w3.org/2000/svg" strokeWidth={2} className='w-4 h-4 md:w-5 md:h-5' fill={!bookmarked  && "none"} viewBox="0 0 24 24" >
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
        </div>
      </div>
    </div>
    <StyledReactGridLayout
      layouts={caseData?.layouts}
      breakpoints={{ md: 960, xs: 0 }}
      cols={{ md: 12, xs: 12 }}
      measureBeforeMount={false}
      useCSSTransforms={mounted}
      rowHeight={30}
      draggableHandle=".draggable"
      onLayoutChange={(layout,layouts) =>{
        setCaseData(draft=>{
          draft.layouts = layouts
        })
      }}
      isDraggable = {isOwner}
      isResizable = {isOwner}
    >
      { views?.filter(view => view.type !="PlaySpeed").map(view =>
        <div key={view.id}  className={`bg-white border border-solid border-slate-200 rounded ${view.type != "Note" ? "overflow-y-auto" : "overflow-hidden"}`}>
          {view.type === "Controller" && 
            <ControllerPanelNext
              key = {view.id}
              view = {view}
              updateView = {newController=>{setViews(draft=>{draft.findIndex(c=>c.id===view.id)===-1? draft.push(newController) : draft.splice(draft.findIndex(c=>c.id===view.id),1,newController);})}}
              removeView={()=>{
                setViews(draft=>{
                  draft.splice(draft.findIndex(c=>c.id===view.id),1)
                })
                setCaseData(draft=>{
                  draft.layouts.md = draft.layouts.md.filter(layoutItem => layoutItem.i != view.id )
                  draft.layouts.xs = draft.layouts.xs.filter(layoutItem => layoutItem.i != view.id )
                })
              }}
              patients = {patients}
              patient={patients.find(p=>p.id===view.patientId)}
              setPatient={newPatient=>{setPatients(draft=>{draft.findIndex(p=>p.id===view.patientId)===-1? draft.push(newPatient) : draft.splice(draft.findIndex(p=>p.id===view.patientId),1,newPatient);})}}
              isOwner={isOwner}
            />
          }
          {view.type === "PressureCurve" && 
            <RealTimeChartNext 
              engine={engine} patients={patients}
              view={view}
              updateView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}} 
              removeView={()=>{
                setCaseData(draft=>{
                  draft.layouts.md = draft.layouts.md.filter(layoutItem => layoutItem.i != view.id )
                  draft.layouts.xs = draft.layouts.xs.filter(layoutItem => layoutItem.i != view.id )                  
                })
                setViews(draft=>{
                  draft.splice(draft.findIndex(v=>v.id===view.id),1)
                })
              }}
              getTimeSeriesFn = {getTimeSeriesPressureFn}
              isOwner={isOwner}
            />
          }
          {view.type === "FlowCurve" && 
            <RealTimeChartNext
              engine={engine} patients={patients}
              view={view}
              updateView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}} 
              removeView={()=>{
                setCaseData(draft=>{
                  draft.layouts.md = draft.layouts.md.filter(layoutItem => layoutItem.i != view.id )
                  draft.layouts.xs = draft.layouts.xs.filter(layoutItem => layoutItem.i != view.id )                  
                })
                setViews(draft=>{
                  draft.splice(draft.findIndex(v=>v.id===view.id),1)
                })
              }}
              getTimeSeriesFn = {getTimeSeriesFlowFn}
              isOwner={isOwner}
            />
          }                  
          {view.type === "PressureVolumeCurve" && 
            <PressureVolumeCurveNext 
              engine={engine} 
              view={view} 
              updateView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}} 
              removeView={()=>{
                setCaseData(draft=>{
                  draft.layouts.md = draft.layouts.md.filter(layoutItem => layoutItem.i != view.id )
                  draft.layouts.xs = draft.layouts.xs.filter(layoutItem => layoutItem.i != view.id )                  
                })
                setViews(draft=>{
                  draft.splice(draft.findIndex(v=>v.id===view.id),1)
                })
              }}
              patients={patients}
              isOwner={isOwner}
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
            />
          } */}
          {
            view.type === "Metrics" &&
            <MetricsPanel 
              view={view} 
              updateView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}}
              patients={patients}
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
          }
          {
            view.type == "Note" && 
            <NoteViewer
              view={view}
              updateView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}}
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
              caseData={caseData}
              setCaseData={setCaseData}
            />
          }
        </div>
      )}      
      {
        views?.filter(view => view.type === "PlaySpeed").map(view => 
          <div key={view.id}  className='overflow-hidden'>
            <PlaySpeedButtonsNext 
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

export default CanvasViewer


