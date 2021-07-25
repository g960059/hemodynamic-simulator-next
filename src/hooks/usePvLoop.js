import React, { useRef, useState, useEffect, useCallback} from 'react'
import {useDocumentVisibilityChange, getVisibilityPropertyNames} from "./useDocumentVisibility"
import {rk4}  from '../utils/RungeKutta/Rk4'
import {e, pvFunc, P} from '../utils/pvFunc'
import { nanoid } from 'nanoid'
import {MutationTimings} from '../constants/InputSettings'


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


export const usePvLoop = (initialHemodynamicProps=DEFAULT_HEMODYANMIC_PROPS,initialData=DEFAULT_DATA, initialTime=DEFAULT_TIME) => {
  const dataRef = useRef(initialData);
  const hemodynamicPropsRef = useRef(initialHemodynamicProps);
  const tRef = useRef(initialTime);
  const speedRef = useRef(1.0);
  const subscriptionsRef = useRef([])
  const hdpMutationsRef = useRef({});
  const subscribe = (update) => {
    const id = nanoid()
    subscriptionsRef.current[id] = update
    return id
  }
  const unsubscribe = id => {delete subscriptionsRef.current[id]} 
  const isTiming = (hdp) => {
    const Timing = MutationTimings[hdp]
    const maybeChamber =  hdp.slice(0,2)
    let chamber = ['LV','LA','RA','RV'].includes(maybeChamber) ?  maybeChamber : 'LV'
    const [_Tmax,_tau,_AV_delay]  = ['Tmax', 'tau', 'AV_delay'].map(x=>chamber+'_'+x)
    const [Tmax,tau,AV_delay, HR] = [hemodynamicPropsRef.current[_Tmax], hemodynamicPropsRef.current[_tau], hemodynamicPropsRef.current[_AV_delay], hemodynamicPropsRef.current['HR']]
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
    if(delta >0 && dataRef.current.length>0){
      const new_logger = {}
      let flag = 0
      while (delta > 0 ){
        let dt = delta >= 2 ? 2 : delta
        dataRef.current = flag % 3==0 ? rk4(pvFunc,hemodynamicPropsRef.current,new_logger)(dataRef.current,tRef.current,dt): rk4(pvFunc,hemodynamicPropsRef.current,null)(dataRef.current,tRef.current,dt)
        tRef.current += dt
        delta -= dt
        flag ++;
      }
      for(let update of Object.values(subscriptionsRef.current)){
        update(new_logger, tRef.current, hemodynamicPropsRef.current)
      }
      if(Object.keys(hdpMutationsRef.current).length > 0){
        Object.entries(hdpMutationsRef.current).forEach(([hdpKey,hdpValue])=> {
          if(hdpKey === 'Volume'){
            dataRef.current[0] += hdpValue - dataRef.current.reduce((a,b)=>a+=b,0);
            delete hdpMutationsRef.current[hdpKey]
          }else if(hdpKey === 'HR'){
            if( tRef.current % (60000/hdpValue) < 160 && tRef.current % (60000/hemodynamicPropsRef.current['HR']) < 160 ){
              hemodynamicPropsRef.current[hdpKey] = hdpValue
              delete hdpMutationsRef.current[hdpKey]
            }
          }else{
            if(isTiming(hdpKey)(tRef.current)){
              hemodynamicPropsRef.current[hdpKey] = hdpValue
              delete hdpMutationsRef.current[hdpKey]
            }
          }
        })
      }
    }
  })
  const setHdps = useCallback((hdpKey, hdpValue) => {hdpMutationsRef.current[hdpKey] = hdpValue})
  const getHdps = useCallback(() => hemodynamicPropsRef.current)
  const setSpeed = useCallback(newSpeed => speedRef.current = newSpeed)
  return {subscribe, unsubscribe, isPlaying, setIsPlaying,setHdps, getHdps, setSpeed}
}



export const DEFAULT_DATA = [517.0283988780775, 139.6755778937746, 342.074495051476, 114.12917857876639, 138.23726297508844, 72.32261938109193, 92.40876881733028, 59.370961675606274, 7.629709285843546, 17.12302746294433]
export const DEFAULT_TIME = 8892.826700000003

export const DEFAULT_HEMODYANMIC_PROPS =  {
  Rcs : 20,
  Ras: 830,
  Rvs : 25,
  Ras_prox : 24,
  Rcp : 10,
  Rap : 13,
  Rvp : 15,
  Rap_prox : 15,

  Rmv : 2.5,
  Rtv : 2.5,

  Cas : 1.83,
  Cvs : 70,
  Cas_prox : 0.1,
  Cap : 20,
  Cvp : 7,  
  Cap_prox : 1.0,

  LV_Ees : 2.21,
  LV_V0 : 5,
  LV_alpha : 0.029,
  LV_beta : 0.34,
  LV_Tmax : 250,
  LV_tau : 25,
  LV_AV_delay : 160,

  LA_Ees : 0.48,
  LA_V0 : 10,
  LA_alpha : 0.058,
  LA_beta : 0.44,
  LA_Tmax : 125,
  LA_tau : 20,
  LA_AV_delay : 0,

  RV_Ees : 0.74,
  RV_V0 : 5,
  RV_alpha : 0.028,
  RV_beta : 0.34,
  RV_Tmax : 300,
  RV_tau : 25,
  RV_AV_delay : 160,

  RA_Ees : 0.38,
  RA_V0 : 10,
  RA_alpha : 0.046,
  RA_beta : 0.44,
  RA_Tmax : 125,
  RA_tau : 20,
  RA_AV_delay : 0,

  HR : 60,
  Volume: 1500, 

  Ravr: 10000,
  Ravs: 0,
  Rmvr: 10000,
  Rmvs: 0,
  Rpvr: 10000,
  Rpvs: 0,
  Rtvr: 10000,
  Rtvs: 0,
}

