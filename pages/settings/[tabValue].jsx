import React,{ useEffect, useRef,useState,useCallback }  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack,Link, CircularProgress, Tab,Avatar, useMediaQuery,Snackbar, IconButton,Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,Slider, Autocomplete, TextField} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';
import {Twitter,Facebook, Close, Check} from "@mui/icons-material"
import { makeStyles} from '@mui/styles';
import { useRouter } from 'next/router'
import Footer from "../../src/components/Footer"
import {auth,db,storage} from '../../src/utils/firebase'
import ReactiveInput from '../../src/components/ReactiveInput';
import {user$} from '../../src/hooks/usePvLoop'
import {useObservable} from "reactfire"
import { useImmer } from "use-immer";
import {collection,doc, updateDoc,serverTimestamp,writeBatch,deleteDoc, setDoc, getDoc,} from 'firebase/firestore';
import { ref, getDownloadURL ,uploadString,uploadBytesResumable} from "firebase/storage";
import { nanoid } from 'nanoid'
import isEqual from "lodash/isEqual"
import Cropper from 'react-easy-crop'
import Layout from "../../src/components/layout"
import {getCroppedImg,readFile, toHira} from "../../src/utils/utils"
import Billing from "../../src/components/Billing"
import { bank_options } from '../../src/utils/bank';

const useStyles = makeStyles((theme) =>({
  background: {
    position: "fixed",
    zIndex: -1,
    top: "0px",
    left: "0px",
    width: "100%",
    overflow: "hidden",
    transform: "translate3d(0px, 0px, 0px)",
    height: "-webkit-fill-available",
    background: "white",
    opacity: 1,
    userSelect: "none",
    pointerEvents: "none"
  },
  featuredBox: {
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    color: "rgb(69, 90, 100)",
    boxShadow: "rgb(0 0 0 / 10%) 0px 2px 4px -2px",
    backgroundColor: "white",
    border: "1px solid rgba(92, 147, 187, 0.17)",
    borderRadius: "12px",
  }
}),
);


const Settings = () => {
  const el = useRef(null);
  const classes = useStyles();
  const router = useRouter()
  const [tabValue, setTabValue] = useState(router.query.tabValue || "account");
  const loadedUser = useObservable("user",user$)
  const [loading, setLoading] = useState(false);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [user, setUser] = useImmer();
  const [uploadingProgress, setUploadingProgress] = useState(null);
  const [imageSrc, setImageSrc] = useState();
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isDuplicatedId, setIsDuplicatedId] = useState(false);
  const isChangedUser = !isEqual(user,loadedUser.data)
  
  useEffect(() => {
    setLoading(true)
    if(loadedUser.status == "success" && loadedUser.data?.uid){
      setUser(loadedUser.data)
    }
    setLoading(false)
  }, [loadedUser.status,loadedUser.data]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  useEffect(() => {
    setTabValue(router.query.tabValue || "profile")
  }, [router.query.tabValue]);

  return <Box width={1}>
      <Divider light flexItem sx={{borderColor:"#5c93bb2b"}}/>
      <Stack width={1} justifyContent="center" alignItems="center" >
        <Box maxWidth="960px" width={1} px={{xs:2,md:10}} p={2}>
          <Typography variant={isUpMd ? 'h4':"h3"} sx={{fontWeight:"bold",mb:3,mt:{xs:3,md:6}}}>Settings</Typography>
          <TabContext value={tabValue}>
            <Box sx={{ borderBottom: 1, borderColor: '#5c93bb2b',mx:{xs:-1,md:0} }}>
              <TabList onChange={(e,newValue)=>{setTabValue(newValue)}} aria-label="lab API tabs example" sx={{"& .MuiTab-textColorPrimary":{fontWeight:"bold"}}} variant="scrollable">
                <Tab label="??????????????????" value="profile"/>
                <Tab label="???????????????" value="billing" />
                <Tab label="????????????" value="payments_history" />
                <Tab label="????????????" value="bank_account" />
              </TabList>
            </Box>
            <TabPanel value="profile" sx={{px:0}}>
              {loadedUser.status=="success" && user && !loading && <>
                <Stack direction={isUpMd ? "row" : "column"} mt={2}>
                  <Stack sx={{minWidth:"150px",width:!isUpMd && 1, justifyContent:!isUpMd &&"center", alignItems:!isUpMd &&"center"}}>
                    <label htmlFor={`profile-upload-button`} style={{display:"flex", justifyContent:"center",alignItems:"center",flexDirection:"column"}}>
                      <input
                        accept="image/*"
                        id={`profile-upload-button`}
                        type="file"
                        style={{ display: `none` }}
                        onChange={async (e)=>{
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0]
                            let imageDataUrl = await readFile(file)
                            setImageSrc(imageDataUrl)
                          }
                        }}
                      />
                      <Dialog open={Boolean(imageSrc)} onClose={()=>{setImageSrc("")}}>
                        <DialogContent sx={{"&.MuiDialogContent-root":{p:0}}}>
                          <Stack>
                            <Box sx={{width:"300px",height:"300px",overflow:"hidden",position:"relative"}}>
                              <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                objectFit="vertical-cover"
                                showGrid={false}
                              />
                            </Box>
                            <Box p={2}>
                              <Slider 
                                value={zoom}
                                min={1} 
                                max={3} 
                                step={.1} 
                                valueLabelDisplay="off"
                                onChange = {(e,v)=> {setZoom(v)}}
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
                            </Box>            
                          </Stack>                
                        </DialogContent>
                        <DialogActions>
                          <Button color="secondary" onClick={()=>{setImageSrc("")}}>???????????????</Button>
                          <Button 
                            variant="contained"
                            className="text-white font-bold"
                            onClick={async ()=>{
                              const imageId = nanoid()
                              const storageRef = ref(storage, `images/${user.uid}/icons/${imageId}`);
                              const croppedImage = await getCroppedImg(
                                imageSrc,
                                croppedAreaPixels,
                                0
                              )
                              uploadString(storageRef, croppedImage, 'data_url').then((snapshot) => {
                                  getDownloadURL(snapshot.ref).then(async photoURL=>{
                                    await updateDoc(doc(db,"users",user.uid),{photoURL})
                                    setUser(draft=>{draft.photoURL = photoURL})
                                  })
                                }
                              )
                              setImageSrc(null)
                            }
                          }>
                            ??????
                        </Button>
                        </DialogActions>                                
                      </Dialog>
                                 
                      <Avatar src={user?.photoURL} sx={{border:'1px solid lightgray',boxShadow:"0 2px 4px #21253840",borderRadius:"50%",width:"90px",height:"90px"}}>{user?.displayName}</Avatar>
                      <Typography variant="subtitle2" color="secondary" sx={{mt:1}}>????????????</Typography> 
                    </label>
                    <Snackbar
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      open={uploadingProgress >0 && uploadingProgress <100}
                      message={<span>?????????????????????<CircularProgress size={16} thickness={4} sx={{ml:1,mb:-.4}}/></span>}
                      sx={{"& .MuiSnackbarContent-root":{minWidth:"auto"}}}
                    />
                    <Snackbar
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      open={uploadingProgress!==null && uploadingProgress>=100}
                      onClose={()=>{setUploadingProgress(null)}}
                      autoHideDuration={1000}
                      message={<>????????????????????????<Check fontSize="small" sx={{ml:1,mb:-.4}}/></>}
                      sx={{"& .MuiSnackbarContent-root":{minWidth:"auto"}}}
                    />    
                  </Stack>
                  <Stack sx={{flexGrow:1}}>
                    <Stack mb={{xs:2,md:3}}>
                      <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>?????????</Typography>
                      <ReactiveInput 
                        value={user.displayName} 
                        updateValue={newValue=>{
                        setUser(draft=>{
                          if(newValue){draft.displayName=newValue}                          
                        })}} 
                        type="text" placeholder="??????(??????????????????)" required
                      />
                    </Stack>
                    <Stack mb={{xs:2,md:3}}>
                      <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>??????ID</Typography>
                      <ReactiveInput 
                        value={user.userId} 
                        updateValue={async newValue=>{
                          if(newValue == loadedUser.data.userId){setUser(draft=>{draft.userId=newValue});return};
                          const docSnap = await getDoc(doc(db,"userIds",newValue))
                          if(!docSnap.exists()){
                            setUser(draft=>{draft.userId=newValue})
                            setIsDuplicatedId(false)
                          }else{
                            setIsDuplicatedId(true)
                          }
                        }} 
                        type="text" error={isDuplicatedId} helperText={isDuplicatedId && "??????ID????????????????????????????????????"} placeholder="https://circleheart.dev/??????????????????"
                      />
                    </Stack>                    
                    <Stack mb={{xs:2,md:3}}>
                      <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>????????????</Typography>
                      <ReactiveInput value={user?.description} updateValue={newValue=>{setUser(draft=>{draft.description=newValue})}} type="text" allowEmpty placeholder="????????????" multiline rows={3}/>
                    </Stack>
                    <Stack direction={isUpMd ? "row" : "column"} mb={{xs:2,md:3}} spacing={{xs:0,md:4}}>
                      <Stack flexGrow={1}  mb={{xs:2,md:0}}>
                        <Stack direction="row" alignItems="center">
                          <Twitter fontSize='small' size="small" sx={{mr:.5,alignSelf:"baseline",color:"#3ab4ff"}}/>
                          <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>Twitter???????????????</Typography>
                        </Stack>
                        <ReactiveInput value={user?.twitterUserName} updateValue={newValue=>{setUser(draft=>{draft.twitterUserName=newValue})}} type="text" allowEmpty placeholder="@???????????????"/>
                      </Stack>                        
                      <Stack flexGrow={1}>
                        <Stack direction="row" alignItems="center">
                          <Facebook fontSize='small' size="small" sx={{mr:.5,alignSelf:"baseline",color:"#4064ad"}}/>
                          <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>Facebook???????????????</Typography>
                        </Stack>
                        <ReactiveInput value={user?.facebookUserName} updateValue={newValue=>{setUser(draft=>{draft.facebookUserName=newValue})}} type="text" allowEmpty placeholder="facebook.com/????????????/???????????????"/>
                      </Stack>                        
                    </Stack>               
                    <Stack mb={{xs:2,md:3}}>
                      <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>??????????????????????????????</Typography>
                      <ReactiveInput value={user?.url} updateValue={newValue=>{setUser(draft=>{draft.url=newValue})}} type="text" allowEmpty placeholder="https://example.com"/>
                    </Stack>
                    <Typography variant="subtitle2" color="secondary">????????????????????????????????????????????????????????????</Typography>
                    <Box width={1} display="flex" justifyContent="center" alignItems="center" my={3}>
                      <Button 
                        onClick={ async ()=>{
                          const batch = writeBatch(db);                  
                          if(user.userId != loadedUser.data.userId){
                            batch.delete(doc(db,"userIds",loadedUser.data.userId))
                            batch.set(doc(db,"userIds",user.userId),{uid:user.uid,createdAt:serverTimestamp()})
                            batch.update(doc(db,"users",user.uid),{...user,updatedAt:serverTimestamp()})
                          }else{
                            batch.update(doc(db,"users",user.uid),{...user,updatedAt:serverTimestamp()})
                          }
                          await batch.commit()
                        }}
                        variant='contained' 
                        className='font-bold text-white'
                        disableElevation sx={{fontWeight:"bold"}}  disabled={!isChangedUser || (isDuplicatedId && user.userId != loadedUser.data.userId)} endIcon = {!isChangedUser&&<Check/>}
                      >
                        {!isChangedUser ? "????????????" : "????????????"} 
                      </Button>
                    </Box>
                  </Stack>
                </Stack>
              </>}
            </TabPanel>
            <TabPanel value="billing" sx={{p:0}}><Billing/></TabPanel>
            <TabPanel value="payments_history"> payments_history</TabPanel>
            <TabPanel value="bank_account">
              {
                router.query.message="bank_account_required" && <div className='bg-red-100 text-red-600 p-4 m-4 rounded-lg text-sm font-bold'>
                  ???????????????????????????????????????????????????????????????????????????
                </div>
              }
              <div className='md:px-4 mt-6'>
                <div className='text-xl font-bold mb-4'>????????????</div>
                <div className='mb-5'>
                  <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>?????????</Typography>
                  <Autocomplete 
                    value={user?.bank}
                    onChange={(event,newValue)=>{
                      setUser(draft=>{
                        draft.bank=newValue
                        draft.branch =null
                      })
                    }}
                    options={bank_options.filter(option=>option.branch_code ==="000").sort((a,b)=> a.kana > b.kana ? 1 : -1).map(option=>{
                      if(["??????", "??????","??????","??????", "?????????","??????","???","??????"].every(x=>!option.name.includes(x))){
                        return {...option,name:option.name+"??????"}
                      }else{
                        return option
                      }
                    })} 
                    groupBy={(option) => toHira(option.kana[0])} 
                    renderInput={(params) => <TextField  
                      {...params} 
                      placeholder="????????????????????????????????????" 
                      required
                      sx={{"& .MuiInputBase-root":{
                        backgroundColor: '#f1f5f9',
                        borderRadius: '4px',
                        padding: "0",
                        border: '1px solid #5c93bb2b',
                        '&:hover': { 
                          borderColor: '#3ea8ff'
                        }},
                        "& input": {border: 'none',padding: '8px 16px !important'},
                        "& p.MuiTypography-root":{
                          fontSize: "0.7rem"
                        },
                        "& .MuiOutlinedInput-notchedOutline":{border:"none"},
                        "& .Mui-focused .MuiOutlinedInput-notchedOutline":{ border: '1px solid #3ea8ff !important'},
                      }}
                    />} 
                    getOptionLabel={option => option.bank_code + "  "+ option.name} 
                    isOptionEqualToValue = {(option,value)=>option.bank_code === value.bank_code}
                  />
                </div>   
                <div className='mb-5'>
                  <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>?????????</Typography>
                  <Autocomplete 
                    value={user?.branch}
                    onChange={(event,newValue)=>{
                      setUser(draft=>{
                        draft.branch=newValue
                      })
                    }}
                    options={bank_options.filter(option=>option.bank_code ===user?.bank?.bank_code).sort((a,b)=> a.kana > b.kana ? 1 : -1)} 
                    groupBy={(option) => toHira(option.kana[0])} 
                    renderInput={(params) => <TextField  
                      {...params} 
                      placeholder="????????????????????????????????????" 
                      required
                      sx={{"& .MuiInputBase-root":{
                        backgroundColor: '#f1f5f9',
                        borderRadius: '4px',
                        padding: "0",
                        border: '1px solid #5c93bb2b',
                        '&:hover': { 
                          borderColor: '#3ea8ff'
                        }},
                        "& input": {border: 'none',padding: '8px 16px !important'},
                        "& p.MuiTypography-root":{
                          fontSize: "0.7rem"
                        },
                        "& .MuiOutlinedInput-notchedOutline":{border:"none"},
                        "& .Mui-focused .MuiOutlinedInput-notchedOutline":{ border: '1px solid #3ea8ff !important'},
                      }}
                    />} 
                    getOptionLabel={option => option.branch_code + "  "+ option.name} 
                    isOptionEqualToValue = {(option,value)=>option.branch_code === value.branch_code}
                  />
                </div> 
                <div className='mb-5 w-full'>
                  <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>???????????????7??????<span className='text-slate-400'>(?????? 6????????????????????????0)</span></Typography>
                  <ReactiveInput 
                    value={user?.account_number} 
                    updateValue={newValue=>{
                    setUser(draft=>{
                      if(newValue){draft.account_number=newValue}                          
                    })}} 
                    type="text" placeholder="???????????????????????????????????????" required fullWidth
                  />
                </div>
                <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>????????????</Typography>
                <div className='mb-5 inline-flex rounded-md overflow-hidden border-solid border border-slate-200 font-bold'>
                  <button className={`px-4 py-2 border-0 cursor-pointer border-r border-solid border-slate-200 bg-white ${user?.account_type == "??????" ? "text-slate-900 bg-slate-100 font-bold" : "text-slate-500"}`} onClick={()=>{setUser(draft=>{draft.account_type="??????"})}}>????????????</button>
                  <button className={`px-4 py-2 border-0 cursor-pointer border-r border-solid border-slate-200 bg-white ${user?.account_type == "??????" ? "text-slate-900 bg-slate-100 font-bold" : "text-slate-500"}`} onClick={()=>{setUser(draft=>{draft.account_type="??????"})}}>????????????</button>
                  <button className={`px-4 py-2 border-0 cursor-pointer bg-white ${user?.account_type == "??????" ? "text-slate-900 bg-slate-100 font-bold" : "text-slate-500"}`} onClick={()=>{setUser(draft=>{draft.account_type="??????"})}}>????????????</button>
                </div>
                <div className='mb-5 w-full'>
                  <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>?????????????????? ????????????</Typography>
                  <ReactiveInput 
                    value={user?.beneficiary_name} 
                    updateValue={newValue=>{
                    setUser(draft=>{
                      if(newValue){draft.beneficiary_name=newValue}                          
                    })}} 
                    type="text" placeholder="???????????????????????????????????????" required fullWidth
                  />
                </div>                          
                <div>
                <Box width={1} display="flex" justifyContent="center" alignItems="center" my={3}>
                  <Button 
                    onClick={ async ()=>{
                      const batch = writeBatch(db);                  
                      if(user.userId != loadedUser.data.userId){
                        batch.delete(doc(db,"userIds",loadedUser.data.userId))
                        batch.set(doc(db,"userIds",user.userId),{uid:user.uid,createdAt:serverTimestamp()})
                        batch.update(doc(db,"users",user.uid),{...user,updatedAt:serverTimestamp()})
                      }else{
                        batch.update(doc(db,"users",user.uid),{...user,updatedAt:serverTimestamp()})
                      }
                      await batch.commit()
                    }}
                    variant='contained' 
                    className='font-bold text-white'
                    disableElevation sx={{fontWeight:"bold"}}  disabled={!isChangedUser || (isDuplicatedId && user.userId != loadedUser.data.userId)} endIcon = {!isChangedUser&&<Check/>}
                  >
                    {!isChangedUser ? "????????????" : "????????????"} 
                  </Button>
                </Box>
                </div>
              </div>              
            </TabPanel>
          </TabContext> 
        </Box>
      </Stack>
      <Footer/>
  </Box>
}

Settings.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

export default Settings;