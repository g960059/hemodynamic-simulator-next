'use client'

import React,{ useEffect, useRef,useState,useCallback }  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack,Link, CircularProgress, Tab,Avatar, useMediaQuery,Snackbar, IconButton,Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,Slider, Autocomplete, TextField} from '@mui/material'
import {Twitter,Facebook, Close, Check} from "@mui/icons-material"
import { useRouter, useParams } from 'next/navigation'
import Footer from "../../../../src/components/Footer"
import ReactiveInput from '../../../../src/components/ReactiveInput';
import {user$} from '../../../../src/hooks/usePvLoop'
import {useObservable} from '../../../../src/hooks/useObservable'
import { useImmer } from "use-immer";
import {collection,doc, updateDoc,serverTimestamp,writeBatch,deleteDoc, setDoc, getDoc, getFirestore,} from 'firebase/firestore';
import { ref, getDownloadURL ,uploadString,uploadBytesResumable, getStorage} from "firebase/storage";
import { nanoid } from 'nanoid'
import Cropper from 'react-easy-crop'
import Layout from "../../../../src/components/layout"
import {getCroppedImg,readFile,deepEqual3} from "../../../../src/utils/utils"
// import Billing from "../../../../src/components/Billing"
import { getAuth } from 'firebase/auth';

const Settings = () => {
  const db = getFirestore()
  const storage = getStorage()
  const auth = getAuth()
  const queryParams = useParams()

  const router = useRouter()
  const [tabValue, setTabValue] = useState(queryParams.tabValue || "account");
  const loadedUser =  useObservable(`user_${auth?.currentUser?.uid}`,user$) 

  const [loading, setLoading] = useState(false);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [user, setUser] = useImmer();
  const [uploadingProgress, setUploadingProgress] = useState(null);
  const [imageSrc, setImageSrc] = useState();
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isDuplicatedId, setIsDuplicatedId] = useState(false);
  const isChangedUser = !deepEqual3(user,loadedUser.data, ["updatedAt"],false, true)

  const updateUser = async () => {
    const batch = writeBatch(db);

    // userIdが変更された場合
    if (user.userId !== loadedUser.data.userId) {
      batch.delete(doc(db, "userIds", loadedUser.data.userId));
      batch.set(doc(db, "userIds", user.userId), { uid: user.uid, createdAt: serverTimestamp() });
      batch.update(doc(db, "users", user.uid), { ...user, updatedAt: serverTimestamp() });
    } else {
      batch.update(doc(db, "users", user.uid), { ...user, updatedAt: serverTimestamp() });
    }

    await batch.commit();
  }

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
    setTabValue(queryParams.tabValue || "profile")
  }, [queryParams.tabValue]);

  return <Box width={1} className="bg-white">
      <Divider light flexItem sx={{borderColor:"#5c93bb2b"}}/>
      <Stack width={1} justifyContent="center" alignItems="center" >
        <Box maxWidth="960px" width={1} px={{xs:2,md:10}} p={2}>
          <div className='text-2xl md:text-3xl font-bold my-5'>Settings</div>
          <div className='w-full sticky top-0 bg-white mx-auto mb-10 text-base font-medium text-center text-slate-500 border-solid border-0 border-b border-slate-200'>
            <div className='flex flex-nowrap flex-row justify-start md:justify-start items-center overflow-x-auto -mb-px max-w-7xl '>
              <div onClick={()=>{setTabValue("profile")}} className={`flex flex-row items-center justify-center text-sm md:text-base px-4 py-2 cursor-pointer transition-all duration-200  border-0 border-solid border-b-2 ${tabValue=="profile"  ? "font-bold text-slate-900  border-slate-800 " : "text-slate-400 border-transparent hover:font-bold hover:text-slate-700 hover:border-gray-300 "}`}>
                プロフィール
              </div>
            </div>
          </div>
        
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
                      <Button color="secondary" onClick={()=>{setImageSrc("")}}>キャンセル</Button>
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
                        決定
                    </Button>
                    </DialogActions>                                
                  </Dialog>
                              
                  <Avatar src={user?.photoURL} sx={{border:'1px solid lightgray',boxShadow:"0 2px 4px #21253840",borderRadius:"50%",width:"90px",height:"90px"}}>{user?.displayName}</Avatar>
                  <Typography variant="subtitle2" color="secondary" sx={{mt:1}}>変更する</Typography> 
                </label>
                <Snackbar
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  open={uploadingProgress >0 && uploadingProgress <100}
                  message={<span>アップロード中<CircularProgress size={16} thickness={4} sx={{ml:1,mb:-.4}}/></span>}
                  sx={{"& .MuiSnackbarContent-root":{minWidth:"auto"}}}
                />
                <Snackbar
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  open={uploadingProgress!==null && uploadingProgress>=100}
                  onClose={()=>{setUploadingProgress(null)}}
                  autoHideDuration={1000}
                  message={<>アップロード完了<Check fontSize="small" sx={{ml:1,mb:-.4}}/></>}
                  sx={{"& .MuiSnackbarContent-root":{minWidth:"auto"}}}
                />    
              </Stack>
              <Stack sx={{flexGrow:1}}>
                <Stack mb={{xs:2,md:3}}>
                  <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>表示名</Typography>
                  <ReactiveInput 
                    value={user.displayName} 
                    updateValue={newValue=>{
                    setUser(draft=>{
                      if(newValue){draft.displayName=newValue}                          
                    })}} 
                    type="text" placeholder="名前(ニックネーム)" required
                  />
                </Stack>
                <Stack mb={{xs:2,md:3}}>
                  <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>表示ID</Typography>
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
                    type="text" error={isDuplicatedId} helperText={isDuplicatedId && "このIDはすでに使用されています"} placeholder="https://circleheart.dev/◯◯◯の部分"
                  />
                </Stack>                    
                <Stack mb={{xs:2,md:3}}>
                  <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>自己紹介</Typography>
                  <ReactiveInput value={user?.description} updateValue={newValue=>{setUser(draft=>{draft.description=newValue})}} type="text" allowEmpty placeholder="自己紹介" multiline rows={3}/>
                </Stack>
                <Stack direction={isUpMd ? "row" : "column"} mb={{xs:2,md:3}} spacing={{xs:2,md:4}}>
                  <Stack flexGrow={1}  mb={{xs:2,md:0}}>
                    <Stack direction="row" alignItems="center">
                      <Twitter fontSize='small' size="small" sx={{mr:.5,alignSelf:"baseline",color:"#3ab4ff"}}/>
                      <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>Twitterユーザー名</Typography>
                    </Stack>
                    <ReactiveInput value={user?.twitterUserName} updateValue={newValue=>{setUser(draft=>{draft.twitterUserName=newValue})}} type="text" allowEmpty placeholder="@なしで入力"/>
                  </Stack>                        
                  <Stack flexGrow={1}>
                    <Stack direction="row" alignItems="center">
                      <Facebook fontSize='small' size="small" sx={{mr:.5,alignSelf:"baseline",color:"#4064ad"}}/>
                      <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>Facebookユーザー名</Typography>
                    </Stack>
                    <ReactiveInput value={user?.facebookUserName} updateValue={newValue=>{setUser(draft=>{draft.facebookUserName=newValue})}} type="text" allowEmpty placeholder="facebook.com/◯◯◯で/以下を入力"/>
                  </Stack>                        
                </Stack>               
                <Stack mb={{xs:2,md:3}}>
                  <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>あなたのウェブサイト</Typography>
                  <ReactiveInput value={user?.url} updateValue={newValue=>{setUser(draft=>{draft.url=newValue})}} type="text" allowEmpty placeholder="https://example.com"/>
                </Stack>
                <Typography variant="subtitle2" color="secondary">プロフィールにこれらの情報が表示されます</Typography>
                <Box width={1} display="flex" justifyContent="center" alignItems="center" my={3}>
                  <Button 
                    onClick={()=>{updateUser()} }
                    variant='contained' 
                    className='font-bold text-white'
                    disableElevation sx={{fontWeight:"bold"}}  disabled={!isChangedUser || (isDuplicatedId && user.userId != loadedUser.data.userId)} endIcon = {!isChangedUser&&<Check/>}
                  >
                    {!isChangedUser ? "保存済み" : "更新する"} 
                  </Button>
                </Box>
              </Stack>
            </Stack>
          </>}
     
            {/* <TabPanel value="billing" sx={{p:0}}><Billing/></TabPanel>
            <TabPanel value="payments_history"> payments_history</TabPanel> */}

    
        </Box>
      </Stack>
  </Box>
}

export default Settings;

{/* <TabPanel value="bank_account">
{
  queryParams.message="bank_account_required" && <div className='bg-red-100 text-red-600 p-4 m-4 rounded-lg text-sm font-bold'>
    お支払先情報を入力し、再度出金申請を行ってください
  </div>
}
<div className='md:px-4 mt-6'>
  <div className='text-xl font-bold mb-4'>お支払先</div>
  <div className='mb-5'>
    <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>銀行名</Typography>
    <Autocomplete 
      value={user?.bank}
      onChange={(event,newValue)=>{
        setUser(draft=>{
          draft.bank=newValue
          draft.branch =null
        })
      }}
      options={bank_options.filter(option=>option.branch_code ==="000").sort((a,b)=> a.kana > b.kana ? 1 : -1).map(option=>{
        if(["金庫", "信金","組合","農協", "バンク","信組","漁","信連"].every(x=>!option.name.includes(x))){
          return {...option,name:option.name+"銀行"}
        }else{
          return option
        }
      })} 
      groupBy={(option) => toHira(option.kana[0])} 
      renderInput={(params) => <TextField  
        {...params} 
        placeholder="銀行名を入力してください" 
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
    <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>支店名</Typography>
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
        placeholder="支店名を入力してください" 
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
    <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>口座番号（7桁）<span className='text-slate-400'>(半角 6桁の場合は先頭に0)</span></Typography>
    <ReactiveInput 
      value={user?.account_number} 
      updateValue={newValue=>{
      setUser(draft=>{
        if(newValue){draft.account_number=newValue}                          
      })}} 
      type="text" placeholder="口座番号を入力してください" required fullWidth
    />
  </div>
  <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>口座種別</Typography>
  <div className='mb-5 inline-flex rounded-md overflow-hidden border-solid border border-slate-200 font-bold'>
    <button className={`px-4 py-2 border-0 cursor-pointer border-r border-solid border-slate-200 bg-white ${user?.account_type == "普通" ? "text-slate-900 bg-slate-100 font-bold" : "text-slate-500"}`} onClick={()=>{setUser(draft=>{draft.account_type="普通"})}}>普通預金</button>
    <button className={`px-4 py-2 border-0 cursor-pointer border-r border-solid border-slate-200 bg-white ${user?.account_type == "当座" ? "text-slate-900 bg-slate-100 font-bold" : "text-slate-500"}`} onClick={()=>{setUser(draft=>{draft.account_type="当座"})}}>当座預金</button>
    <button className={`px-4 py-2 border-0 cursor-pointer bg-white ${user?.account_type == "貯蓄" ? "text-slate-900 bg-slate-100 font-bold" : "text-slate-500"}`} onClick={()=>{setUser(draft=>{draft.account_type="貯蓄"})}}>貯蓄預金</button>
  </div>
  <div className='mb-5 w-full'>
    <Typography variant='subtitle2' sx={{fontWeight:"bold",mb:.5}}>口座名義カナ （全角）</Typography>
    <ReactiveInput 
      value={user?.beneficiary_name} 
      updateValue={newValue=>{
      setUser(draft=>{
        if(newValue){draft.beneficiary_name=newValue}                          
      })}} 
      type="text" placeholder="口座名義を入力してください" required fullWidth
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
      {!isChangedUser ? "保存済み" : "更新する"} 
    </Button>
  </Box>
  </div>
</div>              
</TabPanel> */}