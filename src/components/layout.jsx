import React,{useState,useEffect} from 'react';
import {AppBar, Box, Toolbar, Typography,IconButton, CssBaseline, Button,Dialog, DialogContent,Avatar,DialogContentText, Menu, MenuItem,Divider,alpha, Popover,useMediaQuery} from '@mui/material';
import {Logout,SettingsOutlined, FavoriteBorder,FeedOutlined,EventNoteOutlined,Feed,EventNote,Edit, MenuBookOutlined, StoreOutlined, PaidOutlined } from '@mui/icons-material';
import { makeStyles} from '@mui/material/styles';
import {useTranslation} from '../hooks/useTranslation'
import Image from 'next/image'
import {user$,} from '../hooks/usePvLoop'
import {useObservable} from "reactfire"
import {auth,db} from '../utils/firebase'
import { switchMap, map,  mergeMap, tap } from 'rxjs/operators';
import { combineLatest, of, BehaviorSubject,from } from 'rxjs';  
import { collection, query, where, doc , writeBatch, orderBy, limit, getDocs,getDoc, startAfter} from 'firebase/firestore';
import { collectionData, docData } from 'rxfire/firestore';

import {signOut} from "firebase/auth";
import { useRouter } from 'next/router'
import {nanoid, formatDateDiff} from '../utils/utils'

import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import { useSignInWithGoogle } from 'react-firebase-hooks/auth';
import Background from '../elements/Background'
import { spawn } from 'child_process';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

function Layout(props) {
  const t = useTranslation();
  const router = useRouter()
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const {data:user} = useObservable(`user_${auth?.currentUser?.uid}`,user$)

  const [notificationsWithDetails, setNotificationsWithDetails] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const loadMoreNotifications = async () => {
    let baseQuery = query(
      collection(db, 'notifications'),
      where('uid', '==', auth?.currentUser?.uid),
      orderBy('createdAt', 'desc')
    );
  
    if (lastVisible) {
      baseQuery = query(baseQuery, startAfter(lastVisible));
    }
  
    const limitedQuery = query(baseQuery, limit(10));
    const snapshot = await getDocs(limitedQuery);
  
    let newNotifications = [];
    snapshot.forEach(doc => {
      newNotifications.push({ ...doc.data(), id: doc.id });
    });
  
    if (newNotifications.length > 0) {
      const newLastVisible = newNotifications[newNotifications.length - 1];  
      setLastVisible(newLastVisible?.createdAt);
      // actorとcanvasの詳細を取得
      const newDetails = await Promise.all(newNotifications.map(async (notification) => {
        const actor = await getDoc(doc(db, `users/${notification.actorUid}`));
        const canvas = notification.canvasId ? await getDoc(doc(db, `canvas/${notification.canvasId}`)) : null;
  
        return {
          ...notification,
          actor: actor.data(),
          canvas: canvas ? canvas.data() : null
        };
      }));
  
      setNotificationsWithDetails(prevDetails => {
        if (prevDetails === null) {
          return newDetails;
        }
        return [...prevDetails, ...newDetails];
      });
    }
  };
  

  const [dialogOpen, setDialogOpen] = useState(false);
  const [signInWithGoogle, _, loading, error] = useSignInWithGoogle(auth);

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [newItemAnchorEl, setNewItemAnchorEl] = useState(null);

  const createNewCase =  async () => {
    const canvasId = nanoid()
    router.push({pathname:`/canvas/${canvasId}`,query:{newItem:true}})
    setNewItemAnchorEl(null)
  }


  const markNotificationsAsRead = async () => {
    setNotificationCount(0)
    const batch = writeBatch(db);
    notificationsWithDetails?.filter(notification => !notification?.read)?.forEach((notification) => {
      const notificationRef = doc(db, 'notifications', notification.id);
      batch.update(notificationRef, { read: true });
    });
    await batch.commit();
  };  


  useEffect(() => {
    if(user){
      setDialogOpen(false)
      loadMoreNotifications();
      setNotificationCount(notificationsWithDetails?.filter(notification => !notification?.read)?.length)
    }
  }, [user]);

  return (
    <>
      <CssBaseline />
      <nav className="bg-white">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className='flex h-14 md:h-16 justify-between items-center'>
            <div onClick={()=>{router.push("/")}} className='cursor-pointer flex items-center justify-center'>
              <Image src="/favicons/favicon_256x256.png" width={isUpMd ? 24 : 24} height={isUpMd ? 24 : 24} alt="favicon"/>
              <h1 className='ml-1 text-2xl text-center font-bold'>CircleHeart</h1>
            </div>
            <div className='flex-grow'/>
            {
              user ? 
                <div className='flex flex-row items-center justify-center h-full'>
                  <div onClick={e=>{setNotificationAnchorEl(e.currentTarget);markNotificationsAsRead() }} className='relative mr-3 md:mr-4 mt-2'>
                    <button className='bg-transparent border-none cursor-pointer  p-0  text-slate-500 hover:text-slate-600 '>
                      <svg className='h-6 w-6 md:h-7 md:w-7' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                      </svg>
                      {notificationCount>0 && <span className='bg-blue-500 text-white text-xs rounded-full absolute -top-1 -right-1 h-4.5 min-w-5.5 px-1 inline-block border border-solid border-white'>{notificationCount >=10 ? "10+" : notificationCount}</span>}
                    </button>
                  </div>
                  <div onClick={e=>setAnchorEl(e.currentTarget)} className='w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer' id="profile-button" aria-controls="profile-menu" aria-haspopup="true"  >
                      {user?.photoURL ? <Image width={isUpMd ? 40 : 32} height={isUpMd ? 40 : 32} src={user?.photoURL} className='rounded-full' alt="userPhoto"/> : <span className='text-xl font-bold w-10 h-10 text-center text-white rounded-full bg-slate-600'>{user?.displayName[0]}</span>}
                  </div> 
                  <button onClick={createNewCase} className='ml-3 md:ml-5 bg-blue-500 text-white cursor-pointer font-bold py-1.5 px-2 md:px-3 text-base rounded-md text-center inline-flex items-center hover:bg-sky-700 border-none transition'>
                    <svg className='w-5 h-5 text-white md:mr-2' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <div className='hidden md:inline-block'>Create New</div>
                  </button>
                </div> :
                <button onClick={()=>{setDialogOpen(true)}} className='bg-blue-500 text-white cursor-pointer font-bold py-1 md:py-2 px-3 md:px-4  text-sm md:text-base rounded-md text-center inline-flex items-center hover:bg-sky-700 border-none transition'>
                  Log in
                </button>
            }
          </div>
        </div>
      </nav>
      <Dialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} sx={{'& .firebaseui-idp-button':{borderRadius: "0.45em"}, '& .MuiDialog-paper':{borderRadius: '9px'},'& .MuiDialogContent-root':{maxWidth:"400px"}, '& .MuiBackdrop-root':{background:"rgba(0, 0, 0, 0.2)"}}}>
        <DialogContent>
          <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{mt:2,mb:3}}>
            <Image src="/favicons/favicon_256x256.png" width={28} height={28} alt="headerIcon" className='mr-1'/>
            <Typography variant="h5" noWrap component="div" sx={{fontFamily: "GT Haptik Regular",fontWeight: 'bold', fontSize:{xs:'h6.fontSize',sm:'h5.fontSize'}}}>
              {t['Title']}
            </Typography>
          </Box>
          <DialogContentText variant="body2">
            循環動態シミュレーターで様々な病態や治療法への理解を深めていきましょう。
          </DialogContentText>
            <button variant='contained' onClick={()=>{signInWithGoogle()}} className="btn-neumorphic mx-auto text-base cursor-pointer flex items-center justify-center my-4 text-black py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" ><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              Sign in with Google
            </button>
          <DialogContentText sx={{mt:.5}} variant="body2">
            利用規約、プライバシーポリシーに同意したうえでログインしてください。
          </DialogContentText>
        </DialogContent>
      </Dialog>
      <Popover 
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={(e)=>{setAnchorEl(null)}}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        elevation={0}
        marginThreshold={0}
      >
        <div className='flex flex-col items-center justify-center bg-white  border-solid border border-slate-200 rounded-md shadow-md m-2 mr-1'>
          <div onClick={()=> {router.push("/users/" + user?.userId); setAnchorEl(null)}} 
            className="cursor-pointer text-base whitespace-nowrap text-slate-700 items-center inline-flex w-full pl-2 pr-6 py-3 hover:bg-slate-200"
          >
            <svg className='w-5 h-5 ml-1 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            {user?.displayName}
          </div>
          <div onClick={()=>{router.push("/settings/profile");setAnchorEl(null)}} 
            className="cursor-pointer text-base whitespace-nowrap text-slate-700 items-center inline-flex w-full pl-2 pr-6 py-3 hover:bg-slate-200"
          >
            <svg className='w-5 h-5 ml-1 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            アカウント設定
          </div>          
          <div onClick={()=>{signOut(auth).then(()=>{setAnchorEl(null);})}} className="cursor-pointer text-base whitespace-nowrap text-slate-700 items-center inline-flex w-full pl-2 pr-6 py-3 hover:bg-slate-200">
            <svg  className='w-5 h-5 ml-1 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>           
            ログアウト
          </div>
        </div>
      </Popover>
      <Popover 
        open={Boolean(notificationAnchorEl)}
        anchorEl={notificationAnchorEl}
        onClose={(e)=>{setNotificationAnchorEl(null)}}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        elevation={0}
        marginThreshold={0}
        slotProps={{paper:{className:'bg-white  border-solid border border-slate-200 rounded-md shadow-md m-2 shadow-lg'}}}
      >
        <div >
          {notificationsWithDetails?.length > 0 && <div className='w-[330px] max-h-80  overflow-auto'>
            { notificationsWithDetails?.map((notification,index) => (
              <div onClick={()=>{if(notification.type != "follow"){router.push(`/canvas/${notification.canvasId}`)}else{setNotificationAnchorEl(null)}}} className={`flex flex-row justify-center items-center py-3 px-4 border-0 ${index!=0 && "border-t"} border-solid border-slate-200 hover:bg-slate-50 cursor-pointer`}>
                { notification?.actor?.photoURL ?
                  <div className="h-10 w-10 rounded-full overflow-hidden cursor-pointer hover:opacity-60" onClick={()=>{router.push(`/users/${notification?.actor?.userId}`)}}>
                    <Image src={notification?.actor?.photoURL} height="40" width="40" alt="userPhoto"/>
                  </div> :
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-500" onClick={()=>{router.push(`/users/${notification?.actor?.userId}`)}}>
                    <span className="text-xs font-medium leading-none text-white">{notification?.actor?.displayName?.length > 0 &&notification?.actor?.displayName[0]}</span>
                  </div>
                }
                <div className='ml-2 w-[calc(100%_-_50px)] flex flex-col items-start justify-center'>
                  <div className='w-full text-sm text-slate-500'>
                    <span className='font-bold text-slate-800'>{notification?.actor?.displayName}</span>
                    さんが
                    {notification.type != "follow" && <span className=' text-slate-800'>{notification?.canvas?.name || "Untitled"}</span>}
                    { ( () =>{ switch(notification.type){
                      case "follow":
                        return <>
                          <span className=' text-slate-800'>あなた</span>
                          をフォローしました
                        </>
                      case "like":
                        return "にLikeをつけました"
                      case "bookmark":
                        return "をブックマークしました"
                    } })()}
                  </div>
                  <div className='flex flex-row items-center justify-between'>
                    <span className='text-sm text-slate-500'>{ formatDateDiff(new Date(), new Date(notification?.createdAt?.seconds * 1000)) } </span>
                  </div>
                </div>
              </div>
            ))}
            {notificationsWithDetails?.length >0 && notificationsWithDetails?.length % 10 ==0 && <div className={`flex flex-row justify-center items-center py-3 px-4 border-0 border-t border-solid border-slate-200`}>
              <button onClick={()=>{loadMoreNotifications()}} type="button" className='w-full bg-white shadow stroke-slate-500 text-slate-500 cursor-pointer py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center hover:bg-slate-100 border border-solid border-slate-200 transition'>
                さらに読み込む
              </button>
            </div>}
          </div>}
          {(!notificationsWithDetails || notificationsWithDetails?.length==0 ) &&<div className='flex items-center justify-center py-3 px-4 w-[330px] h-20'>
              <div className='text-sm text-slate-500'>
                通知はありません
              </div>
            </div>
          }
        </div>
      </Popover>      
      <Background/>
      <Elements stripe={stripePromise} >
        {props.children}
      </Elements>
    </>
  );
}

export default Layout

      {/* <AppBar position="static" elevation={0} >
        <Toolbar className="py-1">
          <Box onClick={()=>{router.push("/")}} sx={{cursor:"pointer",fontFamily: "GT Haptik Regular" ,fontWeight: 'bold',display:"flex", alignItems:"center" ,justifyContent:"center"}}>
            <Image src="/favicons/favicon_256x256.png" width={32} height={32}/>
            <Typography variant="h5" noWrap component="div" fontWeight="bold" sx={{fontFamily: "'Josefin Sans', sans-serif", mb:-0.5,ml:1}}>
              {t['Title']}
            </Typography>
          </Box>
          <div style={{flexGrow:1}}></div>
          {
            user && <>
              <IconButton size="small" id="profile-button" aria-controls="profile-menu" aria-haspopup="true"  onClick={e=>setAnchorEl(e.currentTarget)}><Avatar src={user?.photoURL} sx={{border:'1px solid lightgray'}}>{user?.displayName[0]}</Avatar></IconButton> 
              <Button disableElevation variant='contained' className="text-white font-bold ml-4 hidden md:inline-flex" onClick={e=>setNewItemAnchorEl(e.currentTarget)} startIcon={<Edit/>}>投稿</Button>
              <Button disableElevation size="small" variant='contained' className="text-white" onClick={e=>setNewItemAnchorEl(e.currentTarget)} sx={{ml:1.2,display:{xs:"inherit",md:"none"},minWidth:"34px", padding:"4px 0"}}><Edit fontSize='small'/></Button>
            </>
          }{
            !user && <Button variant='contained' onClick={()=>{setDialogOpen(true)}} disableElevation className="font-bold text-white">Log in</Button>
          }        
        </Toolbar>
      </AppBar> */}