import React,{ useEffect, useRef,useState,useCallback}  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack,Link, CircularProgress, Tab,Avatar, useMediaQuery,Snackbar, IconButton,Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,Slider} from '@mui/material'
import {CalendarTodayOutlined, Facebook, Twitter, Link as LinkIcon, ExpandMore, FavoriteBorder, Favorite,FormatListBulletedOutlined} from "@mui/icons-material"
import { makeStyles} from '@mui/styles';
import { useRouter } from 'next/router'
import Footer from "../../components/Footer"
import {auth, db} from '../../utils/firebase'
import {doc, getDoc,getDocs,collection, writeBatch,increment, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp} from 'firebase/firestore';
import Layout from "../../components/layout"
import Checkout from "../../components/Checkout"
import {format} from "date-fns";
import {useWallet } from '../../hooks';
import tocbot from 'tocbot'

import { user$ } from '../../hooks/usePvLoop';
import { useObservable } from "../../../hooks/useObservable";
import { collectionData, docData } from 'rxfire/firestore';
import {  filter, mergeMap, of} from 'rxjs';
import { authState } from 'rxfire/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import clsx from 'clsx';

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
  shadowBox:{
    backgroundColor:"white",
    boxShadow:"0 2px 4px #4385bb12",
    [theme.breakpoints.up('md')]: {
      borderRadius:"12px",
    }
  },
  textLink:{
    textDecoration: "none",textUnderlineOffset: "0.15em",transition: ".25s",color:"#0f83fd","&:hover":{textDecoration:"underline"}
  },
  asideBox: {
    [theme.breakpoints.down('md')]: {
      display: "none",
      overflow: "hidden",
      width:0
    }
  },
  tocBox :{
    fontSize: "14px",
    lineHeight: "1.5",
    "& ol":{
      position:"relative",
      "padding": "0",
      "listStyle": "none"
    },
    "& li":{
      "position": "relative",
      "fontWeight": "700",
      "marginTop": "5px",
      "paddingLeft": "21px",
    },
    "& a.toc-link":{
      "height":"100%","textDecoration":"none","color":"#6e7b85","position":"relative","margin":"8px 0","transition":"none","overflow":"hidden","display":"block","WebkitBoxOrient":"vertical","WebkitLineClamp":"2","maxHeight":"3.05em","textUnderlineOffset":"0.15em",
      "&:hover,&.active":{
        color:"black"
      }
    },
    "& li.is-active-li a.toc-link":{
      "color":"black"
    },
    "& ol li.toc-list-item::before":{"left":"0","top":"4px","width":"12px","height":"12px","background":"#f9b0b0","border":"2px solid #fff","content":'""',"position":"absolute","borderRadius":"50%"},
    "& ol li.is-active-li.toc-list-item::before":{background:"#3ea8ff",border:"2px solid #e5f2ff"},
    "& a.toc-link::before":{display:"none"}
  },
  faintNeumoButton: {
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    color: "#b3b3b3",
    backgroundColor: "#f1f4f9",
    border: "none",
    "&:hover":{
      backgroundColor: "#fff2f2",
      color: "#ec407a"
    },
    "& .MuiOutlinedInput-notchedOutline": {border:"none"}
  },  
  favoritedButton: {
    color: "#f76685",
    backgroundColor: "#ffeaf4",
    border: "none",
    "& .MuiOutlinedInput-notchedOutline": {border:"none"}
  }, 
  faintNeumoBlackButton: {
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    color: "#b3b3b3",
    backgroundColor: "#f1f4f9",
    border: "none",
    "&:hover":{
      backgroundColor: "#fff2f2",
      color: "#000000d1"
    },
    "& .MuiOutlinedInput-notchedOutline": {border:"none"}
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
}),
);


const BookCover = ({book,user}) => {
  const classes = useStyles();
  const router = useRouter()
  const [heartDiff, setHeartDiff] = useState(0);
  const [followerDiff, setFollowerDiff] = useState(0);
  const [currentUser] = useAuthState(auth);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const followedUser = useObservable("following"+currentUser?.uid, docData(doc(db,"followers",user.uid)));
  const purchases = useObservable('purchases'+ currentUser?.uid, authState(auth).pipe( 
    mergeMap(user => user ? collectionData(collection(db,'users/'+user.uid+'/purchases'),{idField: 'id'}) : of([]))
  ))
  const isPurchased = purchases.data?.map(p=>p.itemId).includes(book.id)

  const isFollowing = followedUser.status="success" && followedUser.data?.users?.includes(currentUser?.uid);
  const follow = async () => {
    if(!followedUser.data?.users){
      await setDoc(doc(db,"followers",user.uid),{users: [currentUser?.uid]})
    }else{
      await updateDoc(doc(db,"followers",user.uid),{users: arrayUnion(currentUser?.uid)})
    }
    setFollowerDiff(followerDiff+1)
  }
  const unfollow = async () => {
    await updateDoc(doc(db,"followers",user.uid),{users: arrayRemove(currentUser?.uid)})
    setFollowerDiff(followerDiff-1)
  }

  const heart = useObservable('/books/'+book.id+'/heart'+currentUser?.uid, user$.pipe(
    filter(Boolean),
    mergeMap(currentUser => docData(doc(db,'users',user.uid,'books',book.id,'hearts',currentUser.uid))))
  ) 
  const addHeart = useCallback(async () => {
    const uid = currentUser?.uid
    if(!uid) return
    const batch = writeBatch(db);
    batch.update(doc(db,`users/${user.uid}/books/${book.id}`),{heartCount:increment(1)})
    batch.update(doc(db,`users/${user.uid}`),{bookHeartCount:increment(1)})
    batch.set(doc(db,`users/${user.uid}/books/${book.id}/hearts/${uid}`),{uid})
    batch.set(doc(db, `users/${uid}/favorites/${book.id}`),{bookId:book.id,type:"book",authorId:user.uid, timestamp: serverTimestamp()})
    await batch.commit()
    setHeartDiff(prev=>prev+1);
  },[book.id, currentUser])

  const removeHeart = useCallback(async () => {
    const uid = currentUser?.uid
    if(!uid) return
    const batch = writeBatch(db);
    batch.update(doc(db,`users/${user.uid}/books/${book.id}`),{heartCount:increment(-1)})
    batch.update(doc(db,`users/${user.uid}`),{bookHeartCount:increment(-1)})
    batch.delete(doc(db,`users/${user.uid}/books/${book.id}/hearts/${uid}`))
    batch.delete(doc(db,`users/${uid}/favorites/${book.id}`))
    await batch.commit()
    setHeartDiff(prev=>prev-1);
  },[book.id,currentUser])


  useEffect(() => {
    tocbot.init({
      tocSelector: '.toc',
      contentSelector: '.book',
      headingSelector: 'H5.plateH1, H6.plateH2',
      collapseDepth: 6,
    })
    return () => tocbot.destroy()
  }, [])


  return <Layout>
    <div className='w-full'>
      {
        book && 
          <div className='md:flex justify-between w-full max-w-7xl mx-auto md:mt-10'>
            <div className="md:px-10 pb-10 md:mb-10 w-full">
              <div className='md:flex md:flex-row'>
                <div className='md:hidden border-solid border-0 border-t border-slate-100 flex flex-row items-center px-3 py-2'>
                  <Avatar src={user?.photoURL} onClick={()=>{router.push(`/${user.userId}`)}} className="w-8 h-8 border border-slate-100">
                    {user?.displayName[0]}
                  </Avatar> 
                  <div onClick={()=>{router.push(`/${user.userId}`)}} className="cursor-pointer ml-2 text-sm flex-grow font-bold">{user?.displayName}</div>
                  {book.chapters.filter(chap=>chap.visibility!="private").length==0 ? 
                    <Button variant='contained' color="primary" size="small" className='font-bold md:w-full md:mb-5 text-white' disabled>この本はご利用できません</Button> :
                    ( 
                      book.premium && !isPurchased && currentUser?.uid != user?.uid ? 
                        <Checkout item={book} size="small"/> : 
                        <Button onClick={()=>{router.push(`/${router.query.userId}/books/${book.id}/chapters/${book.chapterOrder[0]}`)}} variant='contained' color="primary" size="small" disableElevation className="font-bold text-white">今すぐ読む</Button>
                    )
                  }            
                  {heart.status=="success" && 
                    (heart.data ? <IconButton onClick={removeHeart} className={clsx(classes.favoritedButton, "ml-2")} ><Favorite sx={{width:"24px", height:"24px"}}/></IconButton>
                    : <IconButton onClick={addHeart} className={clsx(classes.faintNeumoButton, "ml-2")}><FavoriteBorder sx={{width:"24px", height:"24px"}}/></IconButton>)
                  }
                </div>
                <div className='w-full md:w-fit bg-slate-100 md:bg-transparent py-6 md:py-0'>
                  { book?.coverURL ? <div className="rounded-md cursor-pointer book-cover w-[160px] h-[224px] md:w-[215px] md:h-[300px] mx-auto md:mx-0">
                      <img src={book?.coverURL} className="object-cover rounded w-[160px] h-[224px] md:w-[215px] md:h-[300px]" />
                    </div> : 
                    <div className="bg-blue-50 rounded-md shadow-md cursor-pointer w-[160px] h-[224px] md:w-[215px] md:h-[300px] mx-auto">
                      <div className='flex justify-center items-center w-[160px] h-[224px] md:w-[215px] md:h-[300px]' >
                        <div className='font-bold text-xl text-slate-400'>{book.name}</div>
                      </div>
                    </div>
                  }
                </div>
                <div className='px-3 py-4 md:py-0 md:pl-10 '>
                  <div className='font-bold text-2xl md:text-3xl pt-2 pb-6'>{book?.name || "無題の本"}</div>
                  <div className='text-md prose whitespace-pre-wrap' style={{minHeight:"200px"}}>{book?.description}</div>              
                </div>     
              </div>
              <div className='px-3 md:p-0'>
                <div className="font-bold text-2xl md:text-3xl mt-6 border-solid border-0 border-b border-b-slate-200 py-2">Chapters</div>
                <div className='relative mt-4 mb-10 overflow-hidden'>
                  <div className="border-r-2 border-dashed border-blue-50 absolute h-full top-0 left-1 my-4 -z-10"></div>
                  <ul className="list-none m-0 p-0">
                    {
                      book?.chapterOrder?.map(chapId => book.chapters.find(c=>chapId==c.id)).filter(c=>c && c.visibility != "private").map((chapter,index) => <li key={index} className={`py-2 ${book.premium && !isPurchased && currentUser?.uid != user?.uid && chapter.premium && "cursor-default pointer-events-none text-slate-500"}`}>
                        <Link href={`/${router.query.userId}/books/${book.id}/chapters/${chapter.id}`} className={`no-underline hover:no-underline text-black ${book.premium && !isPurchased && currentUser?.uid != user?.uid && chapter.premium && "text-slate-500"}`}>
                          <div className="flex flex-row items-center">
                            <div className="bg-blue-500 rounded-full h-3 w-3 border-solid border-3 border-blue-50 mr-4"></div>
                            <div className='text-blue-500 text-sm font-bold'>Chapter {String(index+1).padStart(2,'0')}</div>
                            {book.premium && chapter.visibility=="public" && !chapter.premium && <div className='ml-2 bg-blue-500 text-xs font-bold text-white px-2 py-0.5 rounded-md'>無料公開</div>}
                          </div>
                          <div className="font-bold text-xl hover:text-blue-500 ml-7 py-1">{chapter.name || "無題のチャプター"}</div>
                        </Link>
                      </li>)
                    }
                  </ul>
                </div>
              </div>
              <div className='px-3 md:p-0'>
                <div className="font-bold text-2xl md:text-3xl my-6 border-solid border-0 border-b border-b-slate-200 py-2">Author</div>
                <div className='flex'>
                  <Avatar src={user?.photoURL} sx={{width:"60px",height:"60px",mr:2,cursor:"pointer"}} onClick={()=>{router.push(`/${user.userId}`)}}>
                    {user?.displayName[0]}
                  </Avatar> 
                  <div className='w-full'>
                    <div className='flex flex-row justify-between w-full md:w-fit'>
                      <Typography variant='h6' onClick={()=>{router.push(`/${user.userId}`)}} sx={{cursor:"pointer", mr:4}}>{user?.displayName}</Typography>
                      {isFollowing ? <Button className='font-bold text-white' variant="contained" onClick={unfollow} disableElevation size="small">フォロー中</Button> : <Button variant="outlined" onClick={follow} size="small">フォローする</Button>}
                    </div>
                    {user?.description  && <Typography variant="body1" sx={{my:1}}>{user?.description}</Typography>}
                    <Stack direction="row" spacing={1.5}>
                      {user?.twitterUserName && <a href={"https://twitter.com/"+user?.twitterUserName} target="_blank" style={{color:"#93a5b1"}}><Twitter sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                      {user?.facebookUserName && <a href={"https://facebook.com/"+user?.facebookUserName} target="_blank" style={{color:"#93a5b1"}}><Facebook sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                      {user?.url && <a href={user?.url} target="_blank" style={{color:"#93a5b1"}}><LinkIcon sx={{"&:hover":{color:"#000000d1"}}}/></a>}                      
                    </Stack>
                  </div>
                </div>
              </div>
            </div>
            <aside className="px-3 md:px-0 w-full md:w-[310px]"> 
              <Stack spacing={3} position="sticky" sx={{top:"30px",maxHeight: "calc(100vh - 50px)",height:"100%" }}>
                <div className='border border-slate-200 border-solid rounded-lg mx-auto w-full md:w-[310px] p-5'>
                  {book.chapters.filter(chap=>chap.visibility!="private").length==0 ? 
                    <Button  variant='contained' color="primary" size="large" className='font-bold w-full mb-5 text-white' disabled>この本はご利用できません</Button> :
                    ( 
                      book.premium && !isPurchased && currentUser?.uid != user?.uid ? 
                        <Checkout item={book} fullWidth={!isUpMd} size={isUpMd ? "large": "medium"}/> : 
                        <Button onClick={()=>{router.push(`/${router.query.userId}/books/${book.id}/chapters/${book.chapterOrder[0]}`)}} variant='contained' color="primary" size="large" disableElevation className='font-bold w-full mb-5 text-white'>今すぐ読む</Button>
                    )
                  }
                  {
                    currentUser?.uid == user?.uid  && <Button onClick={()=>{router.push(`/books/${book.id}`)}} variant='contained' disableElevation color="primary" size="large" className='font-bold w-full mb-5 btn-neumorphic rounded-md py-2'>本を編集する</Button>
                  }
                  <div className='pt-6 pb-4'>
                    <div className='text-sm flex items-center'>
                      <CalendarTodayOutlined size="small" className='text-slate-400 mr-1'/> 
                      <span className='text-slate-600 '>最終更新日</span>
                      <div className='flex-grow'></div>
                      <span>{format(new Date(book.updatedAt? book.updatedAt?.seconds*1000 : book.createdAt?.seconds * 1000),"yyyy.MM.dd")}</span>
                    </div>
                    <div className='text-sm flex items-center mt-3'>
                      <FormatListBulletedOutlined size="small" className='text-slate-400 mr-1'/> 
                      <span className='text-slate-600 '>チャプターの数</span>
                      <div className='flex-grow'></div>
                      <span>{book.chapterOrder?.length || 0}</span>
                    </div>                  
                  </div>
                  {user?.description && <Typography variant="body1" sx={{mt:2}}>{user?.description}</Typography>}
                  <Stack direction="row" justifyContent="center" mt={3}>
                    <Stack direction="row" >
                      {heart.status=="success" && 
                        (heart.data ? <IconButton onClick={removeHeart} className={classes.favoritedButton} ><Favorite sx={{width:"24px", height:"24px"}}/></IconButton>
                        : <IconButton onClick={addHeart} className={classes.faintNeumoButton}><FavoriteBorder sx={{width:"24px", height:"24px"}}/></IconButton>)
                      }
                      <Typography variant="subtitle1" sx={{margin:"auto 0px auto 8px"}} color="secondary">{book.heartCount +heartDiff}</Typography>
                    </Stack>
                    <div style={{flexGrow:1}}/>
                    <IconButton className="bg-transparent ml-0.5 text-slate-400 hover:text-black" ><ExpandMore/></IconButton>
                    <a href={`https://twitter.com/intent/tweet?url=${typeof window !== 'undefined' &&  window.location.href}&text=${encodeURIComponent(book?.name + " | " + book?.displayName)}`} data-size="large"><IconButton className="bg-transparent ml-0.5 text-slate-400 hover:text-black" ><Twitter/></IconButton></a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== 'undefined' &&  window.location.href}`} target="_blank" data-size="large"><IconButton className="bg-transparent ml-0.5 text-slate-400 hover:text-black" ><Facebook/></IconButton></a>
                  </Stack>                
                </div>
              </Stack>
            </aside>
          </div>  
      }
      <Footer/>
    </div>
  </Layout>
}


export default BookCover;

export const getStaticPaths= async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};



export const getStaticProps = async (ctx) => {
  const { userId,bookId } = ctx.params
  const convertTimestampToJson = (data)=>{
    const newData = {...data}
    if(data?.updatedAt){
      newData.updatedAt = data.updatedAt.toJSON()
    }
    if(data?.createdAt){
      newData.createdAt = data.createdAt.toJSON()
    }
    return newData
  }
  const uidSnap = await getDoc(doc(db,'userIds',userId))
  const uid = uidSnap.data().uid
  const userSnap = await getDoc(doc(db,'users',uid))
  const user = {...convertTimestampToJson(userSnap.data()),uid}
  const bookSnap = await getDoc(doc(db,'users',uid,'books',bookId))
  const book = {...convertTimestampToJson(bookSnap.data()),id:bookId, chapters:[]}
  const chaptersSnap = await getDocs(collection(db,'users',uid,'books',bookId,'chapters'))
  chaptersSnap.forEach((chapterSnap)=>{
    const chapter = convertTimestampToJson(chapterSnap.data())
    book.chapters.push({...chapter,id:chapterSnap.id})
  })
  return {
    props: {user,book},
    revalidate: 1
  }
}

