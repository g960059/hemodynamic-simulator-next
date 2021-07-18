import React, { useRef, useState, useEffect, useCallback} from 'react'
import {useDocumentVisibilityChange, getVisibilityPropertyNames} from "./useDocumentVisibility"
import {rk4}  from '../utils/RungeKutta/Rk4'
import {e, pvFunc, P} from '../utils/pvFunc'
import { nanoid } from 'nanoid'


export const useAnimationFrame = (callback,deps=[]) =>{
  const requestRef = useRef()
  const [isPlaying, setIsPlaying] = useState(false);
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
  const subscriptionsRef = useRef([])
  const subscribe = (update) => {
    const id = nanoid()
    subscriptionsRef.current[id] = update
    return id
  }
  const unsubscribe = id => {delete subscriptionsRef.current[id]} 
  const [isPlaying, setIsPlaying] = useAnimationFrame(deltaTime  => {
    if(deltaTime >0 && dataRef.current.length>0){
      let delta = deltaTime
      const new_logger = {}
      let flag = 0
      while (deltaTime > 0 ){
        let dt = deltaTime >= 2 ? 2 : deltaTime
        let t = tRef.current
        dataRef.current = flag % 4==0 ? rk4(pvFunc,hemodynamicPropsRef.current,new_logger)(dataRef.current,t,dt): rk4(pvFunc,hemodynamicPropsRef.current,null)(dataRef.current,t,dt)
        tRef.current += dt
        deltaTime -= dt
        flag ++;
      }
      for(let update of Object.values(subscriptionsRef.current)){
        update(new_logger, tRef.current, hemodynamicPropsRef.current)
      }
    }
  })
  const setHemodynamicProps = newProps => {hemodynamicPropsRef.current = newProps}
   
  return {subscribe, unsubscribe, isPlaying, setIsPlaying,setHemodynamicProps}
}



export const DEFAULT_DATA = [547.8023811212952, 125.29247043455904, 327.3148549511764, 118.96936622914811, 145.92142650139675, 49.463089479002896, 127.49227638555105, 34.55375220239585, 6.854163282131312, 16.336219413346292]
export const DEFAULT_TIME = 5.2397

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

