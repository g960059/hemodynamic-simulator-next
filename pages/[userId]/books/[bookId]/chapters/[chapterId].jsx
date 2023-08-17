import React,{ useEffect, useRef,useState,useCallback}  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack,Link, CircularProgress, Tab,Avatar, useMediaQuery,Snackbar, IconButton,Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,Slider} from '@mui/material'
import {Facebook, Twitter, Link as LinkIcon, FavoriteBorderOutlined, ExpandMore, FavoriteBorder, Favorite, ChevronLeftOutlined, ChevronRightOutlined} from "@mui/icons-material"
import { makeStyles} from '@mui/styles';
import { useRouter } from 'next/router'
import {auth,db} from '../../../../../src/utils/firebase'
import {doc, getDoc,writeBatch,increment, setDoc, updateDoc, arrayUnion, arrayRemove, getDocs, collection} from 'firebase/firestore';
import Layout from "../../../../../src/components/layout"
import {format} from "date-fns";
import {TwitterTweetEmbed } from 'react-twitter-embed';
import tocbot from 'tocbot'
import clsx from 'clsx';
import { user$ } from '../../../../../src/hooks/usePvLoop';
import { useObservable } from 'reactfire';
import { collectionData, docData } from 'rxfire/firestore';
import {mergeMap, of} from 'rxjs';
import Image from 'next/image';
import { useTranslation } from '../../../../../src/hooks/useTranslation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { authState } from 'rxfire/auth';

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
  textLink:{
    textDecoration: "none",textUnderlineOffset: "0.15em",transition: ".25s",color:"#0f83fd","&:hover":{textDecoration:"underline"}
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
    width: "70px",
    height: "98px",
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


const ChapterReader = ({user,book,chapter, chapters}) => {
  const classes = useStyles();
  const router = useRouter()
  const t = useTranslation()
  const [heartDiff, setHeartDiff] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentUser] = useAuthState(auth);
  const purchases = useObservable('purchases'+ currentUser?.uid, authState(auth).pipe( 
    mergeMap(user => user ? collectionData(collection(db,'users/'+user.uid+'/purchases'),{idField: 'id'}) : of([]))
  ))
  const isPurchased = purchases.data?.map(p=>p.itemId).includes(book.id)
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const heart = useObservable('/books/'+book.id+'/heart', user$.pipe(
    mergeMap(currentUser => currentUser ? docData(doc(db,'users',user.uid,'books',book.id,'hearts',currentUser?.uid)) : of(false) ))
  ) 
  
  const addHeart = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if(!uid) return
    const batch = writeBatch(db);
    batch.update(doc(db,`users/${user.uid}/books/${book.id}`),{heartCount:increment(1)})
    batch.update(doc(db,`users/${user.uid}`),{bookHeartCount:increment(1)})
    batch.set(doc(db,`users/${user.uid}/books/${book.id}/hearts/${uid}`),{uid})
    await batch.commit()
    setHeartDiff(prev=>prev+1);
  },[book.id])

  const removeHeart = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if(!uid) return
    const batch = writeBatch(db);
    batch.update(doc(db,`users/${user.uid}/books/${book.id}`),{heartCount:increment(-1)})
    batch.update(doc(db,`users/${user.uid}`),{bookHeartCount:increment(-1)})
    batch.delete(doc(db,`users/${user.uid}/books/${book.id}/hearts/${uid}`))
    await batch.commit()
    setHeartDiff(prev=>prev-1);
  },[book.id])

  useEffect(() => {
    tocbot.init({
      tocSelector: '.toc',
      contentSelector: '.chapter',
      headingSelector: 'H5.plateH1, H6.plateH2',
      collapseDepth: 6,
    })
    return () => tocbot.destroy()
  }, [])

  const currentChapIndex= book?.chapterOrder?.findIndex(chapId => chapId === chapter.id)

  return <div className='h-screen w-full'>
    {
      chapter && <>
        <div className='fixed md:hidden w-full flex items-center justify-between bg-white px-4 h-14'>
          <div className='cursor-pointer' onClick={()=>{setShowSidebar(true)}}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <Link href={`/${user.userId}/books/${book.id}`}  className="text-sm font-bold flex items-center text-slate-600 no-underline hover:no-underline ">{book.name}</Link>
          <div></div>
        </div>
        <div className='relative'>
          {<div className={`fixed inset-0 z-10 bg-black opacity-50 md:hidden ${!showSidebar && "hidden"}`} onClick={()=>{setShowSidebar(false)}}/>}
          <aside className={`bg-white fixed w-[22rem] md:w-[23rem] top-0 left-0 px-6 border-0 border-solid border-r border-slate-200 h-screen ease-in-out duration-300 z-50 md:block`} style={ {transform: (isUpMd || showSidebar ? "translateX(0%)": "translateX(-100%)") }}> 
            <div className='flex flex-row items-center'>
              <Link href={`/${user.userId}/books/${book.id}`}  className="h-14 font-[GT Haptik Regular] font-bold flex flex-row items-center flex-grow cursor-pointer border-0 border-b border-solid border-b-slate-200 text-slate-800 no-underline hover:no-underline">
                <Image src="/HeaderIcon.png" width={32} height={32} alt="HeaderIcon"/>
                <Typography variant="h5" noWrap fontWeight="bold" >
                  {t['Title']}
                </Typography>
              </Link>
              <div onClick={()=>{setShowSidebar(false)}} className='text-slate-500 hover:bg-slate-100 transition-all duration-200 cursor-pointer md:hidden overflow-hidden rounded-full h-10 w-10 flex justify-center items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>

            <div className='h-[calc(100vh-120px)] overflow-y-scroll'>
              {/* <Link href={`/${user.userId}/books/${book.id}`}  className="font-bold mt-4 flex items-center text-slate-400 no-underline hover:no-underline hover:text-blue-500">
                <ChevronLeftOutlined/>
                本のタイトルに戻る
              </Link> */}
              <div className="flex flex-row pb-3 pt-6">
                { book?.coverURL ? 
                  <div className={clsx("rounded-md", "cursor-pointer","hover:opacity-80",classes.bookCover)} onClick={()=>{router.push(`/${user.userId}/books/${book.id}`)}}>
                    <img src={book?.coverURL} width={70} height={98} className="object-cover rounded"/>
                  </div> : 
                  <div className={clsx("bg-blue-50 rounded-md shadow-md cursor-pointer hover:opacity-80",classes.bookCover)} onClick={()=>{router.push(`/${user.userId}/books/${book.id}`)}}>
                    <div className='flex justify-center items-center w-full h-full' style={{width:"70px"}}>
                      <div className='font-bold text-xl text-slate-400'>{book.name}</div>
                    </div>
                  </div>
                }
                <div className='pl-4 flex flex-col justify-between'>
                  <div className="font-bold text-md pointer hover:text-blue-500 cursor-pointer" onClick={()=>{router.push(`/${user.userId}/books/${book.id}`)}}>{book?.name}</div>
                  <Stack direction="row" >
                    {heart.status=="success" && 
                      (heart.data ? <IconButton onClick={removeHeart} className={classes.favoritedButton} ><Favorite className='w-7 h-7'/></IconButton>
                      : <IconButton onClick={addHeart} className={classes.faintNeumoButton}><FavoriteBorder className='w-7 h-7'/></IconButton>)
                    }
                    <Typography variant="subtitle1" sx={{margin:"auto 0px auto 8px"}} color="secondary">{book.heartCount +heartDiff}</Typography>
                  </Stack>                
                </div>
              </div>
              <div>
                {book.chapterOrder.map(chapId => chapters.find(({id})=>id==chapId)).map((chap,chapIndex) =>(
                  <div key={chapIndex} className='py-2'>
                    <Link href={`/${user.userId}/books/${book.id}/chapters/${chap.id}`} className="text-slate-400 font-bold text-sm no-underline hover:no-underline ">
                      <span className={`${chap.id===chapter.id && "text-blue-500"}`}>{String(chapIndex+1).padStart(2,'0')}</span>
                      <span className={`hover:text-slate-800 pl-2 ${chap.id===chapter.id && "text-slate-800"}`}>{chap.name}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <div className='h-16 flex flex-row items-center border-0 border-solid border-t border-t-slate-200'>
              {/* <Avatar src={user?.photoURL} onClick={()=>{router.push(`/${user.userId}`)}} className="h-8 w-8 cursor-pointer">
                {user?.displayName[0]}
              </Avatar> 
              <Stack className='ml-3'>
                <Stack direction="row" justifyContent="space-between">
                  <div onClick={()=>{router.push(`/${user.userId}`)}} className="text-lg cursor-pointer">{user?.displayName}</div>
                </Stack>
                {user?.description  && <Typography variant="body1" sx={{my:1}}>{user?.description}</Typography>}
                <Stack direction="row" spacing={isUpMd ? 1.5 :1.5}>
                  {user?.twitterUserName && <a href={"https://twitter.com/"+user?.twitterUserName} target="_blank" style={{color:"#93a5b1"}}><Twitter sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                  {user?.facebookUserName && <a href={"https://facebook.com/"+user?.facebookUserName} target="_blank" style={{color:"#93a5b1"}}><Facebook sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                  {user?.url && <a href={user?.url} target="_blank" style={{color:"#93a5b1"}}><LinkIcon sx={{"&:hover":{color:"#000000d1"}}}/></a>}                      
                </Stack>
              </Stack> */}
              <Link href={`/${user.userId}/books/${book.id}`}  className="font-bold flex items-center text-slate-400 no-underline hover:no-underline hover:text-blue-500">
                <ChevronLeftOutlined/>
                本のタイトルに戻る
              </Link>              
            </div>
          </aside>
        </div>
        <section className={`pl-0 md:pl-[23rem] pt-14 md:pt-0 h-screen`}>
          <header className='bg-slate-100 py-9'>
            <div className="px-7 max-w-4xl mx-auto">
              <div className="font-bold text-slate-400 text-md">Chapter {String(currentChapIndex+1).padStart(2,'0')}</div>
              <div className="font-bold text-3xl my-4">{chapter?.name}</div>
              <div className='flex flex-row'>
                <Avatar src={user?.photoURL} onClick={()=>{router.push(`/${user.userId}`)}} className="w-7 h-7 mr-3 cursor-pointer">
                  {user?.displayName[0]}
                </Avatar> 
                <Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <div className="text-sm hover:underline cursor-pointer" onClick={()=>{router.push(`/${user.userId}`)}}>{user?.displayName}</div>
                  </Stack>
                </Stack>
              </div>
            </div>
          </header>
          <div className="chapter px-7 py-10 max-w-4xl mx-auto prose whitespace-pre-wrap">
            {
              book.premium && !isPurchased && currentUser?.uid != user?.uid && chapter.premium ? 
              <div className='w-full flex flex-col items-center justify-center py-8'>
                <div className='text-lg text-slate-500 font-bold mb-8'>このチャプターを読むためには本を購入する必要があります</div>
                <Button variant="contained" size="large" onClick={()=>{router.push(`/${user.userId}/books/${book.id}`)}} className="font-bold text-white">購入ページへ</Button>
              </div>
              : chapter?.body.map(n=>serialize(n)) 
            }
            <div className="flex flex-col md:flex-row justify-between items-center mt-16 space-y-3">
              {currentChapIndex >0 && <Link href={`/${user.userId}/books/${book.id}/chapters/${book?.chapterOrder[currentChapIndex-1]}`} className='px-5 pt-2 pb-3 btn-neumorphic w-[20rem] cursor-pointer flex flex-row items-center no-underline hover:no-underline'>
                <ChevronLeftOutlined/>
                <div className='pl-4'>
                  <div className="font-bold text-slate-300">prev</div>
                  <div className="text-xl font-bold">{chapters.find(c=>c.id==book?.chapterOrder[currentChapIndex-1])?.name}</div>
                </div>
              </Link>}
              <div className='flex-grow'></div>
              {currentChapIndex+1 < book?.chapterOrder?.length  && <Link href={`/${user.userId}/books/${book.id}/chapters/${book?.chapterOrder[currentChapIndex+1]}`} className='px-5 pt-2 pb-3 btn-neumorphic w-[20rem] cursor-pointer flex flex-row justify-between items-center no-underline hover:no-underline'>
                <div className='pr-4'>
                  <div className="font-bold text-slate-300">next</div>
                  <div className="text-xl font-bold">{chapters.find(c=>c.id==book?.chapterOrder[currentChapIndex+1])?.name}</div>
                </div>
                <ChevronRightOutlined/>
              </Link>}              
            </div>
            {/* <Stack direction="row" justifyContent="center" mt={5}>
              <div style={{flexGrow:1}}/>
              <IconButton className={classes.faintNeumoBlackButton} sx={{backgroundColor:"transparent !important"}}><ExpandMore fontSize='large'/></IconButton>
              <a href={`https://twitter.com/intent/tweet?url=${process.env.NEXT_PUBLIC_HOST+router.asPath}`} data-size="large"><IconButton className={classes.faintNeumoBlackButton} sx={{ml:.5,backgroundColor:"transparent !important"}}><Twitter fontSize='large'/></IconButton></a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${process.env.NEXT_PUBLIC_HOST+router.asPath}`} target="_blank" data-size="large"><IconButton className={classes.faintNeumoBlackButton} sx={{ml:.5,backgroundColor:"transparent !important"}}><Facebook fontSize='large'/></IconButton></a>
            </Stack> */}
          </div>

        </section>        
      </>
    }
  </div>
}

export default ChapterReader;

export const getStaticPaths= async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps = async (ctx) => {
  const { userId,bookId,chapterId } = ctx.params
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
  const [userSnap, bookSnap, chaptersSnap] = await Promise.all([getDoc(doc(db,'users',uid)),getDoc(doc(db,'users',uid,'books',bookId)),getDocs(collection(db,'users',uid,'books',bookId,'chapters')) ])
  const user = {...convertTimestampToJson(userSnap.data()),uid}
  const book = {...convertTimestampToJson(bookSnap.data()),id:bookId}
  const chapters =  chaptersSnap.docs.map(doc => ({...convertTimestampToJson(doc.data()),id:doc.id}))
  console.log({user,book,chapter:chapters.find(c=>c.id==chapterId),chapters})
  return {
    props: {user,book,chapter:chapters.find(c=>c.id==chapterId),chapters},
    revalidate: 1
  }
}

export const serialize = node => {
  if(!Object.prototype.hasOwnProperty.call(node,"type") && Object.prototype.hasOwnProperty.call(node,"text")) {
    let string = node.text
    if (node.bold) {
      string = <strong>{string}</strong>
    }
    if(node.italic){
      string = <em>{string}</em>
    }
    if(node.underline){
      string = <u>{string}</u>
    }
    return string
  }

  const children = node.children?.map(n => serialize(n))

  switch (node.type) {
    case "blockquote":
      return <blockquote style={{fontSize: ".97em",margin: "1.4rem 0",borderLeft: "3px solid #9dacb7", padding: "2px 0 2px .7em",color: "#505c64"}}>{children}</blockquote>
    case 'p':
      return <Typography variant="body1" sx={{lineHeight: 1.9, fontSize: {xs:"16px",md:"17px"}}}>{children}</Typography>
    case 'a':
      return <a href="${escapeHtml(node.url)}" className=" no-underline hover:no-underline underline-offset-2 duration-150">{children}</a>
    case "h2":
      return <Typography fontWeight="bold" id={children} className="plateH2" variant='h6' sx={{mt: "2.3em",mb: "0.5em",fontSize:{xs:"1.3em",md:"1.5em"}}}>{children}</Typography>
    case "h1":
      return <Typography fontWeight="bold" id={children} className="plateH1" variant='h5' sx={{fontSize:{xs:"1.6em",md:" 1.7em"},pb: "0.2em",mb:"1.1rem",mt: "2.3em",borderBottom: "1px solid #5c93bb2b"}}>{children}</Typography>
    case "ul":
      return <ul style={{margin: "1.4rem 0", lineHeight: 1.7}}>{children}</ul>
    case "ol":
      return <ol style={{margin: "0.4rem 0"}}>{children}</ol>
    case "li":
      return <li style={{margin: "0.4rem 0"}}>{children}</li>
    case "img": 
      return <img src={node.url} style={{margin: "1.5rem auto",display:  "table", maxWidth: "100%",height: "auto"}}/>
    case "media_embed":
      const {url, type} = convertURLtoEmbedURL(node.url)
      const querySeparator = url.includes('?') ? '' : '?';
      if(type == "twitter"){
        return <Box sx={{"& .twitter-tweet-rendered":{m:"0 auto"}}}><TwitterTweetEmbed tweetId={url}/></Box>
      }
      return <Box sx={{width:1, position: "relative",height:0, pb: "calc(56.25% + 38px)", m: "1.5rem 0"}}>
        <iframe
          style={{position: "absolute",top: 0,left: 0, width: "100%",height: "100%"}}
          title="embed"
          src={`${url}${querySeparator}&title=0&byline=0&portrait=0`}
          frameBorder="0"
        />
      </Box>
    case "case-embed":
      return <Box sx={{width:1, position: "relative",height:0, pb: {xs:"80%",md:"calc(56.25% + 38px)"}, m: "1.5rem 0"}}>
        <iframe
          style={{position: "absolute",top: 0,left: 0, width: "100%",height: "100%",border:0,borderRadius:8,overflow:"scroll",border:"1px solid #5c93bb2b"}}
          title="embed"
          src={`${node.url}`}
        />
      </Box>
    default:
      return children
  }
}

export const convertURLtoEmbedURL = (originalURL) => {
  let type,url
  const params = new URLSearchParams(originalURL)
  if(originalURL.includes("youtube")){
    const videoId = params.get("v");
    url = `https://www.youtube.com/embed/${videoId}`;
    type = "youtube"
  }
  if(originalURL.includes("vimeo")){
    const videoId = originalURL.split("vimeo.com/")[1];
    url = `https://player.vimeo.com/video/${videoId}?h=5be51048a4`;
    type = "vimeo"
  }
  if(originalURL.includes("twitter")){
    url = originalURL.split("status/")[1];
    type = "twitter"
  }
  return {url,type}
}