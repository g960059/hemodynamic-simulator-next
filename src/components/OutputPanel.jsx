import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, useMediaQuery, Select, MenuItem, Divider, IconButton, Menu} from '@mui/material'
import {useTranslation} from '../hooks/useTranslation'
import {AoP,CVP,PAP,LAP,SV,EF,PVA,CPO,LVEDP,HR,CO,LaKickRatio} from '../utils/metrics'
import ReactiveInput from './ReactiveInput'
import { useImmer } from 'use-immer'
import { nanoid } from '../utils/utils'
import DeleteMenuItemWithDialog from './DeleteMenuItemWithDialog'

const Metrics = {
  Aop: AoP,
  Cvp: CVP,
  Pap: PAP,
  Lap: LAP,
  Sv: SV,
  Ef: EF,
  Pv: PVA,
  Cpo: CPO,
  Lvedp: LVEDP,
  Hr: HR,
  Co: CO,
  Lkr: LaKickRatio,
}

const OutputPanel = React.memo(({patients, outputs, setOutputs}) => {
  console.log(patients,outputs)
  const t = useTranslation()
  const [selectedOutputId, setSelectedOutputId] = useState(null);
  const [selectedDialogOutputId, setSelectedDialogOutputId] = useState(null);
  const [openOutputFormItem, setOpenOutputFormItem] = useImmer(null);
  const [openNewOutputItem, setOpenNewOutputItem] = useImmer(null);
  const [openDialog, setOpenDialog] = useState(false);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [isEditingTabLabel, setIsEditingTabLabel] = useState(false);

  useEffect(() => {
    if(outputs?.length > 0 && !selectedOutputId) {
      setSelectedOutputId(outputs[0].id);
    }
  }, [outputs, selectedOutputId]);
  return <>
    <nav className="flex -mb-px w-full">
      <div className='flex flex-grow bg-slate-200 md:bg-transparent overflow-x-scroll'>
        {outputs?.map((output)=>(
          <div key={output.id} className='flex-shrink-0 flex-grow-0'>
            <div className={`btn py-2 px-5 text-sm mr-px text-center transition-all duration-150 cursor-pointer ${selectedOutputId==output?.id ? "bg-white font-bold": "text-slate-500"} `} 
              onClick={()=>{
                setSelectedOutputId(output.id);
              }}>
              {output?.label || "無題のタブ"}
            </div>
          </div>))
  }
      </div>
      <div className={`bg-white px-1.5 m-1.5 mx-2 inline-flex items-center rounded-sm cursor-pointer hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300`} 
          onClick={()=>{
            if(!selectedDialogOutputId){
              setSelectedDialogOutputId(selectedOutputId);
            } 
            setOpenDialog(true);}}  >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 stroke-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>          
      </div>
    </nav>
    <div className='overflow-x-scroll w-full '>
      <div className='flex flex-row bg-white'>
        {outputs.find(o=>o.id===selectedOutputId)?.items?.map((output,i) => <div key={i} className="border-solid border-0 border-r  border-slate-300">
          <Output patient = {patients.find(p=>p.id==output.patientId)} output = {output}/>
        </div>)}
      </div>
    </div>
    <Dialog open={openDialog} onClose={()=>{setOpenDialog(false)}} sx={{".MuiDialog-paper": {m:0, minHeight: "540px"}}} fullWidth maxWidth="sm">
      <DialogContent>
        <nav className="flex ">
          <div className='flex w-full overflow-x-scroll'>
            <div className='w-full flex'>
              {outputs?.map((output)=>(
                <div key={output.id} className='flex-shrink-0 flex-grow-0'>
                  <div className={`btn py-1 px-5 text-sm font-bold text-center transition-all duration-150  border-solid border-0 border-b border-slate-300 cursor-pointer ${selectedDialogOutputId==output?.id ? "text-slate-800 border-slate-600": "text-slate-500"} `} 
                    onClick={()=>{
                      setSelectedDialogOutputId(output.id);
                    }}>
                    {output?.label || "無題のタブ"}
                  </div>
                </div>))
              }
            </div>
          </div> 
          <div 
            className={`bg-white px-1.5 m-1.5 mx-2 inline-flex items-center rounded-sm cursor-pointer hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300`} 
            onClick={()=>{
              setOutputs(draft => {
                draft.push({
                  id: nanoid(),
                  label: "無題のタブ",
                  items: [],
                });
              });
            }} 
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>           
        </nav>  
      
        <div className='mt-3 flex justify-between items-center w-full'>
          {isEditingTabLabel ? 
            <ReactiveInput 
              value={outputs.find(o=>o.id==selectedDialogOutputId)?.label} 
              updateValue={newLabel=>{
                setOutputs(draft=>{
                  const index = draft.findIndex(o=>o.id==selectedDialogOutputId);
                  if(draft[index]){
                    draft[index].label = newLabel
                  }
                });
                setIsEditingTabLabel(false);
              }} 
              type="text" placeholder="ラベル" autoFocus/> :
              <div className='font-bold text-lg mb-2 mt-1 cursor-pointer' onClick={()=>{setIsEditingTabLabel(true)}}>{outputs.find(o=>o.id==selectedDialogOutputId)?.label}</div>
          }
          <div className='pt-3 cursor-pointer' onClick={e=>{setMenuAnchorEl(e.currentTarget)}}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 stroke-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={()=>{setMenuAnchorEl(null)}} MenuListProps={{dense:true}}>
            <DeleteMenuItemWithDialog 
              onDelete={()=>{setOutputs(draft=>{
                const index = draft.findIndex(o=>o.id==selectedDialogOutputId);
                  if(draft[index]){
                    draft.splice(index,1);
                    setSelectedDialogOutputId(draft[0]?.id);
                  }
                }) ;
                setMenuAnchorEl(null)
              }} 
              onClose={()=>{setMenuAnchorEl(null)}} 
              message={"「"+(outputs.find(o=>o.id == selectedOutputId)?.label || "無題のメトリックス") +"」を削除しようとしています。この操作は戻すことができません。"}/>
          </Menu>
        </div>
        <div className='my-4  w-full'>
          {
            outputs.find(o=>o.id==selectedDialogOutputId)?.items?.map((item,i) => 
              <>
                { openOutputFormItem?.id == item.id ? <>
                  <div key={i} className="p-4 my-2 border border-solid border-slate-200 rounded-sm shadow-lg z-60">
                    <div className='mb-2'>
                      <label className='text-sm font-medium block text-slate-700'>ラベル</label>
                      <ReactiveInput
                        value={openOutputFormItem.label}
                        updateValue={newLabel=>{
                          setOpenOutputFormItem(draft=>{
                            const index = draft.findIndex(o=>o.id==selectedDialogOutputId);
                            if(draft[index]){
                              draft[index].items[i].label = newLabel
                            }
                          });
                        }}
                        type="text" 
                        placeholder={patients.find(p=>p.id ===  openOutputFormItem.patientId).name + t["output_label"][Metrics[openOutputFormItem.metric].getLabel()]}
                      />
                    </div>
                    <div className='mb-2'>
                      <label className='text-sm font-medium block text-slate-700'>患者</label>
                      <Select
                        id={"patient_" + item.id}
                        value={openOutputFormItem.patientId}
                        required
                        onChange={(e)=>{
                          setOpenOutputFormItem(draft=>{
                            draft.patientId = e.target.value
                            draft.label = ""
                          })
                        }}
                        sx ={{
                            backgroundColor: '#f1f5f9',
                            borderRadius: '4px',
                            border: '1px solid #5c93bb2b',
                            '&:hover': {
                                borderColor: '#3ea8ff',
                            }, 
                            "& .MuiOutlinedInput-notchedOutline":{border:"none"},
                            "& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input":{paddingTop:"8px",paddingBottom:"8px"}
                          }}
                      >
                        {patients.map(p=><MenuItem value={p.id} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{p.name || "無題の患者"}</MenuItem>)}
                      </Select>
                    </div>
                    <div className='mb-2'>
                      <label className='text-sm font-medium block text-slate-700'>項目</label>
                      <Select
                        id={"metric_" + openOutputFormItem.id}
                        value={openOutputFormItem.metric}
                        required
                        onChange={(e)=>{
                          setOpenOutputFormItem(draft=>{
                            draft.metric = e.target.value
                            draft.label = ""
                          })
                        }}
                        sx ={{
                            backgroundColor: '#f1f5f9',
                            borderRadius: '4px',
                            border: '1px solid #5c93bb2b',
                            '&:hover': {
                                borderColor: '#3ea8ff',
                            }, 
                            "& .MuiOutlinedInput-notchedOutline":{border:"none"},
                            "& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input":{paddingTop:"8px",paddingBottom:"8px"}
                          }}
                      >
                        {Object.entries(Metrics).map(([key,metric])=><MenuItem value={key} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{ t["output_label"][metric.getLabel()] || "無題の項目"}</MenuItem>)}
                      </Select>
                    </div>
                    <div className='flex mt-2'>
                      <div onClick={()=>{setOutputs(draft=>{
                        const index = draft.findIndex(o=>o.id==selectedDialogOutputId);
                        if(draft[index]){
                          draft[index].items.splice(i,1);
                        }
                      })}} className='bg-white px-1.5 m-1.5 mx-2 inline-flex items-center rounded-sm cursor-pointer hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300'>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-slate-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className='flex-grow'/>
                      <Button onClick={()=>{setOpenOutputFormItem(null)}} color="inherit">キャンセル</Button>
                      <Button onClick={()=>{
                        setOutputs(draft=>{
                          const index = draft.findIndex(o=>o.id==selectedDialogOutputId);
                          if(draft[index]){
                            draft[index].items[i] = openOutputFormItem
                          }
                        });
                        setOpenOutputFormItem(null)
                        }} color="primary" variant="contained" disableElevation className="text-white font-bold ml-1">
                          更新する
                      </Button>
                    </div>
                  </div>
                </> : 
                <div className='py-2 border-solid border-0 border-b border-slate-200 w-full cursor-pointer'>
                  <div onClick={()=>{setOpenOutputFormItem(item);setOpenNewOutputItem(null)}}>{item.label || patients.find(p=>p.id ===  item.patientId).name + t["output_label"][Metrics[item.metric].getLabel()]}</div>
                </div>
                }
              </>
            )
          }
          {
           openNewOutputItem ? <>
            <div className="p-4 my-3 border border-solid border-slate-200 rounded-sm shadow-lg z-60">
              <div className='mb-2'>
                <label className='text-sm font-medium block text-slate-700'>ラベル</label>
                <ReactiveInput
                  value={openNewOutputItem.label}
                  updateValue={newLabel=>{
                    setOpenNewOutputItem(draft=>{
                      draft.label = newLabel
                    })
                  }}
                  type="text"
                  placeholder={t["output_label"][Metrics[openNewOutputItem.metric].getLabel()]}
                />
              </div>
              <div className='mb-2'>
                <label className='text-sm font-medium block text-slate-700'>患者</label>
                <Select
                  id={"patient_" + openNewOutputItem.id}
                  value={openNewOutputItem.patientId}
                  required
                  onChange={(e)=>{
                    setOpenNewOutputItem(draft=>{
                      draft.patientId = e.target.value
                      draft.label = ""
                    })
                  }}
                  sx ={{
                      backgroundColor: '#f1f5f9',
                      borderRadius: '4px',
                      border: '1px solid #5c93bb2b',
                      '&:hover': {
                          borderColor: '#3ea8ff',
                      },
                      "& .MuiOutlinedInput-notchedOutline":{border:"none"},
                      "& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input":{paddingTop:"8px",paddingBottom:"8px"}
                    }}
                >
                  {patients.map(p=><MenuItem value={p.id} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{p.name || "無題の患者"}</MenuItem>)}
                </Select>
              </div>
              <div className='mb-2'>
                <label className='text-sm font-medium block text-slate-700'>項目</label>
                <Select
                  id={"metric_" + openNewOutputItem.id}
                  value={openNewOutputItem.metric}
                  required
                  onChange={(e)=>{
                    setOpenNewOutputItem(draft=>{
                      draft.metric = e.target.value
                      draft.label = ""
                    })
                  }
                }
                sx ={{
                    backgroundColor: '#f1f5f9',
                    borderRadius: '4px',
                    border: '1px solid #5c93bb2b',
                    '&:hover': {
                        borderColor: '#3ea8ff',
                    },
                    "& .MuiOutlinedInput-notchedOutline":{border:"none"},
                    "& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input":{paddingTop:"8px",paddingBottom:"8px"}
                  }}
                >
                  {Object.entries(Metrics).map(([key,metric])=><MenuItem value={key} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{ t["output_label"][metric.getLabel()] || "無題の項目"}</MenuItem>)}
                </Select>
              </div>
              <div className='flex justify-between mt-2'>
                <div className='flex-grow'/>
                <Button onClick={()=>{setOpenNewOutputItem(null)}} color="inherit">キャンセル</Button>
                <Button onClick={()=>{
                  setOutputs(draft=>{
                    const index = draft.findIndex(o=>o.id==selectedDialogOutputId);
                    if(draft[index]){
                      draft[index].items.push(openNewOutputItem)
                    }
                  });
                  setOpenNewOutputItem(null)
                  }
                } color="primary" variant="contained" disableElevation className="text-white font-bold ml-1">
                  追加する
                </Button>
              </div>
            </div>
          </> : 
          <div className='flex items-center text-slate-500 mt-6 cursor-pointer'>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 stroke-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
              <div className='ml-2'>
                <div onClick={()=>{
                  setOpenOutputFormItem(null)
                  setOpenNewOutputItem({
                    id: nanoid(),
                    patientId: patients[0].id,
                    metric: Object.keys(Metrics)[0],
                    label: ""
                  });
                }} className="text-sm">
                  追加する
            </div>
          </div>
        </div>
          }
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>{setOpenDialog(false)}} color="primary" variant="text" disableElevation className="font-bold ml-1">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>       
  </>
})


const Output = React.memo(({patient, output}) =>{
  const {subscribe,unsubscribe} = patient;
  const t = useTranslation();
  const subscriptionIdRef = useRef();
  const instancesRef = useRef();
  const [refresh, setRefresh] = useState(0);
  const update = (data, time, hdprops) => {
    instancesRef.current.update(data, time, hdprops)
    let current = Math.floor(time / (60000/ data['HR'][0]));
    if(refresh != current){
      setRefresh(current);
    }
  }
  useEffect(() => {
    let instance = new Metrics[output.metric]();
    instancesRef.current = instance;
    subscriptionIdRef.current = subscribe(update);
    return ()=>{
      instancesRef.current = null;
      unsubscribe(subscriptionIdRef.current)
    }
  }, [output.metric, output.patientId]);
  return (
    <div className='p-2 px-2.5 mr-px bg-white'>
      <div className="text-slate-500 text-xs whitespace-nowrap">{output?.label ? output?.label :  patient?.name + t["output_label"][Metrics[output.metric].getLabel()]}</div>
      <div className='flex flex-row items-center'>
        <div className='text-sm text-slate-800 font-bold mr-1'>{instancesRef.current?.get()}</div>
        <div className="text-slate-500 text-xs">{Metrics[output.metric]?.getUnit()}</div>
      </div>
    </div>
  )
})

export default OutputPanel


// const dataTypeKeyMap = {
//   AoP:'AoP',
//   PAP:'PAP',
//   CVP:'Pra',
//   SV:'Qlv',
//   CO:'Qlv',
//   EF:'Qlv',
//   PCWP:'Pla'
// }
// const dataTypeUnit = {
//   AoP:'mmHg',
//   PAP:'mmHg',
//   CVP:'mmHg',
//   SV:'ml',
//   CO:'L/min',
//   EF:'%',
//   PCWP:'mmHg'
// }