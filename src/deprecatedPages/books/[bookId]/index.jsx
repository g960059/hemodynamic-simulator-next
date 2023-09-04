import React, {useRef, useState, useEffect,useCallback} from 'react'
import {Box,Typography,Grid,Tab,Tabs, Divider,AppBar,Tooltip, Toolbar,Button,IconButton,Stack,Switch,Dialog,DialogContent,DialogActions,DialogTitle,Popover,Autocomplete,TextField,TextareaAutosize,useMediaQuery,Slide, Slider, Menu, MenuItem} from '@mui/material'
import {ArrowBack,Add,Check,Tune,Close,FormatQuote, FormatStrikethrough,FormatBold,FormatItalic,FormatUnderlined,Link as LinkIcon, FormatListBulleted, FormatListNumbered, OndemandVideo,ImageOutlined, EditOutlined, ExpandMore} from '@mui/icons-material';
import {user$} from '../../../src/hooks/usePvLoop'
import { useRouter } from 'next/navigation'
import { makeStyles } from '@mui/styles';
import {useTranslation} from '../../../src/hooks/useTranslation'
import ReactiveInput from "../../../src/components/ReactiveInput";

import {useObservable} from '../../../hooks/useObservable'
import { mergeMap,filter,tap,map} from "rxjs/operators";
import { docData, collectionData} from 'rxfire/firestore';
import {collection,doc, updateDoc,serverTimestamp, setDoc, addDoc, deleteDoc, arrayUnion, arrayRemove, writeBatch, getFirestore} from 'firebase/firestore';
import { useImmer } from "use-immer";
import isEqual from "lodash/isEqual"
import {readFile,objectWithoutKeys,getRandomEmoji,formatDateDiff,getCroppedImg,nanoid} from "../../../src/utils/utils"
import Cropper from 'react-easy-crop'

import { ref, getDownloadURL ,uploadString,uploadBytesResumable, getStorage} from "firebase/storage";
import Image from 'next/image';
import clsx from 'clsx';
import { combineLatest, of } from 'rxjs';
import { FaintNeumoIconButton } from '../../../src/components/StyledComponents';
import DeleteMenuItemWithDialog from '../../../src/components/DeleteMenuItemWithDialog';

const useStyles = makeStyles((theme) =>(
  {
    appBarRoot: {
      [theme.breakpoints.up('xs')]: {
        backgroundColor: 'transparent',
        color: 'inherit'
      },
      boxShadow: "rgba(31, 25, 60, 0.1) 0px 0px 8px",
    },
    background: {
      position: "fixed",
      zIndex: -1,
      top: "0px",
      left: "0px",
      width: "100%",
      overflow: "hidden",
      transform: "translate3d(0px, 0px, 0px)",
      height: "-webkit-fill-available",
      background: "radial-gradient(50% 50% at 50% 50%, #3ea8ff 0%, #f5f5f5 100%)",
      opacity: 0.15,
      userSelect: "none",
      pointerEvents: "none"
    },
    socialIcon: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "30px",
      height: "30px",
      borderRadius: "10px",
      color: "#fff",
      marginRight: "8px",
    },
    bookCover: {
      boxShadow: "-6px 6px 10px -2px #001b4440, 0 0 3px #8f9aaf1a",
      position: "relative",
      maxWidth: "100%",
      width: "215px",
      height: "300px",
      "&::after": {
        bottom: 0,
        content: '""',
        height: "100%",
        left: "0",
        position: "absolute",
        width: "100%",
        borderRadius: "5px",
        background: "linear-gradient(-90deg,#fff0,#ffffff1a 80%,#ffffff4d 95%,#fff6 96.5%,#cbcbcb14 98%,#6a6a6a1a)",
      }
    }
  })
);

const Book = () => {
  const classes = useStyles();
  const router = useRouter()
  const t = useTranslation()
  const db = getFirestore()
  const storage = getStorage()

  const book$ = user$.pipe(
    mergeMap(user => user ?  docData(doc(db,'users',user?.uid,"books",router.query.bookId)) : of(null)),
  )
  const chapters$ = user$.pipe(
    mergeMap(user => user ? collectionData(collection(db,'users',user?.uid,'books',router.query.bookId,"chapters"), {idField: "id"}) : of([])),
  )
  const loadedBook = useObservable("book"+router.query.bookId,book$)
  const {data: chapters} = useObservable("chapters"+router.query.bookId,chapters$)
  const {data:user} = useObservable("user",user$)

  const [loading, setLoading] = useState(true);
  const [bookData, setBookData] = useImmer();
  const [defaultBookData, setDefaultBookData] = useState({});
  const [openPublishDialog, setOpenPublishDialog] = useState(false);
  const [imageSrc, setImageSrc] = useState();
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  

  const isChanged = loadedBook.status == "success" && (loadedBook.data &&
    (!isEqual(objectWithoutKeys(bookData,["updatedAt","createdAt"]),objectWithoutKeys(loadedBook.data,["updatedAt","createdAt"]))) || !loadedBook.data);

  useEffect(() => {
    setLoading(true)
    const checkInitialBook = async () => {
      if(loadedBook.status == "success" && loadedBook.data?.createdAt){
        if(!bookData){
          setBookData(loadedBook.data)
        }else{
          setBookData(draft => {draft.chapterOrder = loadedBook.data.chapterOrder})
        }
      }else{
        if(router.query.newItem){
          const newBook = {
            name:"",
            description:"",
            coverURL:"",
            visibility: "private",
            tags:[],
            userId: user?.userId,
            uid: user?.uid,
            displayName: user?.displayName,
            photoURL: user?.photoURL,
            heartCount:0,
            amount:1000,
            premium:false,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          }
          setBookData(newBook);
          setDefaultBookData(newBook);
          await setDoc(doc(db,'users',user?.uid,"books",router.query.bookId),newBook)
        }
      }
    }
    checkInitialBook()
    setLoading(false)
  }, [loadedBook.status,chapters]);


  const updateBook = async () =>{
    const timestamp = serverTimestamp();
    if(!loadedBook.data?.createdAt){
      await setDoc(doc(db,'users',user?.uid,"books",router.query.bookId),{...bookData,updatedAt:timestamp,createdAt:timestamp})
    }else{
      await updateDoc(doc(db,'users',user?.uid,"books",router.query.bookId),{...bookData,updatedAt:timestamp})
    }
  }

  const addChapter = async () =>{
    const newChapterId = nanoid();
    const newChapter = {
      name:"",
      body:[{ type:"p", children:[{text:""}]}],
      visibility: "public",
      premium:true,
      uid:user.uid,
      bookId:router.query.bookId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }
    // setBookData(draft => { draft.chapterOrder.push(newChapterId)})
    const batch = writeBatch(db)
    batch.set(doc(db,'users',user?.uid,"books",router.query.bookId,"chapters",newChapterId),newChapter)
    batch.update(doc(db,'users',user?.uid,"books",router.query.bookId),{chapterOrder: arrayUnion(newChapterId)})
    await batch.commit()
  }

  const removeChapter = (chapterId) => async ()=> {
    setBookData(draft => { draft.chapterOrder = draft.chapterOrder.filter(id => id != chapterId)})
    const batch = writeBatch(db)
    batch.delete(doc(db,'users',user?.uid,"books",router.query.bookId,"chapters",chapterId))
    batch.update(doc(db,'users',user?.uid,"books",router.query.bookId),{chapterOrder: arrayRemove(chapterId)})
    await batch.commit()
  }
  const selectChapter = (chapterId) => async () => {
    await updateBook()
    router.push(`/books/${router.query.bookId}/chapters/${chapterId}`)
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  if(loading || !bookData){
    return (
      <div className="flex flex-row justify-center items-center h-screen w-screen space-x-3 pb-10">
        <div className="animate-ping  h-2 w-2 bg-blue-500 rounded-full"></div>
        <div className="animate-ping  h-2 w-2 bg-blue-500 rounded-full animation-delay-200"></div>
        <div className="animate-ping  h-2 w-2 bg-blue-500 rounded-full animation-delay-400"></div>
      </div>
    )
  }

  return <>
      <AppBar position="static" elevation={0} className="bg-white shadow fixed z-10" classes={{root:classes.appBarRoot}}>
        <Toolbar>
          <Box onClick={()=>{router.push("/dashboard/books")}} sx={{cursor:"pointer",fontFamily: "GT Haptik Regular" ,fontWeight: 'bold',display:"flex",ml:{xs:0,md:2}}}>
            <IconButton><ArrowBack/></IconButton>
          </Box>
          <div style={{flexGrow:1}}/>
          <IconButton sx={{ml:.5}} onClick={()=>{setOpenPublishDialog(true)}}><Tune/></IconButton>
          <Switch checked={bookData.visibility=="public"} onChange={e=>{const newVal = e.target.checked ? "public":"private"; setBookData(draft =>{draft.visibility=newVal})}}/>
          <Typography variant='button' sx={{color:bookData.visibility=="public" ? "black": "gray", mr:1}}>{t["Publish"]}</Typography>
          <Button 
            variant='contained' 
            disableElevation 
            className="font-bold text-white"
            onClick={bookData.visibility=="private" || bookData.visibility=="public" && loadedBook.data?.visibility=="public" ? ()=>{updateBook()} : ()=>{setOpenPublishDialog(true)}}
            disabled={!isChanged}
            endIcon = {!isChanged&&<Check/>}
          > 

            {isChanged ? (bookData.visibility=="private" ? "下書き保存" : (bookData.visibility=="public" && loadedBook.data?.visibility=="public" ? "保存する" : t["Publish"] )) : t["Saved"]}
          </Button>
          <Dialog open={openPublishDialog} onClose={()=>setOpenPublishDialog(false)}  sx={{"& .MuiDialog-paper":{minWidth : isUpMd ? "520px": "100%"}}}>
            <DialogTitle className='font-bold text-2xl'>
              本の設定
            </DialogTitle>
            <DialogContent>
              <Typography variant='subtitle1' fontWeight="bold" >Tags</Typography>
              <Stack direction="column">
                <Typography variant="caption" color="#6e7b85">関連するタグを選んでください。</Typography>
                <Typography variant="caption" color="#6e7b85">最初のタグが一覧で表示されます。</Typography>
              </Stack>
              <div className='py-3 '>
                <Autocomplete 
                  freeSolo multiple value={bookData.tags} 
                  onChange={(e,newTags)=>{setBookData(draft=>{draft.tags=newTags})}}
                  options={[]}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                    />)}
                  sx={{ "&.MuiAutocomplete-root":{
                    backgroundColor: '#f1f5f9',
                    borderRadius: '4px',
                    border: '1px solid #5c93bb2b',
                    '&:hover': {
                      borderColor: '#3ea8ff',
                    },
                    "& .MuiOutlinedInput-root":{padding:"3px 9px"},
                    "& .MuiInput-input": {border: 'none',padding: '8px 0 8px 16px'},
                    "& p.MuiTypography-root":{
                      fontSize: "0.7rem"
                    },
                    "& .Mui-focused .MuiOutlinedInput-notchedOutline":{border:"none"}
                  }}}
                  />
              </div>
              <div className='flex flex-col md:flex-row md:justify-between items-center py-3 '>
                <div className='font-bold text-md'>有料で販売する</div>
                <Switch checked={bookData.premium} onChange={e=>{setBookData(draft =>{draft.premium=e.target.checked})}}/>
              </div>
              {
                bookData.premium && <div className='flex flex-col py-3'>
                  <div className='flex flex-row justify-between pb-2'>
                    <div className='font-bold text-md'>販売価格</div>
                    <div className='text-md'>{bookData.amount}円</div>
                  </div>
                  <div className='flex flex-row items-center'>
                    <div className='font-bold pr-5 text-sm text-slate-400 whitespace-nowrap'>200円</div>
                    <Slider 
                      value={bookData.amount}
                      min={200} 
                      max={5000} 
                      step={100} 
                      valueLabelDisplay="off"
                      onChange = {(e,v)=> {setBookData(draft =>{draft.amount=v})}}
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
                    <div className='font-bold pl-5 text-sm text-slate-400 whitespace-nowrap'>5000円</div>
                  </div>
                </div>
              }
            </DialogContent>
            <DialogActions sx={{display:"flex", justifyContent:"center",mb:2}}>
              <Button onClick={()=>{updateBook();setOpenPublishDialog(false)}} variant='contained' disableElevation disabled={!isChanged} className='font-bold text-white'>
                {isChanged ? (bookData.visibility=="private" || bookData.visibility=="public" && loadedBook.data?.visibility=="public" ? t["Save"] : t["Publish"]) : t["Saved"]}
              </Button>
            </DialogActions>
          </Dialog>
        </Toolbar>
      </AppBar>
      <div className="w-full h-12 md:h-16"/>
      <Box className={classes.background}/>
      <div className='w-full py-14 bg-white'>
        <div className='flex flex-col md:flex-row justify-center w-full max-w-4xl mx-auto'>
          <div className="md:w-80 ">
            <label htmlFor={`book-cover-upload-button`} style={{display:"flex", justifyContent:"center",alignItems:"center",flexDirection:"column"}}>
              <input
                accept="image/*"
                id={`book-cover-upload-button`}
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
                        aspect={215/300}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
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
                      const storageRef = ref(storage, `images/${user.uid}/books/${router.query.bookId}/cover/${imageId}`);
                      const croppedImage = await getCroppedImg(
                        imageSrc,
                        croppedAreaPixels,
                        0
                      )
                      uploadString(storageRef, croppedImage, 'data_url').then((snapshot) => {
                          getDownloadURL(snapshot.ref).then(async coverURL=>{
                            await updateDoc(doc(db,"users",user.uid,"books",router.query.bookId),{coverURL})
                            setBookData(draft=>{draft.coverURL = coverURL})
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
                          
              {bookData?.coverURL ?
                <div className={clsx("rounded-md", "cursor-pointer",classes.bookCover) }>
                  <img src={bookData?.coverURL} width={215} height={300} className="rounded-md" />
                </div>  : (
                <div className="w-56 h-72 bg-blue-50 flex justify-center items-center rounded-md shadow-md cursor-pointer">
                  <div className='font-bold text-3xl text-slate-400'>表紙</div>
                </div>
              )}
              <Typography variant="subtitle2" color="secondary" sx={{mt:2,cursor:"pointer"}}>本の表紙を変更する</Typography> 
            </label>            
          </div>
          <div className='w-full md:ml-8 px-4 md:px-0 mt-6 md:mt-2'>
            <input 
              type="text" autoFocus 
              value={bookData.name} 
              onChange={e=>{setBookData(draft=>{draft.name=e.target.value ?? ""})}} 
              placeholder="本のタイトル"
              className="mb-4 appearance-none font-bold w-full text-2xl border-solid border-0 border-b-2 border-slate-300 bg-transparent placeholder-slate-400 focus:outline-none hover:bg-blue-50" 
            />
            <TextareaAutosize 
              type="text" autoFocus 
              value={bookData.description} 
              onChange={e=>{setBookData(draft=>{draft.description=e.target.value ?? ""})}} 
              placeholder="本の紹介"
              className="resize rounded-md w-full block text-base border-solid border-0 bg-transparent placeholder-slate-400 focus:outline-none hover:bg-blue-50" 
              minRows={2}
            />            
          </div>
        </div>
      </div>
      <div className="w-full py-14">
        <div className="w-full max-w-4xl mx-auto">
          <Stack direction="row" justifyContent="space-between" alignItems="center" className="mb-6 px-4">
            <div className="font-bold text-4xl">Chapters</div>
            {
              chapters?.length>0 && (<Button onClick={addChapter} disableElevation size="small" className="btn-neumorphic" startIcon={<Add/>}>{t["Add"]}</Button>)
            }
          </Stack>
          {
            loadedBook.data?.chapterOrder?.map(chapId => chapters?.find(c=>c.id==chapId))?.filter(Boolean).map((chapter, chapter_index) => (
              <ChapterItem chapter={chapter} chapter_index={chapter_index} removeChapter={removeChapter(chapter.id)} selectChapter={selectChapter(chapter.id)}/>
            ))
          }
          {chapters?.length==0 && (<>
            <div>
              <Typography variant="h6" sx={{textAlign:"center", my:3,fontWeight:"bold"}} className="text-slate-500">最初のチャプターを作成しよう</Typography>
              <Button onClick={addChapter} color="primary" variant='contained' disableElevation className='font-bold text-white mx-auto block'>新しく作成</Button>
            </div>
          </>)}
        </div>
      </div>
  </>
}

export default Book


const ChapterItem = ({chapter:c,chapter_index, removeChapter, selectChapter})=>{
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorVisibilityEl, setAnchorVisibilityEl] = useState(null);

  return (
    <div className="flex flex-row px-4 py-4 bg-white border border-solid border-slate-200" key={c.id}>
      <div className='font-bold text-2xl text-blue-500'>{String(chapter_index+1).padStart(2,'0')}</div>
      <div className='flex flex-col w-full pl-6'>
        <Stack direction="row" >
          <Typography variant='h6' fontWeight="bold" textAlign="left" onClick={selectChapter} sx={{cursor:"pointer", flexGrow:1}} color={!c.name && "secondary"}>{c.name || "無題のチャプター"}</Typography>
          <Tooltip title="編集する">
          <FaintNeumoIconButton onClick={selectChapter} size="small"><EditOutlined/></FaintNeumoIconButton>
          </Tooltip>
          <FaintNeumoIconButton onClick={e=>{setAnchorEl(e.currentTarget)}} size="small" sx={{ml:1,backgroundColor:"transparent !important"}}><ExpandMore/></FaintNeumoIconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={()=>{setAnchorEl(null)}} MenuListProps={{dense:true}}>
            <DeleteMenuItemWithDialog onDelete={()=>{removeChapter();setAnchorEl(null)}} message={"チャプター「"+(c?.name||"無題のチャプター") +"」を削除しようとしています。\nこの操作は戻すことができません。"} onClose={()=>{setAnchorEl(null)}} />
          </Menu>
        </Stack>
        <Stack direction="row" sx={{justifyContent:"flex-start",alignItems:"center", mt:.8}}>
          <Box onClick={e=>{setAnchorVisibilityEl(e.currentTarget)}} sx={{mr:2,alignItems:"center",justifyContent:"center",display:"flex",cursor:"pointer", border:"1px solid",borderColor: (c.visibility !="private" ? '#3ea8ff': "#d6e3ed"), borderRadius:"3px",padding:".1em .35em"}}>
            <Typography  fontSize="11px" fontWeight='bold' color={c.visibility != "private" ? "primary" : 'secondary'}>{c.visibility == "private" ? "非公開": (!c.premium ? "無料公開" : "購入者のみに公開")}</Typography>
          </Box>
          <Menu anchorEl={anchorVisibilityEl} open={Boolean(anchorVisibilityEl)} onClose={()=>{setAnchorVisibilityEl(null)}} MenuListProps={{dense:true}}>
            {c.visibility !="free" && <MenuItem onClick={async ()=>{await updateDoc(doc(db, "users", c.uid,"books",router.query.bookId,'chapters',c.id),{visibility: "public",premium:false}); setAnchorVisibilityEl(null);}}>無料公開に変更する</MenuItem>}
            {c.visibility !="premium" && <MenuItem onClick={async ()=>{await updateDoc(doc(db, "users", c.uid,"books",router.query.bookId,'chapters',c.id),{visibility: "public",premium: true}); setAnchorVisibilityEl(null);}}>購入者のみに公開する</MenuItem>}
            {c.visibility !="private" && <MenuItem onClick={async ()=>{await updateDoc(doc(db, "users", c.uid,"books",router.query.bookId,'chapters',c.id),{visibility: "private" }); setAnchorVisibilityEl(null);}}>非公開にする</MenuItem>}
          </Menu>          
          <Typography  variant="caption" sx={{color:"#6e7b85"}}>{formatDateDiff(new Date(),c.updatedAt?.toDate()) + (isEqual(c.updatedAt,c.createdAt) ? "に作成":"に更新")}</Typography>
        </Stack>
      </div>            
    </div>
  )
}


