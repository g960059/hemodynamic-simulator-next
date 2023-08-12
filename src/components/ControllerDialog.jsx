import React, {useState} from 'react';
import {Dialog,Grow,Popover,MenuItem,Select,Button,useMediaQuery} from '@mui/material'
import EditableText from './EditableText';
import { DragDropContext,Droppable,Draggable} from 'react-beautiful-dnd';
import {nanoid} from "../utils/utils"
import {controllableHdpTypes}  from "../utils/presets"
import { useImmer } from "use-immer";
import { useTranslation } from '../hooks/useTranslation';


const ControllerDialog = React.memo(({open, onClose, initialView=null, updateView,patients}) =>{
  const [view, setView] = useImmer(initialView || { type: "Controller", items:[], patientId: patients[0]?.id, name: "Basic Controller"});
  const [viewItemAnchorEl, setViewItemAnchorEl] = useState(null);
  const [edittingIndex, setEdittingIndex] = useState(null);
  const [openNewItem, setOpenNewItem] = useState(false);
  const t = useTranslation();
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));

  return <>
    <Dialog fullScreen={!isUpMd} sx={{ ".MuiDialog-paper": {m:0}}} open ={open} onClose ={onClose}>
      <div className='border-solid border-0 border-b border-slate-200 w-full p-3 pl-4 flex flex-row items-center justify-center'>
        <div className='text-base font-bold text-center inline-flex items-center'>
          <svg className='w-6 h-5  mr-1.5 stroke-blue-500' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>                 
          Add New Controller
        </div>
        <div className='md:w-60 flex-grow'/>
        <button onClick={onClose} type="button" class="bg-white cursor-pointer rounded-full pr-2 py-1 border-none inline-flex items-center justify-center ">
          <svg className='stroke-slate-600 w-4 h-4' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className='w-full px-6 py-5'>
        <div className='flex flex-row items-center w-full bg-slate-100 rounded-lg p-2'>
          <div className='text-base'>モデル</div>
          <div className='flex-grow'/>
          <Select  variant="standard" disableUnderline  id="existing-patient-base-model"
            value={view.patientId}
            onChange={e=>{setView(draft=>{draft.patientId=e.target.value})}}
          >
            {
              patients.map((patient)=>{
                return <MenuItem key={patient.id} value={patient.id}>{patient.name}</MenuItem>
              })
            }
          </Select>
        </div>
        <div className='text-base text-slate-500 font-bold mt-7'>コントローラの設定</div>
        <hr class="mb-3 h-px border-0 bg-gray-300" />
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>コントローラ名</div>
          <div className='flex-grow'/>
          <EditableText value={view?.name} updateValue={newTitle=>{setView(draft=>{draft.name=newTitle})}}  />
        </div>
        <div className='mt-7 text-base text-slate-500 font-bold'>操作パラメータ</div>
        <hr class="mb-3 h-px border-0 bg-gray-300" /> 
        <div className='w-full min-h-[280px]'>
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
                      {(provided) => (edittingIndex != index ?
                        <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} 
                          className='w-full border-solid cursor-grab flex flex-row items-center justify-center border border-slate-200 bg-slate-200 rounded-lg  my-2'
                        >
                          <svg className="w-6 h-6 " focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DragIndicatorIcon"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                          <div onClick={()=>{setEdittingIndex(index)}} className='cursor-pointer bg-white rounded-lg pl-2 w-full flex items-center justify-center hover:bg-slate-100'>
                            <div className='text-base'>{item?.label}</div>
                            <div className='flex-grow'></div>
                            <div className='p-1 py-2 flex items-center' onClick={e => {e.stopPropagation(); setViewItemAnchorEl(e.currentTarget)}}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                              </svg>
                            </div>
                            <Popover 
                              open={Boolean(viewItemAnchorEl)}
                              anchorEl={viewItemAnchorEl}
                              onClose={(e)=>{e.stopPropagation();setViewItemAnchorEl(null)}}
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
                                <div onClick={()=> {setEdittingIndex(index); setViewItemAnchorEl(null)}} 
                                  className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
                                >
                                  <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                  </svg>
                                  Edit
                                </div>
                                <div onClick={()=>{setView(draft=>{draft.items.splice(index,1)});setViewItemAnchorEl(null);}} 
                                  className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>                                
                                  Delete
                                </div>
                              </div>
                            </Popover>                          
                          </div>
                        </div> :
                        <Grow in={edittingIndex == index}>
                          <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
                            <ControllerEdittor key={item.id} 
                              initialItem={item} 
                              handleClose={()=>{setEdittingIndex(null)}} 
                              handleUpdate={(newItem)=>{setView(draft=>{draft = draft.items.splice(index,1,newItem);setEdittingIndex(null);})}}
                              patient = {patients.find(patient=>patient.id == view.patientId)} 
                            />
                          </div>
                        </Grow>
                      )}
                    </Draggable> 
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          {!openNewItem ?
            <div onClick={()=>{setOpenNewItem(true)}} className='cursor-pointer py-2 px-4 mt-2 text-base border-solid border border-slate-200 rounded-md flex justify-center items-center hover:bg-slate-100 hover:border-slate-100 text-slate-600 '>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add new parameter
            </div> :
            <Grow in={openNewItem}>
              <div>
                <ControllerEdittor 
                  handleClose={()=>{setOpenNewItem(false)}} 
                  handleUpdate={(newItem)=>{
                    setView(draft=>{
                      draft.items.push({...newItem,id:nanoid()});
                    })
                    setOpenNewItem(false)
                  }}
                  patient = {patients.find(patient=>patient.id == view.patientId)} 
                />                
              </div> 
            </Grow>
          }  
        </div>              
      </div>
      
      <div className=' w-full p-3 pl-4 flex flex-row items-center justify-center'>
        <div className='flex-grow'></div>
        <Button onClick={()=>{onClose();setOpenNewItem(false)}} color="inherit">キャンセル</Button>
        { view.items.length >0 ? 
          <button 
            type='button' 
            onClick={()=>{
              updateView(view);
              if(!initialView){setView({ type: "Controller", items:[], patientId: patients[0]?.id, name: "Basic Controller"})}
              onClose()
            }} 
            className=' bg-blue-500 text-white cursor-pointer py-2 px-4 ml-4 text-base rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
          >
            {initialView ? "更新する" : "追加する"}
          </button> : 
          <button 
            type='button' 
            className=' bg-slate-200 text-slate-500  py-2 px-5 ml-4 text-base rounded-md flex justify-center items-center  border-none transition'
          >
            {initialView ? "更新する" : "追加する"}
          </button>
        }
      </div>           
    </Dialog>
  </>
})

export default ControllerDialog;


const ControllerEdittor = ({initialItem=null, handleClose, handleUpdate, patient}) =>{
  const t = useTranslation()
  const [newItem, setNewItem] = useImmer(initialItem || {label:t[controllableHdpTypes[0]],hdp: controllableHdpTypes[0],mode: "basic",items:[], options:[]});
  const [edittingIndex, setEdittingIndex] = useState(null);
  const [openNewOption, setOpenNewOption] = useState();
  const [optionAnchorEl, setOptionAnchorEl] = useState();
  return <>
    <div className='flex flex-col items-center w-full border-solid border border-slate-200  rounded-lg p-2 mt-2'>
      <div className='flex flex-row items-center w-full'>
        <div className='text-base'>パラメータ</div>
        <div className='flex-grow'/>
        <Select  variant="standard" disableUnderline id="model-new-hdptype" value={newItem.hdp} onChange={e=>{setNewItem(draft=>{draft.hdp=e.target.value; draft.label = t[e.target.value]})}}>
          {controllableHdpTypes.map(hdpOption=><MenuItem value={hdpOption}>{t[hdpOption]}</MenuItem>)}
        </Select>
      </div>
      <div className='flex flex-row items-center w-full mt-1'>
        <div className='text-base'>ラベル</div>
        <div className='flex-grow'/>
        <EditableText value={newItem.label} updateValue={newLabel=>{setNewItem(draft=>{draft.label=newLabel});}}  />
      </div> 
      <div className='flex flex-row items-center w-full mt-1'>
        <div className='text-base'>入力形式</div>
        <div className='flex-grow'/>
        <Select  variant="standard" disableUnderline id="model-new-mode" value={newItem.mode} onChange={e=>{setNewItem(draft=>{draft.mode=e.target.value;})}}>
          {["basic","advanced", "customized"].map(hdpOption=><MenuItem value={hdpOption}>{t[hdpOption]}</MenuItem>)}
        </Select>
      </div>
      {newItem.mode == "customized" &&
        <div className='w-full'>
          <div className='text-slate-500 font-bold mt-3'>カスタム設定</div>
          <hr class="mb-3 h-px border-0 bg-gray-300" />
          <div className='w-full '>
            <DragDropContext onDragEnd={({source:src, destination:dest})=>{
              if(!dest ) return;
              setNewItem(draft=>{
                const [insertItem] = draft.options.splice(src.index,1);
                draft.options.splice(dest.index,0,insertItem);
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
                    {newItem.options.map((item,index)=> ( 
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (edittingIndex != index ?
                          <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} 
                            className='w-full border-solid cursor-grab flex flex-row items-center justify-center border border-slate-200 bg-slate-200 rounded-lg  my-2'
                          >
                            <svg className="w-6 h-6 " focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DragIndicatorIcon"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                            <div onClick={()=>{setEdittingIndex(index)}} className='cursor-pointer bg-white rounded-lg pl-2 w-full flex items-center justify-center hover:bg-slate-100'>
                              <div className='text-base'>{item?.label}</div>
                              <div className='flex-grow'></div>
                              <div className='p-1 py-2 flex items-center' onClick={e => {e.stopPropagation(); setOptionAnchorEl(e.currentTarget)}}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                </svg>
                              </div>
                              <Popover 
                                open={Boolean(optionAnchorEl)}
                                anchorEl={optionAnchorEl}
                                onClose={(e)=>{e.stopPropagation();setOptionAnchorEl(null)}}
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
                                  <div onClick={()=> {setEdittingIndex(index); setOptionAnchorEl(null)}} 
                                    className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
                                  >
                                    <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                    Edit
                                  </div>
                                  <div onClick={()=>{setNewItem(draft=>{draft.options.splice(index,1)});setOptionAnchorEl(null);}} 
                                    className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1 text-red-500 hover:bg-red-500 hover:text-white"
                                  >
                                    <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>                                
                                    Delete
                                  </div>
                                </div>
                              </Popover>                          
                            </div>
                          </div> :
                          <Grow in={edittingIndex == index}>
                            <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
                              <OptionItem key={item.id}
                                initialOption={item}
                                handleClose={()=>{setEdittingIndex(null)}}
                                handleUpdate={(newItem)=>{setNewItem(draft=>{draft = draft.options.splice(index,1,newItem);setEdittingIndex(null);})}}
                                hdp = {newItem.hdp}
                                initialHdpValue={patient.getInitialHdps()[newItem.hdp]}                                
                              />
                            </div>
                          </Grow>
                        )}
                      </Draggable> 
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            {!openNewOption ?
              <div onClick={()=>{setOpenNewOption(true)}} className='cursor-pointer py-2 px-4 mt-2 text-base border-solid border border-slate-200 rounded-md flex justify-center items-center hover:bg-slate-100 hover:border-slate-100 text-slate-600 '>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add new parameter
                {console.log(patient)}
              </div> :
              <Grow in={openNewOption}>
                <div>
                  <OptionItem
                    handleClose={()=>{setOpenNewOption(false)}}
                    handleUpdate={(newItem)=>{
                      setNewItem(draft=>{
                        draft.options.push({...newItem,id:nanoid()});
                      })
                      setOpenNewOption(false)
                    }}
                    hdp = {newItem.hdp}
                    initialHdpValue={patient.getInitialHdps()[newItem.hdp]}
                  />
                </div> 
              </Grow>
            }  
          </div>             
        </div>
      }
                                               
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
          disabled={!newItem?.hdp }
          onClick={()=>handleUpdate(newItem)}
          className='bg-blue-500 text-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer py-2 px-3 ml-3 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
        >
        Update
      </button>
      </div>                
    </div>  
    </>
}

const OptionItem = ({initialOption, handleClose, handleUpdate,hdp,initialHdpValue}) =>{
  const t = useTranslation()
  const [newOption, setNewOption] = useImmer(initialOption || {label:"Normal",value:initialHdpValue});
  return <>
    <div className='flex flex-col items-center w-full border-solid border border-slate-200  rounded-lg p-2 mt-2'>
      <div className='flex flex-row items-center w-full'>
        <div className='text-base'>Label</div>
        <div className='flex-grow'/>
        <EditableText value={newOption.label} updateValue={newLabel=>{setNewOption(draft=>{draft.label=newLabel});}}  />
      </div>  
      <div className='flex flex-row items-center w-full mt-1'>
        <div className='text-base'>Value</div>
        <div className='flex-grow'/>
        <EditableText value={newOption.value} updateValue={newValue=>{setNewOption(draft=>{draft.value=newValue});}}  />
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
          disabled={!newOption?.value }
          onClick={()=>handleUpdate(newOption)}
          className='bg-blue-500 text-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer py-2 px-3 ml-3 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
        >
          {initialOption ? "Update" : "Add"}
        </button>
      </div>
    </div>
  </>
}