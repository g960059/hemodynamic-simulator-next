import React from 'react';
import {AppBar, Box, Toolbar, Typography,IconButton, CssBaseline} from '@material-ui/core';
import {GitHub, Twitter} from '@material-ui/icons'
import { makeStyles} from '@material-ui/styles';

import {useTranslation} from '../hooks/useTranslation'


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
  return (
    <>
      <CssBaseline />
      <AppBar position="static" elevation={0} className={classes.appBar} classes={{root:classes.appBarRoot}}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{fontFamily: "GT Haptik Regular" ,flexGrow: 1 }}>
            {t['Title']}
          </Typography>
          <IconButton onClick={()=>{window.open('https://twitter.com/osushi0x0')}} sx={{display: { xs: 'none', md: 'block' }}}>
            <Twitter/>
          </IconButton>
          <IconButton onClick={()=>{window.open('https://github.com/g960059/uniswap_simulator')}} sx={{display: { xs: 'none', md: 'block' }}}>
            <GitHub/>
          </IconButton>
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