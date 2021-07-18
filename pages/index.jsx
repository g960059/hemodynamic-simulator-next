import React, { useRef, useState, useEffect, useLayoutEffect, useCallback} from 'react'
import {Box, Button,CircularProgress, Grid, CssBaseline, IconButton, ButtonBase} from '@material-ui/core'
import {Menu, KeyboardArrowLeft,KeyboardArrowRight} from "@material-ui/icons";
import { Root, Header, EdgeSidebar,EdgeTrigger,Content, Footer, SidebarContent } from "@mui-treasury/layout";
import {usePvLoop} from '../src/hooks/usePvLoop'
import RealTimeChart from '../src/components/RealTimeChart'

const App = () => {
  const {subscribe,unsubscribe ,isPlaying,setIsPlaying, setHemodynamicProps} = usePvLoop()

  return (
    <Root
      scheme={{
        header: {
          config: {
            xs: {
              position: "sticky",
              height: 56,
            },
            md: {
              position: "relative",
              height: 64,
            },
          },
        },
        leftEdgeSidebar: {
          config: {
            xs: {
              variant: "temporary",
              width: "auto",
            },
            md: {
              variant: "permanent",
              width: 256,
              collapsible: true,
              collapsedWidth: 64,
            },
          },
        },
      }}
    >
      <CssBaseline/>
      <Header>
        <Box
          sx={{ flex: 1, display: "flex", alignItems: "center", px: 2, gap: 1 }}
        >
          <EdgeTrigger target={{ anchor: "left", field: "open" }}>
            {(open, setOpen) => (
              <IconButton onClick={() => setOpen(!open)}>
                {open ? <KeyboardArrowLeft /> : <Menu />}
              </IconButton>
            )}
          </EdgeTrigger>
          Header
        </Box>
      </Header>
      <EdgeSidebar anchor="left">
        <SidebarContent>Sidebar Content</SidebarContent>
        <EdgeTrigger target={{ anchor: "left", field: "collapsed" }}>
          {(collapsed, setCollapsed) => (
            <ButtonBase
              onClick={() => setCollapsed(!collapsed)}
              sx={{
                minHeight: 40,
                width: "100%",
                bgcolor: "grey.100",
                borderTop: "1px solid",
                borderColor: "grey.200",
              }}
            >
              {collapsed ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
            </ButtonBase>
          )}
        </EdgeTrigger>        
      </EdgeSidebar>
      <Content>
        <Box>
          <Button onClick={()=>{setIsPlaying(prev=>!prev)}}>{isPlaying ? 'stop' : 'start'}</Button>
          <Grid container>
            <Grid item xs={12} md={8}>
              <RealTimeChart subscribe={subscribe} setIsPlaying={setIsPlaying} dataTypes={['Plv', 'Pla', 'AoP']}/>
            </Grid>
          </Grid>
        </Box>
      </Content>
    </Root>    
  )
}

export default App