'use client'

import React, { useState, useEffect, use} from 'react'
import {Box,Typography,Button,IconButton,Stack,Switch,Dialog, Autocomplete,TextField,useMediaQuery} from '@mui/material'
import {ArrowBack,Check,Tune} from '@mui/icons-material';
import {useEngine, user$} from '../../../../../src/hooks/usePvLoop'
import { useRouter, useParams , useSearchParams} from 'next/navigation'
import {useTranslation} from '../../../../../src/hooks/useTranslation'
import ReactiveInput from "../../../../../src/components/ReactiveInput";
import { paramPresets} from '../../../../../src/utils/presets'

import dynamic from 'next/dynamic'
import {useObservable} from "../../../../../src/hooks/useObservable"
import { map, switchMap, catchError, tap} from "rxjs/operators";
import { combineLatest,of} from "rxjs"
import { docData, collectionData} from 'rxfire/firestore';
import {collection,doc, updateDoc,serverTimestamp,writeBatch,deleteDoc, getDoc,  query, where, getFirestore} from 'firebase/firestore';
import {ref, deleteObject, getStorage } from 'firebase/storage';
import { useImmer } from "use-immer";
import { nanoid } from 'nanoid'
import isEqual from "lodash/isEqual"
import {getRandomEmoji,useRouterConfirmation, deepEqual,deepEqual2} from "../../../../../src/utils/utils"
import { getRandomColor } from '../../../../../src/styles/chartConstants';
import Background from '../../../../../src/elements/Background';
import Layout from '../../../../../src/components/layout';
import Footer from '../../../../../src/components/Footer';
import TextareaAutosize from 'react-textarea-autosize';
import Head from 'next/head'
import { getAuth } from 'firebase/auth';
import CanvasViewer from '../../../../../src/components/CanvasViewer';


const App = () => {
  const auth = getAuth()
  const db = getFirestore()
  const storage = getStorage();
  const t = useTranslation();
  const queryParams = useParams()
  const searchParams = useSearchParams()
  const {data:user} = useObservable(`user_${auth?.currentUser?.uid}`,user$)
  const canvasId = queryParams.canvasId;
  let isChanged = false;
  const combinedData$ = of(canvasId).pipe(
    switchMap(cid => {
      if(cid && !isChanged){
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
  const [defaultParamSets, setDefaultParamSets] = useState([]);
  const [defaultBlocks, setDefaultBlocks] = useState([]);
  const [canvas, setCanvas] = useImmer({});
  const [defaultCanvas, setDefaultCanvas] = useState({});

  const isOwner = canvas.uid == user?.uid 
  const isLogin = !!user?.uid

  const router = useRouterConfirmation(()=>Boolean(isChanged && isOwner));

  const [caseNameEditing, setCaseNameEditing] = useState(false);
  const [openPublishDialog, setOpenPublishDialog] = useState(false);

  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'), {noSsr: true});
  
  const isCanvasChanged = combinedData.status == "success" && combinedData.data?.canvas &&
                            !(deepEqual(canvas, combinedData.data.canvas, ["updatedAt","createdAt","id","layouts"])  && canvas?.layouts &&  deepEqual2(JSON.parse(JSON.stringify(canvas?.layouts)), combinedData.data.canvas?.layouts,[],true) )

  const isNewCanvasChanged = !combinedData.data?.canvas && !deepEqual(canvas, defaultCanvas, ["updatedAt","createdAt","id"]) 
  const isParamsetsChanged = combinedData.status == "success" && combinedData.data?.paramSets && !paramSets.every(p=>{
    const originalParamset = combinedData.data?.paramSets.find(({id})=>id===p.id);
    if(!originalParamset) return false;
    return originalParamset.name === p.name  && deepEqual(originalParamset.initialHdps,p.getHdps())
  })
  const isNewParamsetsChanged = !combinedData.data?.canvas && !paramSets.every(p=>{
    const originalParamset = defaultParamSets.find(({id})=>id===p.id);
    if(!originalParamset) return false;
    return originalParamset.name === p.name  && deepEqual(originalParamset.initialHdps,p.getHdps())
  })
  const isBlocksChanged = combinedData.status == "success" && combinedData.data?.blocks && !blocks.every(v=>{
    const originalBlock = combinedData.data?.blocks.find(({id})=>id===v.id);
    return originalBlock && deepEqual(originalBlock,v)
  })
  const isNewBlocksChanged = !combinedData.data?.canvas && !blocks.every(v=>{
    const originalBlock = defaultBlocks.find(({id})=>id===v.id);
    return originalBlock && deepEqual(originalBlock,v)
  })

  isChanged = isCanvasChanged || isNewCanvasChanged || isParamsetsChanged || isNewParamsetsChanged || isBlocksChanged || isNewBlocksChanged
 
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

  const handleKeyDown = (event) => {
    const { key } = event;
    switch (key) {
        case "Enter":
            setCaseNameEditing(false);
            break;
    }
  }
  const handleBlur = () => {
      setCaseNameEditing(false);
  }


  useEffect(() => {
    setLoading(true)
    if(combinedData.status == "success" && combinedData.data?.paramSets.length>0 && isChanged){
      engine.setIsPlaying(false);
      combinedData.data.paramSets.forEach(p=>{
        engine.register(p);
      })
      setParamSets(engine.getAllPatinets().map(p=>({...p,...combinedData.data.paramSets.find(_p=>_p.id==p.id)})));
      setBlocks(combinedData.data.blocks)
      setCanvas(combinedData.data.canvas)
      engine.setIsPlaying(true);
    }else{
      if(searchParams.get("newItem") && combinedData.status == "success" && combinedData.data?.paramSets.length==0 && paramSets.length==0 && !canvas?.id){
        engine.setIsPlaying(false);
        const newParamSetId = nanoid();
        const newParamSet = {
          id: newParamSetId,
          ...paramPresets["Normal"]
        }
        engine.register(newParamSet);
        setParamSets([{...engine.getPatient(newParamSetId),...newParamSet}]);
        setDefaultParamSets([{...engine.getPatient(newParamSetId),...newParamSet}]);
        const newChartId = nanoid();
        const newPlaySpeedId = nanoid();
        const newOutputId = nanoid();
        const newControllerId = nanoid();
        const newNoteId = nanoid();
        const newBlocks = [
          {
            id: newControllerId,
            name: "Basic Parameters",
            type: "Controller",
            patientId: newParamSetId,
            items: [
              {mode:"basic",label: t["Volume"],hdp:'Volume',options:[], id:nanoid()},
              {mode:"basic",label: t["HR"],hdp:'HR',options:[], id:nanoid()},
              {mode:"basic",label: t["LV_Ees"],hdp:'LV_Ees',options:[], id:nanoid()},
              {mode:"basic",label: t["LV_alpha"],hdp:'LV_alpha',options:[], id:nanoid()},
              {mode:"basic",label: t["Rcs"],hdp:'Rcs',options:[], id:nanoid()},
              {mode:"advanced",label: t["Hb"],hdp:'Hb',options:[], id:nanoid()},
              {mode:"advanced",label: t["VO2"],hdp:'VO2',options:[], id:nanoid()}
            ],
          },
          {
            id: newChartId,
            name: "Pressure Chart",
            type: "PressureCurve",
            items: [
              {
                patientId:newParamSetId,
                id:nanoid(),
                hdp:"Plv",
                label:"左室圧",
                color: getRandomColor()
              },{
                patientId:newParamSetId,
                id:nanoid(),
                hdp:"AoP",
                label:"大動脈圧",
                color: getRandomColor()
              },{
                patientId:newParamSetId,
                id:nanoid(),
                hdp:"Pla",
                label:"左房圧",
                color: getRandomColor()
              },
            ],
            options: {
              timeWindow: 6,
            },
          },{
            id: newPlaySpeedId,
            type: "PlaySpeed",
          },{
            id: newOutputId,
            name: "Metrics",
            type: "Metrics",
            items:[
              {
                id: nanoid(),
                label: "大動脈圧",
                patientId: newParamSetId,
                hdp: "Aop",
              },
              {
                id: nanoid(),
                label: "中心静脈圧",
                patientId: newParamSetId,
                hdp: "Cvp",
              },
              {
                id: nanoid(),
                label: "心拍出量",
                patientId: newParamSetId,
                hdp: "Co",
              },
              {
                id: nanoid(),
                label: "EF",
                patientId: newParamSetId,
                hdp: "Ef",
              },
              {
                id: nanoid(),
                label: "左室仕事量",
                patientId: newParamSetId,
                hdp: "Cpo",
              },
              {
                id: nanoid(),
                label: "LMT流量",
                patientId: newParamSetId,
                hdp: "Ilmt",
              },
              {
                id: nanoid(),
                label: "SVO2",
                patientId: newParamSetId,
                hdp: "Svo2",
              },
              {
                id: nanoid(),
                label: "CS-SVO2",
                patientId: newParamSetId,
                hdp: "Cssvo2",
              }
            ]
          },{
            id: newNoteId,
            name: "Note",
            type: "Note",
            content: [{id:nanoid(),type:"paragraph",props:{textColor:"default",backgroundColor:"default",textAlignment:"left"},content:[],children:[]}],
          }
        ]
        setBlocks(newBlocks);
        setDefaultBlocks(newBlocks);
        const newCanvas = {
          name:"",
          visibility: "private",
          emoji: getRandomEmoji(),
          tags:[],
          totalLikes:0,
          totalBookmarks:0,
          userId: user?.userId,
          uid: user?.uid,
          displayName: user?.displayName,
          photoURL: user?.photoURL,
          layouts:{
            xs: [{i:newControllerId,x:0,y:0,w:12,h:12, minW:3},{i:newChartId,x:0,y:1,w:12,h:10,minW:3},{i: newOutputId, x:0,y:2,w:12,h:7}, {i:newPlaySpeedId,x:0,y:2,w:12,h:2},{i: newNoteId, x:0,y:3,w:12,h:3}], 
            md:[{i:newControllerId,x:0,y:0,w:4,h:10, minW:3},{i:newChartId,x:4,y:0,w:7,h:10,minW:3}, {i:newPlaySpeedId,x:11,y:0,w:1,h:6},{i: newOutputId, x:6,y:10,w:6,h:3}, {i: newNoteId, x:0,y:10,w:6,h:6}],
          },
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        }
        setCanvas(newCanvas);
        setDefaultCanvas(newCanvas);
        setCaseNameEditing(true)
        engine.setIsPlaying(true);
      }
    }
    setLoading(false)
  }, [combinedData.status, combinedData.data]);



  const deleteUnusedImagesFromStorage = async () => {
    const allImageURLsInBlocks = blocks.flatMap(block => {
      if (block.type === "Note" && block.content) {
        return block.content.flatMap(contentItem => {
          if (contentItem.type === "image") {
            return contentItem.props.src;
          }
          return [];
        });
      }
      return [];
    });
  
    const allImagesInStorage = canvas.allImagesInStorage || [];
  
    // allImagesInStorageの中で、allImageURLsInBlocksに存在しないものを削除
    for (const imageUrl of allImagesInStorage) {
      if (!allImageURLsInBlocks.includes(imageUrl) && imageUrl ) {
        const imagePath = new URL(imageUrl).pathname.split('/o/')[1].split('?')[0];
        const decodedPath = decodeURIComponent(imagePath);
        
        const imageRef = ref(storage, decodedPath);
        await deleteObject(imageRef);
      }
    }
    setCanvas(draft => {
      draft.allImagesInStorage = allImageURLsInBlocks.filter(Boolean);
    });
  };

  const updateCanvas = async () =>{
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    if(!combinedData.data.canvas){
      batch.set(doc(db,"canvas",canvasId),{...canvas,layouts: JSON.stringify(canvas.layouts), updatedAt:timestamp,createdAt:timestamp})
    }else{
      batch.update(doc(db,"canvas",canvasId),{...canvas,layouts: JSON.stringify(canvas.layouts),updatedAt:timestamp})
    }
    // combinedData.data?.paramSets.forEach(p=>{
    //   if(!paramSets.some(({id})=>id===p.id)){
    //     batch.delete(doc(db,"paramSets",p.id))
    //   }
    // })
    paramSets.forEach(p=>{
      const paramSet = combinedData.data?.paramSets.find(({id})=>id===p.id);
      if(!paramSet){
        batch.set(doc(db,"paramSets",p.id),{
          name: p.name,
          initialHdps:p.getHdps(),
          initialData: p.getDataSnapshot(),
          initialTime: p.getTimeSnapshot(),
          canvasId: canvasId,
          uid : user?.uid,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }else{
        if(paramSet.name !== p.name || !isEqual(p.initialHdps,p.getHdps())){
          batch.update(doc(db,"paramSets",p.id),{
            name: p.name,
            initialHdps:p.getHdps(),
            initialData: p.getDataSnapshot(),
            initialTime: p.getTimeSnapshot(),
            updatedAt: timestamp,            
          })
        }
      }
    })
    combinedData.data?.blocks.forEach(v=>{
      if(!blocks.some(({id})=>id===v.id)){
        batch.delete(doc(db,"canvas",canvasId,"blocks",v.id))
      }
    })
    blocks.forEach(v=>{
      const view = combinedData.data?.blocks.find(({id})=>id===v.id)
      if(!view){
        if(v.type == "Note"){
          batch.set(doc(db,"canvas",canvasId,"blocks",v.id),{...v,content:JSON.stringify(v.content)})
        }else{
          batch.set(doc(db,"canvas",canvasId,"blocks",v.id),{...v})
        }
      }else{
        if(!isEqual(view,v)){
          if(v.type == "Note"){
            batch.update(doc(db,"canvas",canvasId,"blocks",v.id),{...v,content:JSON.stringify(v.content)})
          }else{
            batch.update(doc(db,"canvas",canvasId,"blocks",v.id),{...v})
          }
        }
      }
    })
    await batch.commit()
    await deleteUnusedImagesFromStorage();
  }

  return (
    loading ? <LoadingSkelton/> : 
    <div className='px-2 md:px-4 lg:px-6'>
      {canvas?.createdAt  &&  <CanvasViewer engine={engine} caseData={canvas} setCaseData={setCanvas} patients={paramSets} setPatients={setParamSets} views={blocks} setViews={setBlocks} isLogin={isLogin} isOwner={isOwner} addLike={addLike} removeLike={removeLike} addBookmark={addBookmark} removeBookmark={removeBookmark} liked={liked} bookmarked ={bookmarked}/>}   
    </div>
  )
}

export default App



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

// const convertTimestampToJson = (data)=>{
//   const newData = {...data}
//   if(data?.updatedAt){
//     newData.updatedAt = data.updatedAt.toJSON()
//   }
//   if(data?.createdAt){
//     newData.createdAt = data.createdAt.toJSON()
//   }
//   return newData
// }

// export const getServerSideProps = async (context) => {
//   const db = getFirestore()
//   const canvasId = context.query.canvasId;
//   const canvasSnap = await getDoc(doc(db,"canvas",canvasId))
//   if(canvasSnap.exists()){
//     const initialCanvas = convertTimestampToJson({id: canvasId, ...canvasSnap.data()});
//     return {
//       props: {
//         initialCanvas
//       }
//     }
//   }else{
//     return {
//       props:{
//         initialCanvas:null
//       }
//     }
//   }
// }



  // const cases = useObservable("cases", combineLatest([user$,cases$]).pipe(
  //   filter(([user_])=>!!user_?.uid),
  //   mergeMap(([user_,cases_]) =>
  //     combineLatest(cases_.map(caseData_ => collectionData(collection(db,'users',user_.uid,"cases",caseData_.id,"paramSets"),{idField: 'id'}))).pipe(
  //       map((patients_) =>cases_.map((case_,index)=>({...case_,paramSets: patients_[index]})))
  //     )
  //   )
  // ));
  
    // useEffect(() => {
  //   const getAllCases = async () => {
  //     const tmpAllCases = []
  //     const allCasesSnap = await getDocs(query(collectionGroup(db,'cases'),limit(50)))
  //     allCasesSnap.forEach(async d=>{
  //       const caseData_ = d.data()
  //       const casePatients = []
  //       const casePatientsSnap = await getDocs(collection(db,'users',caseData_.uid,'cases',d.id,'paramSets'))
  //       casePatientsSnap.forEach(d=>{casePatients.push({...d.data(),id:d.id})})
  //       tmpAllCases.push({...caseData_,paramSets:casePatients})
  //     })
  //     setAllCases(tmpAllCases)
  //   }
  //   getAllCases()
  // }, []);

    // const addPatient = patient =>{
  //   const newPatient = {...patient,id:nanoid()}
  //   engine.register(newPatient);
  //   setParamSets(draft=>{draft.push({...newPatient, ...engine.getPatient(newPatient.id)})})
  //   setCanvas(draft=>{draft.patientIds.push(newPatient.id)})
  //   setTimeout(()=>{scrollPatientBottomRef.current?.scrollIntoView({behavior: "smooth"});},100)
  // }


    // combinedData.data?.outputs.forEach(o=>{
    //   if(!outputs.some(({id})=>id===o.id)){
    //     batch.delete(doc(db,'users',user?.uid,"cases",canvasId,"outputs",o.id))
    //   }
    // })
    // outputs.forEach(o=>{
    //   const output = combinedData.data?.outputs.find(({id})=>id===o.id)
    //   if(!output){
    //     batch.set(doc(db,'users',user?.uid,"cases",canvasId,"outputs",o.id),{...o})
    //   }else{
    //     if(!isEqual(output,o)){
    //       batch.update(doc(db,'users',user?.uid,"cases",canvasId,"outputs",o.id),{...o})
    //     }
    //   }
    // })