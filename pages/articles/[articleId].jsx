import React, {useRef, useState, useEffect,useCallback} from 'react'
import {Box,Typography, Divider,AppBar, Toolbar,Button,IconButton,Stack,Switch,Dialog,DialogContent,DialogActions,DialogTitle,Popover,Autocomplete,TextField,TextareaAutosize,useMediaQuery,Slide} from '@mui/material'
import {ArrowBack,Add,Check,Tune,Close,FormatQuote, FormatStrikethrough,FormatBold,FormatItalic,FormatUnderlined,Link as LinkIcon, FormatListBulleted, FormatListNumbered, OndemandVideo,ImageOutlined} from '@mui/icons-material';
import {user$,cases$} from '../../src/hooks/usePvLoop'
import { useRouter } from 'next/router'
import {a11yProps, TabPanel} from '../../src/components/TabUtils'
import { makeStyles } from '@mui/styles';
import {useTranslation} from '../../src/hooks/useTranslation'
import ReactiveInput from "../../src/components/ReactiveInput";

import {useObservable} from "reactfire"
import {db, storage, auth} from "../../src/utils/firebase"
import { mergeMap,filter,tap,map} from "rxjs/operators";
import { docData, collectionData} from 'rxfire/firestore';
import {collection,doc, updateDoc,serverTimestamp, setDoc} from 'firebase/firestore';
import { useImmer } from "use-immer";
import { nanoid } from 'nanoid'
import isEqual from "lodash/isEqual"
import {readFile,objectWithoutKeys,getRandomEmoji,formatDateDiff} from "../../src/utils/utils"
import { Picker } from 'emoji-mart'
import Lottie from 'react-lottie-player' 
import LoadingAnimation from "../../src/lotties/LoadingAnimation.json"
import { Plate,createPlugins,createPlateUI, createParagraphPlugin, createBlockquotePlugin, createHeadingPlugin,createLinkPlugin,createImagePlugin,HeadingToolbar, usePlateEditorRef, getPluginType,BlockToolbarButton,ELEMENT_H1,ELEMENT_H2,ELEMENT_BLOCKQUOTE,toggleNodeType,LinkToolbarButton,ListToolbarButton,MediaEmbedToolbarButton,ImageToolbarButton,ELEMENT_DEFAULT,MarkToolbarButton, MARK_BOLD, MARK_ITALIC, MARK_UNDERLINE,createBasicMarksPlugin,createListPlugin,createSelectOnBackspacePlugin,MARK_STRIKETHROUGH, ELEMENT_UL, ELEMENT_OL, ELEMENT_MEDIA_EMBED, createPluginFactory,MediaEmbedUrlInput, getMediaEmbedElementStyles, setNodes, getRootProps, ELEMENT_IMAGE, getParent, insertNodes,ToolbarButton,insertMediaEmbed,BalloonToolbar, createResetNodePlugin, ELEMENT_PARAGRAPH,isBlockAboveEmpty,isSelectionAtBlockStart} from '@udecode/plate'
import Sticky from 'react-stickynode';
import { ref, getDownloadURL ,uploadString,uploadBytesResumable} from "firebase/storage";
import { FaTwitter, FaSlideshare,FaYoutube,FaVimeo,FaSpeakerDeck} from 'react-icons/fa';

const ELEMENT_CASE_EMBED = 'case-embed';
const useStyles = makeStyles((theme) =>(
  {
    appBar: {
      [theme.breakpoints.up('xs')]: {
        backgroundColor: 'transparent',
        color: 'inherit'
      },
    },
    appBarRoot: {
      [theme.breakpoints.up('xs')]: {
        backgroundColor: 'transparent',
        color: 'inherit'
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
      background: "radial-gradient(50% 50% at 50% 50%, #3ea8ff 0%, #f5f5f5 100%)",
      opacity: 0.15,
      userSelect: "none",
      pointerEvents: "none"
    },
    socialIcon: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "30px",
      height: "30px",
      borderRadius: "10px",
      color: "#fff",
      marginRight: "8px",
    },
    plateBox:{
      boxShadow:"0 10px 20px #4b57a936",
      width:"100%",
      minHeight:"500px",
      borderRadius:"10px", 
      backgroundColor:"white",
      lineHeight: 1.9, 
      [theme.breakpoints.up('md')]: {
        marginBottom:"40px",
        marginTop:"32px",
        padding:"32px 40px",
      },
      [theme.breakpoints.down('md')]: {
        margin: "10px 8px"
      },
      overflow:"hidden", 
      "& .slate-HeadingToolbar":{
        padding:0
      },
      "& h1.slate-h1":{
        fontSize:" 1.7em",paddingBottom: "0.2em",marginBottom:"1rem",marginTop: "1em",borderBottom: "1px solid #5c93bb2b"
      },
      "& h2.slate-h2":{
        marginTop: "1em",marginBottom: "0.5em",fontSize:"1.5em"
      }
    }    
  })
);

const editableProps = {
  placeholder: 'type...',
  spellCheck: false,
  style: {
    padding: '15px',
  },
};


const Article = () => {
  const classes = useStyles();
  const t = useTranslation();
  const router = useRouter()
  const {data:user} = useObservable("user",user$)

  const loadedArticle = useObservable("article"+router.query.articleId,user$.pipe(
    filter(user => !!user?.uid),
    mergeMap(user => docData(doc(db,'users',user?.uid,"articles",router.query.articleId))),
  ))

  const [loading, setLoading] = useState(true);
  const [articleData, setArticleData] = useImmer({});
  const [defaultArticleData, setDefaultArticleData] = useState({});
  const [articleNameEditing, setArticleNameEditing] = useState(false);
  const [openPublishDialog, setOpenPublishDialog] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'), {noSsr: true});
  const isUpLg = useMediaQuery((theme) => theme.breakpoints.up('lg'), {noSsr: true});

  const isChanged = loadedArticle.status == "success" && (loadedArticle.data &&
    (!isEqual(objectWithoutKeys(articleData,["updatedAt","createdAt"]),objectWithoutKeys(loadedArticle.data,["updatedAt","createdAt"]))) || !loadedArticle.data);

  useEffect(() => {
    setLoading(true)
    if(loadedArticle.status == "success" && loadedArticle.data?.body){
      setArticleData(loadedArticle.data)
    }else{
      if(router.query.newItem){
        const newArticle = {
          name:"",
          visibility: "private",
          emoji: getRandomEmoji(),
          tags:[],
          body:[{children:[{text:""}], type:"p"}],
          heartCount:0,
          userId: user?.userId,
          uid: user?.uid,
          displayName: user?.displayName,
          photoURL: user?.photoURL,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        }
        setArticleData(newArticle);
        setDefaultArticleData(newArticle);
      }
    }
    setLoading(false)
  }, [loadedArticle.status]);


  const updateArticle = async () =>{
    const timestamp = serverTimestamp();
    if(!loadedArticle.data?.createdAt){
      await setDoc(doc(db,'users',user?.uid,"articles",router.query.articleId),{...articleData,updatedAt:timestamp,createdAt:timestamp})
    }else{
      await updateDoc(doc(db,'users',user?.uid,"articles",router.query.articleId),{...articleData,updatedAt:timestamp})
    }
  }

  

  return <>
      <AppBar position="static" elevation={0} className={classes.appBar} classes={{root:classes.appBarRoot}}>
        <Toolbar>
          <Box onClick={()=>{router.push("/dashboard/articles")}} sx={{cursor:"pointer",fontFamily: "GT Haptik Regular" ,fontWeight: 'bold',display:"flex",ml:{xs:0,md:2}}}>
            <IconButton><ArrowBack/></IconButton>
          </Box>
          <div style={{flexGrow:1}}/>
          <IconButton sx={{ml:.5}} onClick={()=>{setOpenPublishDialog(true)}}><Tune/></IconButton>
          <Switch checked={articleData.visibility=="public"} onChange={e=>{const newVal = e.target.checked ? "public":"private"; setArticleData(draft =>{draft.visibility=newVal})}}/>
          <Typography variant='button' sx={{color:articleData.visibility=="public" ? "black": "gray", mr:1}}>{t["Publish"]}</Typography>
          <Button 
            variant='contained' 
            disableElevation 
            className="font-bold text-white"
            onClick={articleData.visibility=="private" || articleData.visibility=="public" && loadedArticle.data?.visibility=="public" ? ()=>{updateArticle()} : ()=>{setOpenPublishDialog(true)}}
            disabled={!isChanged}
            endIcon = {!isChanged&&<Check/>}
          >
            {isChanged ? (articleData.visibility=="private" ? "下書き保存" : (articleData.visibility=="public" && loadedArticle.data?.visibility=="public" ? "保存する" : t["Publish"] )) : t["Saved"]}
          </Button>
          <Dialog open={openPublishDialog} onClose={()=>setOpenPublishDialog(false)} sx={{minHeight:'340px'}}>
            <DialogTitle >
              記事の設定
            </DialogTitle>
            <DialogContent>
              <Stack direction="row" sx={{backgroundColor:"#edf2f6",borderRadius:"10px",color:"#6e7b85",mb:2,mt:1,p:2,position:"relative",alignItems:"center"}}>
                <Box onClick={e=>{setEmojiAnchorEl(e.currentTarget)}} sx={{fontSize:"50px",cursor:"pointer"}}>{articleData.emoji}</Box>
                <Popover open={Boolean(emojiAnchorEl)} anchorEl={emojiAnchorEl} onClose={()=>{setEmojiAnchorEl(null)}} anchorOrigin={{vertical: 'bottom',horizontal:'left'}}>
                  <Picker emoji={articleData.emoji} onSelect={newEmoji=>{setArticleData(draft=>{draft.emoji = newEmoji.native})}} showPreview={false} showSkinTones={false}/>
                </Popover>
                <Divider orientation="vertical" flexItem sx={{mx:2}}/>
                <Typography variant='subtitle2'>アイキャッチ絵文字を変更する</Typography>
              </Stack>
              <Typography variant='subtitle1' fontWeight="bold" sx={{mt:2}}>Tags</Typography>
              <Stack direction="column">
                <Typography variant="caption" color="#6e7b85">関連するタグを選んでください。</Typography>
                <Typography variant="caption" color="#6e7b85">最初のタグが一覧で表示されます。</Typography>
              </Stack>
              <Box mt={1}>
                <Autocomplete 
                  freeSolo multiple value={articleData.tags} 
                  onChange={(e,newTags)=>{setArticleData(draft=>{draft.tags=newTags})}}
                  options={[]}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                    />)}
                  sx={{ "&.MuiAutocomplete-root":{
                    backgroundColor: '#f1f5f9',
                    borderRadius: '4px',
                    border: '1px solid #5c93bb2b',
                    '&:hover': {
                      borderColor: '#3ea8ff',
                    },
                    "& .MuiOutlinedInput-root":{padding:"3px 9px"},
                    "& .MuiInput-input": {border: 'none',padding: '8px 0 8px 16px'},
                    "& p.MuiTypography-root":{
                      fontSize: "0.7rem"
                    },
                    "& .Mui-focused .MuiOutlinedInput-notchedOutline":{border:"none"}
                  }}}
                  />
              </Box>
            </DialogContent>
            <DialogActions sx={{display:"flex", justifyContent:"center",mb:2}}>
              <Button onClick={()=>{updateArticle();setOpenPublishDialog(false)}} variant='contained' disableElevation disabled={!isChanged} className='font-bold text-white' >
                {isChanged ? (articleData.visibility=="private" || articleData.visibility=="public" && loadedArticle.data?.visibility=="public" ? t["Save"] : t["Publish"]) : t["Saved"]}
              </Button>
            </DialogActions>
          </Dialog>
        </Toolbar>
      </AppBar>   
      <div className={classes.background}/>
      <div className='w-full max-w-4xl mx-auto'>
        <div className="pt-7 w-full">
          <TextareaAutosize
            type="text" autoFocus 
            value={articleData.name} 
            onChange={e=>{setArticleData(draft=>{draft.name=e.target.value ?? "Title"})}} 
            placeholder="Title"
            className="appearance-none w-full font-bold mx-2 text-xl prose prose-xl md:text-3xl py-1 px-1 border-0 bg-transparent placeholder-slate-400 focus:outline-none hover:bg-blue-50 resize-none" 
          />
        </div>
        {loading && <Box>
            <Lottie loop animationData={LoadingAnimation} play style={{ objectFit:"contain" }} />
          </Box>
        }
        {loadedArticle.status=="success" &&articleData.body&& !loading && (isUpMd != null && isUpMd != undefined) && <>
          <Stack direction="row" pb={{xs:10,md:8}}>
            <Box className={classes.plateBox}>
              <Plate 
                id={"article_"+router.query.articleId} 
                editableProps={editableProps} 
                initialValue={articleData.body} 
                onChange={newValue=>{setArticleData(draft=>{draft.body=newValue})}}
                plugins={createPlugins([
                  createParagraphPlugin(),
                  createBlockquotePlugin(),
                  createHeadingPlugin(),
                  createLinkPlugin(),
                  createListPlugin(),
                  createMediaEmbedPlugin(),
                  createCaseEmbedPlugin(),
                  createBasicMarksPlugin(),
                  createImagePlugin({
                    uploadImage: (file) => {
                      const imageId = nanoid()
                      const storageRef = ref(storage, `images/${user.uid}/articles/${router.query.articleId}/${imageId}`);
                      const metaData = {contentType: file.type}
                      const uploadTask = uploadBytesResumable(storageRef, file, metaData);
                      uploadTask.on('state_changed',snapshot => {
                          console.log(snapshot.bytesTransferred/snapshot.totalBytes*100)
                        },
                        err => {alert("エラー: この画像はアップロードできません")},
                        () => {
                          return getDownloadURL(uploadTask.snapshot.ref).then(url=>{
                            console.log(url)
                            return url
                          })
                        }
                      )
                    }
                  }),
                  createResetNodePlugin({
                    options: {
                      rules: [
                        {
                          types: [ELEMENT_BLOCKQUOTE],
                          defaultType: ELEMENT_PARAGRAPH,
                          hotkey: 'Enter',
                          predicate: isBlockAboveEmpty,
                        },
                        {
                          types: [ELEMENT_BLOCKQUOTE],
                          defaultType: ELEMENT_PARAGRAPH,
                          hotkey: 'Backspace',
                          predicate: isSelectionAtBlockStart,
                        },
                      ],
                    }
                  }),
                  createSelectOnBackspacePlugin({
                    options: {
                      query: {
                        allow: [ELEMENT_MEDIA_EMBED,ELEMENT_IMAGE],
                      },
                    },
                  }),
                ],{components:{...createPlateUI(),[ELEMENT_MEDIA_EMBED]:MediaEmbedElement, [ELEMENT_CASE_EMBED]:CaseEmbedElement}})}
              >
                <BalloonToolbar theme="light">
                  <BasicElementToolBarButtons/>
                </BalloonToolbar>
              </Plate>
            </Box>
            {isUpMd && <Sticky top={160} >
              <Stack spacing={2} sx={{pl:3}}>
                {/* <MediaEmbedToolbarButton icon={<OndemandVideo/>}/> */}
                <CaseEmbedButtton icon={<Typography variant='caption' sx={{fontWeight:"bold",px:.8,py:.4,whiteSpace:"nowrap"}}>症例</Typography>}/>
                <ImageInsertButton/>
                <MediaEmbedButton/>
              </Stack>
            </Sticky>}
          </Stack>
          { !isUpMd &&  <Stack direction="row" spacing={3} sx={{position:"fixed", bottom:"24px", width:1, justifyContent:"center",alignItems:"center",zIndex:5000}}>
              <CaseEmbedButtton icon={<Typography variant='caption' sx={{fontWeight:"bold",px:.8,py:.4,whiteSpace:"nowrap"}}>症例</Typography>}/>
              <ImageInsertButton/>
              <MediaEmbedButton/>
            </Stack>
          }
        </>
        }
      </div>
  </>
}

export default Article

export const BasicElementToolBarButtons = ()=>{
  const router = useRouter()
  const editor = usePlateEditorRef("article_"+router.query.articleId);
  return (
    <Stack direction="row" sx={{color:"gray",px:{xs:3,md:1.5},py:1,pb:{xs:"10px",md:1},width:"100%",alignItems:"center",overflow:"scroll", "& span.slate-ToolbarButton":{width:"auto",height:"100%"}, "& .slate-ToolbarButton-active,.slate-ToolbarButton:hover":{backgroundColor:"#e5f2ff",color:"#3ea8ff !important", borderRadius:"8px"}}}>
      <BlockToolbarButton type={getPluginType(editor,ELEMENT_H1)} icon={<Typography variant='h5' sx={{fontWeight:"bold",px:.5,}}>T</Typography>}/>
      <Divider flexItem orientation="vertical" sx={{mx:1}}/>
      <BlockToolbarButton type={getPluginType(editor,ELEMENT_H2)} icon={<Typography variant='body1' sx={{fontWeight:"bold",px:.5,}}>T</Typography>}/>
      <Divider flexItem orientation="vertical" sx={{mx:1}}/>
      <BlockToolbarButton type={getPluginType(editor,ELEMENT_BLOCKQUOTE)} icon={<FormatQuote/>}/>
      <Divider flexItem orientation="vertical" sx={{mx:1}}/>
      <MarkToolbarButton type={getPluginType(editor,MARK_BOLD)} icon={<FormatBold/>}/>
      <Divider flexItem orientation="vertical" sx={{mx:1}}/>
      <MarkToolbarButton type={getPluginType(editor,MARK_ITALIC)} icon={<FormatItalic/>}/>
      <Divider flexItem orientation="vertical" sx={{mx:1}}/>
      <MarkToolbarButton type={getPluginType(editor,MARK_UNDERLINE)} icon={<FormatUnderlined/>}/>
      <Divider flexItem orientation="vertical" sx={{mx:1}}/>
      <LinkToolbarButton icon={<LinkIcon/> }/>
      <Divider flexItem orientation="vertical" sx={{mx:1}}/>
      <ListToolbarButton
        type={getPluginType(editor, ELEMENT_UL)}
        icon={<FormatListBulleted/>}
      />
      <Divider flexItem orientation="vertical" sx={{mx:1}}/>
      <ListToolbarButton
        type={getPluginType(editor, ELEMENT_OL)}
        icon={<FormatListNumbered/>}
      />
    </Stack>
  )
}

export const createMediaEmbedPlugin = createPluginFactory({
  key: ELEMENT_MEDIA_EMBED,
  isElement: true,
  isVoid: true,
  then: (editor, { type }) => ({
    deserializeHtml: {
      rules: [
        {
          validNodeName: 'IFRAME',
        },
      ],
      getNode: async (el) => {
        let url = await extract(el.getAttribute('src'))
        if (url) {
          return {
            type,
            url,
          };
        }
      },
    },
  }),
});
export const createCaseEmbedPlugin = createPluginFactory({
  key: ELEMENT_CASE_EMBED,
  isElement: true,
  isVoid: true,
  then: (editor, { type }) => ({
    deserializeHtml: {
      rules: [
        {
          validNodeName: 'IFRAME',
        },
      ],
      getNode: async (el) => {
        let url = await extract(el.getAttribute('src'))
        if (url) {
          return {
            type,
            url,
          };
        }
      },
    },
  }),
});

export const MediaEmbedElement = (props) => {
  const { attributes, children, nodeProps, element, editor } = props;
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const rootProps = getRootProps(props);

  let { url } = element;
  let type = null
  const params = (new URL(url)).searchParams
  const youtubePattern = /(?:http?s?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g;
  
  if(youtubePattern.test(url)){
    const videoId = params.get('v');
    url = `https://www.youtube.com/embed/${videoId}`;
    type = "youtube"
  }
  if(url.includes("vimeo")){
    const videoId = url.split("vimeo.com/")[1];
    url = `https://player.vimeo.com/video/${videoId}?h=5be51048a4`;
    type = "vimeo"
  }
  if(url.includes("twitter")){
    url = `https://twitframe.com/show?url=${url}`;
    type = "twitter"
  }
  const querySeparator = url.includes('?') ? '' : '?';

  const styles = getMediaEmbedElementStyles(props);

  return (
    <div
      {...attributes}
      css={styles.root.css}
      className={styles.root.className}
      {...rootProps}
    >
      <div contentEditable={false}>
        <Box sx={{position: "relative", padding: type =="youtube" && "75% 0px 0px" || type =="vimeo" && "60% 0 0" || type == "twitter" && (isUpMd && "60% 0 0" || !isUpMd && "100% 0 0") || "75% 0px 0px"}}>
          <iframe
            style={{position: "absolute",top: 0,left: 0, width: "100%",height: "100%"}}
            title="embed"
            src={`${url}${querySeparator}&title=0&byline=0&portrait=0`}
            frameBorder="0"
            {...nodeProps}
          />
        </Box>
      </div>
      {children}
    </div>
  );
};

export const CaseEmbedElement = (props) => {
  const { attributes, children, nodeProps, element, editor } = props;
  const rootProps = getRootProps(props);
  let { url } = element;
  const styles = getMediaEmbedElementStyles(props);
  return (
    <div
      {...attributes}
      css={styles.root.css}
      className={styles.root.className}
      {...rootProps}
    >
      <div contentEditable={false}>
        <div
          css={styles.iframeWrapper?.css}
          className={styles.iframeWrapper?.className}
        >
          <iframe
            css={styles.iframe?.css}
            className={styles.iframe?.className}
            title="embed"
            src={`${process.env.NEXT_PUBLIC_HOST}/embed/${url}`}
            {...nodeProps}
            style={{border:0,borderRadius:8,overflow:"scroll",width:"100%",minHeight:"260px",aspectRatio:"2/1.3",border:"1px solid #5c93bb2b"}}
          />
        </div>
      </div>
      {children}
    </div>
  );
};


export const ImageInsertButton = (props)=>{
  const classes = useStyles();
  const router = useRouter()
  const editor = usePlateEditorRef("article_"+router.query.articleId);
  return (
    <label htmlFor={`upload-button`}>
      <input
        accept="image/*"
        className={classes.input}
        id={`upload-button`}
        multiple
        type="file"
        style={{ display: `none` }}

        onChange={async (e)=>{
          e.preventDefault();
          const file =  e.target.files[0];
          const imageId = nanoid()
          const storageRef = ref(storage, `images/${auth.currentUser.uid}/articles/${router.query.articleId}/${imageId}`);
          let imageDataUrl = await readFile(file)
          const snapshot = await uploadString(storageRef, imageDataUrl, 'data_url');
          const url = await getDownloadURL(snapshot.ref);
          insertMediaEmbed(editor, { url,key:ELEMENT_IMAGE});
        }}
      />
      <IconButton className='btn-floating rounded-3xl' component="span" {...props}><ImageOutlined/></IconButton>
    </label>
  )
}


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const CaseEmbedButtton = () => {
  const classes = useStyles();
  const router = useRouter();
  const editor = usePlateEditorRef("article_"+router.query.articleId);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const cases = useObservable("cases",cases$);
  const handleClose = () => {
    setDialogOpen(false);
  };
  return <>
    <Button className='btn-floating' sx={{borderRadius:"2.5rem !important",fontWeight:"bold"}} onClick={()=>{setDialogOpen(true);}} color="inherit">症例</Button>
    <Dialog open={dialogOpen} TransitionComponent={Transition} keepMounted onClose={()=>{handleClose()}} fullScreen={!isUpMd}>
      <DialogTitle sx={{fontWeight:"bold",m: 0, p: 2 }}>
        症例を挿入
        <IconButton onClick={()=>{handleClose();}} sx={{position: 'absolute',right: 8,top: 8,color: (theme) => theme.palette.grey[500]}}><Close/></IconButton> 
      </DialogTitle>
      <DialogContent sx={{width:{md:"580px"}}}>
        <Stack>
          {cases.data?.sort((a,b)=>a.updatedAt<b.updatedAt ? 1 : -1).map(c=>(
            <Stack direction="row" justifyContent="center" alignItems="center" sx={{borderTop:"1px solid #5c93bb2b",py:2}}>
              <Stack direction={isUpMd ?"row":"column"} justifyContent="space-between" alignItems={isUpMd? "center":"flex-start"} sx={{width:1,pr:4}}>
                <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{mb:{xs:1,md:0}}}>
                  <Box className={classes.socialIcon} backgroundColor="#ffc5c5ab"><Box width={18} height={18}>{c.emoji}</Box></Box>
                  <Typography variant='subtitle1' sx={{mr:1,fontWeight:"bold"}}>{c.name || "無題の症例"}</Typography>
                </Stack>
                <Typography variant="caption" sx={{color:"#6e7b85"}}>{formatDateDiff(new Date(),c.updatedAt?.toDate()) + (isEqual(c.updatedAt,c.createdAt) ? "に作成":"に更新")}</Typography>
              </Stack>
              <div style={{flexGrow:1}}/>
              <button className="btn-neumorphic" onClick={()=>{insertMediaEmbed(editor, { url:`${c.uid}/${c.id}`,key:ELEMENT_CASE_EMBED});handleClose()}}>挿入</button>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>    
  </>
  
};


export const MediaEmbedButton = ()=>{
  const classes = useStyles();
  const router = useRouter();
  const editor = usePlateEditorRef("article_"+router.query.articleId);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [twitterURL, setTwitterURL] = useState("");
  const [youtubeURL, setYoutubeURL] = useState("");
  const [slideshareURL, setSlideshareURL] = useState("");
  const [speakerDeckURL, setSpeakerDeckURL] = useState("");
  const [vimeoURL, setVimeoURL] = useState("");

  const handleClose = () => {
    setTwitterURL("");
    setYoutubeURL("");
    setSlideshareURL("");
    setSpeakerDeckURL("");
    setVimeoURL("");
    setDialogOpen(false);
  };

  return <>
    <IconButton className='btn-floating rounded-3xl' onClick={()=>{setDialogOpen(true)}}><Add/></IconButton>
    <Dialog open={dialogOpen} TransitionComponent={Transition} keepMounted onClose={()=>{handleClose()}} fullScreen={!isUpMd}>
      <DialogTitle sx={{fontWeight:"bold",m: 0, p: 2 }}>
        エディターに挿入 
        <IconButton onClick={()=>{handleClose();}} sx={{position: 'absolute',right: 8,top: 8,color: (theme) => theme.palette.grey[500]}}><Close/></IconButton> 
      </DialogTitle>
      <DialogContent sx={{width:{md:"580px"}}}>
        <Stack>
          <Stack direction="row" justifyContent="center" alignItems="center" sx={{borderTop:"1px solid #5c93bb2b",py:2}}>
            <Stack direction={isUpMd ?"row":"column"}>
              <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{width:"150px", mb:{xs:1,md:0}}}>
                <Box className={classes.socialIcon} backgroundColor="rgb(58, 180, 255)"><FaTwitter width={18} height={18}/></Box>
                <Typography variant='subtitle1' sx={{mr:1,fontWeight:"bold"}}>Twitter</Typography>
              </Stack>
              <ReactiveInput value={twitterURL} updateValue={setTwitterURL} type="text" width="240px" placeholder="ツイートのURL"/>
            </Stack>
            <div style={{flexGrow:1}}/>
            <Button className="btn-neumorphic" onClick={()=>{insertMediaEmbed(editor, { url :twitterURL,key:ELEMENT_MEDIA_EMBED});setTwitterURL("");setDialogOpen(false)}}>挿入</Button>
          </Stack>
          <Stack direction="row" justifyContent="center" alignItems="center" sx={{borderTop:"1px solid #5c93bb2b",py:2}}>
            <Stack direction={isUpMd ?"row":"column"}>
              <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{width:"150px", mb:{xs:1,md:0}}}>
                <Box className={classes.socialIcon} backgroundColor="rgb(245, 75, 70)"><FaYoutube width={18} height={18}/></Box>
                <Typography variant='subtitle1' sx={{mr:1,fontWeight:"bold"}}>Youtube</Typography>
              </Stack>
              <ReactiveInput value={youtubeURL} updateValue={setYoutubeURL} type="text" width="240px" placeholder="動画ページのURL"/>
            </Stack>
            <div style={{flexGrow:1}}/>
            <Button className="btn-neumorphic" onClick={()=>{insertMediaEmbed(editor, { url :youtubeURL,key:ELEMENT_MEDIA_EMBED});setYoutubeURL("");setDialogOpen(false)}}>挿入</Button>
          </Stack>
          <Stack direction="row" justifyContent="center" alignItems="center" sx={{borderTop:"1px solid #5c93bb2b",py:2}}>
            <Stack direction={isUpMd ?"row":"column"}>
              <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{width:"150px", mb:{xs:1,md:0}}}>
                <Box className={classes.socialIcon} backgroundColor="rgb(29, 150, 214)"><FaSlideshare width={18} height={18}/></Box>
                <Typography variant='subtitle1' sx={{mr:1,fontWeight:"bold"}}>Slideshare</Typography>
              </Stack>
              <ReactiveInput value={slideshareURL} updateValue={setSlideshareURL} type="text" width="240px" placeholder="embed_code/key/○○の部分"/>
            </Stack>
            <div style={{flexGrow:1}}/>
            <Button className="btn-neumorphic" onClick={()=>{insertMediaEmbed(editor, { url : `https://www.slideshare.net/slideshow/embed_code/key/${slideshareURL}`,key:ELEMENT_MEDIA_EMBED});setSlideshareURL("");setDialogOpen(false)}}>挿入</Button>
          </Stack>
          <Stack direction="row" justifyContent="center" alignItems="center" sx={{borderTop:"1px solid #5c93bb2b",py:2}}>
            <Stack direction={isUpMd ?"row":"column"}>
              <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{width:"150px", mb:{xs:1,md:0}}}>
                <Box className={classes.socialIcon} backgroundColor="rgb(0, 146, 135)"><FaSpeakerDeck width={18} height={18}/></Box>
                <Typography variant='subtitle1' sx={{mr:1,fontWeight:"bold"}}>SpeakerDeck</Typography>
              </Stack>
              <ReactiveInput value={speakerDeckURL} updateValue={setSpeakerDeckURL} type="text" width="240px" placeholder="埋め込みコードのdata-id"/>
            </Stack>
            <div style={{flexGrow:1}}/>
            <Button className="btn-neumorphic" onClick={()=>{insertMediaEmbed(editor, { url :`https://speakerdeck.com/player/${speakerDeckURL}`,key:ELEMENT_MEDIA_EMBED});setSpeakerDeckURL("");setDialogOpen(false)}}>挿入</Button>
          </Stack>
          <Stack direction="row" justifyContent="center" alignItems="center" sx={{borderTop:"1px solid #5c93bb2b",py:2}}>
            <Stack direction={isUpMd ?"row":"column"}>
              <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{width:"150px", mb:{xs:1,md:0}}}>
                <Box className={classes.socialIcon} backgroundColor="#1ab0e3"><FaVimeo width={18} height={18}/></Box>
                <Typography variant='subtitle1' sx={{mr:1,fontWeight:"bold"}}>Vimeo</Typography>
              </Stack>
              <ReactiveInput value={vimeoURL} updateValue={setVimeoURL} type="text" width="240px" placeholder="動画ページのURL"/>
            </Stack>
            <div style={{flexGrow:1}}/>
            <Button className="btn-neumorphic" onClick={()=>{insertMediaEmbed(editor, { url :vimeoURL,key:ELEMENT_MEDIA_EMBED});setVimeoURL("");setDialogOpen(false)}}>挿入</Button>
          </Stack>          
        </Stack>
      </DialogContent>
    </Dialog>
  </>
}

