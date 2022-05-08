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
              <Box width={1} display='flex' justifyContent='center' alignItems='center' 
                sx={{"& .firebaseui-idp-button":{
                  transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
                  boxShadow: "rgb(0 0 0 / 10%) 0px 2px 4px -2px",
                  backgroundColor: "#EFF6FB99",
                  border: "1px solid rgba(92, 147, 187, 0.17)",
                  "&:hover":{
                      backgroundColor: "rgba(239, 246, 251, 0.6)",
                      borderColor: "rgb(207, 220, 230)"
                  },
                  "& .firebaseui-idp-text":{
                    fontSize: "1rem",
                    color:"black"
                  }
                }}}>
                <StyledAuth/>
              </Box>
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