import React,{useState,useEffect} from 'react';
import {AppBar, Box, Toolbar, Typography,IconButton, CssBaseline, Button,Dialog, DialogContent,Avatar,DialogContentText, Menu, MenuItem,Divider,alpha} from '@mui/material';
import {Logout,SettingsOutlined, FavoriteBorder,FeedOutlined,EventNoteOutlined,Feed,EventNote,Edit, MenuBookOutlined, StoreOutlined, PaidOutlined } from '@mui/icons-material';
import { makeStyles} from '@mui/styles';
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
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);


const useStyles = makeStyles((theme) =>({
    root: {
      display: 'flex',
    },
    appBar: { 
      width: "100%",
      backgroundColor: 'transparent',
      color: 'inherit'
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up('xs')]: {
        display: 'none',
      },
    },
    responsiveIcon:{
      [theme.breakpoints.up('xs')]: {
        width: "34px",
        height: "34px",
      },
      [theme.breakpoints.up('md')]: {
        width: "40px",
        height: "40px",
      }
    },
    toolbar: theme.mixins.toolbar,
    content: {
      flexGrow: 1,
      // padding: theme.spacing(3),
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
      // background: "radial-gradient(50% 50% at 50% 50%, rgb(62 168 255) 0%, rgb(247, 248, 250) 100%)",
      opacity: 0.15,
      userSelect: "none",
      pointerEvents: "none"
    },
    headerIcon:{
      width: '32px',
      height: '32px'
    },
    menuList: {
      '& .MuiMenu-list': {
        padding: '0',
      },
      '& .MuiMenuItem-root': {
        '& .MuiSvgIcon-root': {
          fontSize: 18,
          color: theme.palette.text.secondary,
          marginRight: theme.spacing(1.5),
        },
        '&:active': {
          backgroundColor: alpha(
            theme.palette.primary.main,
            theme.palette.action.selectedOpacity,
          ),
        },
      },
    }
  }),
);

function Layout(props) {
  const t = useTranslation();
  const classes = useStyles();
  const router = useRouter()
  const {data:user} = useObservable(`user_${auth?.currentUser?.uid}`,user$)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signInWithGoogle, _, loading, error] = useSignInWithGoogle(auth);

  const [anchorEl, setAnchorEl] = useState(null);
  const [newItemAnchorEl, setNewItemAnchorEl] = useState(null);

  const createNewCase =  async () => {
    const caseId = nanoid()
    router.push({pathname:`/cases/${caseId}`,query:{newItem:true}})
    setNewItemAnchorEl(null)
  }
  const createNewArticle =  async () => {
    const articleId = nanoid()
    router.push({pathname:`/articles/${articleId}`,query:{newItem:true}})
    setNewItemAnchorEl(null)
  }
  const createNewBook =  async () => {
    const bookId = nanoid()
    router.push({pathname:`/books/${bookId}`,query:{newItem:true}})
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
      <AppBar position="static" elevation={0} className={classes.appBar} >
        <Toolbar className="py-1">
          <Box onClick={()=>{router.push("/")}} sx={{cursor:"pointer",fontFamily: "GT Haptik Regular" ,fontWeight: 'bold',display:"flex", alignItems:"center"}}>
            <Image src="/HeaderIcon.png" width={32} height={32}/>
            <Typography variant="h5" noWrap component="div" fontWeight="bold" sx={{fontFamily: "'Josefin Sans', sans-serif", mb:-1}}>
              {t['Title']}
            </Typography>
          </Box>
          <div style={{flexGrow:1}}></div>
          {
            user && <>
              <IconButton size="small" id="profile-button" aria-controls="profile-menu" aria-haspopup="true"  onClick={e=>setAnchorEl(e.currentTarget)}><Avatar src={user?.photoURL} sx={{border:'1px solid lightgray'}} className={classes.responsiveIcon}>{user?.displayName[0]}</Avatar></IconButton> 
              <Button disableElevation variant='contained' className="text-white font-bold ml-4 hidden md:inline-flex" onClick={e=>setNewItemAnchorEl(e.currentTarget)} startIcon={<Edit/>}>投稿</Button>
              <Button disableElevation size="small" variant='contained' className="text-white" onClick={e=>setNewItemAnchorEl(e.currentTarget)} sx={{ml:1.2,display:{xs:"inherit",md:"none"},minWidth:"34px", padding:"4px 0"}}><Edit fontSize='small'/></Button>
            </>
          }{
            !user && <Button variant='contained' onClick={()=>{setDialogOpen(true)}} disableElevation className="font-bold text-white">Log in</Button>
          }
          <Dialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} sx={{'& .firebaseui-idp-button':{borderRadius: "0.45em"}, '& .MuiDialog-paper':{borderRadius: '9px'},'& .MuiDialogContent-root':{maxWidth:"400px"}, '& .MuiBackdrop-root':{background:"rgba(0, 0, 0, 0.2)"}}}>
            <DialogContent>
              <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{mt:2,mb:3}}>
                <Image src="/HeaderIcon.png" width={40} height={40}/>
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
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={()=>{setAnchorEl(null);}}
            MenuListProps={{
              'aria-labelledby': 'profile-button',
            }}
            className={classes.menuList}
          >
            <MenuItem onClick={()=>{router.push("/" + user?.userId);setAnchorEl(null)}} disableRipple sx={{fontWeight:"bold",height:"50px"}}>{user?.displayName}</MenuItem>
            <hr className='border-solid border-0 border-b border-slate-200 my-0'/>
            <MenuItem onClick={()=>{router.push("/dashboard/cases");setAnchorEl(null)}} disableRipple ><EventNoteOutlined/>症例の管理</MenuItem>
            <MenuItem onClick={()=>{router.push("/dashboard/articles");setAnchorEl(null)}} disableRipple ><FeedOutlined/>記事の管理</MenuItem>
            <MenuItem onClick={()=>{router.push("/dashboard/books");setAnchorEl(null)}} disableRipple ><MenuBookOutlined/>本の管理</MenuItem>
            <hr className='border-solid border-0 border-b border-slate-200 my-0'/>
            <MenuItem onClick={()=>{router.push("/dashboard/purchases");setAnchorEl(null)}} disableRipple ><StoreOutlined/>購入した本</MenuItem>
            <MenuItem onClick={()=>{router.push("/dashboard/favorites");setAnchorEl(null)}} disableRipple ><FavoriteBorder/>いいねした投稿</MenuItem>
            <MenuItem onClick={()=>{router.push("/dashboard/sales");setAnchorEl(null)}} disableRipple ><PaidOutlined/>収益の管理</MenuItem>
            <MenuItem onClick={()=>{router.push("/settings/profile");setAnchorEl(null)}} disableRipple ><SettingsOutlined/>アカウント設定</MenuItem>
            <hr className='border-solid border-0 border-b border-slate-200 my-0'/>
            <MenuItem onClick={()=>{signOut(auth).then(()=>{setAnchorEl(null);})}} disableRipple ><Logout/>ログアウト</MenuItem>
          </Menu>
          <Menu
            id="newItem-menu"
            anchorEl={newItemAnchorEl}
            open={Boolean(newItemAnchorEl)}
            onClose={()=>{setNewItemAnchorEl(null);}}
            MenuListProps={{
              'aria-labelledby': 'newItem-button',
            }}
          >
            <MenuItem onClick={createNewCase} disableRipple sx={{pr:3}}><Feed sx={{mr:1.5,my:1, color:"#6e7b85"}}/>症例を作成</MenuItem>
            <MenuItem onClick={createNewArticle} disableRipple sx={{pr:3}}><EventNote sx={{mr:1.5, my:1,color:"#6e7b85"}}/>記事を作成</MenuItem>
            <MenuItem onClick={createNewBook} disableRipple sx={{pr:3}}><MenuBookOutlined sx={{mr:1.5, my:1,color:"#6e7b85"}}/>本を作成</MenuItem>
          </Menu>                      
        </Toolbar>
      </AppBar>
      <Box className={classes.background}></Box>
      <Elements stripe={stripePromise} >
        {props.children}
      </Elements>
    </>
  );
}

export default Layout