import React, { useRef, useState, useEffect, useCallback} from 'react'
import {useDocumentVisibilityChange, getVisibilityPropertyNames} from "./useDocumentVisibility"
import {rk4}  from '../utils/RungeKutta/Rk4'
import {e, pvFunc, P} from '../utils/pvFunc'
import { nanoid } from 'nanoid'
import {MutationTimings} from '../constants/InputSettings'
import {DEFAULT_DATA, DEFAULT_TIME,DEFAULT_HEMODYANMIC_PROPS} from '../utils/presets'

import { authState} from 'rxfire/auth';
import { collectionData, docData,collection as collectionRef } from 'rxfire/firestore';
import {collection,doc,query,where,setDoc,addDoc,updateDoc,collectionGroup,orderBy,limit, serverTimestamp, writeBatch, Timestamp, getFirestore } from 'firebase/firestore';
import {auth,db} from "../utils/firebase"
import { concatMap,map,tap,switchMap,filter,mergeMap} from "rxjs/operators";
import { combineLatest, of,zip } from 'rxjs';
import {useObservable} from "reactfire"
import { addDays } from 'date-fns'
import { getAuth } from 'firebase/auth'


export const useAnimationFrame = (callback,deps=[]) =>{
  const requestRef = useRef()
  const [isPlaying, setIsPlaying] = useState(true);
  const previousTimeRef = useRef()
  const animate = useCallback(time =>{
    if(previousTimeRef.current != undefined){
      const deltaTime = time - previousTimeRef.current
      callback(deltaTime)
    }
    previousTimeRef.current = time;
    if(!isPlaying){
      previousTimeRef.current = undefined
      cancelAnimationFrame(requestRef.current)
    }else{
      requestRef.current = requestAnimationFrame(animate)
    }
  },[callback])
  useDocumentVisibilityChange(isHidden => {
    if(isHidden){
      previousTimeRef.current = undefined
      cancelAnimationFrame(requestRef.current)
    }else{
      requestRef.current = requestAnimationFrame(animate)
    }
  })  
  useEffect(()=>{
    requestRef.current = requestAnimationFrame(animate)
    return () => {if(requestRef.current) return cancelAnimationFrame(requestRef.current)}
  },[...deps, callback])
  return [isPlaying, setIsPlaying]
}

export const usePvLoop = (id,initialHemodynamicProps=DEFAULT_HEMODYANMIC_PROPS,initialData=DEFAULT_DATA, initialTime=DEFAULT_TIME,prevId=null) => {
  const idRef = useRef(id);
  const dataRef = useRef({});
  const hemodynamicPropsRef = useRef({});
  const tRef = useRef({});
  const speedRef = useRef({});
  const subscriptionsRef = useRef({})
  const subscriptionIdsRef = useRef({});
  const hdpMutationsRef = useRef({});

  dataRef.current[id] ??= initialData;
  hemodynamicPropsRef.current[id] ??= {...initialHemodynamicProps};
  tRef.current[id] ??= initialTime;
  speedRef.current[id] ??= 1.0;
  hdpMutationsRef.current[id] ??= {};
  subscriptionsRef.current[id] ??= {};
  idRef.current = id;

  if(prevId!=null){
    for(const [prevSubsId,update] of Object.entries(subscriptionsRef.current[prevId])){
      let originalSubsId;
      for(const [originalId, [patientId,subsId]] of Object.entries(subscriptionIdsRef.current)){
        if(subsId == prevSubsId){
          originalSubsId = originalId;
          break;
        }
      }
      const nextSubsId = nanoid();
      subscriptionIdsRef.current[originalSubsId] = [id,nextSubsId];
      subscriptionsRef.current[id][nextSubsId] = update
    }
    delete subscriptionsRef.current[prevId]
  }

  const subscribe = (update) => {
    const originalSubsId = nanoid()
    subscriptionIdsRef.current[originalSubsId] = [idRef.current,originalSubsId];
    subscriptionsRef.current[idRef.current][originalSubsId] = update
    return originalSubsId
  }

  const unsubscribe = subs_id => {
    if(subscriptionIdsRef.current[subs_id]){
      const [currentPatientId,current_subs_id] = subscriptionIdsRef.current[subs_id]
      delete subscriptionsRef.current[currentPatientId][current_subs_id]
    }else{
      delete subscriptionsRef.current[idRef.current][subs_id]
    }
  } 

  const isTiming = (hdp) => {
    const Timing = MutationTimings[hdp]
    const maybeChamber =  hdp.slice(0,2)
    let chamber = ['LV','LA','RA','RV'].includes(maybeChamber) ?  maybeChamber : 'LV'
    const [_Tmax,_tau,_AV_delay]  = ['Tmax', 'tau', 'AV_delay'].map(x=>chamber+'_'+x)
    const [Tmax,tau,AV_delay, HR] = [hemodynamicPropsRef.current[idRef.current][_Tmax], hemodynamicPropsRef.current[idRef.current][_tau], hemodynamicPropsRef.current[idRef.current][_AV_delay], hemodynamicPropsRef.current[idRef.current]['HR']]
    return t => {
      switch(Timing){
        case 'EndDiastolic':
          return e(t-AV_delay,Tmax,tau,HR) < 0.001
        case 'EndSystolic':
          return e(t-AV_delay,Tmax,tau,HR) > 0.999
        default:
          return true
      }
    }
  }

  const [isPlaying, setIsPlaying] = useAnimationFrame(deltaTime  => {
    let delta = speedRef.current[idRef.current] * deltaTime
    if(delta >0 && dataRef.current[idRef.current].length>0){
      const new_logger = {}
      let flag = 0
      while (delta > 0 ){
        let dt = delta >= 1 ? 1 : delta
        dataRef.current[idRef.current] = flag % 3==0 ? rk4(pvFunc,hemodynamicPropsRef.current[idRef.current],new_logger)(dataRef.current[idRef.current],tRef.current[idRef.current],dt): rk4(pvFunc,hemodynamicPropsRef.current[idRef.current],null)(dataRef.current[idRef.current],tRef.current[idRef.current],dt)
        tRef.current[idRef.current] += dt
        delta -= dt
        flag ++;
      }
      if(!subscriptionsRef.current[idRef.current]) return ;
      for(let update of Object.values(subscriptionsRef.current[idRef.current])){
        update(new_logger, tRef.current[idRef.current], hemodynamicPropsRef.current[idRef.current])
      }
      if(Object.keys(hdpMutationsRef.current[idRef.current]).length > 0){
        Object.entries(hdpMutationsRef.current[id]).forEach(([hdpKey,hdpValue])=> {
          if(hdpKey === 'Volume'){
            dataRef.current[id][0] += hdpValue - dataRef.current[id].reduce((a,b)=>a+=b,0);
            hemodynamicPropsRef.current[id][hdpKey] = hdpValue
            delete hdpMutationsRef.current[id][hdpKey]
          }else if(hdpKey === 'HR'){
            if( ((60000/hdpValue) - (tRef.current[id]-160) % (60000/hdpValue)) < 100 && ((60000/hemodynamicPropsRef.current[id]['HR']) - (tRef.current[id]-160) % (60000/hemodynamicPropsRef.current[id]['HR'])) < 100 ){
              hemodynamicPropsRef.current[id][hdpKey] = hdpValue
              delete hdpMutationsRef.current[id][hdpKey]
            }
          }else{
            if(isTiming(hdpKey)(tRef.current[id])){
              hemodynamicPropsRef.current[id][hdpKey] = hdpValue
              delete hdpMutationsRef.current[id][hdpKey]
            }
          }
        })
      }
    }
  })
  const setHdps = useCallback((hdpKey, hdpValue) => {hdpMutationsRef.current[idRef.current][hdpKey] = hdpValue})
  const getHdps = () => hemodynamicPropsRef.current[idRef.current]
  const setSpeed = useCallback(newSpeed => speedRef.current[idRef.current] = newSpeed)
  const getDataSnapshot = () => dataRef.current[idRef.current];
  const getTimeSnapshot = () => tRef.current[idRef.current];

  return {subscribe, unsubscribe, isPlaying, setIsPlaying,setHdps, getHdps, setSpeed,getDataSnapshot,getTimeSnapshot}
}

export const useEngine = () => {
  const idsRef = useRef([]);
  const initialHdpsRef = useRef({});
  const initialDatasRef = useRef({});
  const initialTimesRef = useRef({});
  const namesRef=useRef({})
  const dataRef = useRef({});
  const hemodynamicPropsRef = useRef({});
  const tRef = useRef({});
  const speedRef = useRef(1.0);
  const subscriptionsRef = useRef({})
  const hdpMutationsRef = useRef({});
  
  const register = ({id,initialHdps,initialData,initialTime,name}) => {
    initialHdpsRef.current[id] = initialHdps;
    initialDatasRef.current[id] = initialData;
    initialTimesRef.current[id] = initialTime;
    dataRef.current[id] = initialData;
    namesRef.current[id] = name;
    hemodynamicPropsRef.current[id] = {...initialHdps};
    tRef.current[id] = initialTime;
    hdpMutationsRef.current[id] = {};
    subscriptionsRef.current[id] = {};
    if(!idsRef.current.includes(id)) {
      idsRef.current.push(id);
    }
  }
  const unregister = (id) => {
    idsRef.current = idsRef.current.filter(x=>x!=id);
    delete initialHdpsRef.current[id];
    delete initialDatasRef.current[id];
    delete initialTimesRef.current[id];
    delete dataRef.current[id];
    delete namesRef.current[id];
    delete hemodynamicPropsRef.current[id];
    delete tRef.current[id];
    delete hdpMutationsRef.current[id];
    delete subscriptionsRef.current[id];
  }

  const clear = () => {
    dataRef.current={}
    hemodynamicPropsRef.current={}
    tRef.current={}
    namesRef.current={}
    hdpMutationsRef.current={}
    subscriptionsRef.current={}
    idsRef.current = []
  }

  const subscribe = (id) => (update) => {
    const subsId = nanoid()
    subscriptionsRef.current[id][subsId] = update
    return subsId
  }

  const unsubscribe = (id) => subs_id => {
    if(subscriptionsRef.current[id]){
      delete subscriptionsRef.current[id][subs_id]
    }
  } 

  const isTiming = (id,hdp) => {
    const Timing = MutationTimings[hdp];
    const maybeChamber = hdp.slice(0,2);
    let chamber = ['LV','LA','RA','RV'].includes(maybeChamber) ?  maybeChamber : 'LV'
    const [_Tmax,_tau,_AV_delay]  = ['Tmax', 'tau', 'AV_delay'].map(x=>chamber+'_'+x)
    const [Tmax,tau,AV_delay, HR] = [hemodynamicPropsRef.current[id][_Tmax], hemodynamicPropsRef.current[id][_tau], hemodynamicPropsRef.current[id][_AV_delay], hemodynamicPropsRef.current[id]['HR']]
    return t => {
      switch(Timing){
        case 'EndDiastolic':
          return e(t-AV_delay,Tmax,tau,HR) < 0.001
        case 'EndSystolic':
          return e(t-AV_delay,Tmax,tau,HR) > 0.999
        default:
          return true
      }
    }
  }

  const [isPlaying, setIsPlaying] = useAnimationFrame(deltaTime  => {
    let delta = speedRef.current * deltaTime
    for(let id of idsRef.current){
      let delta = speedRef.current * deltaTime
      if(delta >0 && dataRef.current[id].length>0){
        const new_logger = {}
        let flag = 0
        while (delta > 0 ){
          let dt = delta >= 1 ? 1 : delta
          dataRef.current[id] = flag % 3==0 ? rk4(pvFunc,hemodynamicPropsRef.current[id],new_logger)(dataRef.current[id],tRef.current[id],dt): rk4(pvFunc,hemodynamicPropsRef.current[id],null)(dataRef.current[id],tRef.current[id],dt)
          tRef.current[id] += dt
          delta -= dt
          flag ++;
        }
        if(!subscriptionsRef.current[id]) return ;
        for(let update of Object.values(subscriptionsRef.current[id])){
          update(new_logger, tRef.current[id], hemodynamicPropsRef.current[id])
        }
        if(Object.keys(hdpMutationsRef.current[id]).length > 0){
          Object.entries(hdpMutationsRef.current[id]).forEach(([hdpKey,hdpValue])=> {
            if(hdpKey === 'Volume'){
              dataRef.current[id][0] += hdpValue - dataRef.current[id].reduce((a,b)=>a+=b,0);
              hemodynamicPropsRef.current[id][hdpKey] = hdpValue
              delete hdpMutationsRef.current[id][hdpKey]
            }else if(hdpKey === 'HR'){
              if( ((60000/hdpValue) - (tRef.current[id]-160) % (60000/hdpValue)) < 100 && ((60000/hemodynamicPropsRef.current[id]['HR']) - (tRef.current[id]-160) % (60000/hemodynamicPropsRef.current[id]['HR'])) < 100 ){
                hemodynamicPropsRef.current[id][hdpKey] = hdpValue
                delete hdpMutationsRef.current[id][hdpKey]
              }
            }else{
              if(isTiming(id,hdpKey)(tRef.current[id])){
                hemodynamicPropsRef.current[id][hdpKey] = hdpValue
                delete hdpMutationsRef.current[id][hdpKey]
              }
            }
          })
        }
      }      
    }
  })

  const setSpeed = useCallback(newSpeed => speedRef.current = newSpeed)
  const setHdps = (id) =>(hdpKey, hdpValue) => {hdpMutationsRef.current[id][hdpKey] = hdpValue}
  const getHdps = (id) => () => hemodynamicPropsRef.current[id]
  const getDataSnapshot = (id) => ()=> dataRef.current[id];
  const getTimeSnapshot = (id) => ()=> tRef.current[id];
  const getInitialHdps = (id) => () => initialHdpsRef.current[id]
  const getInitialDatas = (id) => () => initialDatasRef.current[id]
  const getInitialTimes   = (id) => () => initialTimesRef.current[id]
  const getPatient = id => {
    return {id,getInitialHdps:getInitialHdps(id),getInitialDatas:getInitialDatas(id),getInitialTimes:getInitialTimes(id), subscribe:subscribe(id),unsubscribe:unsubscribe(id),getHdps:getHdps(id),setHdps:setHdps(id),getDataSnapshot:getDataSnapshot(id),getTimeSnapshot:getTimeSnapshot(id)}
  }
  const getAllPatinets = () => idsRef.current.map(id=>getPatient(id))
  const getPatientData = id =>({id, initialHdps:initialHdpsRef.current[id], initialData:initialDatasRef.current[id],initialTime: initialTimesRef.current[id],name: namesRef.current[id] })
  const getAllPatientsData = ()=>idsRef.current.map(id=>getPatientData(id));
  return {register,unregister,clear,subscribe,unsubscribe, isPlaying,setIsPlaying,setSpeed,getPatient,getAllPatinets,getPatientData, getAllPatientsData, ids:idsRef.current}
}

class Patient {
  constructor(id=null,name,initialHdps,initialData,initialTime,visibility,emoji,tags,uid,displayName,photoURL,favs,subscribe,unsubscribe ,isPlaying,setIsPlaying, setHdps, getHdps, setSpeed,getDataSnapshot,getTimeSnapshot){
    this.id=id ? id :  nanoid();
    this.name = name;
    this.initialHdps=initialHdps;
    this.initialData=initialData;
    this.initialTime = initialTime;
    this.visibility = visibility;
    this.emoji = emoji;
    this.tags = tags;
    this.uid = uid;
    this.displayName = displayName;
    this.photoURL = photoURL;
    this.favs = favs;
    this.subscribe=subscribe;
    this.unsubscribe=unsubscribe 
    this.isPlaying=isPlaying;
    this.setIsPlaying=setIsPlaying;
    this.setHdps=setHdps;
    this.getHdps=getHdps;
    this.setSpeed=setSpeed;
    this.getDataSnapshot = getDataSnapshot;
    this.getTimeSnapshot = getTimeSnapshot;
  }
}

// export const user$ = authState(auth).pipe(
//   mergeMap(user => {
//     if(user){
//       return combineLatest([docData(doc(db,'users',user?.uid),{idField: 'uid'}),of(user)])
//     }else{
//       return combineLatest([of(null),of(null)])
//     }
//   }),
//   tap(([userDocData,user])=>{
//       if(user && !userDocData){
//         const initializeUser = async ()=>{
//           const batch = writeBatch(db);
//           batch.set(doc(db,"users",user.uid),{
//             displayName: user.displayName,
//             photoURL: user.photoURL,
//             userId: user.uid,
//             email: user.email,
//             caseHeartCount:0,
//             createdAt:serverTimestamp(),
//           });
//           batch.set(doc(db,"userIds",user.uid),{uid:user.uid, createdAt:serverTimestamp()});
//           batch.set(doc(db,"followers",user.uid),{users:[]});
//           await batch.commit();
//         }
//         initializeUser();
//       }
//     }
//   ),
//   map(([userDocData,user])=> userDocData),
// );

export const user$ = authState(getAuth()).pipe(
  switchMap(user => {
    if (user) {
      const db = getFirestore()
      return docData(doc(db, 'users', user.uid), { idField: 'uid' }).pipe(
        tap(userDocData => {
          if (!userDocData) {
            const initializeUser = async () => {
              const batch = writeBatch(db);
              batch.set(doc(db, "users", user.uid), {
                displayName: user.displayName,
                photoURL: user.photoURL,
                userId: user.uid,
                email: user.email,
                caseHeartCount: 0,
                createdAt: serverTimestamp(),
              });
              batch.set(doc(db, "userIds", user.uid), { uid: user.uid, createdAt: serverTimestamp() });
              batch.set(doc(db, "followers", user.uid), { users: [] });
              await batch.commit();
            }
            initializeUser();
          }
        })
      );
    } else {
      // userがnullの場合、nullを発行するObservableを返します
      return of(null);
    }
  })
);






// export const nextUser$ = user$.pipe(
//   mergeMap(user => docData(doc(db,'users',user.uid),{idField: 'uid'})),
// )


// export const myPatients$ = user$.pipe(
//   mergeMap(user =>user ? collectionData(collection(db, 'users',user?.uid,'patients'),{idField: 'id'}) : of([])),
// )
// export const allPatients$ = collectionData(query(collectionGroup(db,'patients')),{idField: 'id'})

// export const selectedPatient$ = combineLatest([myPatients$,user$]).pipe(
//   map(([patients,user])=>{
//     if(user){
//       console.log(user.selectedPatientId)
//       return patients.find(p=>p.id==user.selectedPatientId)
//     }else{
//       return of(null)
//     }
//   })
// )
// export const patientsRef$ =  user$.pipe(
//   filter(user => !!user.uid),
//   map(user => collection(db, 'users',user?.uid,'patients'))
// )
// export const cases$ = user$.pipe(
//   mergeMap(user => user ? collectionData(collection(db,'users',user?.uid,'cases'),{idField: 'id'}): of([])),
// )
// export const articles$ = user$.pipe(
//   mergeMap(user => user ? collectionData(collection(db,'users',user?.uid,'articles'),{idField: 'id'}): of([])),
// )
// export const books$ = user$.pipe(
//   mergeMap(user => user ? collectionData(collection(db,'users',user?.uid,'books'),{idField: 'id'}): of([])),
// )

// export const userRef$ = user$.pipe(
//   filter(user => !!user.uid),
//   map(user => doc(db,'users',user?.uid))
// )

// export const allCases$ = collectionData(query(collectionGroup(db,'cases'),orderBy("favs"),limit(50)),{idField: 'id'})

// export const purchases$ = user$.pipe(
//   mergeMap(user => user?.uid ?
//     collectionData(collection(db,'users/'+user?.uid+'/purchases'),{idField:"id"}):
//     of([])
//   ),
//   mergeMap(purchases => combineLatest(
//     purchases?.map(purchase => 
//       combineLatest({timestamp:of(purchase.timestamp.toDate()), bookData: docData(doc(db,`users/${purchase.sellerId}/books/${purchase.itemId}`),{idField:"id"}), authorData: docData(doc(db,`users/${purchase.sellerId}`))})
//     )
//   ))
// )
// export const favorites$ = user$.pipe(
//   mergeMap(user => user?.uid ?
//     collectionData(collection(db,'users/'+user?.uid+'/favorites'),{idField:"id"}):
//     of([])
//   ),
//   mergeMap(favorites => combineLatest(
//     favorites?.map(favorite =>{
//       if(favorite.type =="book"){
//         return  combineLatest({timestamp:of(favorite.timestamp?.toDate()), bookData: docData(doc(db,`users/${favorite.authorId}/books/${favorite.bookId}`),{idField:"id"}), authorData: docData(doc(db,`users/${favorite.authorId}`))})
//       }
//       if(favorite.type =="article"){
//         return  combineLatest({timestamp:of(favorite.timestamp?.toDate()), articleData: docData(doc(db,`users/${favorite.authorId}/articles/${favorite.articleId}`),{idField:"id"}), authorData: docData(doc(db,`users/${favorite.authorId}`))})
//       }
//       return of(null)
//     })
//   ))
// )
// export const following$ = user$.pipe(
//   mergeMap(user => user?.uid ?
//     collectionData(query(collection(db,'followers'),where('users', 'array-contains', user.uid)),{idField:"id"}): of([])
//   ),
//   mergeMap(following => combineLatest(
//     following?.map(({id:uid}) => combineLatest({userData: docData(doc(db,'users',uid),{idField: "uid"}), articles: collectionData(query(collection(db,'users',uid,'articles'),where("updatedAt",">",Timestamp.fromDate(addDays(new Date(),-30)))),{idField: "id"}), books: collectionData(query(collection(db,'users',uid,'books'),where("updatedAt",">",Timestamp.fromDate(addDays(new Date(),-30)))),{idField: "id"})}))
//   ))
// )

// export const sales$ = user$.pipe(
//   mergeMap(user => 
//     combineLatest({user: of(user), sales: (user?.uid ? collectionData(collection(db,'users/'+user?.uid+'/sales'),{idField:"id"}) : of([]))})
//   ),
// )
// export const salesDetail$ =  combineLatest([sales$,books$]).pipe(
//   mergeMap(([sales,books]) => 
//     combineLatest(sales.sales.map(sale => combineLatest({customerData: docData(doc(db,`users/${sale.customerId}`),{idField:"uid"}), saleData: of(sale), bookData: of(books.find(p=>p.id==sale.itemId))}) )) 
//   )
// )
// export const payableHistory$ = user$.pipe(
//   mergeMap(user => user?.uid ?
//     collectionData(collection(db,'users/'+user?.uid+'/payable_history'),{idField:"id"}):
//     of([])
//   )
// )
// export const withdrawals$ = user$.pipe(
//   mergeMap(user => user?.uid ?
//     collectionData(collection(db,'users/'+user?.uid+'/withdrawals'),{idField:"id"}):
//     of([])
//   )
// )


// export const useEngine= ({id,name,hdps,initialData,initialTime}) => {
//   console.log(id)
//   const {subscribe,unsubscribe ,isPlaying,setIsPlaying, setHdps, getHdps, setSpeed,getDataSnapshot,getTimeSnapshot} = usePvLoop(id,hdps,initialData,initialTime)
//   return {id,name,hdps,initialData,initialTime,subscribe,unsubscribe ,isPlaying,setIsPlaying, setHdps, getHdps, setSpeed,getDataSnapshot,getTimeSnapshot}
// }

export const usePatient = () => {
  const [loadedPatient, setLoadedPatient] = useState(null);
  const selectedPatient = useObservable("selectedPatient",selectedPatient$,{initialData:{id:"default",name:"Normal",hdps:DEFAULT_HEMODYANMIC_PROPS,initialData:DEFAULT_DATA,initialTime:DEFAULT_TIME}})
  if(selectedPatient.status == 'success' && selectedPatient.data){
    const {id,name,hdps,initialData,initialTime,visibility,emoji,tags,uid,displayName,photoURL,favs} = selectedPatient.data
    let prevId;
    // return loadedPatient;
    if(loadedPatient && loadedPatient.id != id){
      prevId = loadedPatient.id
    }
    const {subscribe,unsubscribe ,isPlaying,setIsPlaying, setHdps, getHdps, setSpeed,getDataSnapshot,getTimeSnapshot} = usePvLoop(id,hdps,initialData,initialTime,prevId)
    const patient = new Patient(id,name, hdps,initialData,initialTime,visibility,emoji,tags,uid,displayName,photoURL,favs,subscribe,unsubscribe ,isPlaying,setIsPlaying, setHdps, getHdps, setSpeed,getDataSnapshot,getTimeSnapshot)
    // setLoadedPatient(patient); 
    if(!loadedPatient || loadedPatient?.id != id){
      setLoadedPatient(patient)
    }
    return patient;
    
  }else{
    const {subscribe,unsubscribe ,isPlaying,setIsPlaying, setHdps, getHdps, setSpeed,getDataSnapshot,getTimeSnapshot} = usePvLoop("default",DEFAULT_HEMODYANMIC_PROPS,DEFAULT_DATA,DEFAULT_TIME)
    const patient = new Patient("default","normal", DEFAULT_HEMODYANMIC_PROPS,DEFAULT_DATA,DEFAULT_TIME,"private",emoji,tags,uid,displayName,photoURL,favs,subscribe,unsubscribe ,isPlaying,setIsPlaying, setHdps, getHdps, setSpeed,getDataSnapshot,getTimeSnapshot)
    if(!loadedPatient || loadedPatient.id != "default" ){
      setLoadedPatient(patient)
    }
    return patient
  }
}


