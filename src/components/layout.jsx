import React,{useState,useEffect} from 'react';
import {AppBar, Box, Toolbar, Typography,IconButton, CssBaseline, Button,Dialog, DialogContent,Avatar,DialogContentText, Menu, MenuItem,Divider,alpha, Popover,useMediaQuery} from '@mui/material';
import {Logout,SettingsOutlined, FavoriteBorder,FeedOutlined,EventNoteOutlined,Feed,EventNote,Edit, MenuBookOutlined, StoreOutlined, PaidOutlined } from '@mui/icons-material';
import { makeStyles} from '@mui/material/styles';
import {useTranslation} from '../hooks/useTranslation'
import Image from 'next/image'
import {user$,} from '../hooks/usePvLoop'
import {useObservable} from "reactfire"
import {StyledAuth,app,auth,db} from '../utils/firebase'
import {signOut} from "firebase/auth";
import { useRouter } from 'next/router'
import {nanoid} from '../utils/utils'

import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import { useSignInWithGoogle } from 'react-firebase-hooks/auth';
import Background from '../elements/Background'
import { spawn } from 'child_process';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);


// const useStyles = makeStyles((theme) =>({
//     root: {
//       display: 'flex',
//     },
//     appBar: { 
//       width: "100%",
//       backgroundColor: 'transparent',
//       color: 'inherit'
//     },
//     menuButton: {
//       marginRight: theme.spacing(2),
//       [theme.breakpoints.up('xs')]: {
//         display: 'none',
//       },
    // },
    // responsiveIcon:{
    //   [theme.breakpoints.up('xs')]: {
    //     width: "34px",
    //     height: "34px",
    //   },
    //   [theme.breakpoints.up('md')]: {
    //     width: "40px",
    //     height: "40px",
    //   }
    // },
    // menuList: {
    //   '& .MuiMenu-list': {
    //     padding: '0',
    //   },
    //   '& .MuiMenuItem-root': {
    //     '& .MuiSvgIcon-root': {
    //       fontSize: 18,
    //       color: theme.palette.text.secondary,
    //       marginRight: theme.spacing(1.5),
    //     },
    //     '&:active': {
    //       backgroundColor: alpha(
    //         theme.palette.primary.main,
    //         theme.palette.action.selectedOpacity,
    //       ),
    //     },
    //   },
    // }
//   }),
// );

function Layout(props) {
  const t = useTranslation();
  const router = useRouter()
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const {data:user} = useObservable(`user_${auth?.currentUser?.uid}`,user$)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signInWithGoogle, _, loading, error] = useSignInWithGoogle(auth);

  const [anchorEl, setAnchorEl] = useState(null);
  const [newItemAnchorEl, setNewItemAnchorEl] = useState(null);

  const createNewCase =  async () => {
    const canvasId = nanoid()
    router.push({pathname:`/canvas/${canvasId}`,query:{newItem:true}})
    setNewItemAnchorEl(null)
  }


  useEffect(() => {
    if(user){
      setDialogOpen(false)
    }
  }, [user]);

  return (
    <>
      <CssBaseline />
      <nav className="bg-white">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className='flex h-12 md:h-16 justify-between items-center'>
            <div onClick={()=>{router.push("/")}} className='cursor-pointer flex items-center justify-center'>
              <Image src="/favicons/favicon_256x256.png" width={isUpMd ? 24 : 20} height={isUpMd ? 24 : 20} alt="favicon"/>
              <h1 className='ml-1 text-xl md:text-2xl text-center font-bold'>CircleHeart</h1>
            </div>
            <div className='flex-grow'/>
            {
              user ? 
                <div className='flex flex-row items-center justify-center'>
                  <div className='w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer' id="profile-button" aria-controls="profile-menu" aria-haspopup="true"  onClick={e=>setAnchorEl(e.currentTarget)}>
                      {user?.photoURL ? <Image width={isUpMd ? 40 : 32} height={isUpMd ? 40 : 32} src={user?.photoURL} className='rounded-full' alt="userPhoto"/> : <span className='text-xl font-bold w-10 h-10 text-center text-white rounded-full bg-slate-600'>{user?.displayName[0]}</span>}
                  </div> 
                  <button onClick={createNewCase} className='ml-3 md:ml-5 bg-blue-500 text-white cursor-pointer font-medium py-1.5 px-2 md:px-3 text-base rounded-md text-center inline-flex items-center hover:bg-sky-700 border-none transition'>
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
            <Image src="/HeaderIcon.png" width={40} height={40} alt="headerIcon"/>
            <Typography variant="h5" noWrap component="div" sx={{fontFamily: "GT Haptik Regular",fontWeight: 'bold', fontSize:{xs:'h6.fontSize',sm:'h5.fontSize'}}}>
              {t['Title']}
            </Typography>
          </Box>
          <DialogContentText variant="body2">
            循環動態シミュレーターで様々な病態や治療法への理解を深めていきましょう。
          </DialogContentText>
            <button variant='contained' onClick={()=>{signInWithGoogle()}} className="btn-neumorphic mx-auto text-base cursor-pointer flex items-center justify-center my-4 text-black py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" class="abcRioButtonSvg mr-3"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
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