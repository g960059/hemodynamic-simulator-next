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



function UserSummary(){
  const router = useRouter()


  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  // const [user, setUser] = useState();
  const [cases, setCases] = useState();

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
        const loadedCases = []
        const loadedCasesSnap = await getDocs(query(collection(db,'users',uid,'cases'),where("visibility","!=","private")));
        loadedCasesSnap.forEach(async (caseSnap) => {
          loadedCases.push({...caseSnap.data(),id:caseSnap.id})
        })
        setCases(loadedCases)       
      }
    })()
  }, [uid]);



  return <>
    {
      user && <>
        <Stack width={1} justifyContent="center" alignItems="center">
          <NoSsr>
            <Stack className='w-full max-w-6xl mx-auto' direction={isUpMd ?"row" : "column"} pt={isUpMd?6:4} pb={isUpMd?4:1} px={isUpMd?10:2} spacing={3}>
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


            <div className='bg-blue-50 min-h-[18rem] w-full'>
              <div className="w-full max-w-5xl py-4 px-4 md:px-10 mx-auto">
 

                  <Grid container spacing={{xs:2,md:3}} sx={{width:"100%"}}>
                    {cases?.map(c => (
                      <Grid item xs={12} md={6} sx={{mb:{xs:3,md:0}}}>
                        <Stack onClick={()=>{router.push(`/${user.userId}/cases/${c.id}`)}} direction="row" sx={{overflow:"hidden",borderRadius:"9px", cursor:"pointer",height:"100%"}}>
                          <div className='bg-white rounded-lg flex justify-center items-center w-24 h-24'>
                            <span className='text-4xl'>{c?.emoji || "😊"}</span>
                          </div>                          
                          <Stack sx={{pl:2, justifyContent:"flex-end",flexGrow:1}}>
                            <Typography variant='subtitle1' fontWeight="bold" textAlign="left">{c.name || "無題の症例"}</Typography>
                            <div style={{flexGrow:1}}/>
                            <Stack direction="row" >{c.tags?.map(tag=><Box sx={{color:"#f86684",background:"#ffc5c545",fontSize:"10px",borderRadius:"4px",padding:"2px 5px",margin:"3px 7px 3px 0"}}>{tag}</Box>)}</Stack>
                            <Stack direction="row" justifyContent="center" alignItems="center">
                              <Avatar  src={user?.photoURL} sx={{ width: "34px", height: "34px" }}>
                                {user?.displayName[0]}
                              </Avatar>
                              <Stack ml={1} flexGrow={1}>
                                <Typography variant="subtitle2" >{c.displayName}</Typography>
                                <Stack direction="row">
                                  <Typography  variant="body2" sx={{color:"#6e7b85"}}>{formatDateDiff(new Date(),c.updatedAt?.toDate())}</Typography>
                                  <FavoriteBorder fontSize="small" sx={{color:"#6e7b85",ml:2,mr:.5}}/>
                                  <Typography variant="body2" sx={{color:"#6e7b85"}}>{c.heartCount}</Typography>
                                </Stack>
                              </Stack>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>

             
              </div>
            </div>
          
             
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