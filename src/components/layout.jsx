import React,{useState,useEffect} from 'react';
import {AppBar, Box, Toolbar, Typography,IconButton, CssBaseline, Button,Dialog, DialogContent,Avatar,DialogContentText, Menu, MenuItem,Divider} from '@mui/material';
import { makeStyles} from '@mui/styles';
import {useTranslation} from '../hooks/useTranslation'
import Image from 'next/image'

import {StyledAuth,app} from '../utils/firebase'
import {getAuth,onAuthStateChanged,signOut} from "firebase/auth";

const drawerWidth = 0;

const useStyles = makeStyles((theme) =>({
    root: {
      display: 'flex',
    },
    drawer: {
      [theme.breakpoints.up('sm')]: {
        width: drawerWidth,
        flexShrink: 0,
      },
    },
    appBar: {
      [theme.breakpoints.up('sm')]: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: drawerWidth,
        backgroundColor: 'transparent',
        color: 'inherit'
      },
    },
    appBarRoot: {
      [theme.breakpoints.up('sm')]: {
        backgroundColor: 'transparent',
        color: 'inherit'
      }
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        display: 'none',
      },
    },
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
      boxSizing: 'border-box',
      width: drawerWidth,
    },
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
      background: "radial-gradient(50% 50% at 50% 50%, rgb(255, 0, 122) 0%, rgb(247, 248, 250) 100%)",
      opacity: 0.15,
      userSelect: "none",
      pointerEvents: "none"
    },
    headerIcon:{
      width: '32px',
      height: '32px'
    }
  }),
);

function Layout(props) {
  const t = useTranslation();
  const classes = useStyles();
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const auth = getAuth(app)
  useEffect(() => {
    onAuthStateChanged(auth,currentUser => {
      if(currentUser){
        setUser(currentUser);
        setDialogOpen(false);
      }else{
        setUser(null);
      }
    })
  }, []);
  return (
    <>
      <CssBaseline />
      <AppBar position="static" elevation={0} className={classes.appBar} classes={{root:classes.appBarRoot}}>
        <Toolbar>
          <Box sx={{display:{xs:'none',sm:'block'}, mb:'-6px'}}><Image src="/HeaderIcon.png" width={30} height={30}/></Box>
          <Typography variant="h6" noWrap component="div" sx={{fontFamily: "GT Haptik Regular" ,flexGrow: 1,fontWeight: 'bold'}}>
            {t['Title']}
          </Typography>
          {
            user && <IconButton size="small" id="profile-button" aria-controls="profile-menu" aria-haspopup="true" aria-expanded={profileOpen ? 'true' : undefined} onClick={e=>setAnchorEl(e.currentTarget)}><Avatar src={user?.photoURL} sx={{border:'1px solid lightgray'}}>{user?.displayName[0]}</Avatar></IconButton> 
          }{
            !user && <Button variant='contained' onClick={()=>{setDialogOpen(true)}} disableElevation>Log in</Button>
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
          >
            <MenuItem onClick={()=>{}}>{user?.displayName}</MenuItem>
            <Divider />
            <MenuItem onClick={()=>{signOut(auth).then(()=>{setAnchorEl(null);})}}>Log out</MenuItem>
          </Menu>          
        </Toolbar>
      </AppBar>
      <Box className={classes.background}></Box>
      <Box>
        {props.children}
      </Box>
    </>
  );
}

export default Layout