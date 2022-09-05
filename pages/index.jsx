import React,{ useEffect, useRef, useState }  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack, CircularProgress,Tab} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';

import {useTranslation} from "../src/hooks/useTranslation"
import { makeStyles} from '@mui/styles';
import { useRouter } from 'next/router'
import Footer from "../src/components/Footer"
import {auth,db} from '../src/utils/firebase'

import Layout from "../src/components/layout"
import { collectionGroup, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import Image from 'next/image'
import { formatDateDiff } from '../src/utils/utils';
import {useObservable} from "reactfire"
import {following$} from '../src/hooks/usePvLoop'
import Link from 'next/link';


const TopPage = ({cases,articles,books}) => {
  const t = useTranslation();
  const router = useRouter()
  const [tabValue, setTabValue] = useState('home');
  const followingFeed = useObservable(`following`,following$)

  return <Layout>
        <div className='max-w-7xl w-full mx-auto px-4 md:px-10'>
          <div onClick={()=>{setTabValue("home")}} className={`inline-block px-4 py-2 cursor-pointer transition-all duration-200 ${tabValue=="home"  ? "font-bold text-slate-900 border-0 border-b-2 border-solid border-slate-800" : "text-slate-400 hover:font-bold hover:text-slate-700"}`}>ホーム</div>
          <div onClick={()=>{setTabValue("following")}} className={`inline-block px-4 py-2 cursor-pointer transition-all duration-200 ${tabValue=="following"  ? "font-bold text-slate-900 border-0 border-b-2 border-solid border-slate-800" : "text-slate-400 hover:font-bold hover:text-slate-700"}`}>フォロー中</div>
        </div>
        <div className='border-0 border-b border-solid border-b-slate-200'/>
        {
          tabValue=="home" && (
            <div className='max-w-4xl w-full mx-auto md:py-4 px-4'>
              <div className='font-bold text-slate-800 text-2xl md:text-3xl py-4'>Cases</div>
              <div className="md:grid md:grid-cols-2 md:gap-4">
                {
                  cases?.filter(c => c?.visibility=="public")?.map(c=><CaseItem caseItem={c}/>)
                }
              </div>
              <div className='flex justify-center mt-6'>
                <Link href="/cases">
                  <a className='cursor-pointer no-underline text-blue-500 mb-[1px] hover:mb-0 hover:border-solid hover:border-0 hover:border-b hover:border-blue-500'>
                    症例をさらに探す
                  </a>
                </Link>                
              </div>              
              <div className='font-bold text-slate-800 text-2xl md:text-3xl py-4'>Articles</div>
              <div className="md:grid md:grid-cols-2 md:gap-4">
                {
                  articles?.filter(article=>article?.visibility=="public")?.map(article=><ArticleItem article={article}/>)
                }
              </div>
              <div className='flex justify-center mt-6'>
                <Link href="/articles">
                  <a className='cursor-pointer no-underline text-blue-500 mb-[1px] hover:mb-0 hover:border-solid hover:border-0 hover:border-b hover:border-blue-500'>
                    記事をさらに探す
                  </a>
                </Link>                
              </div>
              <div className='font-bold text-slate-800 text-2xl md:text-3xl py-4'>Books</div>
              <div className="md:grid md:grid-cols-2 md:gap-4">
                {
                  books?.filter(book=>book?.visibility=="public")?.map(book=><BookItem book={book}/>)
                }
              </div>
              <div className='flex justify-center mt-6'>
                <Link href="/books">
                  <a className='cursor-pointer no-underline text-blue-500 mb-[1px] hover:mb-0 hover:border-solid hover:border-0 hover:border-b hover:border-blue-500'>
                    本をさらに探す
                  </a>
                </Link>                
              </div>       
            </div>            
          )
        }
      {
        tabValue=="following" && (
          <div className="max-w-4xl w-full mx-auto md:py-4 px-4">
            <div className='font-bold text-slate-800 text-2xl md:text-3xl py-4'>Articles</div>
            <div className="md:grid md:grid-cols-2 md:gap-4">
              {
                followingFeed.data?.map(u=>u?.articles).flat().map(article=><ArticleItem article={article}/>)
              }
            </div>
            <div className='font-bold text-slate-800 text-2xl md:text-3xl py-4'>Books</div>
            <div className="md:grid md:grid-cols-2 md:gap-4">
              {
                followingFeed.data?.map(u=>u?.books).flat().map(book=><BookItem book={book}/>)
              }
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

  const articlesSnap = await getDocs(query(collectionGroup(db,'articles'),orderBy("heartCount"),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20)))
  const articles = articlesSnap.docs.map(doc=>{
    const article = convertTimestampToJson(doc.data())
    article.id = doc.id
    return article
  })
  const booksSnap = await getDocs(query(collectionGroup(db,'books'),orderBy("heartCount"),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20)))
  const books = booksSnap.docs.map(doc=>{
    const book = convertTimestampToJson(doc.data())
    book.id = doc.id
    return book
  })
  const casesSnap = await getDocs(query(collectionGroup(db,'cases'),orderBy("heartCount"),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20)))
  const cases = casesSnap.docs.map(doc=>{
    const c = convertTimestampToJson(doc.data())
    c.id = doc.id
    return c
  })
  return {
    props: {articles, books, cases},
    revalidate: 1
  }
}

export const ArticleItem = ({article})=> {
  return (
    <div key={article.id} className="w-full flex flex-row pb-5">
      <Link href={`/${article?.userId}/articles/${article?.id}`} >
        <a className= "text-slate-900 hover:opacity-70 transition-opacity duration-200 cursor-pointer w-24 h-24 no-underline hover:no-underline">
          {
            article?.coverURL ? <Image src={article?.coverURL} width={96} height={96}/> :
            <div className='bg-blue-50 rounded-lg flex justify-center items-center w-24 h-24'>
              <span className='text-4xl'>{article?.emoji}</span>
            </div>
          }
        </a>
      </Link>
      <div className='ml-3 flex flex-col'>
        <Link href={`/${article?.userId}/articles/${article?.id}`}>
          <a className='font-bold text-slate-800 no-underline hover:no-underline'>
            {article?.name || "無題の記事"}
          </a>
        </Link>
        <div style={{flexGrow:1}}/>
        <div className='flex flex-row items-center'>
          {article.photoURL ?
            <div className="h-8 w-8 rounded-full overflow-hidden" onClick={()=>{router.push(`/users/${article.userId}`)}}>
              <Image src={article.photoURL} height="32" width="32"/>
            </div> :  
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={()=>{router.push(`/users/${article.userId}`)}}>
              <span className="text-xs font-medium leading-none text-white">{article?.displayName[0]}</span>
            </div>
          }
          <div className='ml-2 text-slate-500'>
            <Link href={`/users/${article?.userId}`}>
              <a className='text-sm font-medium no-underline hover:no-underline text-slate-500'>
                {article?.displayName}
              </a>
            </Link>
            
            <div className='flex flex-row items-center justify-between'>
              <span className=' text-sm font-medium '>{ formatDateDiff(new Date(), new Date(article?.updatedAt?.seconds * 1000)) } </span>
              <span className=' text-sm ml-3 flex flex-row '>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className=' text-sm ml-0.5'>{article?.heartCount || 0}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const CaseItem = ({caseItem}) => {
  return (
    <div key={caseItem?.id} className="w-full flex flex-row pb-5">
      <Link href={`/${caseItem?.userId}/cases/${caseItem?.id}`} >
        <a className= "text-slate-900 hover:opacity-70 transition-opacity duration-200 cursor-pointer w-24 h-24 no-underline hover:no-underline">
          {
            caseItem?.coverURL ? <Image src={caseItem?.coverURL} width={96} height={96}/> :
            <div className='bg-blue-50 rounded-lg flex justify-center items-center w-24 h-24'>
              <span className='text-4xl'>{caseItem?.emoji}</span>
            </div>
          }
        </a>
      </Link>
      <div className='ml-3 flex flex-col'>
        <Link href={`/${caseItem?.userId}/cases/${caseItem?.id}`}>
          <a className='font-bold text-slate-800 no-underline hover:no-underline'>
            {caseItem?.name || "無題のケース"}
          </a>
        </Link>
        <div style={{flexGrow:1}}/>
        <div className='flex flex-row items-center'>
          {caseItem?.photoURL ?
            <div className="h-8 w-8 rounded-full overflow-hidden" onClick={()=>{router.push(`/users/${caseItem.userId}`)}}>
              <Image src={caseItem?.photoURL} height="32" width="32"/>
            </div> :
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={()=>{router.push(`/users/${caseItem.userId}`)}}>
              <span className="text-xs font-medium leading-none text-white">{caseItem?.displayName[0]}</span>
            </div>
          }
          <div className='ml-2 text-slate-500'>
            <Link href={`/users/${caseItem?.userId}`}>
              <a className='text-sm font-medium no-underline hover:no-underline text-slate-500'>
                {caseItem?.displayName}
              </a>
            </Link>
            <div className='flex flex-row items-center justify-between'>
              <span className=' text-sm font-medium '>{ formatDateDiff(new Date(), new Date(caseItem?.updatedAt?.seconds * 1000)) } </span>
              <span className=' text-sm ml-3 flex flex-row '>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className=' text-sm ml-0.5'>{caseItem?.heartCount || 0}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export const BookItem = ({book}) => {
  return (
    <div key={book.id} className="w-full flex flex-row pb-5">
      { book?.coverURL ? <Link href={`/${book?.userId}/books/${book?.id}`}>
          <a className="cursor-pointer book-cover w-[100px] h-[140px] hover:opacity-70 transition-opacity duration-200 no-underline hover:no-underline">
            <img src={book?.coverURL} width={100} height={140} className="object-cover rounded" />
          </a>
        </Link> : 
        <div className="bg-blue-100 shadow-md cursor-pointer book-cover w-[100px] h-[140px] hover:opacity-70 transition-opacity duration-200 no-underline hover:no-underline">
          <div className='flex justify-center items-center w-full h-full' style={{width:"100px"}}>
            <div className='font-bold text-xl text-slate-400'>{book?.name || "無題の本"}</div>
          </div>
        </div>
      }                   
      <div className='ml-3 flex flex-col'>
        <Link href={`/${book?.userId}/books/${book?.id}`}>
          <a  className='font-bold text-slate-800 no-underline hover:no-underline'>
            {book?.name || "無題の記事"}
          </a>
        </Link>
        {book?.premium && <div className='text-blue-500 font-bold'>￥ {book?.amount}</div> }
        <div style={{flexGrow:1}}/>
        <div className='flex flex-row items-center'>
          {book.photoURL ?
            <div className="h-8 w-8 rounded-full overflow-hidden" onClick={()=>{router.push(`/users/${book.userId}`)}}>
              <img src={book.photoURL} height="32" width="32"/>
            </div> :  
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={()=>{router.push(`/users/${book.userId}`)}}>
              <span className="text-xs font-medium leading-none text-white">{book?.displayName[0]}</span>
            </div>
          }
          <div className='ml-2 text-slate-500'>
            <Link href={`/users/${book?.userId}`}>
              <a className='text-sm font-medium no-underline hover:no-underline text-slate-500'>
                {book?.displayName}
              </a>
            </Link>
            <div className='flex flex-row items-center justify-between'>
              <span className=' text-sm font-medium '>{ formatDateDiff(new Date(), new Date(book?.updatedAt?.seconds * 1000)) } </span>
              <span className=' text-sm ml-3 flex flex-row '>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className=' text-sm ml-0.5'>{book?.heartCount || 0}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>    
  )
}

// TopPage.getLayout = (page) => {
//   return (
//     <Layout>
//       {page}
//     </Layout>
//   )
// }

export default TopPage;

