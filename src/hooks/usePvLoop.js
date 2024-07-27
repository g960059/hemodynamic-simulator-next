'use client'

import React, { useRef, useState, useEffect, useCallback} from 'react'
import {useDocumentVisibilityChange} from "./useDocumentVisibility"
import {rk4}  from '../utils/RungeKutta/Rk4'
import {e, pvFunc, P} from '../utils/pvFunc'
import { nanoid } from 'nanoid'
import {MutationTimings} from '../constants/InputSettings'
import { authState} from 'rxfire/auth';
import { collectionData, docData,collection as collectionRef } from 'rxfire/firestore';
import {collection,doc,query,where,setDoc,addDoc,updateDoc,collectionGroup,orderBy,limit, serverTimestamp, writeBatch, Timestamp, getFirestore } from 'firebase/firestore';
import { concatMap,map,tap,switchMap,filter,mergeMap} from "rxjs/operators";
import { combineLatest, of,zip } from 'rxjs';
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
  },[isPlaying,callback])
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
  },[isPlaying,...deps, callback])
  return [isPlaying, setIsPlaying]
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
  const speedRef = useRef({});
  const isPlayingRef = useRef({});
  const subscriptionsRef = useRef({})
  const hdpMutationsRef = useRef({});
  const hdpMutationSubscriptionsRef = useRef({});
  const hdpMutationSubscriptionsAllRef = useRef({});
  const hdpAllMutationSubscriptionsRef = useRef({});

  
  const register = useCallback(({id,initialHdps,initialData,initialTime,name}) => {
    initialHdpsRef.current[id] = initialHdps;
    initialDatasRef.current[id] = initialData;
    initialTimesRef.current[id] = initialTime;
    dataRef.current[id] = initialData;
    namesRef.current[id] = name;
    hemodynamicPropsRef.current[id] = {...initialHdps};
    tRef.current[id] = initialTime;
    hdpMutationsRef.current[id] = {};
    subscriptionsRef.current[id] = {};
    hdpMutationSubscriptionsRef.current[id] = {};
    hdpMutationSubscriptionsAllRef.current[id] = {};
    speedRef.current[id] = 1.0;
    isPlayingRef.current[id] = true;
    if(!idsRef.current.includes(id)) {
      idsRef.current.push(id);
    }
  },[])

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
    delete hdpMutationSubscriptionsRef.current[id];
    delete hdpMutationSubscriptionsAllRef.current[id];
    delete speedRef.current[id];
    delete isPlayingRef.current[id];
  }

  const deleteModel = (id) => {
    Object.values(hdpAllMutationSubscriptionsRef.current).forEach(callback => {
      callback(id, 'DELETE_MODEL', null);
    });
    unregister(id);
  };

  const clear = () => {
    dataRef.current={}
    hemodynamicPropsRef.current={}
    tRef.current={}
    namesRef.current={}
    hdpMutationsRef.current={}
    subscriptionsRef.current={}
    hdpMutationSubscriptionsRef.current={}
    hdpAllMutationSubscriptionsRef.current={}
    speedRef.current = {};
    isPlayingRef.current = {};
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

  const subscribeHdpMutation = (id) => hdpKeys => callback =>{
    const subsId = nanoid();
    hdpKeys.forEach(hdpKey => {
      hdpMutationSubscriptionsRef.current[id][subsId] ??= {}
      hdpMutationSubscriptionsRef.current[id][subsId][hdpKey] = callback
    })
    return subsId
  }
  const unsubscribeHdpMutation = (id) => subs_id => {
    if(hdpMutationSubscriptionsRef.current[id]){
      delete hdpMutationSubscriptionsRef.current[id][subs_id]
    }
  }
  const subscribeHdpMutationAll = (id) => callback => {
    const subsId = nanoid();
    hdpMutationSubscriptionsAllRef.current[id][subsId] = callback
    return subsId
  }
  const unsubscribeHdpMutationAll = (id) => subs_id => {
    if(hdpMutationSubscriptionsAllRef.current[id]){
      delete hdpMutationSubscriptionsAllRef.current[id][subs_id]
    }
  }
  const subscribeAllHdpMutation =  callback =>{
    const subsId = nanoid();
    hdpAllMutationSubscriptionsRef.current[subsId] = callback
    return subsId
  }
  const unsubscribeAllHdpMutation = subs_id => {
    if(hdpAllMutationSubscriptionsRef.current){
      delete hdpAllMutationSubscriptionsRef.current[subs_id]
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
    for(let id of idsRef.current){
      if (!isPlayingRef.current[id]) return;
      let delta = speedRef.current[id] * deltaTime
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
              console.log(hdpValue, dataRef.current[id].reduce((a,b)=>a+=b,0))
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
                console.log(id, hdpKey, hdpValue)
                hemodynamicPropsRef.current[id][hdpKey] = hdpValue
                delete hdpMutationsRef.current[id][hdpKey]
              }
            }
          })
        }
      }      
    }
  })

  const setSpeed = (id) => (newSpeed) => {
    speedRef.current[id] = newSpeed;
  };

  const setIsModelPlaying = (id) => (isPlaying) => {
    isPlayingRef.current[id] = isPlaying;
  };

  const setHdps = (id) =>(hdpKey, hdpValue) => {
    hdpMutationsRef.current[id][hdpKey] = hdpValue
    if (hdpMutationSubscriptionsRef.current[id]) {
      Object.values(hdpMutationSubscriptionsRef.current[id]).forEach(hdpCallbacks => {
        const callback = hdpCallbacks[hdpKey];
        if (callback) {
          callback(hdpKey, hdpValue);
        }
      });
    }
    if(hdpMutationSubscriptionsAllRef.current[id]){
      Object.values(hdpMutationSubscriptionsAllRef.current[id]).forEach(callback => {
        callback(id,hdpKey, hdpValue);
      });
    }
    if(hdpAllMutationSubscriptionsRef.current){
      Object.entries(hdpAllMutationSubscriptionsRef.current).forEach(([subsId,callback])=>{
        callback(id,hdpKey, hdpValue);
      })
    }
  }
  const getHdps = (id) => () => hemodynamicPropsRef.current[id]
  const getDataSnapshot = (id) => ()=> dataRef.current[id];
  const getTimeSnapshot = (id) => ()=> tRef.current[id];
  const getInitialHdps = (id) => () => initialHdpsRef.current[id]
  const getInitialDatas = (id) => () => initialDatasRef.current[id]
  const getInitialTimes   = (id) => () => initialTimesRef.current[id]
  const getPatient = id => {
    return {
      id,
      getInitialHdps: getInitialHdps(id),
      getInitialDatas: getInitialDatas(id),
      getInitialTimes: getInitialTimes(id),
      subscribe: subscribe(id),
      unsubscribe: unsubscribe(id),
      subscribeHdpMutation: subscribeHdpMutation(id),
      unsubscribeHdpMutation: unsubscribeHdpMutation(id),
      subscribeHdpMutationAll: subscribeHdpMutationAll(id),
      unsubscribeHdpMutationAll: unsubscribeHdpMutationAll(id),
      getHdps: getHdps(id),
      setHdps: setHdps(id),
      getDataSnapshot: getDataSnapshot(id),
      getTimeSnapshot: getTimeSnapshot(id),
      setSpeed: setSpeed(id),
      setIsModelPlaying: setIsModelPlaying(id),
      isPlaying: isPlayingRef.current[id],
      speed: speedRef.current[id],
    };
  }
  const getAllPatinets = () => idsRef.current.map(id=>getPatient(id))
  const getPatientData = id =>({id, initialHdps:initialHdpsRef.current[id], initialData:initialDatasRef.current[id],initialTime: initialTimesRef.current[id],name: namesRef.current[id]})
  const getAllPatientsData = ()=>idsRef.current.map(id=>getPatientData(id));
  return {register,unregister,clear,subscribe,unsubscribe,subscribeHdpMutation,unsubscribeHdpMutation,subscribeAllHdpMutation,unsubscribeAllHdpMutation,subscribeHdpMutationAll,unsubscribeHdpMutationAll, isPlaying,setIsPlaying,setIsModelPlaying, setSpeed,getPatient,getAllPatinets,getPatientData, getAllPatientsData, ids:idsRef.current, setHdps, getHdps,deleteModel}
}




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




