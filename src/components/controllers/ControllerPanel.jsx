import React,{useState, useEffect,useReducer} from 'react';
import {Box,Grid, Typography, Stack,MenuItem,Divider,Select, Popover, IconButton, Slider,Tab, Button, ButtonGroup,ToggleButtonGroup,ToggleButton,Dialog,DialogContent,DialogTitle,DialogActions, DialogContentText,Tooltip,List,ListItem,ListItemText,ListItemIcon,Breadcrumbs,Link,useMediaQuery,Slide,Autocomplete,TextField,Menu} from '@mui/material'
import { DragDropContext,Droppable,Draggable} from 'react-beautiful-dnd';
import { makeStyles } from '@mui/styles';

import {useTranslation} from '../../hooks/useTranslation'
import {InputRanges,VDOptions} from '../../constants/InputSettings'
import {DEFAULT_HEMODYANMIC_PROPS} from '../../utils/presets'
import {Refresh,Delete,EditOutlined,ChevronRight,Add,DragIndicator,NavigateNext,ExpandMore,ContentCopy} from '@mui/icons-material';
import ReactiveInput from "../ReactiveInput";
import DeleteMenuItemWithDialog from "../DeleteMenuItemWithDialog";
import { useImmer } from "use-immer";
import { nanoid } from 'nanoid';


const Severity = ["Trivial","Mild","Moderate","Severe"]

const useStyles = makeStyles((theme) =>({
    shadowBox: {
      backgroundColor: "white",
      boxShadow: "rgb(0 10 60 / 20%) 0px 3px 6px -2px",
      border: "1px solid rgba(239, 246, 251, 0.6)",
      borderRadius:"8px"
    },
    faintNeumoButton: {
      transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
      color: "#b3b3b3",
      backgroundColor: "#f1f4f9",
      border: "none",
      "&:hover":{
        backgroundColor: "#e5f2ff",
        color: "#3ea8ff"
      },
      "& .MuiOutlinedInput-notchedOutline": {border:"none"}
    },
    firestoreList: {
      "&.Mui-selected":{
        backgroundColor:"rgba(0, 0, 0, 0.04)", 
        "&:hover":{
          backgroundColor:"rgba(0, 0, 0, 0.04)"
        }
      },
      "& .MuiListItemIcon-root .MuiSvgIcon-root":{
        display:"none"
      },
      "&.MuiListItem-root:hover .MuiListItemIcon-root .MuiSvgIcon-root":{
        display:"block"
      },
      "& .MuiListItemSecondaryAction-root .MuiButtonBase-root":{
        display:"none"
      },
      "&.MuiListItem-root:hover .MuiListItemSecondaryAction-root .MuiButtonBase-root":{
        display:"block"
      }
    },
    secondaryActionHidden: {
      "& .MuiListItemSecondaryAction-root .MuiButtonBase-root":{
        display:"none"
      },
      "&.MuiListItem-root:hover .MuiListItemSecondaryAction-root .MuiButtonBase-root":{
        display:"block"
      }
    }
  }),
);

const Hdps = [
  'Volume',"HR",
  'LV_Ees', 'LV_alpha', 'LV_Tmax', 'LV_tau', 'LV_AV_delay', 'LA_Ees', 'LA_alpha', 'LA_Tmax', 'LA_tau', 'LA_AV_delay', 'RV_Ees', 'RV_alpha', 'RV_Tmax', 'RV_tau', 'RV_AV_delay', 'RA_Ees', 'RA_alpha', 'RA_Tmax', 'RA_tau', 'RA_AV_delay',
  "Ras","Rap","Rvs","Rvp","Ras_prox","Rap_prox","Rcs","Rcp","Cas","Cap","Cvs","Cvp",
  'Ravs', 'Ravr', 'Rmvs', 'Rmvr', 'Rtvs', 'Rtvr', 'Rpvs', 'Rpvr',
  "ECMO","Impella"
]

const ControllerPanel = React.memo(({patient, setPatient,removePatient,setViews, clonePatient,readOnly=false}) => {
  const classes = useStyles()
  const t = useTranslation()
  const {controller} = patient;
  const [patientNameEditing, setPatientNameEditing] = useState(false);
  const [parentControllerId, setParentControllerId] = useState(patient?.controller?.controllers[0]?.id || null);
  const [childControllerId, setChildControllerId] = useState(patient?.controller?.controllers[0]?.controllers[0]?.id || null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [openInfoDialog, setOpenInfoDialog] = useState(false);


  return <div></div>
    // <div className='p-2'>
    //   <Stack direction="row" justifyContent="flex-start" alignItems="center" px={1}>
    //     {/* <Typography variant="h6" fontWeight="bold" color="primary" sx={{mr:2}} className="hidden md:inline-block">{String(patientIndex+1).padStart(2,'0')}</Typography> */}
    //     {
    //       patientNameEditing && !readOnly ? 
    //         <ReactiveInput 
    //         value={patient?.name} 
    //         updateValue={newName=>{
    //           setViews(draft=>{
    //             for(let i=0; i<draft.length; i++){
    //               for(let j=0; j<draft[i].items.length; j++){
    //                 if(patient.id === draft[i].items[j].patientId){
    //                   draft[i].items[j].label = draft[i].items[j].label.replace(patient.name,newName);
    //                 }
    //               }
    //           }})
    //           setPatient({...patient,name:newName});
    //           setPatientNameEditing(false)
    //         }} 
    //         type="text" autoFocus  allowEmpty/> :
    //         <div className='flex items-center'>
    //           <Typography variant="h5" fontWeight="bold" onClick={()=>{setPatientNameEditing(true)}} sx={{"&:hover":{backgroundColor:"rgba(0, 0, 0, 0.04)"},cursor:"pointer",pr:1, color:!patient.name&&"gray"}}>{patient?.name || "Patient Title"}</Typography>
    //           <div className='p-1.5 ml-1 inline-flex items-center cursor-pointer rounded-full transition-all duration-100' onClick={()=>{setOpenInfoDialog(true)}}>
    //             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 stroke-slate-400 hover:stroke-blue-500">
    //               <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    //             </svg>
    //           </div>
    //         </div>
    //     }
    //     <Dialog open={openInfoDialog} onClose={()=>{setOpenInfoDialog(false)}} maxWidth='md' sx={{"& .MuiDialog-paper":{width: "100%"}}}>
    //       <DialogTitle className='font-bold'>{patient?.name || "無題の患者"}のパラメータ</DialogTitle>
    //       <DialogContent>
    //         <div className='w-full md:grid md:grid-cols-2 md:gap-x-10'>
    //           {
    //             Object.entries([patient.getInitialHdps(), patient.getHdps()]
    //               .flatMap(Object.entries)
    //               .reduce((o,[k,v])=>( {...o, [k]: (o[k]?[...o[k],v]:[v])}),{})).filter(x=>Hdps.includes(x[0])).sort((a,b)=> Hdps.findIndex(hdp=>hdp===a[0]) - Hdps.findIndex(hdp=>hdp===b[0]))
    //               .map(([k,v])=> (<div className='flex flex-row items-center'>
    //                 <div className=' mr-2'>{t[k] || k}</div>
    //                 <div className='flex-grow'></div>
    //                 {v[0] === v[1] ? 
    //                   <div className='text-slate-600'>{v[0]}</div> :
    //                   <><div className='text-slate-600'>{v[0]} → </div><div className='font-bold'>{v[1]}</div></>}
    //                 <div className='text-xs ml-1 text-slate-600'>{InputRanges[k]?.unit}</div>
    //               </div>))
    //           }
    //         </div>
    //       </DialogContent>
    //     </Dialog>
    //     <div style={{flexGrow:1}}></div>
    //     {
    //       !readOnly && <>
    //         <ControllerEditor initialController={controller} updateController={newController =>{setPatient(produce(patient,draft=>{draft.controller=newController}))}}/>
    //         <Tooltip title={patient?.name+"を複製する"}>
    //           <IconButton onClick={clonePatient} size="small" className={classes.faintNeumoButton}><ContentCopy/></IconButton>
    //         </Tooltip>
    //         <IconButton onClick={e=>{setMenuAnchorEl(e.currentTarget)}} size="small" className={classes.faintNeumoButton} sx={{ml:1,backgroundColor:"transparent !important"}}><ExpandMore/></IconButton>
    //         <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={()=>{setMenuAnchorEl(null)}} MenuListProps={{dense:true}}>
    //           <DeleteMenuItemWithDialog onDelete={()=>{removePatient();setMenuAnchorEl(null)}} message={"患者「"+patient?.name +"」を削除しようとしています。この操作は戻すことができません。"} onClose={()=>{setMenuAnchorEl(null)}}/>
    //         </Menu>
    //       </>
    //     }
    //   </Stack>
    //   {controller.controllers.length>0 && 
    //     <TabContext value={parentControllerId}>
    //       <TabList 
    //         onChange={(e,v)=>{setParentControllerId(v);setChildControllerId(controller.controllers.find(c=>c.id==v)?.controllers[0]?.id)}}
    //         variant="scrollable"
    //         scrollButtons
    //         allowScrollButtonsMobile
    //         sx={{mx:-2,"& .MuiTabs-scrollButtons.Mui-disabled": {opacity: 0.3}}}
    //         >
    //         {controller.controllers.map(item=><Tab label={item.name} value={item.id} />)}
    //       </TabList>
    //       <Box width={1} sx={{borderTop: 1, borderColor: 'divider',my:'-1px',mx:1}}/>
    //       {controller.controllers.map(subController=>
    //         <TabPanel value={subController.id} sx={{px:1,pt:2}}>
    //           <Box>
    //             {
    //               subController.controllers.length>0 && 
    //                 <ToggleButtonGroup
    //                   color="primary"
    //                   value={childControllerId}
    //                   exclusive
    //                   onChange={(e,v)=>{setChildControllerId(v)}}
    //                   size="small"
    //                   sx ={{width:1,'& .MuiToggleButton-root':{pb:'2px',pt:'3px',flexGrow:1}, mb:2}}
    //                 >
    //                   {subController.controllers.map(controllerItem =>(
    //                     <ToggleButton value={controllerItem.id}>{controllerItem.name}</ToggleButton>
    //                   ))}
    //                 </ToggleButtonGroup>
    //             }
    //             {
    //               subController.controllers.find(({id})=>childControllerId ==id)?.items?.map(controllerItem => (
    //                 <InputItem patient={patient} controllerItem={controllerItem} forceUpdate={()=>{setPatient({...patient})}}/>
    //               ))
    //             }
    //             { subController.items?.length>0 && <>
    //                 { subController.controllers?.length>0 && <Divider light  sx={{my:2, fontSize:"smaller",color:"gray"}}>{subController.name}共通</Divider>}
    //                 <Box width={1} pt={1}>
    //                   {subController.items?.map(controllerItem => (
    //                     <InputItem patient={patient} controllerItem={controllerItem} forceUpdate={()=>{setPatient({...patient})}}/>
    //                   ))}
    //                 </Box>
    //               </>
    //             }
    //           </Box>
    //         </TabPanel>
    //       )}
    //     </TabContext>      
    //   }
    //   {controller.items?.length>0 && (controller.controllers?.length>0 ? <Divider light sx={{mt:-1.5,mb:1,fontSize:"smaller",color:"gray"}}>{patient.name}共通</Divider> : <Divider light sx={{my:1,}}/>)}
    //   {controller.items?.length>0 &&
    //     <Box width={1} px={1} pt={1}>
    //       {
    //         controller.items?.map(controllerItem=> (
    //           <InputItem patient={patient} controllerItem={controllerItem} forceUpdate={()=>{setPatient({...patient})}}/>
    //         ))
    //       }
    //     </Box>
    //   }
    // </div>
  
})

export default ControllerPanel


export const ControllerEditor = ({initialController,updateController})=>{
  const classes = useStyles()
  const t = useTranslation();
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [controller, setController] = useImmer(initialController);
  const [controllerNameEditing, setControllerNameEditing] = useState(false);
  const [dialogParentNameEditing, setDialogParentNameEditing] = useState(false);
  const [dialogChildNameEditing, setDialogChildNameEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedParentIndex, setSelectedParentIndex] = useState(null);
  const [selectedChildIndex, setSelectedChildIndex] = useState(null);
  console.log(selectedParentIndex, selectedChildIndex)
  return <>
    <Tooltip title="コントローラーを編集する">
      <IconButton onClick={()=>{setDialogOpen(true)}} size="small" className={classes.faintNeumoButton} sx={{mr:1}}><EditOutlined/></IconButton>
    </Tooltip>
    <Dialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} maxWidth='md' sx={{"& .MuiDialog-paper":{width: "100%"}}}>
      <DialogContent>
        <Grid container sx={{border: "1px solid #5c93bb2b",borderRadius: "15px"}} disablePadding>
          <Grid item xs={12} px={2} py={1} sx={{backgroundColor:"whitesmoke"}}>
            <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
              <Link onClick={()=>{setSelectedChildIndex(null);setSelectedParentIndex(null)}} component="button" variant="body1" href="#" underline="hover" color="inherit" sx={{"&:hover":{color:"#f16a95"}}}>
                <div className='px-1.5 m-1.5 mx-0  inline-flex items-center'>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-slate-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
              </Link>
              {selectedParentIndex!=null && <Link onClick={()=>{setSelectedChildIndex(null)}} component="button" variant="body1" href="#" underline="hover" color="inherit" sx={{"&:hover":{color:"#f16a95"}}}>{controller.controllers[selectedParentIndex]?.name}</Link>}
              {selectedParentIndex!=null && selectedChildIndex != null && <Link variant="body1" href="#" underline="none" color="inherit" >{controller.controllers[selectedParentIndex].controllers[selectedChildIndex]?.name}</Link>}
            </Breadcrumbs>
          </Grid>
          <Grid item xs={12}>
            <Divider flexItem/>
          </Grid>
          <Slide direction={"right"} in={isUpMd || selectedParentIndex==null} mountOnEnter unmountOnExit>
            <Grid item xs={12} md={4} sx={{display: !isUpMd && selectedParentIndex!=null && "none"}}>
              <List sx={{"& .MuiListItemIcon-root":{minWidth: "32px"}}} disablePadding>               
                {/* <ListItem sx={{backgroundColor:"whitesmoke"}}>
                {
                  controllerNameEditing ? 
                    <ReactiveInput 
                      value={controller?.name} 
                      updateValue={newName=>{
                        setController({...controller,name:newName});
                        setControllerNameEditing(false)
                      }} 
                      type="text" autoFocus/> :
                    <Typography variant="h6" fontWeight="bold" onClick={()=>{setControllerNameEditing(true)}} sx={{width:1,cursor:"pointer","&:hover":{backgroundColor:"rgba(0, 0, 0, 0.04)"}}}>{controller?.name}</Typography>
                }                  
                </ListItem> */}
                <Divider/>
                <ListItem 
                  button sx={{"&.MuiListItem-root:hover":{backgroundColor:"#fef0f5"}}} 
                  onClick={()=>{
                    const id=nanoid(); 
                    setController(draft=>{draft.controllers.push({id,name:"無題のタブ",items:[],controllers:[]});setSelectedParentIndex(draft.controllers.length-1);setDialogParentNameEditing(true)});
                  }}
                >
                  <ListItemIcon ><Add color="primary"/></ListItemIcon><ListItemText primary="タブを追加" primaryTypographyProps={{color:"primary"}}/>
                </ListItem>
                <DragDropContext onDragEnd={({source,destination}) => {
                  if(!destination || source.index==destination.index) return;
                  setController(draft => {
                    const [insertItem] = draft.controllers.splice(source.index,1)
                    draft.controllers.splice(destination.index,0,insertItem)
                    setSelectedParentIndex(destination.index)
                  })
                }} >
                  <Droppable droppableId="root-tab">
                    {(provided) => (
                      <Box {...provided.droppableProps} ref={provided.innerRef} width={1}>
                        {controller.controllers.map((controllerItem, index)=>(
                            <Draggable key={controllerItem.id} draggableId={controllerItem.id} index={index}>
                              {(provided) => (  
                                <ListItem 
                                  className={classes.firestoreList} 
                                  button 
                                  selected={index==selectedParentIndex} 
                                  onClick={()=>{setSelectedParentIndex(index); setSelectedChildIndex(null)}}
                                  ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
                                >
                                  <ListItemIcon ><DragIndicator/></ListItemIcon>
                                  <ListItemText primary={controllerItem.name} sx={{cursor:"pointer"}}/>
                                  {index==selectedParentIndex ? <ChevronRight sx={{display:"block"}}/> : null}
                                </ListItem>
                              )}
                            </Draggable>                            
                          ))}                        
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>
                <Divider/>                
                <AddControllerItem addItem={newItem => {setController(draft=>{draft.items.push(newItem)})}}/>
                <DragDropContext onDragEnd={({source,destination}) => {
                  if(!destination || source.index==destination.index) return;
                  setController(draft => {
                    const [insertItem] = draft.items.splice(source.index,1)
                    draft.items.splice(destination.index,0,insertItem)
                  })
                }} >
                  <Droppable droppableId="root-item">
                    {(provided) => (
                      <Box {...provided.droppableProps} ref={provided.innerRef} width={1}>
                        {controller.items?.map((controllerItem, index)=>(
                          <Draggable key={controllerItem.id} draggableId={controllerItem.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef} 
                                {...provided.draggableProps} {...provided.dragHandleProps}
                              >
                                <EditControllerItem 
                                  initialItem={controllerItem} 
                                  updateItem={newItem => {setController(draft=>{if(draft?.items){draft.items[index]=newItem}})}}
                                  deleteItem={()=>{setController(draft=>{draft?.items.splice(index,1)});}}
                                />    
                              </div>
                            )}
                          </Draggable>                            
                        ))}                        
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>         
              </List>
            </Grid>
          </Slide>
          <Divider orientation="vertical" flexItem/>
          <Slide direction="left" in={isUpMd || selectedParentIndex!=null} mountOnEnter unmountOnExit>
            <Grid item xs={12} md={4} sx={{display: !isUpMd && (selectedParentIndex==null || selectedParentIndex!=null && selectedChildIndex!=null) && "none"}}>
              <List sx={{"& .MuiListItemIcon-root":{minWidth: "32px"}}} disablePadding>
                {selectedParentIndex != null && <ListItem sx={{backgroundColor:"whitesmoke"}} className={isUpMd && classes.secondaryActionHidden} secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={()=>{setController(draft=>{draft.controllers.splice(selectedParentIndex,1)});setSelectedParentIndex(null);setSelectedChildIndex(null)}}>
                    <Delete/>
                  </IconButton>
                }>
                  {
                    dialogParentNameEditing ? 
                      <ReactiveInput 
                        value={controller.controllers[selectedParentIndex].name} 
                        updateValue={newName=>{
                          setController(draft=>{draft.controllers[selectedParentIndex].name=newName})
                          setDialogParentNameEditing(false)
                        }} 
                        type="text" autoFocus/> :
                      <Typography variant="h6" fontWeight="bold" onClick={()=>{setDialogParentNameEditing(true)}} sx={{width:1,cursor:"pointer","&:hover":{backgroundColor:"rgba(0, 0, 0, 0.04)"}}}>{controller.controllers[selectedParentIndex]?.name}</Typography>
                  }
                </ListItem>}
                <Divider/>
                <ListItem button 
                  sx={{"&.MuiListItem-root:hover":{backgroundColor:"#fef0f5"}}}
                  onClick={()=>{
                    const id=nanoid(); 
                    setController(draft=>{draft.controllers[selectedParentIndex].controllers.push({id,name:"無題のタブ",items:[],controllers:[]});setSelectedChildIndex(draft.controllers[selectedParentIndex].controllers.length-1);setDialogChildNameEditing(true)});
                  }}
                >
                  <ListItemIcon ><Add color="primary"/></ListItemIcon><ListItemText primary="タブを追加" primaryTypographyProps={{color:"primary"}}/>
                </ListItem>
                <DragDropContext onDragEnd={({source,destination}) => {
                  if(!destination || source.index==destination.index) return;
                  setController(draft => {
                    const [insertItem] = draft.controllers[selectedParentIndex].controllers.splice(source.index,1)
                    draft.controllers[selectedParentIndex].controllers.splice(destination.index,0,insertItem)
                    setSelectedChildIndex(destination.index)
                  })
                }} >
                  <Droppable droppableId="parent-tab">
                    {(provided) => (
                      <Box {...provided.droppableProps} ref={provided.innerRef} width={1}>
                        {controller.controllers[selectedParentIndex]?.controllers.map((controllerItem, index)=>(
                            <Draggable key={controllerItem.id} draggableId={controllerItem.id} index={index}>
                              {(provided) => (  
                                <ListItem 
                                  className={classes.firestoreList} 
                                  button 
                                  selected={index==selectedChildIndex} 
                                  onClick={()=>{setSelectedChildIndex(index)}}
                                  ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
                                >
                                  <ListItemIcon ><DragIndicator/></ListItemIcon>
                                  <ListItemText primary={controllerItem.name} sx={{cursor:"pointer"}}/>
                                  {index==selectedChildIndex ? <ChevronRight sx={{display:"block"}}/> : null}
                                </ListItem>
                              )}
                            </Draggable>                            
                          ))}                        
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>
                <Divider/>
                <AddControllerItem addItem={newItem => {setController(draft=>{draft.controllers[selectedParentIndex].items.push(newItem)})}}/>                
                
                <DragDropContext onDragEnd={({source,destination}) => {
                  if(!destination || source.index==destination.index) return;
                  setController(draft => {
                    const [insertItem] = draft.controllers[selectedParentIndex]?.items.splice(source.index,1)
                    draft.controllers[selectedParentIndex]?.items.splice(destination.index,0,insertItem)
                  })
                }} >
                  <Droppable droppableId="parent-item">
                    {(provided) => (
                      <Box {...provided.droppableProps} ref={provided.innerRef} width={1}>
                        {controller.controllers[selectedParentIndex]?.items?.map((controllerItem, index)=>(
                          <Draggable key={controllerItem.id} draggableId={controllerItem.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef} 
                                {...provided.draggableProps} {...provided.dragHandleProps}
                              >
                                <EditControllerItem 
                                  initialItem={controllerItem} 
                                  updateItem={newItem => {setController(draft=>{draft.controllers[selectedParentIndex].items[index]=newItem})}}
                                  deleteItem={()=>{setController(draft=>{draft.controllers[selectedParentIndex].items.splice(index,1)});}}
                                />     
                              </div>
                            )}
                          </Draggable>                            
                        ))}                        
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>
              </List>
            </Grid>
          </Slide> 
          <Divider orientation="vertical" flexItem/>
          <Slide direction="left" in={isUpMd || selectedChildIndex!=null && selectedParentIndex!=null} mountOnEnter unmountOnExit>
            <Grid item xs={12} md={3.9} sx={{display: !isUpMd || selectedChildIndex==null && "none"}}>
              <List disablePadding>
                <ListItem sx={{backgroundColor:"whitesmoke"}} className={isUpMd && classes.secondaryActionHidden} secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={()=>{setController(draft=>{draft.controllers[selectedParentIndex].controllers.splice(selectedChildIndex,1)});setSelectedChildIndex(null)}}>
                    <Delete/>
                  </IconButton>
                }>
                  {
                    dialogChildNameEditing ? 
                      <ReactiveInput 
                        value={controller.controllers[selectedParentIndex].controllers[selectedChildIndex]?.name} 
                        updateValue={newName=>{
                          setController(draft=>{draft.controllers[selectedParentIndex].controllers[selectedChildIndex].name=newName})
                          setDialogChildNameEditing(false)
                        }} 
                        type="text" autoFocus/> :
                      <Typography variant="h6" fontWeight="bold" onClick={()=>{setDialogChildNameEditing(true)}} sx={{width:1,cursor:"pointer","&:hover":{backgroundColor:"rgba(0, 0, 0, 0.04)"}}}>{controller.controllers[selectedParentIndex]?.controllers[selectedChildIndex]?.name}</Typography>
                  }
                </ListItem> 
                <Divider/> 
                <AddControllerItem addItem={newItem => {setController(draft=>{draft.controllers[selectedParentIndex].controllers[selectedChildIndex].items.push(newItem)})}}/>
                <DragDropContext onDragEnd={({source,destination}) => {
                  if(!destination || source.index==destination.index) return;
                  setController(draft => {
                    const [insertItem] = draft.controllers[selectedParentIndex].controllers[selectedChildIndex]?.items.splice(source.index,1)
                    draft.controllers[selectedParentIndex].controllers[selectedChildIndex]?.items.splice(destination.index,0,insertItem)
                  })
                }} >
                  <Droppable droppableId="child-item">
                    {(provided) => (
                      <Box {...provided.droppableProps} ref={provided.innerRef} width={1}>
                        {controller.controllers[selectedParentIndex]?.controllers[selectedChildIndex]?.items?.map((controllerItem, index)=>(
                          <Draggable key={controllerItem.id} draggableId={controllerItem.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef} 
                                {...provided.draggableProps} {...provided.dragHandleProps}
                              >
                              <EditControllerItem 
                                initialItem={controllerItem} 
                                updateItem={newItem => {setController(draft=>{draft.controllers[selectedParentIndex].controllers[selectedChildIndex].items[index]=newItem})}}
                                deleteItem={()=>{setController(draft=>{draft.controllers[selectedParentIndex].controllers[selectedChildIndex].items.splice(index,1)});}}
                              />
                              </div>
                            )}
                          </Draggable>                            
                        ))}                        
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>      
              </List>
            </Grid> 
          </Slide>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={2}>
          <Button color="secondary" onClick={()=>{setController(initialController);setDialogOpen(false)}}>Cancel</Button>
          <Button variant="contained" onClick={()=>{updateController(controller);setDialogOpen(false)}}>{t["Save"]}</Button>
        </Stack>
      </DialogActions>
    </Dialog>  
  </>
}

export const EditControllerItem = ({initialItem,updateItem, deleteItem}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const classes = useStyles();
  const t = useTranslation();
  const [controllerItem, setControllerItem] = useImmer({...initialItem,hdp:{label:t[initialItem.hdp],value:initialItem.hdp}});
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const onClickSave = ()=>{
    updateItem({...controllerItem,hdp:controllerItem.hdp.value});
    setAnchorEl(null)
  }
  return <>
    <ListItem onClick={e=>{setAnchorEl(e.currentTarget)}} className={classes.firestoreList} secondaryAction={
      <IconButton edge="end" aria-label="delete" onClick={deleteItem}>
        <Delete/>
      </IconButton>
    }>
      <ListItemIcon ><DragIndicator/></ListItemIcon>                      
      <ListItemText primary={t[controllerItem.hdp.value]} sx={{cursor:"pointer"}}/>
    </ListItem>    
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={()=>{setAnchorEl(null)}}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Box p={1}>
        <Stack direction='column' justifyContent='center' alignItems='flex-start' spacing={2} p={1} >
          <Stack direction='row' justifyContent='flex-start' alignItems='center' spacing={1}>
            <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>項目</Typography>
            <Autocomplete 
              value={controllerItem.hdp} 
              onChange={(event,newValue)=>{setControllerItem(draft=>{draft.hdp=newValue})}}
              options={
                Hdps.map(hdp=>({label:t[hdp],value:hdp}))
              }
              renderInput={(params) => <TextField {...params} value={t[params.value]} />}
              disableClearable
              size="small"
              sx={{minWidth:"240px"}}
            />        
          </Stack>
          <Stack direction='row' justifyContent='flex-start' alignItems='center' spacing={1}>
            <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>モード</Typography>
            <ToggleButtonGroup
              color="primary"
              value={controllerItem.mode}
              exclusive
              onChange={(e,newValue)=>{setControllerItem(draft=>{draft.mode=newValue})}}
              size="small"
              sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
            >
              <ToggleButton value="basic">基本</ToggleButton>
              <ToggleButton value="advanced">詳細</ToggleButton>
              <ToggleButton value="customized">カスタマイズ</ToggleButton>
            </ToggleButtonGroup>    
          </Stack>
          {
            controllerItem.mode==="customized" && 
            <Stack direction={'column'} justifyContent='flex-start' alignItems={'flex-start'} spacing={0.5}>
              <CustomizedOptionCreater createOption={newOption => setControllerItem(draft=>{draft.options.push(newOption)})} initialOption={{label: "無題のラベル",value:DEFAULT_HEMODYANMIC_PROPS[controllerItem?.hdp?.value]}} unit={InputRanges[controllerItem?.hdp?.value]?.unit}/>
                <DragDropContext onDragEnd={({source,destination}) => {
                  if(!destination || source.index==destination.index) return;
                  setControllerItem(draft => {
                    const [insertItem] = draft.options.splice(source.index,1)
                    draft.options.splice(destination.index,0,insertItem)
                  })
                }}>
                  <Droppable droppableId="customized-item-creator">
                    {(provided) => (
                      <Stack {...provided.droppableProps} ref={provided.innerRef} width={1} alignItems="flex-start">
                        {controllerItem.options?.map((option, index)=>(
                            <Draggable key={JSON.stringify(option)+index} draggableId={JSON.stringify(option)+index} index={index}>
                              {(provided) => (
                                <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                  <CustomizedOptionItem option={option} updateOption={newOption => setControllerItem(draft=>{draft.options[index]=newOption})} deleteOption={()=>{setControllerItem(draft=>{draft.options.splice(index,1)})}} unit={InputRanges[controllerItem?.hdp?.value]?.unit}  />
                                </Box>
                              )}
                            </Draggable>                            
                          ))}                        
                        {provided.placeholder}
                      </Stack>
                    )}
                  </Droppable>
                </DragDropContext>
            </Stack>
          }
        </Stack>
        { controllerItem.hdp.value && controllerItem.mode &&
          <Stack direction='column' justifyContent='center' alignItems='flex-start' position="relative" spacing={1} py={1} px={2} mt={1} sx={{border:"1px solid #cfdce6", borderRadius:"8px", color:"#757575"}}>
            <Box position="absolute" zIndex={100} width={1} height={1}></Box>
            <Typography variant={isUpMd ?'caption':'subtitle1'} ml="3px" width={70} color="secondary">Preview</Typography>
            <PreviewItem hdp={controllerItem.hdp.value} mode={controllerItem.mode} options={controllerItem.options}/>
          </Stack>
        }
        <Stack direction="row" width="100%" justifyContent="center" alignItems="center" spacing={1} sx={{pt:1}}>
          <IconButton edge="end" aria-label="delete" onClick={()=>{deleteItem();setAnchorEl(null)}}>
            <Delete/>
          </IconButton>
          <Box sx={{flexGrow:1}}></Box>       
          <Button onClick={()=>{setControllerItem({...initialItem,hdp:{label:t[initialItem.hdp],value:initialItem.hdp}});setAnchorEl(null);}}>Cancel</Button>
          <Button onClick={onClickSave} variant="contained">更新する</Button>
        </Stack>
      </Box>
    </Popover>    
  </>  
}

export const AddControllerItem = React.memo(({addItem})=>{
  const [anchorEl, setAnchorEl] = useState(null);
  const t = useTranslation();
  const [controllerItem, setControllerItem] = useImmer({hdp:"",mode:"basic",options:[]});
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const onClickSave = ()=>{
    if(controllerItem.hdp?.value){
      addItem({...controllerItem,hdp:controllerItem.hdp.value});
    }
    setControllerItem({hdp:"",mode:"basic",options:[],id:nanoid()});
    setAnchorEl(null)
  }
  return <>
    <ListItem button sx={{"&.MuiListItem-root:hover":{backgroundColor:"#fef0f5"}}} onClick={e=>{setAnchorEl(e.currentTarget)}}>
      <ListItemIcon><Add color="primary"/></ListItemIcon><ListItemText primary="入力を追加" primaryTypographyProps={{color:"primary"}}/>
    </ListItem>
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={()=>{setAnchorEl(null)}}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Box p={1}>
        <Stack direction={'column'} justifyContent='center' alignItems='flex-start' spacing={2} p={1} >
          <Stack direction={'row'} justifyContent='flex-start' alignItems={'center'} spacing={1}>
            <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>項目</Typography>
            <Autocomplete 
              value={controllerItem.hdp} 
              onChange={(event,newValue)=>{setControllerItem(draft=>{draft.hdp=newValue})}}
              options={
                Hdps.map(hdp=>({label:t[hdp],value:hdp}))
              }
              renderInput={(params) => <TextField {...params} value={t[params.value]} />}
              disableClearable
              size="small"
              sx={{minWidth:"240px"}}
            />        
          </Stack>
          <Stack direction={'row'} justifyContent='flex-start' alignItems={'center'} spacing={1}>
            <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>モード</Typography>
            <ToggleButtonGroup
              color="primary"
              value={controllerItem.mode}
              exclusive
              onChange={(e,newValue)=>{setControllerItem(draft=>{draft.mode=newValue})}}
              size="small"
              sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
            >
              <ToggleButton value="basic">基本</ToggleButton>
              <ToggleButton value="advanced">詳細</ToggleButton>
              <ToggleButton value="customized">カスタマイズ</ToggleButton>
            </ToggleButtonGroup>    
          </Stack>
          {
            controllerItem.mode==="customized" && 
            <Stack direction={'column'} justifyContent='flex-start' alignItems={'flex-start'} spacing={0.5}>
              <CustomizedOptionCreater createOption={newOption => setControllerItem(draft=>{draft.options.push(newOption)})} initialOption={{label: "無題のラベル",value:DEFAULT_HEMODYANMIC_PROPS[controllerItem?.hdp?.value]}} unit={InputRanges[controllerItem?.hdp?.value]?.unit}/>
                <DragDropContext onDragEnd={({source,destination}) => {
                  if(!destination || source.index==destination.index) return;
                  setControllerItem(draft => {
                    const [insertItem] = draft.options.splice(source.index,1)
                    draft.options.splice(destination.index,0,insertItem)
                  })
                }}>
                  <Droppable droppableId="customized-item-creator">
                    {(provided) => (
                      <Stack {...provided.droppableProps} ref={provided.innerRef} width={1} alignItems="flex-start">
                        {controllerItem.options.map((option, index)=>(
                            <Draggable key={JSON.stringify(option)+index} draggableId={JSON.stringify(option)+index} index={index}>
                              {(provided) => (
                                <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                  <CustomizedOptionItem option={option} updateOption={newOption => setControllerItem(draft=>{draft.options[index]=newOption})} deleteOption={()=>{setControllerItem(draft=>{draft.options.splice(index,1)})}} unit={InputRanges[controllerItem?.hdp?.value]?.unit}  />
                                </Box>
                              )}
                            </Draggable>                            
                          ))}                        
                        {provided.placeholder}
                      </Stack>
                    )}
                  </Droppable>
                </DragDropContext>
            </Stack>
          }
        </Stack>
        { controllerItem.hdp.value && controllerItem.mode &&
          <Stack direction='column' justifyContent='center' alignItems='flex-start' position="relative" spacing={1} py={1} px={2} mt={1} sx={{border:"1px solid #cfdce6", borderRadius:"8px", color:"#757575"}}>
            <Box position="absolute" zIndex={100} width={1} height={1}></Box>
            <Typography variant={isUpMd ?'caption':'subtitle1'} ml="3px" width={70} color="secondary">Preview</Typography>
            <PreviewItem hdp={controllerItem.hdp.value} mode={controllerItem.mode} options={controllerItem.options}/>
          </Stack>
        }
        <Stack direction="row" width="100%" justifyContent="flex-end" alignItems="center" spacing={1} sx={{pt:1}}>
          <Button onClick={()=>{setControllerItem({hdp:"",mode:"basic",options:[]});setAnchorEl(null);}} color='secondary'>Cancel</Button>
          <Button onClick={onClickSave} variant="contained">追加する</Button>
        </Stack>
      </Box>
    </Popover>    
  </>
})

export const CustomizedOptionCreater = React.memo(({createOption,initialOption, unit=""})=>{
  const [option, setOption] = useImmer(initialOption);
  const [editing, setEditing] = useState(false);
  if(!editing){
    return <Button onClick={()=>{setEditing(true)}}>オプションを追加する</Button>
  }else{
    return (
      <Stack direction={'row'} justifyContent='flex-start' alignItems={'center'} spacing={1} sx={{p:1}}>
        <ReactiveInput type="text" value={option.label} updateValue={ newVal => setOption(draft=>{draft.label=newVal})}/>
        <ReactiveInput variant='standard' value={option.value} updateValue={ newVal => setOption(draft=>{draft.value=newVal})} unit={unit} sx={{"& input":{padding: "8px",maxWidth:"90px"}, pr:.5}}/>
        <Button onClick={()=>{createOption(option); setOption(initialOption); setEditing(false)}}>追加</Button>
      </Stack>
    )
  }
})

export const CustomizedOptionItem = React.memo(({option:initialOption, updateOption,deleteOption,unit=""})=>{
  const [option, setOption] = useImmer(initialOption);
  const [editing, setEditing] = useState(false);
  if(editing){
    return (          
      <Stack direction={'row'} justifyContent='flex-start' alignItems={'center'} spacing={1} sx={{px:1}}>
        <ReactiveInput type="text" value={option.label} updateValue={ newVal => setOption(draft=>{draft.label=newVal})}/>
        <ReactiveInput variant='standard' value={option.value} updateValue={ newVal => setOption(draft=>{draft.value=newVal})} unit={unit} sx={{"& input":{padding: "8px",maxWidth:"90px"}, pr:.5}}/>
        <Button color="secondary" onClick={()=>{setOption(initialOption);setEditing(false)}}>キャンセル</Button>
        <Button variant="contained" onClick={()=>{updateOption(option);setEditing(false)}}>更新する</Button>
      </Stack>
    )
  }else{
    return <Stack direction='row' justifyContent='center' alignItems="center" spacing={1} sx={{px:1}}>
      <IconButton><DragIndicator/></IconButton>
      <Typography variant='subtitle1' onClick={()=>{setEditing(true)}}>{option.label + "  " + option.value + unit}</Typography>
      <IconButton edge="end" aria-label="delete" onClick={deleteOption}>
        <Delete/>
      </IconButton>
    </Stack> 
  }
})

export const PreviewItem = React.memo(({hdp,mode,options})=>{
  const t = useTranslation();
  return <>
    {mode==="basic" && 
      <Grid container justifyContent="center" alignItems="center" display='flex' sx={{mb:1}}>
        <Grid item xs={6.5}>
          <Typography variant='subtitle1'>{t[hdp]}</Typography>
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
            <Button>-10%</Button>
            <Button><Refresh/></Button>
            <Button>+10%</Button>
          </ButtonGroup>
        </Grid>
      </Grid>
    }
    {mode==="advanced" && <>
      <Grid container justifyContent="center" alignItems="center" display='flex' >
        <Grid item xs={7}>
          <Typography variant='subtitle1'>{t[hdp]}</Typography>
        </Grid>
        <Grid item xs={5} justifyContent="flex-end" alignItems="center" display='flex'>
          <ReactiveInput variant="standard" unit={InputRanges[hdp]?.unit}/>
        </Grid>
      </Grid>
      <Grid container justifyContent="center" alignItems="center" display='flex' sx={{mb:1}}>
        <Grid item xs={2} justifyContent="flex-start" alignItems="center" display='flex' >
          <Typography variant="subtitle2" color="gray">x0.25</Typography>
        </Grid>
        <Grid item xs={8} justifyContent="center" alignItems="center" display='flex' >
          <Slider 
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
    }
    {mode==="customized" && 
      <>
        <Grid container justifyContent="flex-start" alignItems="center" display='flex' sx={{mb:1}}>
          <Grid item xs={6.5}>
            <Typography variant='subtitle1'>{t[hdp]}</Typography>
          </Grid>
          <Grid item justifyContent="flex-end" alignItems="center" display='flex'>
            <ToggleButtonGroup
              value={0}
              color="primary"
              size="small"
              sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
            >
              {options.map((option,index)=><ToggleButton value={index}>{option.label}</ToggleButton>)}
            </ToggleButtonGroup>
          </Grid>
        </Grid>      
      </>    
    }
  </>
})

export const InputItem =  React.memo(({patient, controllerItem, forceUpdate}) => {
  const {hdp, mode, options} = controllerItem
  const {getHdps,setHdps: setHdps_,initialHdps} = patient;
  const hdps = getHdps();
  const setHdps = (k,v) => {setHdps_(k,v); setTimeout(()=>{forceUpdate()},100)}
  if(hdp == "Impella") return <ImpellaButton hdps={hdps} setHdps={setHdps} key={hdp}/>;
  if(hdp == "ECMO") return <Box sx={{mb:1,width:1}} key={hdp}><EcmoButton hdps={hdps} setHdps={setHdps} /></Box>;
  if(hdp == "IABP") return <Box sx={{mb:1,width:1}} key={hdp}><IabpButton hdps={hdps} setHdps={setHdps} /></Box>;
  if(["Ravs","Rmvs","Rtvs","Rpvs","Ravr","Rmvr","Rtvr","Rpvr"].includes(hdp)) return <Box sx={{mt:1,width:1}} key={hdp}><BasicToggleButtons hdp={hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps}/></Box>
  return <>
    {mode=="basic" && <BasicInputs hdp={hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps} key={hdp}/>}
    {mode=="advanced" && <AdvancedInputs hdp={hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps} key={hdp}/>}
    {mode=="customized" && <CustomizedInputs hdp={hdp} initialHdps={initialHdps} hdps={hdps} setHdps={setHdps} key={hdp} options={options}/>}
  </>  
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
    <Grid container justifyContent="space-between" alignItems="center" display='flex' sx={{mb:1}}>
      <Grid item>
      <Typography variant='subtitle1' whiteSpace="nowrap">{display()}</Typography>
      </Grid>
      <Grid item>
      <Stack direction="row" justifyContent="flex-end" alignItems="center" display='flex'>
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
      </Stack>
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

export const CustomizedInputs = React.memo(({hdp,hdps,setHdps,options}) => {
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
        options.map((option,i) => (
          <ToggleButton value={option.value}>{option.label}</ToggleButton>
        ))
      }
      </ToggleButtonGroup> 
    </Box>
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

export const IabpButton = React.memo(({hdps,setHdps}) => {
  const t = useTranslation();
  const [iabpFreq, setIabpFreq] = useState(hdps["IabpFreq"]);
  const [delayInflation, setDelayInflation] = useState(hdps["DelayInflation"]);
  const [delayDeflation, setDelayDeflation] = useState(hdps["DelayDeflation"]);
  const [qDrive, setQDrive] = useState(hdps["Qdrive"]);
  const [radiusAorta, setRadiusAorta] = useState(hdps["RadiusDscAorta"]);
  const [lengthIabp, setLengthIabp] = useState(hdps["LengthIabp"]);

 
  const handleFreq = (e, v) =>{
    if(0<=v && v<=3){
      setIabpFreq(v);
      setHdps("IabpFreq",v);
    }else{
      setIabpFreq(0);
      setHdps("IabpFreq",0);
    }
  }


  return <>
    <Grid container justifyContent="space-between" alignItems="center" display='flex' sx={{mb:1}}>
      <Grid item xs={12} justifyContent="space-between" alignItems="center" display='flex' sx={{mb:.5}}>
        <Typography variant='subtitle1'>アシスト比</Typography>
      </Grid>
      <Grid itex xs={12}  justifyContent="space-between" alignItems="center" display='flex'>
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