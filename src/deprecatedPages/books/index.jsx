import React,{ useEffect, useRef, useState }  from 'react'
import { useRouter } from 'next/navigation'
import Footer from "../../components/Footer"
import {auth,db} from '../../utils/firebase'

import Layout from "../../components/layout"
import { collectionGroup, endBefore, getDocs, limit, orderBy, query, startAfter, startAt, where } from 'firebase/firestore';
import Image from 'next/image'
import { formatDateDiff } from '../../utils/utils';
import Link from 'next/link';
import { ChevronLeftOutlined, ChevronRightOutlined } from '@mui/icons-material'



const Books = () => {
  const router = useRouter()
  const [books, setBooks] = useState([]);
  const [booksSnap, setBooksSnap] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [startDoc, setStartDoc] = useState(null);
  const [page, setPage] = useState(0);
  useEffect(() => {
    const fetchBooks = async ()=>{
      let booksSnapTmp
      if(lastDoc){
        booksSnapTmp = await getDocs(query(collectionGroup(db,'books'),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20),startAfter(lastDoc)));
      }else{
        if(startDoc){
          booksSnapTmp = await getDocs(query(collectionGroup(db,'books'),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20),endBefore(startDoc)));
        }else{
          booksSnapTmp = await getDocs(query(collectionGroup(db,'books'),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20)));
        }
      }
      setBooksSnap(booksSnapTmp)
      setBooks(booksSnapTmp.docs.map(doc=>{
        const book = doc.data()
        book.id = doc.id
        return book
      }))
    }
    fetchBooks();
  }, [lastDoc,startDoc]);
  return <Layout>
      <div className='border-0 border-b border-solid border-b-slate-200'/>
      <div className='max-w-4xl w-full mx-auto md:py-4 px-4'>
        <div className='font-bold text-slate-800 text-2xl md:text-3xl py-4'>Books</div>
        <div className="md:grid md:grid-cols-2 md:gap-4">
          {
            books?.map(book=><BookItem book={book}/>)
          }
        </div>
        <div className="flex flex-row justify-center items-center mt-16 space-x-4">
          {page >0 &&
            <button onClick={()=>{setStartDoc(booksSnap?.docs[0]);setLastDoc(null);setPage(prev=>prev-1)}} className='btn-neumorphic cursor-pointer flex flex-row justify-between items-center'>
              <ChevronLeftOutlined/>
              <div className="text-md">{Number(page||0)-1}ページへ</div>
            </button>
          }
          {
            booksSnap?.docs.length == 20 &&
            <button onClick={()=>{setLastDoc(booksSnap?.docs[booksSnap?.docs?.length-1]);setStartDoc(null);setPage(prev=>prev+1)}} className='btn-neumorphic cursor-pointer flex flex-row justify-between items-center'>
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
            <div className="h-8 w-8 rounded-full overflow-hidden" onClick={()=>{router.push(`/${book.userId}`)}}>
              <img src={book.photoURL} height="32" width="32"/>
            </div> :  
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={()=>{router.push(`/${book.userId}`)}}>
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


export default Books;

