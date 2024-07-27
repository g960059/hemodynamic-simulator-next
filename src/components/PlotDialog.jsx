import React, {useState} from 'react';
import {Dialog,Grow,Popover,MenuItem,Select,useMediaQuery} from '@mui/material'
import EditableText from './EditableText';
import { DragDropContext,Droppable,Draggable} from 'react-beautiful-dnd';
import {nanoid} from "../utils/utils"
import { useImmer } from "use-immer";
import { useTranslation } from '../hooks/useTranslation';
import { metricOptions } from '../utils/metrics';
import ColorPicker from './ColorPicker';
import { getRandomColor } from '../styles/chartConstants';
import {Switch} from './ui/switch'
import { Transition } from 'react-transition-group';
import { clsx } from 'clsx';

const PlotDialog = React.memo(({open, onClose, initialView=null, updateView,patients}) =>{
  const getDefaultView = ()=>{
    return ({
      id: nanoid(),
      name: "Plot",
      type: "Plot",
      hideTitle:false,
      curve: "point",
      items:[{
        id: nanoid(),
        label: "Normal",
        patientId: patients.length > 0 ? patients[0].id : null,
        xSource: "Lvedp",
        ySource: "Sv",
        color: getRandomColor(),
      }],
      axis:{
        bottom : {
          title: "LVEDP(mmHg)",
          postfix: "",
          precision: null,
          autoScale: true,
          min: null,
          max: null,
        },
        left: {
          title: "SV(ml)",
          postfix: "",
          precision: null,
          autoScale: true,
          min: null,
          max: null,
        }
      },
      interval: 1000,
      fifoCapacity: 600,
      autoStart: true,
    })
  }
  const [view, setView] = useImmer(initialView || getDefaultView()  );
  
  const [viewItemAnchorEl, setViewItemAnchorEl] = useState(null);
  const [edittingIndex, setEdittingIndex] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [openNewMetric, setOpenNewMetric] = useState(false);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));

  return <>
    <Dialog fullScreen={!isUpMd} sx={{ ".MuiDialog-paper": {m:0}}} open ={open} onClose ={onClose}>
      <div className='sticky top-0 md:min-w-[460px] bg-white border-solid border-0 border-b border-slate-200 w-full p-3 pl-4 flex flex-row items-center justify-center'>
        <div className='text-base font-bold text-center inline-flex items-center'>
          <svg className='w-6 h-5 mr-1.5 stroke-blue-500' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
          </svg>   
          {initialView ? "Edit Plot" : "Add New Plot"}  
        </div>
        <div className='md:w-60 flex-grow'/>
        <button onClick={onClose} type="button" class="bg-white cursor-pointer rounded-full pr-2 py-1 border-none inline-flex items-center justify-center ">
          <svg className='stroke-slate-600 w-4 h-4' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className='w-full px-6 py-5'>
        <div className='text-base text-slate-500 font-bold '>設定</div>
        <hr class="mb-3 h-px border-0 bg-gray-300" />
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>タイトル</div>
          <div className='flex-grow'/>
          <EditableText value={view?.name} updateValue={newTitle=>{setView(draft=>{draft.name=newTitle})}}  />
        </div>
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>プロット間隔(ms)</div>
          <div className='flex-grow'/>
          <EditableText value={view?.interval} updateValue={newValue=>{setView(draft=>{draft.interval=Number(newValue)})}}  />
        </div>
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>最大プロット数</div>
          <div className='flex-grow'/>
          <EditableText value={view?.fifoCapacity} updateValue={newValue=>{setView(draft=>{draft.fifoCapacity=Number(newValue)})}}  />
        </div>
        <div className='flex flex-row items-center w-full my-2'>
          <div className='text-base'>最初から記録開始</div>
          <div className='flex-grow'/>
          <Switch
            checked={view?.autoStart}
            onCheckedChange={newValue=>{setView(draft=>{draft.autoStart=newValue})}}
          />
        </div>                         
        <div className='text-base text-slate-500 font-bold mt-3'>xy軸の設定</div>
        <hr class="mb-3 h-px border-0 bg-gray-300" /> 
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>タイトル(x軸)</div>
          <div className='flex-grow'/>
          <EditableText value={view?.axis?.bottom?.title} updateValue={newValue=>{setView(draft=>{draft.axis.bottom.title=newValue})}}  />
        </div> 
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>タイトル(y軸)</div>
          <div className='flex-grow'/>
          <EditableText value={view?.axis?.left?.title} updateValue={newValue=>{setView(draft=>{draft.axis.left.title=newValue})}}  />
        </div>                                     
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>単位(x軸)</div>
          <div className='flex-grow'/>
          <EditableText value={view?.axis?.bottom?.postfix} updateValue={newValue=>{setView(draft=>{draft.axis.bottom.postfix=newValue})}}  />
        </div>
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>単位(y軸)</div>
          <div className='flex-grow'/>
          <EditableText value={view?.axis?.left?.postfix} updateValue={newValue=>{setView(draft=>{draft.axis.left.postfix=newValue})}}  />
        </div>
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>有効桁数(x軸)</div>
          <div className='flex-grow'/>
          <EditableText value={view?.axis?.bottom?.precision} updateValue={newValue=>{setView(draft=>{draft.axis.bottom.precision=newValue})}} placeholder="2,3,etc.."  />
        </div>
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>有効桁数(y軸)</div>
          <div className='flex-grow'/>
          <EditableText value={view?.axis?.left?.precision} updateValue={newValue=>{setView(draft=>{draft.axis.left.precision=newValue})}} placeholder="2,3,etc.." />
        </div>
        <div className='flex flex-row items-center w-full my-2'>
          <div className='text-base'>オートスケール(x軸)</div>
          <div className='flex-grow'/>
          <Switch
            checked={view?.axis?.bottom?.autoScale}
            onCheckedChange={newValue=>{setView(draft=>{draft.axis.bottom.autoScale=newValue})}}
          />
        </div>        
        {!view?.axis?.bottom?.autoScale && <>
          <div className='flex flex-row items-center w-full mt-1'>
            <div className='text-base'>最小値(x軸)</div>
            <div className='flex-grow'/>
            <EditableText value={view?.axis?.bottom?.min} updateValue={newValue=>{setView(draft=>{draft.axis.bottom.min=newValue})}}  />
          </div>           
          <div className='flex flex-row items-center w-full mt-1'>
            <div className='text-base'>最大値(x軸)</div>
            <div className='flex-grow'/>
            <EditableText value={view?.axis?.bottom?.max} updateValue={newValue=>{setView(draft=>{draft.axis.bottom.max=newValue})}}  />
          </div>
        </>}
        <div className='flex flex-row items-center w-full my-2'>
          <div className='text-base'>オートスケール(y軸)</div>
          <div className='flex-grow'/>
          <Switch
            checked={view?.axis?.left?.autoScale}
            onCheckedChange={newValue=>{setView(draft=>{draft.axis.left.autoScale=newValue})}}
          />
        </div>
        {!view?.axis?.left?.autoScale && <>        
          <div className='flex flex-row items-center w-full mt-1'>
            <div className='text-base'>最小値(y軸)</div>
            <div className='flex-grow'/>
            <EditableText value={view?.axis?.left?.min} updateValue={newValue=>{setView(draft=>{draft.axis.left.min=newValue})}}/>
          </div>  
          <div className='flex flex-row items-center w-full mt-1'>
            <div className='text-base'>最大値(y軸)</div>
            <div className='flex-grow'/>
            <EditableText value={view?.axis?.left?.max} updateValue={newValue=>{setView(draft=>{draft.axis.left.max=newValue})}} />
          </div> 
        </>}                                                       
        <div className='mt-7 text-base text-slate-500 font-bold'>記録データ</div>
        <hr class="mb-3 h-px border-0 bg-gray-300" /> 
        <div className='w-full min-h-[240px]'>
          <DragDropContext onDragEnd={({source:src, destination:dest})=>{
            if(!dest ) return;
            setView(draft=>{
              const [insertItem] = draft.items.splice(src.index,1);
              draft.items.splice(dest.index,0,insertItem);
              if(dest.index == edittingIndex) setEdittingIndex(src.index)
              else if(src.index == edittingIndex) setEdittingIndex(dest.index)
            })
          }}>
            <Droppable droppableId="droppable">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {view.items.map((item,index)=> ( 
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) =>
                        <Transition in={edittingIndex != index} timeout={150}>
                          {state=>(
                            <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} className={clsx("border-solid border rounded-lg overflow-hidden" , (state=="exiting" || state=="exited" || state=="entering") && "border-2 border-blue-500  ring-4 ring-blue-50",state =="entered" && "border border-slate-200")}>
                              <div className={clsx("cursor-grab flex flex-row items-center justify-center  bg-slate-200 ", state== "entered" && "animate-in fade-in", state=="exiting" && "animate-out fade-out", (state=="exited" || state=="entering") && "hidden")}>
                                <svg className="w-6 h-6 " focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DragIndicatorIcon"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                                <div onClick={()=>{setEdittingIndex(index);setOpenNewMetric(false)}} className='cursor-pointer bg-white rounded-lg pl-2 w-full flex items-center justify-center hover:bg-slate-100'>
                                  <div className='w-1 rounded-sm mr-3 py-3' style={{backgroundColor: item?.color}}/>
                                  <div className='text-base'>{item?.label}</div>
                                  <div className='flex-grow'></div>
                                  <div className='p-1 py-2 flex items-center' onClick={e => {e.stopPropagation(); setViewItemAnchorEl(e.currentTarget);setActiveItemId(item.id)}}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                    </svg>
                                  </div>
                                  <Popover 
                                    open={Boolean(viewItemAnchorEl) && activeItemId === item.id}
                                    anchorEl={viewItemAnchorEl}
                                    onClose={(e)=>{e.stopPropagation();setViewItemAnchorEl(null);setActiveItemId(null)}}
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
                                    disablePortal
                                    PaperProps={{style: {backgroundColor: 'transparent',boxShadow: 'none',width: 'auto',maxWidth: 'none',}}}
                                  >
                                    <div className='flex flex-col items-center justify-center py-2 bg-white border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0'>
                                      <div onClick={()=> {setEdittingIndex(index); setViewItemAnchorEl(null);setActiveItemId(null)}} 
                                        className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
                                      >
                                        <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                        </svg>
                                        Edit
                                      </div>
                                      <div onClick={(e)=>{e.stopPropagation();setView(draft=>{draft.items.splice(index,1)});setViewItemAnchorEl(null);setActiveItemId(null)}} 
                                        className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1 text-red-500 hover:bg-red-500 hover:text-white"
                                      >
                                        <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>                                
                                        Delete
                                      </div>
                                    </div>
                                  </Popover>                          
                                </div>
                              </div>
                              <div className={clsx(state=="exited" && "animate-in fade-in", state=="entering" && "animate-out fade-out", (state=="entered" || state=="exiting") && "hidden")}>
                                <PlotEditor  
                                  key={item.id} initialItem={item} patients={patients} handleClose={()=>{setEdittingIndex(null)}} 
                                  handleUpdate={(newItem)=>{setView(draft=>{draft = draft.items.splice(index,1,newItem);setEdittingIndex(null);})}} 
                                />
                              </div>
                            </div>
                          )}
                        </Transition>
                      }
                    </Draggable> 
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <Transition in={!openNewMetric} timeout={150}>
            {state=>(            
              <div className={clsx("mt-4 border-solid rounded-lg", (state=="exiting" || state=="exited" || state=="entering") && "border-2 border-blue-500  ring-4 ring-sky-100",state =="entered" && "border border-slate-200")}>          
                <div onClick={()=>{setOpenNewMetric(true); setEdittingIndex(null)}} 
                  className={ clsx(state== "entered" && "animate-in fade-in", state=="exiting" && "animate-out fade-out", (state=="exited" || state=="entering") && "hidden", "cursor-pointer py-2 px-4 text-base flex justify-center items-center hover:bg-slate-100 hover:border-slate-100 text-slate-600")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" class="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add new plot
                </div> 
                <div className={clsx(state=="exited" && "animate-in fade-in", state=="entering" && "animate-out fade-out", (state=="entered" || state=="exiting") && "hidden")}>
                  <PlotEditor 
                    patients={patients} 
                    handleClose={()=>{setOpenNewMetric(false)}} 
                    handleUpdate={(newItem)=>{
                      setView(draft=>{
                        draft.items.push({...newItem,id:nanoid()});
                      })
                      setOpenNewMetric(false)
                    }}
                  />
                </div> 
              </div>
            )}
          </Transition> 
        </div>  
      </div>  
      <div className='sticky bottom-0 bg-white w-full p-3 border-solid border-0 border-t border-slate-200 flex flex-row items-center justify-center md:justify-end space-x-4'>
        <button  
          type='button' onClick={()=>{onClose();setOpenNewMetric(false)}} 
          className="py-2 px-4 w-full md:w-auto font-bold text-slate-600 bg-slate-100 cursor-pointer text-sm rounded-md flex justify-center items-center  hover:bg-slate-200 transition">
          キャンセル
        </button>
        { view.items.length >0 ? 
          <button 
            type='button' 
            onClick={()=>{
              updateView(view)
              if(!initialView){
                setView(getDefaultView())
              }
              onClose()
            }} 
            className='bg-blue-500 text-white font-bold cursor-pointer w-full md:w-auto py-2 px-4 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
          >
            {initialView ? "更新する" : "追加する"}
          </button>: <button 
            type='button' 
            className=' bg-slate-200 text-slate-500 font-bold w-full md:w-auto  py-2 px-4 text-sm rounded-md flex justify-center items-center  border-none transition'
          >
            {initialView ? "更新する" : "追加する"}
          </button>
        }
      </div>
    </Dialog>
  </>
})

export default PlotDialog;


const PlotEditor = ({initialItem=null,patients, handleClose, handleUpdate}) =>{
  const [newItem, setNewItem] = useImmer(initialItem || {label:patients[0]?.name || t["Lvedp"] + "vs"+ t["Sv"],xSource: "Lvedp",ySource: "Sv",patientId: patients[0].id, color:getRandomColor()});
  const t = useTranslation()
  return <>
    <div className='flex flex-col items-center w-full border-solid border border-slate-200  p-2'>
      <div className='flex flex-row items-center w-full mt-1'>
        <div className='text-base'>Model</div>
        <div className='flex-grow'/>
        <Select  variant="standard" disableUnderline id="chart-new-items" value={newItem.patientId}  onChange={e=>{setNewItem(draft=>{draft.patientId=e.target.value})}}>
          {patients.map(patient=><MenuItem value={patient.id}>{patient?.name || "無題のモデル"}</MenuItem>)}
        </Select>
      </div> 
      <div className='flex flex-row items-center w-full mt-1'>
        <div className='text-base'>Source(x軸)</div>
        <div className='flex-grow'/>
        <Select  variant="standard" disableUnderline id="chart-new-items" value={newItem.xSource}  onChange={e=>{setNewItem(draft=>{draft.xSource = e.target.value})}}>
          {metricOptions?.map(hdpOption=><MenuItem value={hdpOption}>{t[hdpOption] || hdpOption}</MenuItem>)}
        </Select>
      </div>
      <div className='flex flex-row items-center w-full mt-1'>
        <div className='text-base'>Source(y軸)</div>
        <div className='flex-grow'/>
        <Select  variant="standard" disableUnderline id="chart-new-items" value={newItem.ySource}  onChange={e=>{setNewItem(draft=>{draft.ySource = e.target.value})}}>
          {metricOptions?.map(hdpOption=><MenuItem value={hdpOption}>{t[hdpOption] || hdpOption}</MenuItem>)}
        </Select>
      </div>   
      <div className='flex flex-row items-center w-full mt-1'>
        <div className='text-base'>Label</div>
        <div className='flex-grow'/>
        <EditableText value={newItem.label} updateValue={newLabel=>{setNewItem(draft=>{draft.label=newLabel});}}  />
      </div>     
      <div className='flex flex-row items-center w-full mt-1'>
        <div className='text-base'>Color</div>
        <div className='flex-grow min-w-[32px]'/>
        <ColorPicker color={newItem.color} onChange={newColor => {setNewItem(draft=>{draft.color=newColor})}} />
      </div>                   
      <div className=' w-full pl-3 mt-3 flex flex-row items-center justify-center'>
        <div className='flex-grow'></div>
        <button type='button' 
          onClick={handleClose} 
          className=' bg-slate-100 text-slate-700 cursor-pointer py-2 px-3 text-sm rounded-md flex justify-center items-center hover:bg-slate-200 border-none transition'
        >
          Cancel
        </button>
        <button 
          type='button' 
          disabled={!newItem?.xSource || !newItem?.ySource || !newItem?.patientId}
          onClick={()=>handleUpdate(newItem)}
          className='bg-blue-500 text-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer py-2 px-3 ml-3 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
        >
        {initialItem ? "Update" : "Add"}
      </button>
      </div>                
    </div>  
    </>
}