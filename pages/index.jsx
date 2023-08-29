import React,{ useEffect, useRef, useState }  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack, CircularProgress,Tab, Dialog, DialogContent,DialogContentText,Popover} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';

import {useTranslation} from "../src/hooks/useTranslation"
import { makeStyles} from '@mui/material/styles';
import { useRouter } from 'next/router'
import Footer from "../src/components/Footer"
import {auth,db} from '../src/utils/firebase'
import { useSignInWithGoogle } from 'react-firebase-hooks/auth';

import Layout from "../src/components/layout"
import { doc,collection,collectionGroup, getDocs,getDoc, limit, orderBy, query, where, writeBatch, startAfter} from 'firebase/firestore';
import { collectionData, docData} from 'rxfire/firestore';
import Image from 'next/image'
import { formatDateDiff } from '../src/utils/utils';
import {useObservable} from "reactfire"
import {user$} from '../src/hooks/usePvLoop'
import Link from 'next/link';
import { mergeMap, of, BehaviorSubject, switchMap, map, from, combineLatest } from 'rxjs';
import DeleteMenuItemWithDialog from '../src/components/DeleteMenuItemWithDialog';

const PAGE_SIZE = 20;

const TopPage = ({initialCanvas}) => {
  const t = useTranslation();
  const router = useRouter()
  const canvas$ = user$.pipe(
    mergeMap(user => user ? collectionData(collection(db,'canvas'),{idField: 'id'}): of([])),
  )
  const {data:user} = useObservable(`user_${auth?.currentUser?.uid}`,user$)


  const [signInWithGoogle, _, loading, error] = useSignInWithGoogle(auth);
  const [tabValue, setTabValue] = useState(router.query.tab || "trending");

  const [canvasList, setCanvasList] = useState(initialCanvas);
  const [lastDoc, setLastDoc] = useState();
  const [bookmarkedCanvases, setBookmarkedCanvases] = useState([]);
  const [lastBookmarkDoc, setLastBookmarkDoc] = useState(null);
  const [myCases, setMyCases] = useState([]);
  const [lastMyCasesDoc, setLastMyCasesDoc] = useState(null);

  const loadMoreCanvas = async () => {
    let q = query(
      collectionGroup(db, "canvas"),
      orderBy("updatedAt", "desc"),
      where("visibility", "==", "public"),
      limit(PAGE_SIZE)
    );

    if (lastDoc) {
      q = query(
        collectionGroup(db, "canvas"),
        orderBy("updatedAt", "desc"),
        where("visibility", "==", "public"),
        startAfter(lastDoc), 
        limit(PAGE_SIZE)
      );
    }
    const newCanvasSnap = await getDocs(q);
    const newCanvas = newCanvasSnap.docs.map((doc) => ({id:doc.id, ...doc.data()}));
    if (newCanvas.length) {
      //idが重複していないアイテムのみ追加
      setCanvasList(prevCanvasList =>  [...prevCanvasList, ...newCanvas.filter(c => !prevCanvasList.map(c => c.id).includes(c.id))]);
      setLastDoc(newCanvasSnap.docs[newCanvasSnap.docs.length-1]); // 最後のドキュメントを保存
    }
  };

  const loadMoreBookmarkedCanvases = async () => {
    let q = query(
      collection(db, "bookmarks"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    );
  
    if (lastBookmarkDoc) {
      q = query(
        collection(db, "bookmarks"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastBookmarkDoc),
        limit(PAGE_SIZE)
      );
    }
    
    const newBookmarkSnap = await getDocs(q);
    const newBookmarkedCanvasIds = newBookmarkSnap.docs.map(doc => doc.data().canvasId);
    console.log(newBookmarkedCanvasIds)
    if (newBookmarkedCanvasIds.length) {
      const newBookmarkedCanvas = newBookmarkedCanvasIds.map(canvasId => getDoc(doc(db, "canvas", canvasId)));
      const newBookmarkedCanvasData = await Promise.all(newBookmarkedCanvas);
      setBookmarkedCanvases(prevBookmarkedCanvases => [...prevBookmarkedCanvases, ...newBookmarkedCanvasData.map(doc => ({id:doc.id, ...doc.data()}))]);
      console.log(bookmarkedCanvases)
      setLastBookmarkDoc(newBookmarkSnap.docs[newBookmarkSnap.docs.length-1]);
    }
  };
  const loadMoreMyCases = async () => {
    let q = query(
      collection(db, 'canvas'),
      where("uid", "==", user.uid),
      orderBy("updatedAt", "desc"),
      limit(PAGE_SIZE)
    );
  
    if (lastMyCasesDoc) {
      q = query(
        collection(db, 'canvas'),
        where("uid", "==", user.uid),
        orderBy("updatedAt", "desc"),
        startAfter(lastMyCasesDoc),
        limit(PAGE_SIZE)
      );
    }
  
    const newMyCasesSnap = await getDocs(q);
    const newMyCases = newMyCasesSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    if (newMyCases.length) {
      setMyCases(prevMyCases => [...prevMyCases, ...newMyCases]);
      setLastMyCasesDoc(newMyCasesSnap.docs[newMyCasesSnap.docs.length-1]);
    }
  };

  const removeCanvas = async (canvasId) => {
    const batch = writeBatch(db);
    const canvasRef = doc(db, "canvas", canvasId);
    batch.delete(canvasRef);
    const paramSetsSnapshot = await getDocs(query(collection(db, "paramSets"), where("canvasId", "==", canvasId)));
    paramSetsSnapshot.forEach(paramSetDoc => {
      batch.delete(paramSetDoc.ref);
    });
    const blocksSnapshot = await getDocs(collection(db, "canvas", canvasId, "blocks"));
    blocksSnapshot.forEach(blockDoc => {
      batch.delete(blockDoc.ref);
    });
    await batch.commit();
  }

  useEffect(() => {
    if (user) {
      loadMoreBookmarkedCanvases();
      loadMoreMyCases();
    }
  }, [user]);

  return <Layout>
      <div className='w-full sticky top-0 bg-white mx-auto md:px-10 text-base font-medium text-center text-slate-500 border-solid border-0 border-b border-slate-200'>
        <div className='flex flex-nowrap flex-row justify-center md:justify-start items-center overflow-x-auto -mb-px max-w-7xl '>
          <div onClick={()=>{setTabValue("trending")}} className={`flex flex-row items-center justify-center text-sm px-4 py-2 cursor-pointer transition-all duration-200  border-0 border-solid border-b-2 ${tabValue=="trending"  ? "font-bold text-slate-900  border-blue-500 " : "text-slate-400 border-transparent hover:font-bold hover:text-slate-700 hover:border-gray-300 "}`}>
            <svg className='w-5 h-5 mr-1 hidden md:block' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
            トレンド
          </div>
          <div onClick={()=>{setTabValue("mypage")}} className={`flex flex-row items-center justify-center text-sm px-4 py-2 cursor-pointer transition-all duration-200  border-0 border-solid border-b-2 ${tabValue=="mypage"  ? "font-bold text-slate-900  border-blue-500 " : "text-slate-400 border-transparent hover:font-bold hover:text-slate-700 hover:border-gray-300 "}`}>
            <svg className='w-5 h-5 mr-1 hidden md:block' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            マイページ  
          </div>
          <div onClick={()=>{setTabValue("bookmark")}} className={`flex flex-row items-center justify-center text-sm px-4 py-2 cursor-pointer transition-all duration-200  border-0 border-solid border-b-2 ${tabValue=="bookmark"  ? "font-bold text-slate-900  border-blue-500 " : "text-slate-400 border-transparent hover:font-bold hover:text-slate-700 hover:border-gray-300 "}`}>
            <svg className='w-5 h-5 mr-1 hidden md:block' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            あとで読む 
          </div>          
        </div>
      </div>
      {
        tabValue == "trending" && (
          <div className='max-w-4xl w-full mx-auto py-4 md:py-6 px-4 min-h-[440px]'>
            <div className="grid md:grid-cols-2 gap-4 md:gap-8">
              {
                canvasList.map(c => <CanvasItem canvasItem={c} />)
              }
            </div> 
            {canvasList.length >= PAGE_SIZE  && <div className="mt-4 text-center w-full flex justify-center items-center">
              <button onClick={loadMoreCanvas} className='bg-white shadow stroke-slate-500 text-slate-500 cursor-pointer py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center hover:bg-slate-100 border border-solid border-slate-200 transition'>
                もっと読み込む
              </button>
            </div>}
          </div>
        )
      }
      {
        tabValue=="mypage" && (
          user ? 
          <div className='max-w-4xl w-full mx-auto py-4 md:py-6 px-4 min-h-[440px] '>
            <div className="grid md:grid-cols-2 gap-4 md:gap-8">
              {
                myCases?.map(c=><CanvasItem canvasItem={c} removeCanvas={removeCanvas} isOwner={true}/>)
              }
            </div>
            { myCases.length >= PAGE_SIZE && 
              <div className="mt-4 text-center w-full flex justify-center items-center">
                <button onClick={loadMoreMyCases} className='bg-white shadow stroke-slate-500 text-slate-500 cursor-pointer py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center hover:bg-slate-100 border border-solid border-slate-200 transition'>
                  もっと読み込む
                </button>
              </div>
            }
          </div>  : <UrgeLogin/>
        )
      }
      {
        tabValue == "bookmark"  && (
          user ? 
          <div className='max-w-4xl w-full mx-auto py-4 md:py-6 px-4 min-h-[440px]'>
            <div className="grid md:grid-cols-2 gap-4 md:gap-8">
              {
                bookmarkedCanvases?.map(c => <CanvasItem canvasItem={c} />)
              }
            </div>
            { bookmarkedCanvases.length >= PAGE_SIZE  &&
              <div className="mt-4 text-center w-full flex justify-center items-center">
                <button onClick={loadMoreBookmarkedCanvases}  className='bg-white shadow stroke-slate-500 text-slate-500 cursor-pointer py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center hover:bg-slate-100 border border-solid border-slate-200 transition'>
                  もっと読み込む
                </button>
              </div>
              }
          </div> : <UrgeLogin/>
        )
      }
      <hr className="border-0 border-b border-slate-200"/>
      <Footer/>
  </Layout>
}




export const CanvasItem = ({canvasItem,removeCanvas=null, isOwner=false}) => {
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState(null);
  return <>
    <div key={canvasItem?.id} onClick={(e)=>{e.preventDefault();e.stopPropagation();router.push({pathname:`/canvas/${canvasItem?.id}`})}}  className="w-full flex flex-col py-3 px-4 bg-white cursor-pointer border border-solid border-slate-200 rounded-md overflow-hidden hover:shadow transition">
      <div className='flex flex-row items-center'>
        {canvasItem?.photoURL ?
          <div className="h-8 w-8 rounded-full overflow-hidden" onClick={(e)=>{e.stopPropagation(); router.push(`/users/${canvasItem.userId}`)}}>
            <Image src={canvasItem?.photoURL} height="32" width="32" alt="userPhoto"/>
          </div> :
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={(e)=>{e.stopPropagation();router.push(`/users/${canvasItem.userId}`)}}>
            <span className="text-xs font-medium leading-none text-white">{canvasItem?.displayName[0]}</span>
          </div>
        }
        <div className='ml-2 text-slate-500' >
          <div onClick={(e)=>{e.stopPropagation(); router.push(`/users/${canvasItem.userId}`)}} className='text-sm font-medium no-underline hover:underline text-slate-500'>
              {canvasItem?.displayName}
          </div>
          <div className='flex flex-row items-center justify-between'>
            <span className='text-sm font-medium '>{ formatDateDiff(new Date(), new Date(canvasItem?.updatedAt?.seconds * 1000)) } </span>
          </div>
        </div>
        <div className='flex-grow'/>
        {isOwner && <div className='p-1 px-2 flex items-center cursor-pointer text-slate-600 hover:text-lightBlue-500 transition' onClick={e => {e.stopPropagation(); setAnchorEl(e.currentTarget)}}>
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </div>}
      </div>
      <div className='ml-10 mt-2' >
        <div onClick={(e)=>{e.preventDefault();e.stopPropagation();router.push({pathname:`/canvas/${canvasItem?.id}`})}} className='font-bold text-xl text-slate-800 no-underline hover:underline'>
            {canvasItem?.name || "Untitled"}
        </div>
        <div className='flex flex-row items-center justify-start mt-2'>
          {canvasItem.tags?.map(tag=><span class="inline-flex items-center gap-1.5 py-1 px-2 mr-2 rounded-md text-xs font-medium bg-slate-100 text-slate-800">{tag}</span>)}
        </div>
      </div>
      <div className='flex-grow'/>
      <div className='ml-10 mt-2 flex items-center justify-center'>
        <span className='mr-3 text-sm flex flex-row items-center justify-start text-slate-500'>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className='text-sm ml-0.5'>{canvasItem?.totalLikes || 0}</span>
        </span>
        <span className='text-sm flex flex-row items-center justify-start text-slate-500'>
            <svg xmlns="http://www.w3.org/2000/svg" strokeWidth={1.5} className="h-4 w-4 md:h-5 md:w-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24" >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          <span className='text-sm ml-0.5'>{canvasItem?.totalBookmarks || 0}</span>
        </span>        
        <div className='flex-grow'/>
        {
          isOwner && (
            canvasItem.visibility=="public" ?  
              <span class="inline-flex items-center py-1 px-2 rounded-md text-xs font-medium text-blue-500 border border-solid border-blue-500">公開中</span> :
              <span class="inline-flex items-center py-1 px-2 rounded-md text-xs font-medium text-slate-400 border border-solid border-slate-300">下書き</span>
          )
        }
      </div>
    </div>
    <Popover 
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={(e)=>{setAnchorEl(null)}}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      elevation={0}
      marginThreshold={0}
    >
      <div className='flex flex-col items-center justify-center py-2 bg-white  border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0'>
        <div onClick={()=> {router.push({pathname:`/canvas/${canvasItem?.id}`}); setAnchorEl(null)}} 
          className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
        >
          <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Edit
        </div>
        <DeleteMenuItemWithDialog raw onDelete={()=>{if(isOwner) removeCanvas(canvasItem?.id);}} onClose={()=>setAnchorEl(null)} message ={"「"+(canvasItem?.name || "Untitled") + "」を削除しようとしています。この操作は戻すことができません。"}>
          <div className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1  text-red-500 hover:bg-red-500 hover:text-white">
            <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>                                
            Delete
          </div>
        </DeleteMenuItemWithDialog>
      </div>
    </Popover>    
  </>
}

export const getStaticProps = async () => {
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


  const canvasSnap = await getDocs(query(collectionGroup(db,'canvas'),orderBy("updatedAt"),where("visibility", "==", "public"),limit(PAGE_SIZE)))
  const canvas = canvasSnap.docs.map(doc=>{
    const c = convertTimestampToJson(doc.data())
    c.id = doc.id
    return c
  })
  return {
    props: {initialCanvas: canvas},
    revalidate: 1
  }
}

export default TopPage;

const UrgeLogin = () => {
  const t = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  return  <div>
    <div className='max-w-4xl w-full mx-auto flex flex-col items-center justify-center py-4 md:py-6 px-4 min-h-[440px]'>
      <div className='text-slate-600 text-xl mb-4'>Please log in to view this tab.</div>
      <button onClick={()=>{setDialogOpen(true)}} className='bg-blue-500 text-white cursor-pointer py-2 px-2 md:px-4 text-base rounded-md text-center inline-flex items-center hover:bg-sky-700 border-none transition'>
          Log in
      </button>
      <Dialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} sx={{'& .firebaseui-idp-button':{borderRadius: "0.45em"}, '& .MuiDialog-paper':{borderRadius: '9px'},'& .MuiDialogContent-root':{maxWidth:"400px"}, '& .MuiBackdrop-root':{background:"rgba(0, 0, 0, 0.2)"}}}>
        <DialogContent>
          <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{mt:2,mb:3}}>
            <Image src="/HeaderIcon.png" width={40} height={40} alt='headerIcon'/>
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
    </div>
  </div>   
}


// export const ArticleItem = ({article})=> {
//   return (
//     <div key={article.id} className="w-full flex flex-row pb-5">
//       <Link href={`/${article?.userId}/articles/${article?.id}`} className= "text-slate-900 hover:opacity-70 transition-opacity duration-200 cursor-pointer w-24 h-24 no-underline hover:no-underline">
//           {
//             article?.coverURL ? <Image src={article?.coverURL} width={96} height={96}/> :
//             <div className='bg-blue-50 rounded-lg flex justify-center items-center w-24 h-24'>
//               <span className='text-4xl'>{article?.emoji}</span>
//             </div>
//           }
//       </Link>
//       <div className='ml-3 flex flex-col'>
//         <Link href={`/${article?.userId}/articles/${article?.id}`} className='font-bold text-slate-800 no-underline hover:no-underline'>
//             {article?.name || "無題の記事"}
//         </Link>
//         <div style={{flexGrow:1}}/>
//         <div className='flex flex-row items-center'>
//           {article.photoURL ?
//             <div className="h-8 w-8 rounded-full overflow-hidden" onClick={()=>{router.push(`/users/${article.userId}`)}}>
//               <Image src={article.photoURL} height="32" width="32"/>
//             </div> :  
//             <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={()=>{router.push(`/users/${article.userId}`)}}>
//               <span className="text-xs font-medium leading-none text-white">{article?.displayName[0]}</span>
//             </div>
//           }
//           <div className='ml-2 text-slate-500'>
//             <Link href={`/users/${article?.userId}`} className='text-sm font-medium no-underline hover:no-underline text-slate-500'>
//               {article?.displayName}
//             </Link>
            
//             <div className='flex flex-row items-center justify-between'>
//               <span className=' text-sm font-medium '>{ formatDateDiff(new Date(), new Date(article?.updatedAt?.seconds * 1000)) } </span>
//               <span className=' text-sm ml-3 flex flex-row '>
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
//                 </svg>
//                 <span className=' text-sm ml-0.5'>{article?.heartCount || 0}</span>
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }




// export const BookItem = ({book}) => {
//   return (
//     <div key={book.id} className="w-full flex flex-row pb-5">
//       { book?.coverURL ? <Link href={`/${book?.userId}/books/${book?.id}`}>
//           <a className="cursor-pointer book-cover w-[100px] h-[140px] hover:opacity-70 transition-opacity duration-200 no-underline hover:no-underline">
//             <img src={book?.coverURL} width={100} height={140} className="object-cover rounded" />
//           </a>
//         </Link> : 
//         <div className="bg-blue-100 shadow-md cursor-pointer book-cover w-[100px] h-[140px] hover:opacity-70 transition-opacity duration-200 no-underline hover:no-underline">
//           <div className='flex justify-center items-center w-full h-full' style={{width:"100px"}}>
//             <div className='font-bold text-xl text-slate-400'>{book?.name || "無題の本"}</div>
//           </div>
//         </div>
//       }                   
//       <div className='ml-3 flex flex-col'>
//         <Link href={`/${book?.userId}/books/${book?.id}`}>
//           <a  className='font-bold text-slate-800 no-underline hover:no-underline'>
//             {book?.name || "無題の記事"}
//           </a>
//         </Link>
//         {book?.premium && <div className='text-blue-500 font-bold'>￥ {book?.amount}</div> }
//         <div style={{flexGrow:1}}/>
//         <div className='flex flex-row items-center'>
//           {book.photoURL ?
//             <div className="h-8 w-8 rounded-full overflow-hidden" onClick={()=>{router.push(`/users/${book.userId}`)}}>
//               <img src={book.photoURL} height="32" width="32"/>
//             </div> :  
//             <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={()=>{router.push(`/users/${book.userId}`)}}>
//               <span className="text-xs font-medium leading-none text-white">{book?.displayName[0]}</span>
//             </div>
//           }
//           <div className='ml-2 text-slate-500'>
//             <Link href={`/users/${book?.userId}`}>
//               <a className='text-sm font-medium no-underline hover:no-underline text-slate-500'>
//                 {book?.displayName}
//               </a>
//             </Link>
//             <div className='flex flex-row items-center justify-between'>
//               <span className=' text-sm font-medium '>{ formatDateDiff(new Date(), new Date(book?.updatedAt?.seconds * 1000)) } </span>
//               <span className=' text-sm ml-3 flex flex-row '>
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
//                 </svg>
//                 <span className=' text-sm ml-0.5'>{book?.heartCount || 0}</span>
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>    
//   )
// }

// TopPage.getLayout = (page) => {
//   return (
//     <Layout>
//       {page}
//     </Layout>
//   )
// }