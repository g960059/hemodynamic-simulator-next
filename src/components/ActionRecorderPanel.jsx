import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Popover} from '@mui/material'
import { nanoid } from '../utils/utils'
import DeleteMenuItemWithDialog from './DeleteMenuItemWithDialog'
import ActionRecorderDialog from './ActionRecorderDialog'



const ActionRecorder = React.memo(({updateHdp,patients, view, updateView,setViews,removeView,isOwner,engine}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [timeoutIds, setTimeoutIds] = useState({});
  const [replayingScenarioIds, setReplayingScenarioIds] = useState(new Set());
  const [currentActionIndex, setCurrentActionIndex] = useState({});
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState({});
  const [playbackSpeedPopoverAnchorEl, setPlaybackSpeedPopoverAnchorEl] = useState(null);
  const [replayDirection, setReplayDirection] = useState({});
  
  const [subscription, setSubscription] = useState(null);

  const handlePlaybackSpeedClick = (event) => {
    setPlaybackSpeedPopoverAnchorEl(event.currentTarget);
  };
  
  const handlePlaybackSpeedClose = () => {
    setPlaybackSpeedPopoverAnchorEl(null);
  };
  
  const handlePlaybackSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    setPlaybackSpeedPopoverAnchorEl(null);
  };
  
  
  const handleRecord =()=>{
    if(subscription?.subsId){
      engine.unsubscribeAllHdpMutation(subscription?.subsId)
      setSubscription(null)
      setReplayDirection(prev => ({ ...prev, [subscription?.scenarioId]: 'forward' }));
      setCurrentActionIndex(prev => ({ ...prev, [subscription?.scenarioId]: -1 }));
      setProgress(prev => ({ ...prev, [subscription?.scenarioId]: 0 }));
    }else{
      const startTime = +Date.now()
      const scenarioId = nanoid()
      updateView({id:view.id, ...view, scenarios: view?.scenarios ? [...view.scenarios, {id:scenarioId,label:"actions", actions:[],startTime}]: [{id:scenarioId,label:"actions", actions:[],startTime}]})
      const subsId = engine.subscribeAllHdpMutation((patientId, hdpKey, hdpValue)=>{
        setViews(draft => {
          const viewIdx = draft.findIndex(({id})=>id==view.id)
          const scenarioIdx = draft[viewIdx].scenarios.findIndex(({id})=>id==scenarioId)
          draft[viewIdx].scenarios[scenarioIdx].actions.push({patientId, key:hdpKey, value:hdpValue, time:+Date.now()})
        })
      })
      setSubscription({subsId, scenarioId})
    }
  }

  const replayActions = (scenario) => {
    setReplayingScenarioIds(prev => new Set([...prev, scenario.id]));
    setReplayDirection(prev => ({ ...prev, [scenario.id]: 'forward' }));
    const newTimeoutIds = timeoutIds[scenario.id] || [];
    const startTime = currentActionIndex[scenario.id] ? (currentActionIndex[scenario.id]==-1 ? scenario.startTime : scenario.actions[currentActionIndex[scenario.id]].time ) : scenario.startTime;
    const startIdx =  currentActionIndex[scenario.id] ?  Math.max(currentActionIndex[scenario.id] , 0) : 0;  
    const slicedActions = scenario.actions.slice(startIdx);
    if(startIdx >= scenario.actions.length) {
      setReplayDirection(prev => ({ ...prev, [scenario.id]: 'backward' }));
      setReplayingScenarioIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(scenario.id);
        return newSet;
      })
      setProgress(prev => ({ ...prev, [scenario.id]: 100 }));
    }else{
      slicedActions.forEach((action, index) => {
        // console.log(index, action.time - startTime)
        const timeoutId = setTimeout(() => {
          // console.log(index, "action is executed")
          updateHdp(action.patientId)(action.key, action.value);
          setCurrentActionIndex(prev => ({ ...prev, [scenario.id]: index + startIdx}));
          if (index == slicedActions?.length - 1) {
            setReplayDirection(prev => ({ ...prev, [scenario.id]: 'backward' }));
            setReplayingScenarioIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(scenario.id);
              return newSet;
            });
            setProgress(prev => ({ ...prev, [scenario.id]: 100 }));
          }
        }, (action.time - startTime) / playbackSpeed);
        newTimeoutIds.push(timeoutId);
      });
      setTimeoutIds({ ...timeoutIds, [scenario.id]: newTimeoutIds });
    }

  };
  
  const resetActions = (scenario) => {
    setReplayingScenarioIds(prev => new Set([...prev, scenario.id]));
    const startIdx = currentActionIndex[scenario.id] || Math.max(scenario.actions?.length - 1,0) ;     
    const newTimeoutIds = timeoutIds[scenario.id] || [];
    const reversedActions = [...scenario.actions].reverse();
    const slicedActions = reversedActions.slice(reversedActions.length - 1 - startIdx);
    if(startIdx <= 0) {
      setReplayDirection(prev => ({ ...prev, [scenario.id]: 'forward' }));
      setReplayingScenarioIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(scenario.id);
        return newSet;
      });
      setProgress(prev => ({ ...prev, [scenario.id]: 0 }));
    }else{
      slicedActions.forEach((action, index) => {
        const timeoutId = setTimeout(() => {
          updateHdp(action.patientId)(action.key, action.value);
          setCurrentActionIndex(prev => ({ ...prev, [scenario.id]: ( - index + startIdx)}));
          if (index === slicedActions.length - 1 ) {
            const finalTimeoutId = setTimeout(() => {
              setReplayDirection(prev => ({ ...prev, [scenario.id]: 'forward' }));
              setReplayingScenarioIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(scenario.id);
                return newSet;
              });
              setProgress(prev => ({ ...prev, [scenario.id]: 0 }));
            }, (action.time - scenario.startTime) / playbackSpeed);
            setCurrentActionIndex(prev => ({ ...prev, [scenario.id]: -1}));
            newTimeoutIds.push(finalTimeoutId);
          }
        }, (slicedActions[0].time - action.time) / playbackSpeed);
        newTimeoutIds.push(timeoutId);
      });
      setTimeoutIds({ ...timeoutIds, [scenario.id]: newTimeoutIds });
    }

  };

  const stopReplayActions = (scenarioId) => {
    setReplayingScenarioIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(scenarioId);
      return newSet;
    });  
    (timeoutIds[scenarioId] || []).forEach((id) => {
      clearTimeout(id);
    });
    // const currentIdx = currentActionIndex[scenarioId];
    setTimeoutIds({ ...timeoutIds, [scenarioId]: [] });
    // setStoppedActionIndex({ ...stoppedActionIndex, [scenarioId]: currentIdx });
  };

  useEffect(() => {
    const intervalIds = {};
    view?.scenarios?.forEach((scenario) => {
      if (replayingScenarioIds.has(scenario.id) && scenario.actions.length > 0) {
        const totalDuration = scenario.actions[scenario.actions.length - 1]?.time - scenario.startTime;
        const startReplayTime = + Date.now();
        const startActionIndex = currentActionIndex[scenario.id] !== undefined ? currentActionIndex[scenario.id] : 0;
        const startActionTime = currentActionIndex[scenario.id] >=0 ? scenario.actions[startActionIndex]?.time : scenario.startTime;
        intervalIds[scenario.id] = setInterval(() => {
          const currentTime = + Date.now();
          const elapsedTime = replayDirection[scenario.id] != 'backward' ?  
            (currentTime - startReplayTime) * playbackSpeed + (startActionTime - scenario.startTime) :
            (currentTime - startReplayTime) * playbackSpeed + (scenario.actions[scenario.actions.length - 1]?.time - startActionTime); 
          let progressRatio  = progress[scenario.id] 
          if(replayDirection[scenario.id] == 'backward' && progressRatio > 0){
            progressRatio = 100 - (elapsedTime / totalDuration) * 100;
          }else{
            if(replayDirection[scenario.id] == 'forward' && progressRatio < 100)
            {
              progressRatio = (elapsedTime / totalDuration) * 100;
            }
          } 
          console.log(progressRatio, elapsedTime, totalDuration)
          setProgress((prev) => ({ ...prev, [scenario.id]: Math.min(Math.max(progressRatio, 0), 100) }));
        }, 100);
      }
    });
  
    return () => {
      Object.values(intervalIds).forEach((id) => clearInterval(id));
    };
  }, [replayingScenarioIds, view?.scenarios, playbackSpeed, replayDirection]);


  return <>
    <div className='w-full h-full overflow-hidden'>
      <div className='flex items-center p-2 pb-1 pl-4 mb-2 border-solid border-0 border-b border-b-slate-200 relative h-10'>
        <div className='draggable cursor-move font-bold text-base md:text-lg pl-1 whitespace-nowrap overflow-x-auto'>{view?.name || "Recorder"}</div>
        <div className='draggable cursor-move flex-grow h-full'></div>
        <button onClick={handleRecord} type="button" className=' text-slate-700  cursor-pointer py-1 px-1.5 md:px-3 text-sm rounded-md items-center border-none bg-slate-100 hover:bg-slate-200  transition'>
          {subscription ?<span class="relative inline-flex h-2.5 w-2.5 mr-2">
            <span class="animate-ping duration-75 absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span > :
          <span class="relative inline-flex h-2.5 w-2.5 mr-2">
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-900"></span>
          </span>
          }
          <div className='inline-block w-28'>{subscription ? "Stop Recording" : "Start Recording"}</div>
        </button>        
        {isOwner && <div className='p-1 px-3 -my-2 flex items-center cursor-pointer text-slate-600 hover:text-lightBlue-500 transition' onClick={e => { setAnchorEl(e.currentTarget)}}>
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </div>}
      </div>
      <div className='flex flex-col flex-wrap bg-white w-full h-[calc(100%_-_48px)] relative overflow-auto' >
        <div className='w-full flex flex-col'>
          {
            view?.scenarios?.map((scenario) => <>
              {
                subscription?.scenarioId != scenario.id ?  <div className='w-full flex flex-col items-start justify-center p-2 md:px-4' key={scenario.id}> 
                  <div className='flex flex-row justify-center items-center space-x-2'>
                    <div className='mb-2 text-base font-bold text-slate-500'>{scenario.label}</div>
                    <div className='mb-2 text-sm  text-slate-500'>{scenario?.actions?.length} actions recoreded</div>
                  </div>
                  <div className='w-full flex flex-row items-center justify-center'>
                    {replayingScenarioIds.has(scenario.id)  ? 
                      <>
                        <button className='border border-solid px-2 py-1 flex flex-row justify-center items-center rounded-md border-slate-200 stroke-slate-500 hover:stroke-slate-700 hover:bg-slate-100' onClick={() => { stopReplayActions(scenario.id); }} type="button">
                          <svg className='w-5 h-5 mr-0.5' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z" fill="none" strokeMiterlimit="10" strokeWidth="32"/><path d="M310.4 336H201.6a25.62 25.62 0 01-25.6-25.6V201.6a25.62 25.62 0 0125.6-25.6h108.8a25.62 25.62 0 0125.6 25.6v108.8a25.62 25.62 0 01-25.6 25.6z"/></svg>
                          <span className='text-sm text-slate-500 hover:text-slate-700'>stop</span>
                        </button>
                      </> :
                      replayDirection[scenario.id] == "backward" ?
                        <button className='border border-solid px-2 py-1 flex flex-row justify-center items-center rounded-md border-slate-200 stroke-slate-500 hover:stroke-slate-700 hover:bg-slate-100' onClick={() => { resetActions(scenario); }} type="button">
                            <svg className='w-5 h-5 mr-0.5' xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 512 512"><path d="M256 448c106 0 192-86 192-192S362 64 256 64 64 150 64 256s86 192 192 192z" fill="none" strokeMiterlimit="10" strokeWidth="32"/><path d="M192 176a16 16 0 0116 16v53l111.68-67.46a10.78 10.78 0 0116.32 9.33v138.26a10.78 10.78 0 01-16.32 9.31L208 267v53a16 16 0 01-32 0V192a16 16 0 0116-16z"/></svg>
                            <span className='text-sm text-slate-500 hover:text-slate-700'>reset</span>
                        </button> :            
                      <>
                        <button className='border border-solid px-2 py-1 flex flex-row justify-center items-center rounded-md border-slate-200 stroke-slate-500 hover:stroke-slate-700 hover:bg-slate-100' onClick={() => { replayActions(scenario); }} type="button">
                          <svg className='w-5 h-5 mr-0.5' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M112 111v290c0 17.44 17 28.52 31 20.16l247.9-148.37c12.12-7.25 12.12-26.33 0-33.58L143 90.84c-14-8.36-31 2.72-31 20.16z" fill="none" strokeMiterlimit="10" strokeWidth="32"/></svg>
                          <span className='text-sm text-slate-500 hover:text-slate-700'>replay</span>
                        </button>
                      </>
                    }
                    <button 
                      className='border border-solid px-2 py-1 mx-2 text-sm text-slate-500 rounded-md border-slate-200 stroke-slate-500 hover:stroke-slate-700 hover:bg-slate-100' 
                      type="button"
                      onClick={handlePlaybackSpeedClick}
                    >
                      x{playbackSpeed}
                    </button>

                    <Popover
                      open={Boolean(playbackSpeedPopoverAnchorEl)}
                      anchorEl={playbackSpeedPopoverAnchorEl}
                      onClose={handlePlaybackSpeedClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                      }}
                    >
                      <div className='p-2'>
                        {[0.25,0.5,1,2.0,5.0].map((speed)=>(
                          <div onClick={() => handlePlaybackSpeedChange(speed)} className='cursor-pointer py-1'>{speed}倍速</div> 
                        ))}
                      </div>
                    </Popover>
                    <div class="flex-grow ml-2 bg-gray-200 rounded-full dark:bg-gray-700">
                      <div class="bg-blue-500 text-xs h-4 font-medium text-sky-100 text-center p-0.5 leading-none rounded-full" style={{ width: `${ Math.round(progress[scenario.id])>3  ? ( Math.round(progress[scenario.id])>97 ? 100 : Math.ceil(progress[scenario.id] || 0)) : 0 }%` }}>{Math.round(progress[scenario.id])>3  ? ( Math.round(progress[scenario.id])>97 ? 100 : Math.ceil(progress[scenario.id] || 0))+"%": ""}</div>
                    </div>                      
                  </div>
                </div>: <div className='w-full flex flex-col items-start justify-center p-2 md:px-4' >
                  {scenario?.actions?.length || 0} actions recoreded...
                </div>
              }
              <div className='w-full px-4 pt-2'>
                <div className='border-0 border-b border-slate-200'></div>
              </div>
            </> )
          }
        </div>

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
      slotProps={{paper:{className:'border border-solid border-slate-200 rounded shadow-md'}}}
    >
      <div className='flex flex-col items-center justify-center py-2'>
        <div onClick={()=> {setDialogOpen(true); setAnchorEl(null)}} 
          className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
        >
          <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Edit
        </div>
        <DeleteMenuItemWithDialog raw onDelete={()=>{removeView()}} onClose={()=>setAnchorEl(null)} message ={"「"+(view?.name || "Recorder") + "」を削除しようとしています。この操作は戻すことができません。"}>
          <div className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1  text-red-500 hover:bg-red-500 hover:text-white">
            <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>                                
            Delete
          </div>
        </DeleteMenuItemWithDialog>
      </div>
    </Popover>
    <ActionRecorderDialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} initialView={view} updateView={(newView)=>{updateView({id:view.id, ...newView});}} patients={patients}/>
  </>
})



export default ActionRecorder

