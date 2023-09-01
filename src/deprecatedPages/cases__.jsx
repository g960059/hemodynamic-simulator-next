import React, { useRef, useState, useEffect,} from 'react'
import {Box, NoSsr, Grid, Tab,Tabs, Divider,Typography,Stack,Chip, Button, Avatar} from '@mui/material'
import {Add,FavoriteBorder} from "@mui/icons-material";
import {user$, myPatients$,allPatients$,cases$} from '../../hooks/usePvLoop'
import { makeStyles } from '@mui/styles';
import {useTranslation} from '../../hooks/useTranslation'
import Lottie from 'react-lottie-player' 
import DoctorPrescription from "../../lotties/DoctorPrescription.json"
import { useRouter } from 'next/router'
import {formatDateDiff, nanoid} from "../../utils/utils"
import {useObservable} from "../hooks/useObservable"
import Layout from '../../components/layout'
import Image from 'next/image'

const useStyles = makeStyles((theme) =>(
  {
    containerBox: {
      overflow: 'hidden',
      overflowY: 'scroll',
      height: `auto`,
      [theme.breakpoints.up('md')]: {
        height: `calc(100vh - 56px)`,
      },
    },
    subContainerBox: {
      overflow: 'hidden',
      overflowY: 'scroll',
      height: `auto`,
      [theme.breakpoints.up('md')]: {
        maxHeight : `calc(100vh - 174px)`,
      },
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
    neumoButton: {
      transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
      color: "rgb(69, 90, 100)",
      boxShadow: "0 2px 4px -2px #21253840",
      backgroundColor: "white",
      border: "1px solid rgba(92, 147, 187, 0.17)",
      "&:hover":{
        backgroundColor: "rgba(239, 246, 251, 0.6)",
        borderColor: "rgb(207, 220, 230)"
      }
    },
    featuredBox: {
      transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
      color: "rgb(69, 90, 100)",
      boxShadow: "rgb(0 0 0 / 10%) 0px 2px 4px -2px",
      backgroundColor: "white",
      border: "1px solid rgba(92, 147, 187, 0.17)",
      borderRadius: "12px",
    }
  })
);

const Cases = React.memo(() => {
  const classes = useStyles();
  const t = useTranslation();
  const router = useRouter()
  const user = useObservable("user",user$)
  // const myPatients = useObservable("patients", myPatients$)
  // const allPatients = useObservable("allPatients", allPatients$)
  const cases = useObservable("cases", cases$);

  const createNewCase =  async () => {
    const caseId = nanoid()
    router.push({pathname:`cases/${caseId}`,query:{newItem:true}})
  }
  const selectNewCase = (id)=>() => {
    router.push({pathname:`cases/${id}`})
  }

  return <>
    <Box> 
      <Grid container justifyContent="center">
        <Grid item xs={12} lg={9} display="flex" justifyContent="center" alignItems="center">
          <Box p={2} width={1}>
            {user.data?.uid  && <>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight="bold" sx={{mt:1,mb:2}}>最近の症例</Typography>
                {
                  cases?.data?.length>0 && (<Button onClick={createNewCase} disableElevation size="small" className={classes.neumoButton} startIcon={<Add/>}>{t["Add"]}</Button>)
                }
              </Stack>
              <Grid container width={1} spacing={{xs:0,md:2}}>
                {cases?.data?.map(c => (
                  <Grid item xs={12} md={6} lg={4} sx={{mb:{xs:2,md:0}}}>
                    <Stack onClick={selectNewCase(c.id)} sx={{boxShadow:"0 3px 6px -2px #000a3c33",borderRadius:"9px", overflow:"hidden", cursor:"pointer",height:"100%",transition: "box-shadow .2s", "&:hover":{boxShadow:"0 6px 12px -4px #001b4433"}}}>
                      <Stack direction="column" justifyContent="center" alignItems="center" backgroundColor="#ffc5c5ab" py={1}>
                        <Typography sx={{fontSize:{xs:"35px",md:"46px"}}}>{c.emoji || "😊"}</Typography>
                      </Stack>
                      <Stack sx={{backgroundColor:"white", p:1.5, justifyContent:"flex-end",flexGrow:1}}>
                        <Typography variant='subtitle1' fontWeight="bold" textAlign="left">{c.name}</Typography>
                        <div style={{flexGrow:1}}/>
                        <Stack direction="row" my={.5}>{c.tags?.map(tag=><Box sx={{color:"#f86684",background:"#ffc5c545",fontSize:"10px",borderRadius:"4px",padding:"2px 5px",margin:"3px 7px 3px 0"}}>{tag}</Box>)}</Stack>
                        <Stack direction="row" justifyContent="center" alignItems="center">
                          <Avatar sx={{ width: 24, height: 24 }}>
                            {c?.photoURL ? <Image src={c?.photoURL} layout='fill' alt="userPhoto"/> : c?.displayName[0]}
                          </Avatar>
                          <Typography variant="body2" sx={{mx:1}} >{c.displayName}</Typography>
                          <Typography  variant="body2" sx={{color:"#6e7b85"}}>{formatDateDiff(new Date(),c.updatedAt?.toDate())}</Typography>
                          <div style={{flexGrow:1}}/>
                          <FavoriteBorder fontSize="small" sx={{color:"#6e7b85"}}/>
                          <Typography variant="body2" sx={{color:"#6e7b85"}}>{c.favs}</Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Grid>
                ))}
                {
                  (cases?.data?.length==0) && <Stack direction="column" width={1} justifyContent="center" alignItems="center" display="flex">
                    <Stack direction="column" p={2} mt={3} justifyContent="center" alignItems="center" className={classes.featuredBox}>
                      <Typography variant="subtitle1" sx={{mt:2, fontWeight:"bold",textAlign:"center",color:"gray"}}>{t["MakeANewCase"]}</Typography>
                      <Box sx={{display:"flex",justifyContent:"center",width:1,height:"200px"}}>
                        <Lottie loop animationData={DoctorPrescription} play style={{ objectFit:"contain" }} />
                      </Box>
                      <Button onClick={()=>{createNewCase()}} variant='contained' sx={{fontWeight:"bold"}}>{t["Add"]}</Button>
                    </Stack>
                  </Stack>
                }
              </Grid>            
            </>}
            <Typography variant="h5" fontWeight="bold" sx={{mb:1,mt:2}}>{t["SharedPatients"]}</Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
    <Box className={classes.background}/>
  </>
})

Cases.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

export default Cases

