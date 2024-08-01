'use client'

import React, { useState, useEffect} from 'react'
import {useEngine, user$} from '../../../../../src/hooks/usePvLoop'
import { useParams} from 'next/navigation'
import {useObservable} from "../../../../../src/hooks/useObservable"
import { map, switchMap, catchError} from "rxjs/operators";
import { combineLatest,of} from "rxjs"
import { docData, collectionData} from 'rxfire/firestore';
import {collection,doc, serverTimestamp,writeBatch,  query, where, getFirestore} from 'firebase/firestore';
import { useImmer } from "use-immer";
import { getAuth } from 'firebase/auth';
import CaseEditor from '../../../../../src/components/CaseEditor';


const ClientPage = () => {
  const auth = getAuth()
  const db = getFirestore()
  const queryParams = useParams()
  const {data:user} = useObservable(`user_${auth?.currentUser?.uid}`,user$)
  const canvasId = queryParams.canvasId;
  const combinedData$ = of(canvasId).pipe(
    switchMap(cid => {
      if(cid ){
        return combineLatest({
          canvas: docData(doc(db,"canvas",cid),{idField:"id"}),
          paramSets: collectionData(query(collection(db,"paramSets"),where("canvasId","==",cid)),{idField: 'id'}),
          blocks: collectionData(collection(db,"canvas",cid,"blocks"),{idField: 'id'}),        
        }).pipe(
        map(data => {
          const updatedData = { ...data };
          if (updatedData.canvas && typeof updatedData.canvas.layouts === 'string') {
            try {
              updatedData.canvas.layouts = JSON.parse(updatedData.canvas.layouts);
            } catch (error) {
              console.error("Error parsing layouts JSON: ", error);
            }
          }
          if (updatedData.blocks && Array.isArray(updatedData.blocks)) {
            updatedData.blocks = updatedData.blocks.map(block => {
              if (block.type === "Note" && typeof block.content === 'string') {
                try {
                  block.content = JSON.parse(block.content);
                } catch (error) {
                  console.error("Error parsing block content JSON: ", error);
                }
              }
              return block;
            });
          }      
          return updatedData;
        }))
      }else{
        return of(null)
      }
    })
  )

  const combinedData = useObservable("combinedData_"+canvasId, combinedData$)
  const liked$ = combineLatest([of(canvasId), user$]).pipe(
    switchMap(([cid, user]) => {
      if (cid && user?.uid) {
        return docData(doc(db, "likes", `${user.uid}_${cid}`)).pipe(
          map(likeDoc => !!likeDoc),
          catchError(() => of(false))
        );
      } else {
        return of(false);
      }
    })
  );
  const {data: liked} = useObservable(`liked_${canvasId}`, liked$);
  const bookmarked$ = combineLatest([of(canvasId), user$]).pipe(
    switchMap(([cid, user]) => {
      if (cid  && user?.uid) {
        return docData(doc(db, "bookmarks", `${user.uid}_${cid}`)).pipe(
          map(bookmarkDoc => !!bookmarkDoc),
          catchError(() => of(false))
        );
      } else {
        return of(false);
      }
    })
  );
  
  
  const {data: bookmarked} = useObservable(`bookmarked_${canvasId}`, bookmarked$);  

  const [loading, setLoading] = useState(true);

  const engine = useEngine()
  const [paramSets, setParamSets] = useImmer([]);
  const [blocks, setBlocks] = useImmer([]);
  const [canvas, setCanvas] = useImmer({});

  const isOwner = canvas.uid == user?.uid 
  const isLogin = !!user?.uid




 
  const addLike = async () =>{
    if(!isLogin) return
    setCanvas(draft=>{draft.totalLikes+=1})
    const batch = writeBatch(db);
    batch.update(doc(db,"canvas",canvasId),{totalLikes:canvas.totalLikes+1})
    batch.set(doc(db,"likes",`${user?.uid}_${canvasId}`),{uid:user?.uid,canvasId:canvasId,canvasOwnerId: canvas.uid,createdAt:serverTimestamp()})
    await batch.commit() 
  }
  const removeLike = async () =>{
    if(!isLogin) return;
    setCanvas(draft=>{draft.totalLikes-=1})
    const batch = writeBatch(db);
    batch.update(doc(db,"canvas",canvasId),{totalLikes:canvas.totalLikes-1})
    batch.delete(doc(db,"likes",`${user?.uid}_${canvasId}`))
    await batch.commit()
  }
  const addBookmark = async () => {
    if(!isLogin) return;
    setCanvas(draft=>{draft.totalBookmarks+=1})
    const batch = writeBatch(db);
    batch.update(doc(db, "canvas", canvasId), { totalBookmarks: canvas.totalBookmarks + 1 });
    batch.set(doc(db, "bookmarks", `${user?.uid}_${canvasId}`), {
        uid: user?.uid,
        canvasId: canvasId,
        createdAt: serverTimestamp(),
        canvasOwnerId: canvas.uid,
    });
    await batch.commit();
  }
  const removeBookmark = async () => {
    if(!isLogin) return;
    setCanvas(draft=>{draft.totalBookmarks-=1})
    const batch = writeBatch(db);
    batch.update(doc(db, "canvas", canvasId), { totalBookmarks: canvas.totalBookmarks - 1 });
    batch.delete(doc(db, "bookmarks", `${user?.uid}_${canvasId}`));
    await batch.commit();
  }


  useEffect(() => {
    setLoading(true)
    if(combinedData.status == "success" && combinedData.data?.paramSets.length>0 ){
      engine.setIsPlaying(false);
      combinedData.data.paramSets.forEach(p=>{
        engine.register(p);
      })
      setParamSets(engine.getAllPatinets().map(p=>({...p,...combinedData.data.paramSets.find(_p=>_p.id==p.id)})));
      setBlocks(combinedData.data.blocks)
      setCanvas(combinedData.data.canvas)
      engine.setIsPlaying(true);
    }
    setLoading(false)
  }, [combinedData.status, combinedData.data]);

  return (
    loading ? <LoadingSkelton/> : 
    <div className='px-2 md:px-4 lg:px-6'>
      {canvas?.createdAt  &&  <CaseEditor engine={engine} caseData={canvas} setCaseData={setCanvas} patients={paramSets} setPatients={setParamSets} views={blocks} setViews={setBlocks} isLogin={isLogin} isOwner={isOwner} addLike={addLike} removeLike={removeLike} addBookmark={addBookmark} removeBookmark={removeBookmark} liked={liked} bookmarked ={bookmarked}/>}   
    </div>
  )
}

export default ClientPage



const LoadingSkelton = () => {
  return <>
        <div className='w-full pb-3 animate-pulse'> 
          <div className='w-full flex flex-col space-y-4  mt-5 md:mx-8 items-start justify-center'>
            <div className='bg-gray-200 w-2/3 md:w-1/3 h-7 md:h-7 rounded-md mx-5'></div>
            <div className='flex flex-row items-center justify-center mx-5'>
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className='ml-2 '>
                <div className="h-3 w-32 bg-gray-200 rounded-md mb-2" />
                <div className="h-3 w-10 bg-gray-200 rounded-md" />
              </div>
            </div>
            <div className='flex-grow'/>
          </div>
        </div>
        <div className='animate-pulse px-7 flex flex-col  md:flex-row w-full md:h-[calc(100vh_-_250px)] md:flex-wrap items-center justify-center overflow-auto '>
          <div className="h-60 md:h-2/3 w-full  md:w-1/6 px-1 py-2 md:p-4">
            <div className="bg-gray-200 rounded-md w-full h-full"/>
          </div>
          <div className="h-60 md:h-2/3 w-full  md:w-4/6 px-1 py-2 md:p-4">
            <div className="bg-gray-200 rounded-md w-full h-full"/>
          </div>
          <div className="h-60 md:h-2/3 w-full  md:w-1/6 px-1 py-2 md:p-4">
            <div className="bg-gray-200 rounded-md w-full h-full"/>
          </div>
          <div className="h-60 w-full  md:w-1/2 px-1 py-2 md:p-4">
            <div className="bg-gray-200 rounded-md w-full h-full"/>
          </div>
          <div className="h-60 w-full  md:w-1/2 px-1 py-2 md:p-4">
            <div className="bg-gray-200 rounded-md w-full h-full"/>
          </div>
        </div>     
    </>
}

