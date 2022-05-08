import React,{ useEffect, useRef, useState }  from 'react'
import { useRouter } from 'next/router'
import Footer from "../../src/components/Footer"
import {auth,db} from '../../src/utils/firebase'

import Layout from "../../src/components/layout"
import { collectionGroup, endBefore, getDocs, limit, orderBy, query, startAfter, startAt, where } from 'firebase/firestore';
import Image from 'next/image'
import { formatDateDiff } from '../../src/utils/utils';
import Link from 'next/link';
import { ChevronLeftOutlined, ChevronRightOutlined } from '@mui/icons-material'



const Articles = () => {
  const router = useRouter()
  const [articles, setArticles] = useState([]);
  const [articlesSnap, setArticlesSnap] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [startDoc, setStartDoc] = useState(null);
  const [page, setPage] = useState(0);
  useEffect(() => {
    const fetchArticles = async ()=>{
      let articlesSnapTmp
      if(lastDoc){
        articlesSnapTmp = await getDocs(query(collectionGroup(db,'articles'),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20),startAfter(lastDoc)));
      }else{
        if(startDoc){
          articlesSnapTmp = await getDocs(query(collectionGroup(db,'articles'),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20),endBefore(startDoc)));
        }else{
          articlesSnapTmp = await getDocs(query(collectionGroup(db,'articles'),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20)));
        }
      }
      setArticlesSnap(articlesSnapTmp)
      setArticles(articlesSnapTmp.docs.map(doc=>{
        const article = doc.data()
        article.id = doc.id
        return article
      }))
    }
    fetchArticles();
  }, [lastDoc,startDoc]);
  return <Layout>
      <div className='border-0 border-b border-solid border-b-slate-200'/>
      <div className='max-w-4xl w-full mx-auto md:py-4 px-4'>
        <div className='font-bold text-slate-800 text-2xl md:text-3xl py-4'>Articles</div>
        <div className="md:grid md:grid-cols-2 md:gap-4">
          {
            articles?.map(article=><ArticleItem article={article}/>)
          }
        </div>
        <div className="flex flex-row justify-center items-center mt-16 space-x-4">
          {page >0 &&
            <button onClick={()=>{setStartDoc(articlesSnap?.docs[0]);setLastDoc(null);setPage(prev=>prev-1)}} className='btn-neumorphic cursor-pointer flex flex-row justify-between items-center'>
              <ChevronLeftOutlined/>
              <div className="text-md">{Number(page||0)-1}ページへ</div>
            </button>
          }
          {
            articlesSnap?.docs.length == 20 &&
            <button onClick={()=>{setLastDoc(articlesSnap?.docs[articlesSnap?.docs?.length-1]);setStartDoc(null);setPage(prev=>prev+1)}} className='btn-neumorphic cursor-pointer flex flex-row justify-between items-center'>
              <div className="text-md">次のページへ</div>
              <ChevronRightOutlined/>
            </button>
          }          
        </div>
      </div>            
      <hr className="border-0 border-b border-slate-200"/>
      <Footer/>
  </Layout>
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
            <div className="h-8 w-8 rounded-full overflow-hidden" onClick={()=>{router.push(`/${article.userId}`)}}>
              <Image src={article.photoURL} height="32" width="32"/>
            </div> :  
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={()=>{router.push(`/${article.userId}`)}}>
              <span className="text-xs font-medium leading-none text-white">{article?.displayName[0]}</span>
            </div>
          }
          <div className='ml-2 text-slate-500'>
            <Link href={`/${article?.userId}`}>
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


export default Articles;

