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



const Cases = () => {
  const router = useRouter()
  const [cases, setCases] = useState([]);
  const [casesSnap, setCasesSnap] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [startDoc, setStartDoc] = useState(null);
  const [page, setPage] = useState(0);
  useEffect(() => {
    const fetchCases = async ()=>{
      let casesSnapTmp
      if(lastDoc){
        casesSnapTmp = await getDocs(query(collectionGroup(db,'cases'),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20),startAfter(lastDoc)));
      }else{
        if(startDoc){
          casesSnapTmp = await getDocs(query(collectionGroup(db,'cases'),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20),endBefore(startDoc)));
        }else{
          casesSnapTmp = await getDocs(query(collectionGroup(db,'cases'),orderBy("updatedAt"),where("visibility", "==", "public"),limit(20)));
        }
      }
      setCasesSnap(casesSnapTmp)
      setCases(casesSnapTmp.docs.map(doc=>{
        const caseData = doc.data()
        caseData.id = doc.id
        return caseData
      }))
    }
    fetchCases();
  }, [lastDoc,startDoc]);
  return <Layout>
      <div className='border-0 border-b border-solid border-b-slate-200'/>
      <div className='max-w-4xl w-full mx-auto md:py-4 px-4'>
        <div className='font-bold text-slate-800 text-2xl md:text-3xl py-4'>Cases</div>
        <div className="md:grid md:grid-cols-2 md:gap-4">
          {
            cases?.map(caseData=><CaseItem caseItem={caseData}/>)
          }
        </div>
        <div className="flex flex-row justify-center items-center mt-16 space-x-4">
          {page >0 &&
            <button onClick={()=>{setStartDoc(casesSnap?.docs[0]);setLastDoc(null);setPage(prev=>prev-1)}} className='btn-neumorphic cursor-pointer flex flex-row justify-between items-center'>
              <ChevronLeftOutlined/>
              <div className="text-md">{Number(page||0)-1}ページへ</div>
            </button>
          }
          {
            casesSnap?.docs.length == 20 &&
            <button onClick={()=>{setLastDoc(casesSnap?.docs[casesSnap?.docs?.length-1]);setStartDoc(null);setPage(prev=>prev+1)}} className='btn-neumorphic cursor-pointer flex flex-row justify-between items-center'>
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

export const CaseItem = ({caseItem}) => {
  return (
    <div key={caseItem?.id} className="w-full flex flex-row pb-5">
      <Link href={`/${caseItem?.userId}/cases/${caseItem?.id}`} >
        <a className= "text-slate-900 hover:opacity-70 transition-opacity duration-200 cursor-pointer w-24 h-24 no-underline hover:no-underline">
          {
            caseItem?.coverURL ? <Image src={caseItem?.coverURL} width={96} height={96} alt="coverImage"/> :
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
              <Image src={caseItem?.photoURL} height="32" width="32" alt="userPhoto"/>
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


export default Cases;

