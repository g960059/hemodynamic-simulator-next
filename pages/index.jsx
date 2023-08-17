import React,{ useEffect, useRef, useState }  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack, CircularProgress,Tab, Dialog, DialogContent,DialogContentText} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';

import {useTranslation} from "../src/hooks/useTranslation"
import { makeStyles} from '@mui/material/styles';
import { useRouter } from 'next/router'
import Footer from "../src/components/Footer"
import {auth,db} from '../src/utils/firebase'
import { useSignInWithGoogle } from 'react-firebase-hooks/auth';

import Layout from "../src/components/layout"
import { collectionGroup, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import Image from 'next/image'
import { formatDateDiff } from '../src/utils/utils';
import {useObservable} from "reactfire"
import {cases$,user$} from '../src/hooks/usePvLoop'
import Link from 'next/link';


const TopPage = ({cases}) => {
  const t = useTranslation();
  const router = useRouter()
  const myCases = useObservable(`mycases`,cases$)
  const {data:user} = useObservable(`user_${auth?.currentUser?.uid}`,user$)
  const [signInWithGoogle, _, loading, error] = useSignInWithGoogle(auth);
  const [tabValue, setTabValue] = useState(router.query.tab || "trending");
  const [dialogOpen, setDialogOpen] = useState(false);


  return <Layout>
        <div className='w-full mx-auto px-4 md:px-10 text-base font-medium text-center text-slate-500 border-solid border-0 border-b border-slate-200'>
          <ul className='flex flex-wrap -mb-px max-w-7xl '>
            <div onClick={()=>{setTabValue("trending")}} className={`inline-block px-4 py-2 cursor-pointer transition-all duration-200  border-0 border-solid border-b-2 ${tabValue=="trending"  ? "font-bold text-slate-900  border-blue-500 " : "text-slate-400 border-transparent hover:font-bold hover:text-slate-700 hover:border-gray-300 "}`}>Trending</div>
            <div onClick={()=>{setTabValue("mypage")}} className={`inline-block px-4 py-2 cursor-pointer transition-all duration-200  border-0 border-solid border-b-2 ${tabValue=="mypage"  ? "font-bold text-slate-900  border-blue-500 " : "text-slate-400 border-transparent hover:font-bold hover:text-slate-700 hover:border-gray-300 "}`}>My Creations</div>
          </ul>
        </div>
        {
          tabValue=="trending" && (
            <div className='max-w-4xl w-full mx-auto py-4 md:py-6 px-4 min-h-[440px]'>
              <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                {
                  cases.map(c=><CaseItem caseItem={c}/>)
                }
              </div>         
            </div>            
          )
        }
      {
        tabValue=="mypage" && myCases.status=="success" && (
          user ? 
          <div className='max-w-4xl w-full mx-auto py-4 md:py-6 px-4 min-h-[440px]'>
            <div className="grid md:grid-cols-2 gap-4 md:gap-8">
              {
                myCases.data.map(c=><CaseItem caseItem={c}/>)
              }
            </div>         
          </div>  :
          <div>
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
        )
      }
      <hr className="border-0 border-b border-slate-200"/>
      <Footer/>
  </Layout>
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

  // const articlesSnap = await getDocs(query(collectionGroup(db,'articles'),orderBy("heartCount"),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20)))
  // const articles = articlesSnap.docs.map(doc=>{
  //   const article = convertTimestampToJson(doc.data())
  //   article.id = doc.id
  //   return article
  // })
  // const booksSnap = await getDocs(query(collectionGroup(db,'books'),orderBy("heartCount"),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20)))
  // const books = booksSnap.docs.map(doc=>{
  //   const book = convertTimestampToJson(doc.data())
  //   book.id = doc.id
  //   return book
  // })
  const casesSnap = await getDocs(query(collectionGroup(db,'cases'),orderBy("heartCount"),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20)))
  const cases = casesSnap.docs.map(doc=>{
    const c = convertTimestampToJson(doc.data())
    c.id = doc.id
    return c
  })
  return {
    props: {cases},
    revalidate: 1
  }
}

export const CaseItem = ({caseItem}) => {
  const router = useRouter()
  return (
    <div key={caseItem?.id} onClick={()=>{router.push({pathname:`/cases/${caseItem?.id}`,query:{caseUid: caseItem.uid}})}} className="w-full flex flex-col py-3 px-4 bg-white cursor-pointer border border-solid border-slate-200 rounded-md overflow-hidden hover:shadow transition">
      <div className='flex flex-row items-center'>
        {caseItem?.photoURL ?
          <div className="h-8 w-8 rounded-full overflow-hidden" onClick={()=>{router.push(`/users/${caseItem.userId}`)}}>
            <Image src={caseItem?.photoURL} height="32" width="32" alt="userPhoto"/>
          </div> :
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={()=>{router.push(`/users/${caseItem.userId}`)}}>
            <span className="text-xs font-medium leading-none text-white">{caseItem?.displayName[0]}</span>
          </div>
        }
        <div className='ml-2 text-slate-500'>
          <Link href={`/users/${caseItem?.userId}`} className='text-sm font-medium no-underline hover:underline text-slate-500'>
              {caseItem?.displayName}
          </Link>
          <div className='flex flex-row items-center justify-between'>
            <span className='text-sm font-medium '>{ formatDateDiff(new Date(), new Date(caseItem?.updatedAt?.seconds * 1000)) } </span>
          </div>
        </div>
      </div>
      {/* <Link className= "text-slate-900 hover:opacity-70 transition-opacity duration-200 cursor-pointer w-24 h-24 no-underline hover:no-underline" >
          {
            caseItem?.coverURL ? <Image src={caseItem?.coverURL} width={96} height={96}/> :
            <div className='bg-blue-50 rounded-lg flex justify-center items-center w-24 h-24'>
              <span className='text-4xl'>{caseItem?.emoji}</span>
            </div>
          }
      </Link> */}
      <div className='ml-10 mt-2'>
        <Link href={`/cases/${caseItem?.id}`} className='font-bold text-xl text-slate-800 no-underline hover:underline'>
            {caseItem?.name || "無題のケース"}
        </Link>
      </div>
      <div className='ml-10 mt-2'>
        <span className='text-sm flex flex-row items-center justify-start text-slate-500'>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className='text-sm ml-0.5'>{caseItem?.heartCount || 0}</span>
        </span>
      </div>
    </div>
  )
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

export default TopPage;

