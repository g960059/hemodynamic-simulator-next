import React, { useRef, useState, useEffect, useCallback} from 'react'
import {useDocumentVisibilityChange, getVisibilityPropertyNames} from "./useDocumentVisibility"
import {rk4}  from '../utils/RungeKutta/Rk4'
import {e, pvFunc, P} from '../utils/pvFunc'
import { nanoid } from 'nanoid'
import {MutationTimings} from '../constants/InputSettings'
import {DEFAULT_DATA, DEFAULT_TIME,DEFAULT_HEMODYANMIC_PROPS} from '../utils/presets'

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
  const hemodynamicPropsRef = useRef({...initialHemodynamicProps});
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
            hemodynamicPropsRef.current[hdpKey] = hdpValue
            delete hdpMutationsRef.current[hdpKey]
          }else if(hdpKey === 'HR'){
            if( ((60000/hdpValue) - (tRef.current-160) % (60000/hdpValue)) < 100 && ((60000/hemodynamicPropsRef.current['HR']) - (tRef.current-160) % (60000/hemodynamicPropsRef.current['HR'])) < 100 ){
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
  const getHdps = () => hemodynamicPropsRef.current
  const setSpeed = useCallback(newSpeed => speedRef.current = newSpeed)
  return {subscribe, unsubscribe, isPlaying, setIsPlaying,setHdps, getHdps, setSpeed}
}

