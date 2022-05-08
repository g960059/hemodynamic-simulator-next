import React,{ useEffect, useRef,useState,useCallback}  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack,Link, CircularProgress, Tab,Avatar, useMediaQuery,Snackbar, IconButton,Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,Slider} from '@mui/material'
import {CalendarToday, Facebook, Twitter, Link as LinkIcon, FavoriteBorderOutlined, ExpandMore, FavoriteBorder, Favorite} from "@mui/icons-material"
import { makeStyles} from '@mui/styles';
import { useRouter } from 'next/router'
import Footer from "../../../src/components/Footer"
import {auth,db} from '../../../src/utils/firebase'
import {doc, getDoc,writeBatch,increment, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp} from 'firebase/firestore';
import Layout from "../../../src/components/layout"
import {format} from "date-fns";
import {TwitterTweetEmbed } from 'react-twitter-embed';
import tocbot from 'tocbot'
import clsx from 'clsx';
import { user$ } from '../../../src/hooks/usePvLoop';
import { useObservable } from 'reactfire';
import { docData } from 'rxfire/firestore';
import {  mergeMap} from 'rxjs';
import { useAuthState } from 'react-firebase-hooks/auth';
import { nanoid } from 'nanoid';

const useStyles = makeStyles((theme) =>({
  background: {
    position: "fixed",
    zIndex: -1,
    top: "0px",
    left: "0px",
    width: "100%",
    overflow: "hidden",
    transform: "translate3d(0px, 0px, 0px)",
    height: "-webkit-fill-available",
    background: "white",
    opacity: 1,
    userSelect: "none",
    pointerEvents: "none"
  },
  shadowBox:{
    backgroundColor:"white",
    boxShadow:"0 2px 4px #4385bb12",
    [theme.breakpoints.up('md')]: {
      borderRadius:"12px",
    }
  },
  textLink:{
    textDecoration: "none",textUnderlineOffset: "0.15em",transition: ".25s",color:"#0f83fd","&:hover":{textDecoration:"underline"}
  },
  asideBox: {
    [theme.breakpoints.down('md')]: {
      display: "none",
      overflow: "hidden",
      width:0
    }
  },
  tocBox :{
    fontSize: "14px",
    lineHeight: "1.5",
    "& ol":{
      position:"relative",
      "padding": "0",
      "listStyle": "none"
    },
    "& li":{
      "position": "relative",
      "fontWeight": "700",
      "marginTop": "5px",
      "paddingLeft": "21px",
    },
    "& a.toc-link":{
      "height":"100%","textDecoration":"none","color":"#6e7b85","position":"relative","margin":"8px 0","transition":"none","overflow":"hidden","display":"block","WebkitBoxOrient":"vertical","WebkitLineClamp":"2","maxHeight":"3.05em","textUnderlineOffset":"0.15em",
      "&:hover,&.active":{
        color:"black"
      }
    },
    "& li.is-active-li a.toc-link":{
      "color":"black"
    },
    "& ol li.toc-list-item::before":{"left":"0","top":"4px","width":"12px","height":"12px","background":"#cae4ff","border":"2px solid #fff","content":'""',"position":"absolute","borderRadius":"50%"},
    "& ol li.is-active-li.toc-list-item::before":{background:"#3ea8ff",border:"2px solid #e5f2ff"},
    "& a.toc-link::before":{display:"none"}
  },
  faintNeumoButton: {
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    color: "#b3b3b3",
    backgroundColor: "#f1f4f9",
    border: "none",
    "&:hover":{
      backgroundColor: "#fff2f2",
      color: "#ec407a"
    },
    "& .MuiOutlinedInput-notchedOutline": {border:"none"}
  },  
  favoritedButton: {
    color: "#f76685",
    backgroundColor: "#ffeaf4",
    border: "none",
    "& .MuiOutlinedInput-notchedOutline": {border:"none"}
  }, 
  faintNeumoBlackButton: {
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    color: "#b3b3b3",
    backgroundColor: "#f1f4f9",
    border: "none",
    "&:hover":{
      backgroundColor: "#fff2f2",
      color: "#000000d1"
    },
    "& .MuiOutlinedInput-notchedOutline": {border:"none"}
  }, 
}),
);


const ArticleReader = ({article,user}) => {
  const classes = useStyles();
  const router = useRouter()
  const [heartDiff, setHeartDiff] = useState(0);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [followerDiff, setFollowerDiff] = useState(0);

  const followedUser = useObservable("following"+user.uid, docData(doc(db,"followers",user.uid)));
  const isFollowing = followedUser.status="success" && followedUser.data?.users?.includes(auth.currentUser?.uid);
  const follow = async () => {
    if(!followedUser.data?.users){
      await setDoc(doc(db,"followers",user.uid),{users: [auth.currentUser?.uid]})
    }else{
      await updateDoc(doc(db,"followers",user.uid),{users: arrayUnion(auth.currentUser?.uid)})
    }
    setFollowerDiff(followerDiff+1)
  }
  const unfollow = async () => {
    await updateDoc(doc(db,"followers",user.uid),{users: arrayRemove(auth.currentUser?.uid)})
    setFollowerDiff(followerDiff-1)
  }

  const heart = useObservable('/articles/'+article.id+'/heart', user$.pipe(
    mergeMap(currentUser => docData(doc(db,'users',user.uid,'articles',article.id,'hearts',currentUser.uid))))
  ) 
  const addHeart = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if(!uid) return
    const batch = writeBatch(db);
    batch.update(doc(db,`users/${user.uid}/articles/${article.id}`),{heartCount:increment(1)})
    batch.update(doc(db,`users/${user.uid}`),{articleHeartCount:increment(1)})
    batch.set(doc(db,`users/${user.uid}/articles/${article.id}/hearts/${uid}`),{uid})
    batch.set(doc(db, `users/${uid}/favorites/${article.id}`),{articleId:article.id,type:"article",authorId:user.uid, timestamp: serverTimestamp()})
    await batch.commit()
    setHeartDiff(prev=>prev+1);
  },[article.id])

  const removeHeart = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if(!uid) return
    const batch = writeBatch(db);
    batch.update(doc(db,`users/${user.uid}/articles/${article.id}`),{heartCount:increment(-1)})
    batch.update(doc(db,`users/${user.uid}`),{articleHeartCount:increment(-1)})
    batch.delete(doc(db,`users/${user.uid}/articles/${article.id}/hearts/${uid}`))
    batch.delete(doc(db, `users/${uid}/favorites/${article.id}`))
    await batch.commit()
    setHeartDiff(prev=>prev-1);
  },[article.id])

  useEffect(() => {
    tocbot.init({
      tocSelector: '.toc',
      contentSelector: '.article',
      headingSelector: 'H5.plateH1, H6.plateH2',
      collapseDepth: 6,
    })
    return () => tocbot.destroy()
  }, [])



  return <Box width={1}>
    {
      article && <>
        <Stack width={1} justifyContent="center" alignItems="center"  className="bg-blue-50">
          <Stack maxWidth="1120px" width={1} pt={isUpMd?6:4} pb={isUpMd?4:4} px={2} justifyContent="center" alignItems="center" >
            <Box display="flex" justifyContent="center" alignItems="center">
              <Typography sx={{fontSize:"80px"}}>{article.emoji || "😊"}</Typography>
            </Box>
            <Typography variant='h4' fontWeight="bold" >{article.name || "無題の記事"}</Typography>
            <Stack direction="row" sx={{color:"#6e7b85",mt:3,alignItems:"center"}} >
              <CalendarToday fontSize='small'/> 
              <Typography  variant="subtitle1" sx={{ml:1}}>{format(new Date(article.updatedAt?.seconds*1000),'yyyy年M月dd日') }</Typography>
            </Stack>
          </Stack>
          <Box display="flex" maxWidth="1120px" width={1} justifyContent="space-between" >
            <Box className={clsx(classes.shadowBox, "article w-full md:mr-6")} px={{xs:"14px",md:5}} py={5} mb={{xs:0,md:5}} >
              {
                article?.body.map(n=>serialize(n)) 
              }
              <Stack direction="row" justifyContent="center" mt={5}>
                <Stack direction="row" >
                  {heart.status=="success" && 
                    (heart.data ? <IconButton onClick={removeHeart} className={classes.favoritedButton} sx={{}}><Favorite sx={{width:"33px"}}/></IconButton>
                    : <IconButton onClick={addHeart} className={classes.faintNeumoButton}><FavoriteBorder sx={{width:"33px"}}/></IconButton>)
                  }
                  <Typography variant="subtitle1" sx={{margin:"auto 0px auto 8px"}} color="secondary">{article.heartCount +heartDiff}</Typography>
                </Stack>
                <div style={{flexGrow:1}}/>
                <IconButton className={classes.faintNeumoBlackButton} sx={{backgroundColor:"transparent !important"}}><ExpandMore fontSize='large'/></IconButton>
                <a href={`https://twitter.com/intent/tweet?url=${typeof window !== 'undefined' &&  window.location.href}`} data-size="large"><IconButton className={classes.faintNeumoBlackButton} sx={{ml:.5,backgroundColor:"transparent !important"}}><Twitter fontSize='large'/></IconButton></a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== 'undefined' &&  window.location.href}`} target="_blank" data-size="large"><IconButton className={classes.faintNeumoBlackButton} sx={{ml:.5,backgroundColor:"transparent !important"}}><Facebook fontSize='large'/></IconButton></a>
              </Stack>
              <Box sx={{borderTop:"solid 1px #5c93bb2b", width:1,mt:2,pt:3}}>
                <Stack direction="row">
                  <Avatar src={user?.photoURL} sx={{width:"60px",height:"60px",mr:2,cursor:"pointer"}} onClick={()=>{router.push(`/${user.userId}`)}}>
                    {user?.displayName[0]}
                  </Avatar> 
                  <Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant='h6' onClick={()=>{router.push(`/${user.userId}`)}} sx={{cursor:"pointer", mr:2}}>{user?.displayName}</Typography>
                      {isFollowing ? <Button className='font-bold text-white' variant="contained" onClick={unfollow} disableElevation size="small">フォロー中</Button> : <Button variant="outlined" onClick={follow} size="small">フォローする</Button>}
                    </Stack>
                    {user?.description  && <Typography variant="body1" sx={{my:1}}>{user?.description}</Typography>}
                    <Stack direction="row" spacing={isUpMd ? 1.5 :1.5}>
                      {user?.twitterUserName && <a href={"https://twitter.com/"+user?.twitterUserName} target="_blank" style={{color:"#93a5b1"}}><Twitter sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                      {user?.facebookUserName && <a href={"https://facebook.com/"+user?.facebookUserName} target="_blank" style={{color:"#93a5b1"}}><Facebook sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                      {user?.url && <a href={user?.url} target="_blank" style={{color:"#93a5b1"}}><LinkIcon sx={{"&:hover":{color:"#000000d1"}}}/></a>}                      
                    </Stack>
                  </Stack>
                </Stack>
                
              </Box>
            </Box>
            <aside style={{width:"320px"}} className={classes.asideBox}> 
              <Stack  spacing={3} position="sticky" sx={{top:"30px",maxHeight: "calc(100vh - 50px)",height:"100%" }}>
                <Box className={classes.shadowBox} p={2.5} width="320px">
                  <Stack direction="row">
                    <Avatar src={user?.photoURL} sx={{width:"60px",height:"60px",mr:1,cursor:"pointer"}} onClick={()=>{router.push(`/${user.userId}`)}}>
                      {user?.displayName[0]}
                    </Avatar> 
                    <Stack>
                      <Typography variant='h6' onClick={()=>{router.push(`/${user.userId}`)}} sx={{cursor:"pointer"}}>{user?.displayName}</Typography>
                      <Stack direction="row" spacing={isUpMd ? 1.5 :1}>
                        {user?.twitterUserName && <a href={"https://twitter.com/"+user?.twitterUserName} target="_blank" style={{color:"#93a5b1"}}><Twitter sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                        {user?.facebookUserName && <a href={"https://facebook.com/"+user?.facebookUserName} target="_blank" style={{color:"#93a5b1"}}><Facebook sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                        {user?.url && <a href={user?.url} target="_blank" style={{color:"#93a5b1"}}><LinkIcon sx={{"&:hover":{color:"#000000d1"}}}/></a>}
                        {isFollowing ? <Button variant="contained" className='font-bold text-white' onClick={unfollow} disableElevation size="small">フォロー中</Button> : <Button variant="outlined" onClick={follow} size="small">フォローする</Button>}
                      </Stack>
                    </Stack>
                  </Stack>
                  {user?.description && <Typography variant="body1" sx={{mt:2}}>{user?.description}</Typography>}
                </Box>
                <div className='p-5 w-80 bg-white shadow-sm rounded-xl'>
                  <div className='text-sm font-bold mb-1'>目次</div>
                  <div className={clsx(classes.tocBox, "toc")}/>
                </div>
              </Stack>
            </aside>
          </Box>  
        </Stack>  
      </>
    }
    <Footer/>
  </Box>
}

ArticleReader.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

export default ArticleReader;

export const getStaticPaths= async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};



export const getStaticProps = async (ctx) => {
  const { userId,articleId } = ctx.params
  const convertTimestampToJson = (data)=>{
    const newData = {...data}
    if(data?.updatedAt){
      newData.updatedAt = data.updatedAt.toJSON()
    }
    if(data?.createdAt){
      newData.createdAt = data.createdAt.toJSON()
    }
    return newData
  }
  const uidSnap = await getDoc(doc(db,'userIds',userId))
  const uid = uidSnap.data().uid
  const userSnap = await getDoc(doc(db,'users',uid))
  const user = {...convertTimestampToJson(userSnap.data()),uid}
  const articleSnap = await getDoc(doc(db,'users',uid,'articles',articleId))
  const article = {...convertTimestampToJson(articleSnap.data()),id:articleId}
  return {
    props: {user,article},
    revalidate: 1
  }
}

export const serialize = node => {
  const classes = useStyles()
  if(!Object.hasOwn(node,"type") && Object.hasOwn(node,"text")) {
    let string = node.text
    if (node.bold) {
      string = <strong>{string}</strong>
    }
    if(node.italic){
      string = <em>{string}</em>
    }
    if(node.underline){
      string = <u>{string}</u>
    }
    return string
  }

  const children = node.children?.map(n => serialize(n))

  switch (node.type) {
    case "blockquote":
      return <blockquote style={{fontSize: ".97em",margin: "1.4rem 0",borderLeft: "3px solid #9dacb7", padding: "2px 0 2px .7em",color: "#505c64"}}>{children}</blockquote>
    case 'p':
      return <Typography variant="body1" sx={{lineHeight: 1.9, fontSize: {xs:"16px",md:"17px"}}}>{children}</Typography>
    case 'a':
      return <a href="${escapeHtml(node.url)}" className={classes.textLink}>{children}</a>
    case "h2":
      return <Typography fontWeight="bold" id={children} className="plateH2" variant='h6' sx={{mt: "2.3em",mb: "0.5em",fontSize:{xs:"1.3em",md:"1.5em"}}}>{children}</Typography>
    case "h1":
      return <Typography fontWeight="bold" id={children} className="plateH1" variant='h5' sx={{fontSize:{xs:"1.6em",md:" 1.7em"},pb: "0.2em",mb:"1.1rem",mt: "2.3em",borderBottom: "1px solid #5c93bb2b"}}>{children}</Typography>
    case "ul":
      return <ul style={{margin: "1.4rem 0", lineHeight: 1.7}}>{children}</ul>
    case "ol":
      return <ol style={{margin: "0.4rem 0"}}>{children}</ol>
    case "li":
      return <li style={{margin: "0.4rem 0"}}>{children}</li>
    case "img": 
      return <img src={node.url} style={{margin: "1.5rem auto",display:  "table", maxWidth: "100%",height: "auto"}}/>
    case "media_embed":
      const {url, type} = convertURLtoEmbedURL(node.url)
      const querySeparator = url.includes('?') ? '' : '?';
      if(type == "twitter"){
        return <Box sx={{"& .twitter-tweet-rendered":{m:"0 auto"}}}><TwitterTweetEmbed tweetId={url}/></Box>
      }
      return <Box sx={{width:1, position: "relative",height:0, pb: "calc(56.25% + 38px)", m: "1.5rem 0"}}>
        <iframe
          style={{position: "absolute",top: 0,left: 0, width: "100%",height: "100%"}}
          title="embed"
          src={`${url}${querySeparator}&title=0&byline=0&portrait=0`}
          frameBorder="0"
        />
      </Box>
    case "case-embed":
      return <Box sx={{width:1, position: "relative",height:0, pb: {xs:"80%",md:"calc(56.25% + 38px)"}, m: "1.5rem 0"}}>
        <iframe
          style={{position: "absolute",top: 0,left: 0, width: "100%",height: "100%",border:0,borderRadius:8,overflow:"scroll",border:"1px solid #5c93bb2b"}}
          title="embed"
          src={`${node.url}`}
        />
      </Box>
    default:
      return children
  }
}

export const convertURLtoEmbedURL = (originalURL) => {
  let type,url
  if(originalURL.includes("youtube")){
    const videoId = originalURL.split("watch?v=")[1];
    url = `https://www.youtube.com/embed/${videoId}`;
    type = "youtube"
  }
  if(originalURL.includes("vimeo")){
    const videoId = originalURL.split("vimeo.com/")[1];
    url = `https://player.vimeo.com/video/${videoId}?h=5be51048a4`;
    type = "vimeo"
  }
  if(originalURL.includes("twitter")){
    url = originalURL.split("status/")[1];
    type = "twitter"
  }
  return {url,type}
}