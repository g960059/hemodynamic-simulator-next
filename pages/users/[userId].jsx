import React,{ useEffect, useRef,useState,useCallback}  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack, Tab,Avatar, useMediaQuery,NoSsr} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';
import {Twitter,Facebook, Link as LinkIcon,FavoriteBorder} from "@mui/icons-material"
import { useRouter } from 'next/router'
import Footer from "../../src/components/Footer"
import {auth,db} from '../../src/utils/firebase'
import {useObservable} from "reactfire"
import {collection,doc, updateDoc,serverTimestamp,writeBatch,deleteDoc, setDoc, getDoc, getDocs, arrayUnion, arrayRemove, where,} from 'firebase/firestore';
import Layout from "../../src/components/layout"
import { collectionData, docData } from 'rxfire/firestore';
import { filter, map, mergeMap, of, tap } from 'rxjs';
import Image from 'next/image'
import { formatDateDiff } from '../../src/utils/utils';
import { user$ } from '../../src/hooks/usePvLoop';
import clsx from 'clsx';
import { query } from 'firebase/database';
import { useAuthState} from 'react-firebase-hooks/auth';
import {useDocumentData} from "react-firebase-hooks/firestore"
import Background from '../../src/elements/Background';
import Link from 'next/link';


function UserSummary(){
  const router = useRouter()


  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  // const [user, setUser] = useState();
  const [canvas, setCanvas] = useState();

  const [followerDiff, setFollowerDiff] = useState(0);
  const [currentUser] = useAuthState(auth)
  const uid$ = of(router.query.userId).pipe(
    filter(Boolean),
    mergeMap(userId=> docData(doc(db,'userIds',userId))),
    map(user => user.uid)
  );
  const {data:uid} = useObservable(`uid_${router.query.userId}`, uid$);
  const {data:followers} = useObservable(`followedUser_${router.query.userId}`,uid$.pipe(
    filter(Boolean),
    mergeMap(uid=>docData(doc(db,'followers',uid))),
    map(followers => followers.users)
  ));
  const {data:user} = useObservable(`user_${router.query.userId}`,uid$.pipe(
    filter(Boolean),
    mergeMap(uid=>docData(doc(db,'users',uid))),
  ));
  const isFollowing = followers?.includes(auth.currentUser?.uid);
  const follow = async () => {
    if(!followers){
      await setDoc(doc(db,"followers",uid),{users: [auth.currentUser?.uid]})
    }else{
      await updateDoc(doc(db,"followers",uid),{users: arrayUnion(auth.currentUser?.uid)})
    }
    setFollowerDiff(followerDiff+1)
  }
  const unfollow = async () => {
    await updateDoc(doc(db,"followers",uid),{users: arrayRemove(auth.currentUser?.uid)})
    setFollowerDiff(followerDiff-1)
  }

  useEffect(() => {
    (async ()=>{
      if(uid){
        const loadedCanvas = []
        const loadedCanvasSnap = await getDocs(query(collection(db,"canvas"),where("visibility","!=","private")));
        loadedCanvasSnap.forEach(async (caseSnap) => {
          loadedCanvas.push({...caseSnap.data(),id:caseSnap.id})
        })
        setCanvas(loadedCanvas)       
      }
    })()
  }, [uid]);



  return <>
    {
      user && <>
        <Stack width={1} justifyContent="center" alignItems="center" className='bg-white'>
          <NoSsr>
            <Stack className='w-full max-w-6xl mx-auto' direction={isUpMd ?"row" : "column"} pt={isUpMd?8:4} pb={isUpMd?4:1} px={isUpMd?10:2} spacing={3}>
              <Avatar src={user?.photoURL} sx={{width:"100px",height:"100px"}}>
                {user?.displayName[0]}
              </Avatar>
              <Stack flexGrow={1} spacing={1}>
                <Stack direction="row" >
                  <Typography variant="h5" fontWeight="bold">{user?.displayName}</Typography>
                  <div style={{flexGrow:1}}/>
                  {user.uid === currentUser?.uid ? <Button onClick={()=>{router.push(`/settings/profile`)}} className="btn-neumorphic">プロフィールを編集</Button> : (isFollowing ? <Button variant="contained" onClick={unfollow} className="text-white font-bold" disableElevation size="small">フォロー中</Button> : <Button variant="outlined" onClick={follow} size="small">フォローする</Button>)}
                </Stack>
                {user?.description && <Typography variant="body1">{user?.description}</Typography>}
                <Stack direction="row" spacing={2}>
                  {user?.caseHeartCount+user?.articleHeartCount >0 && <Box display="flex" alignItems="center"> 
                      <Typography variant="subtitle1" sx={{fontWeight:"bold",mr:.5}}>{user?.caseHeartCount+user?.articleHeartCount}</Typography>
                      <Typography variant="body2" color="secondary">Likes</Typography>
                    </Box>
                  }
                  {followers?.length+followerDiff >0 && <Box display="flex" alignItems="center">
                    <Typography variant="subtitle1" sx={{fontWeight:"bold",mr:.5}}>{followers?.length+followerDiff}</Typography>
                    <Typography variant="body2" color="secondary">Followers</Typography>
                  </Box> }
                </Stack>
                <Stack direction="row" spacing={isUpMd ? 2 :1.5}>
                  {user?.twitterUserName && <a href={"https://twitter.com/"+user?.twitterUserName} target="_blank" style={{color:"#93a5b1"}}><Twitter sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                  {user?.facebookUserName && <a href={"https://facebook.com/"+user?.facebookUserName} target="_blank" style={{color:"#93a5b1"}}><Facebook sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                  {user?.url && <a href={user?.url} target="_blank" style={{color:"#93a5b1"}}><LinkIcon sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                </Stack>
              </Stack>
            </Stack>
          </NoSsr>
        </Stack>
        <div className='max-w-4xl w-full mx-auto py-4 md:py-6 px-4 min-h-[440px]'>
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            {
              canvas?.map(c=><CanvasItem canvas={c}/>)
            }
          </div>         
        </div>    
      </>
    }
    <Footer/>   
    <Background/>
  </>
}

export const CanvasItem = ({canvas}) => {
  const router = useRouter()
  return (
    <div key={canvas?.id} onClick={(e)=>{e.preventDefault();e.stopPropagation();router.push({pathname:`/canvas/${canvas?.id}`})}}  className="w-full flex flex-col py-3 px-4 bg-white cursor-pointer border border-solid border-slate-200 rounded-md overflow-hidden hover:shadow transition">
      <div className='flex flex-row items-center'>
        {canvas?.photoURL ?
          <div className="h-8 w-8 rounded-full overflow-hidden" onClick={(e)=>{e.stopPropagation(); router.push(`/users/${canvas.userId}`)}}>
            <Image src={canvas?.photoURL} height="32" width="32" alt="userPhoto"/>
          </div> :
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={(e)=>{e.stopPropagation();router.push(`/users/${canvas.userId}`)}}>
            <span className="text-xs font-medium leading-none text-white">{canvas?.displayName[0]}</span>
          </div>
        }
        <div className='ml-2 text-slate-500' >
          <div onClick={(e)=>{e.stopPropagation(); router.push(`/users/${canvas.userId}`)}} className='text-sm font-medium no-underline hover:underline text-slate-500'>
              {canvas?.displayName}
          </div>
          <div className='flex flex-row items-center justify-between'>
            <span className='text-sm font-medium '>{ formatDateDiff(new Date(), new Date(canvas?.updatedAt?.seconds * 1000)) } </span>
          </div>
        </div>
      </div>
      <div className='ml-10 mt-2' >
        <div onClick={(e)=>{e.preventDefault();e.stopPropagation();router.push({pathname:`/canvas/${canvas?.id}`})}} className='font-bold text-xl text-slate-800 no-underline hover:underline'>
            {canvas?.name || "Untitled"}
        </div>
        <div className='flex flex-row items-center justify-start mt-2'>
          {canvas.tags?.map(tag=><span class="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-slate-100 text-slate-800">{tag}</span>)}
        </div>
      </div>
      <div className='ml-10 mt-2'>
        <span className='text-sm flex flex-row items-center justify-start text-slate-500'>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className='text-sm ml-0.5'>{canvas?.heartCount || 0}</span>
        </span>
      </div>
    </div>
  )
}

UserSummary.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}




export default UserSummary;


// const useStyles = makeStyles((theme) =>({

//   bookCover: {
//     boxShadow: "-6px 6px 10px -2px #001b4440, 0 0 3px #8f9aaf1a",
//     position: "relative",
//     maxWidth: "100%",
//     width: "100px",
//     height: "140px",
//     "&::after": {
//       bottom: 0,
//       content: '""',
//       height: "100%",
//       left: "0",
//       position: "absolute",
//       width: "100%",
//       borderRadius: "5px",
//       background: "linear-gradient(-90deg,#fff0,#ffffff1a 80%,#ffffff4d 95%,#fff6 96.5%,#cbcbcb14 98%,#6a6a6a1a)",
//     }
//   }
// }),
// );