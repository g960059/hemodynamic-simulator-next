import React,{ useEffect, useRef,useState,useCallback,Popover}  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack, Tab,Avatar, useMediaQuery,NoSsr, Dialog} from '@mui/material'
import {Twitter,Facebook, Link as LinkIcon,FavoriteBorder} from "@mui/icons-material"
import { useRouter } from 'next/router'
import Footer from "../../src/components/Footer"
import {auth,db} from '../../src/utils/firebase'
import {useObservable} from "reactfire"
import {collection,doc, updateDoc,serverTimestamp,writeBatch,deleteDoc, setDoc, getDoc, getDocs, arrayUnion, arrayRemove, where,} from 'firebase/firestore';
import Layout from "../../src/components/layout"
import { collectionData, docData } from 'rxfire/firestore';
import { filter, map, mergeMap, of, tap,  combineLatest } from 'rxjs';
import Image from 'next/image'
import { formatDateDiff } from '../../src/utils/utils';
import { query } from 'firebase/database';
import { useAuthState} from 'react-firebase-hooks/auth';
import Background from '../../src/elements/Background';
import {CanvasItem} from "../../pages/index"
import Link from 'next/link'

function UserSummary(){
  const router = useRouter()

  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [canvas, setCanvas] = useState();
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);

  const [currentUser] = useAuthState(auth)
  const myFollowingIds$ = currentUser?.uid ? collectionData(collection(db, 'users', currentUser?.uid, 'following')) : of([]);
  const {data:myFollowingIds} = useObservable(`myFollowingIds_${currentUser?.uid}`, myFollowingIds$);
  const uid$ = of(router.query.userId).pipe(
    filter(Boolean),
    mergeMap(userId=> docData(doc(db,'userIds',userId))),
    map(user => user.uid)
  );
  const {data:uid} = useObservable(`uid_${router.query.userId}`, uid$);
  const {data:user} = useObservable(`user_${router.query.userId}`,uid$.pipe(
    filter(Boolean),
    mergeMap(uid=>docData(doc(db,'users',uid))),
  ));
  const followerIds$ = uid$.pipe(
    filter(Boolean),
    mergeMap(uid => collectionData(collection(db, 'users', uid, 'followers'))),
  );
  const {data: followerIds} = useObservable(`followerIds_${router.query.userId}`, followerIds$);
  const followingIds$ = uid$.pipe(
    filter(Boolean),
    mergeMap(uid => collectionData(collection(db, 'users', uid, 'following'))),
  );
  const {data: followingIds} = useObservable(`followingIds_${router.query.userId}`, followingIds$);
  const followersWithDetails$ = followerIds$.pipe(
    mergeMap(followerIds => {
      const userDetailsObservables = followerIds.map(follower => docData(doc(db, 'users', follower.uid),{idField:'uid'}));
      return combineLatest(userDetailsObservables);
    })
  );
  const { data: followers } = useObservable(`followersWithDetails_${router.query.userId}`, followersWithDetails$);
  
  const followingWithDetails$ = followingIds$.pipe(
    mergeMap(followingIds => {
      const userDetailsObservables = followingIds.map(followee => docData(doc(db, 'users', followee.uid),{idField:'uid'}));
      return combineLatest(userDetailsObservables);
    })
  );
  const { data: followings } = useObservable(`followingWithDetails_${router.query.userId}`, followingWithDetails$);
  const isFollowing = followerIds?.some(followee => followee?.uid === currentUser?.uid);

  const follow = async (currentUid, targetUid) => {
    console.log(currentUid, targetUid)
    const batch = writeBatch(db);
  
    // currentUidのfollowingサブコレクションにtargetUidを追加
    const followingRef = doc(collection(db, 'users', currentUid, 'following'), targetUid);
    batch.set(followingRef, {
      uid: targetUid,
      timestamp: new Date()
    });
  
    // targetUidのfollowersサブコレクションにcurrentUidを追加
    const followerRef = doc(collection(db, 'users', targetUid, 'followers'), currentUid);
    batch.set(followerRef, {
      uid: currentUid,
      timestamp: new Date()
    });
  
    await batch.commit();
  }
  
  const unfollow = async (currentUid, targetUid) => {
    const batch = writeBatch(db);
  
    // currentUidのfollowingサブコレクションからtargetUidを削除
    const followingRef = doc(collection(db, 'users', currentUid, 'following'), targetUid);
    batch.delete(followingRef);
  
    // targetUidのfollowersサブコレクションからcurrentUidを削除
    const followerRef = doc(collection(db, 'users', targetUid, 'followers'), currentUid);
    batch.delete(followerRef);
  
    await batch.commit();
  }  

  const handleFollow = async () => {
    await follow(currentUser?.uid, user?.uid);
  }
  const handleUnfollow = async () => {
    await unfollow(currentUser?.uid, user?.uid);
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
            <div className='w-full max-w-4xl mx-auto py-4 md:py-8 px-4 flex flex-col md:flex-row md:space-x-10 space-y-3' >
              <div className='flex flex-row items-center'>
                <Avatar src={user?.photoURL} className='w-20 h-20'>
                  {user?.displayName[0]}
                </Avatar>
                <div className='flex-grow'/>
                {!isUpMd && currentUser?.uid && (user.uid === currentUser?.uid ? 
                  <Button onClick={()=>{router.push(`/settings/profile`)}} className="btn-neumorphic">プロフィールを編集</Button> : 
                  (isFollowing ? <button onClick={handleUnfollow} className=" bg-blue-500 text-white cursor-pointer py-2 px-2 md:px-4 text-sm md:text-base rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition">フォロー中</button> :
                   <button className=' border-1 border-solid border-blue-500 bg-white text-blue-500 cursor-pointer py-1.5 px-2 md:px-4 text-sm md:text-base rounded-md flex justify-center items-center hover:bg-blue-50 transition' onClick={handleFollow}>フォローする</button>)
                )}
              </div>
              <Stack flexGrow={1} spacing={1}>
                <Stack direction="row" >
                  <Typography variant="h5" fontWeight="bold">{user?.displayName}</Typography>
                  <div style={{flexGrow:1}}/>
                  {isUpMd && currentUser?.uid && (user.uid === currentUser?.uid  ? <Button onClick={()=>{router.push(`/settings/profile`)}} className="btn-neumorphic">プロフィールを編集</Button> : (isFollowing ? <button onClick={handleUnfollow} className=" bg-blue-500 text-white cursor-pointer py-2 px-2 md:px-4 text-sm md:text-base rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition">フォロー中</button> : <button className=' border-1 border-solid border-blue-500 bg-white text-blue-500 cursor-pointer py-1.5 px-2 md:px-4 text-sm md:text-base rounded-md flex justify-center items-center hover:bg-blue-50 transition' onClick={handleFollow}>フォローする</button>))}
                </Stack>
                {user?.description && <Typography variant="body1">{user?.description}</Typography>}
                <Stack direction="row" spacing={2}>
                  {/* {user?.caseHeartCount+user?.articleHeartCount >0 && <Box display="flex" alignItems="center"> 
                      <Typography variant="subtitle1" sx={{fontWeight:"bold",mr:.5}}>{user?.caseHeartCount+user?.articleHeartCount}</Typography>
                      <Typography variant="body2" color="secondary">Likes</Typography>
                    </Box>
                  } */}
                  {<div onClick={()=>{setOpenFollowers(true)}} className='cursor-pointer flex items-center justify-center'>
                    <div className='text-slate-600 text-base font-bold mr-0.5 text-center'>{followerIds?.length || 0}</div>
                    <div className=' text-base text-slate-500 text-center'>Followers</div>
                  </div> }
                  {<div onClick={()=>{setOpenFollowing(true)}} className='cursor-pointer flex items-center justify-center'>
                    <div className='text-slate-600 text-base font-bold mr-0.5 text-center'>{followingIds?.length || 0}</div>
                    <div className=' text-base text-slate-500 text-center'>Followings</div>
                  </div> }
                </Stack>
                <Stack direction="row" spacing={isUpMd ? 2 :1.5}>
                  {user?.twitterUserName && <a href={"https://twitter.com/"+user?.twitterUserName} target="_blank" style={{color:"#93a5b1"}}><Twitter sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                  {user?.facebookUserName && <a href={"https://facebook.com/"+user?.facebookUserName} target="_blank" style={{color:"#93a5b1"}}><Facebook sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                  {user?.url && <a href={user?.url} target="_blank" style={{color:"#93a5b1"}}><LinkIcon sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                </Stack>
              </Stack>
            </div>
          </NoSsr>
        </Stack>
        <div className='max-w-4xl w-full mx-auto py-6 px-4 min-h-[440px]'>
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            {
              canvas?.map(c=><CanvasItem canvasItem={c}/>)
            }
          </div>         
        </div>
        <Dialog open={openFollowers} onClose={()=>setOpenFollowers(false)}>
          <div className='border-solid border-0 border-b border-slate-200 w-full p-3 pl-4 flex flex-row items-center justify-center'>
            <div className='text-base font-bold text-center inline-flex items-center'>            
              フォロワー
            </div>
            <div className='flex-grow md:w-52'/>
            <button onClick={()=>setOpenFollowers(false)} type="button" class="bg-white cursor-pointer rounded-full pr-2 py-1 border-none inline-flex items-center justify-center ">
              <svg className='stroke-slate-400 hover:stroke-slate-600 w-4 md:w-6 h-4 md:h-6 transition' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className='w-full h-80 px-4 py-2 overflow-y-auto'> 
            <div className='w-full max-w-2xl mx-auto p-2'>
              {followers?.map(follower=>(
                <div className='flex flex-row items-center justify-center py-2'>
                  { follower.photoURL ?
                    <div className="h-10 w-10 rounded-full overflow-hidden cursor-pointer hover:opacity-60" onClick={()=>{router.push(`/users/${follower.userId}`)}}>
                      <Image src={follower.photoURL} height="40" width="40" alt="userPhoto"/>
                    </div> :
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-500" onClick={()=>{router.push(`/users/${follower.userId}`)}}>
                      <span className="text-xs font-medium leading-none text-white">{follower?.displayName?.length > 0 &&follower?.displayName[0]}</span>
                    </div>
                  }
                  <div className='ml-2 text-slate-500'>
                    <Link href={`/users/${follower.userId}`} className='text-sm font-medium no-underline hover:underline text-slate-500'>
                        {follower.displayName}
                    </Link>
                    <div className='flex flex-row items-center justify-between'>
                      <span className=' text-xs font-medium '>@{follower.userId?.length>14 ? follower.userId?.slice(0,14)+ ".." : follower.userId}</span>
                    </div>
                  </div>
                  <div className='flex-grow'/>
                  {myFollowingIds.map(({uid})=>uid)?.includes(follower.uid) ? 
                    <button onClick={()=>{unfollow(currentUser.uid, follower.uid)}} className=" bg-blue-500 text-white cursor-pointer py-2 px-2 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition">フォロー中</button> : 
                    <button onClick={async ()=>{await follow(currentUser.uid, follower.uid)}} className=' border-1 border-solid border-blue-500 bg-white text-blue-500 cursor-pointer py-1.5 px-2 text-sm rounded-md flex justify-center items-center hover:bg-blue-50 transition' >フォローする</button>
                  }
                </div>
                ))
              } 
            </div>
          </div>        
        </Dialog>
        <Dialog open={openFollowing} onClose={()=>setOpenFollowing(false)}>
          <div className='border-solid border-0 border-b border-slate-200 w-full p-3 pl-4 flex flex-row items-center justify-center'>
            <div className='text-base font-bold text-center inline-flex items-center'>            
              フォロー中
            </div>
            <div className='flex-grow md:w-52'/>
            <button onClick={()=>setOpenFollowing(false)} type="button" class="bg-white cursor-pointer rounded-full pr-2 py-1 border-none inline-flex items-center justify-center ">
              <svg className='stroke-slate-400 hover:stroke-slate-600 w-4 md:w-6 h-4 md:h-6 transition' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className='w-full h-80 px-4 py-2 overflow-y-auto'> 
            <div className='w-full max-w-2xl mx-auto p-2'>
              {followings?.map(following=>(
                <div className='flex flex-row items-center justify-center py-2'>
                  { following.photoURL ?
                    <div className="h-10 w-10 rounded-full overflow-hidden cursor-pointer hover:opacity-60" onClick={()=>{router.push(`/users/${following.userId}`)}}>
                      <Image src={following.photoURL} height="40" width="40" alt="userPhoto"/>
                    </div> :
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-500" onClick={()=>{router.push(`/users/${following.userId}`)}}>
                      <span className="text-xs font-medium leading-none text-white">{following?.displayName?.length > 0 &&following?.displayName[0]}</span>
                    </div>
                  }
                  <div className='ml-2 text-slate-500'>
                    <Link href={`/users/${following.userId}`} className='text-sm font-medium no-underline hover:underline text-slate-500'>
                        {following.displayName}
                    </Link>
                    <div className='flex flex-row items-center justify-between'>
                      <span className=' text-xs font-medium '>@{following.userId?.length>14 ? following.userId?.slice(0,14)+ ".." : following.userId}</span>
                    </div>
                  </div>
                  <div className='flex-grow'/>
                  {myFollowingIds.map(({uid})=>uid)?.includes(following.uid) ? 
                    <button onClick={()=>{unfollow(currentUser.uid, following.uid)}} className=" bg-blue-500 text-white cursor-pointer py-2 px-2 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition">フォロー中</button> : 
                    <button onClick={async ()=>{await follow(currentUser.uid, following.uid)}} className=' border-1 border-solid border-blue-500 bg-white text-blue-500 cursor-pointer py-1.5 px-2 text-sm rounded-md flex justify-center items-center hover:bg-blue-50 transition' >フォローする</button>
                  }
                </div>
                ))
              } 
            </div>
          </div>        
        </Dialog>         
      </>
    }
    <Footer/>   
    <Background/>
  </>
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