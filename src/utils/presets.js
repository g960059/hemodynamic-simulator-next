import { nanoid } from 'nanoid'
import {metricOptions} from './metrics'

export const DEFAULT_DATA = [749.9842973712131, 149.3527787113375, 405.08061599015554, 135.97317102061024, 144.32186565319813, 75.34345155268299, 117.70495107318685, 73.76400781737635, 68.42882775454605, 42.75963410693713, 20.28639894876003, 10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,]
export const DEFAULT_TIME = 954.931700000081
export const DEFAULT_HEMODYANMIC_PROPS =  {
  Ras : 20,
  Rcs: 830,
  Rvs : 25,
  Ras_prox : 30, //4
  Rcp : 10,
  Rap : 13,
  Rvp : 15,
  Rap_prox : 15,

  Rmv : 2.5,
  Rtv : 2.5,

  Cas : 1.83,
  Cvs : 70,
  Cas_prox : 0.54,
  Cap : 20,
  Cvp : 7,  
  Cap_prox : 1.0,

  Las_prox: 2,
  Las : 1700,
  Lap_prox: 52,
  Lap : 1700,

  Ciabp: 1.5,
  Rda: 3,
  Cda: 0.52,
  Qdrive: 40,
  Qbase:4,
  RadiusDscAorta: 1,
  LengthIabp: 18,
  DelayInflation: 100,
  DelayDeflation: 0,
  IabpFreq: 0,

  LV_Ees : 2.21,
  LV_V0 : 5,
  LV_alpha : 0.029,
  LV_beta : 0.34,
  LV_Tmax : 300,
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

  Ravr: 100000,
  Ravs: 0,
  Rmvr: 100000,
  Rmvs: 0,
  Rpvr: 100000,
  Rpvs: 0,
  Rtvr: 100000,
  Rtvs: 0,
  impella_type: "None", 
  impella_aux_level: "P5",
  ecmo_speed: 0,
  Ctube:0.1,
  Rtube:20000,

  Clmca: 0.002,
  Clad: 0.0015,
  Clad1: 0.0013,
  Clad2: 0.0012,
  Clad3: 0.00028,
  Clad4: 0.0019,
  Cdiag: 0.0016,
  Clcx: 0.0011,
  Clcx1: 0.00065,
  Clcx2: 0.00075,
  Clcx3: 0.001,
  Cmarg1: 0.0012,
  Cmarg2: 0.00077,
  Cmarg3: 0.001,
  Clcv: 0.06,
  
  Rlmca: 6000,
  Rlad: 500,
  Rlad1: 3100,
  Rlad2: 870,
  Rlad3: 6700,
  Rlad4: 4700,
  Rdiag: 1900,
  Rlcx: 300,
  Rlcx1: 400,
  Rlcx2: 800,
  Rlcx3: 270,
  Rmarg1: 1400,
  Rmarg2: 2200,
  Rmarg3: 2400,
  Rlcv: 10600,


  // 3 or 10.6 or 13.6

  Llmca: 20000,
  Llad: 30000,
  Llad1: 100000,
  Llad2: 40000,
  Llad3: 100000,
  Llad4: 160000,
  Ldiag: 80000,
  Llcx: 20000,
  Llcx1: 20000,
  Llcx2: 40000,
  Llcx3: 90000,
  Lmarg1: 60000,
  Lmarg2: 70000,
  Lmarg3: 80000,

  Rz3 : 115600,
  Rz4 : 425000,
  Rz5 : 55200,
  Rz6 : 115000,
  Rz7 : 128400,
  Rz8 : 122000,
  Rz9 : 130100,
  Rz10 :55100,

  Hb:15,
  VO2: 250,
}

export const NORMAL_PRESETS = {          
  initialHdps: DEFAULT_HEMODYANMIC_PROPS,
  initialData: DEFAULT_DATA,
  initialTime: DEFAULT_TIME
}

export const HFREF_PRESETS = {          
  initialHdps: {
    ...DEFAULT_HEMODYANMIC_PROPS,

  },
  initialData: DEFAULT_DATA,
  initialTime: DEFAULT_TIME
}

export const DEFAULT_CONTROLLER = [
  {
    id: "basic",
    name: "基本",
    tabs: [{name: "基本",hdps:['Volume','HR','LV_Ees','LV_alpha','Ras','Hb']}],
  },
  {
    id:"cardiofunctions",
    name: "心機能",
    tabs: [
      {name: "左室",hdps:["LV_Ees","LV_alpha" ,"LV_Tmax" ,"LV_tau" ,"LV_AV_delay"]},
      {name: "左房",hdps:["LA_Ees","LA_alpha" ,"LA_Tmax" ,"LA_tau" ,"LA_AV_delay"]},
      {name: "右室",hdps:["RV_Ees","RV_alpha" ,"RV_Tmax" ,"RV_tau" ,"RV_AV_delay"]},
      {name: "右房",hdps:["RA_Ees","RA_alpha" ,"RA_Tmax" ,"RA_tau" ,"RA_AV_delay"]},
    ],
  },
  {
    id: "vessels",
    name: "血管",
    tabs: [
      {name: "体血管",hdps:["Ras","Rvs","Ras_prox","Rcs","Cas","Cvs"]},
      {name: "肺血管",hdps:["Rap","Rvp","Rap_prox","Rcp","Cap","Cvp"]},
    ],
  },
  {
    id: "valves" ,
    name: "弁膜症",
    tabs: [
      {name: "弁膜症",hdps:["Ravs","Ravr","Rmvs","Rmvr","Rtvs","Rtvr","Rpvs","Rpvr"]}
    ]
  },
  {
    id:"assisted_circulation",
    name:"補助循環",
    tabs:[
      {name: "補助循環",hdps:["Impella","ECMO"]}
    ]
  }
]

export const DEFAULT_CONTROLLER_NEXT = [
  {
    id: "basic",
    name: "基本",
    items:[
      {mode:"basic",hdp:'Volume',options:[], id:nanoid()},
      {mode:"basic",hdp:'HR',options:[], id:nanoid()},
      {mode:"basic",hdp:'LV_Ees',options:[], id:nanoid()},
      {mode:"basic",hdp:'LV_alpha',options:[], id:nanoid()},
      {mode:"basic",hdp:'Rcs',options:[], id:nanoid()},
      {mode:"advanced",hdp:'Hb',options:[], id:nanoid()},
      {mode:"advanced",hdp:'VO2',options:[], id:nanoid()},
    ],
    controllers: [],
  },
  {
    id:"cardiofunctions",
    name: "心機能",
    items:[],
    controllers: [
      {
        id:"lv",
        name: "左室",
        items:[
          {mode:"basic",hdp:"LV_Ees",options:[], id:nanoid()},
          {mode:"basic",hdp:"LV_alpha",options:[], id:nanoid()},
          {mode:"basic",hdp:"LV_Tmax",options:[], id:nanoid()},
          {mode:"basic",hdp:"LV_tau",options:[], id:nanoid()},
          {mode:"basic",hdp:"LV_AV_delay",options:[], id:nanoid()}
        ]
      },
      {
        id:"la",
        name: "左房",
        items:[
          {mode:"basic",hdp:"LA_Ees",options:[], id:nanoid()},
          {mode:"basic",hdp:"LA_alpha",options:[], id:nanoid()},
          {mode:"basic",hdp:"LA_Tmax",options:[], id:nanoid()},
          {mode:"basic",hdp:"LA_tau",options:[], id:nanoid()},
          {mode:"basic",hdp:"LA_AV_delay",options:[], id:nanoid()}
        ]
      },
      {
        id:"rv",
        name: "右室",
        items:[
          {mode:"basic",hdp:"RV_Ees",options:[], id:nanoid()},
          {mode:"basic",hdp:"RV_alpha",options:[], id:nanoid()},
          {mode:"basic",hdp:"RV_Tmax",options:[], id:nanoid()},
          {mode:"basic",hdp:"RV_tau",options:[], id:nanoid()},
          {mode:"basic",hdp:"RV_AV_delay",options:[], id:nanoid()}
        ]
      },
      {
        id:"ra",
        name: "右房",
        items:[
          {mode:"basic",hdp:"RA_Ees",options:[], id:nanoid()},
          {mode:"basic",hdp:"RA_alpha",options:[], id:nanoid()},
          {mode:"basic",hdp:"RA_Tmax",options:[], id:nanoid()},
          {mode:"basic",hdp:"RA_tau",options:[], id:nanoid()},
          {mode:"basic",hdp:"RA_AV_delay",options:[], id:nanoid()}
        ]
      },
    ],
  },
  {
    id: "vessels",
    name: "血管",
    controllers: [
      {
        id:"sys_vessels",
        name: "体血管",
        items:[
          {mode:"basic",hdp:"Ras",options:[], id:nanoid()},
          {mode:"basic",hdp:"Rvs",options:[], id:nanoid()},
          {mode:"basic",hdp:"Ras_prox",options:[], id:nanoid()},
          {mode:"basic",hdp:"Rcs",options:[], id:nanoid()},
          {mode:"basic",hdp:"Cas",options:[], id:nanoid()},
          {mode:"basic",hdp:"Cvs",options:[], id:nanoid()},
        ]
      },
      {
        id:"lung_vessels",
        name: "肺血管",
        items:[
          {mode:"basic",hdp:"Rap",options:[], id:nanoid()},
          {mode:"basic",hdp:"Rvp",options:[], id:nanoid()},
          {mode:"basic",hdp:"Rap_prox",options:[], id:nanoid()},
          {mode:"basic",hdp:"Rcp",options:[], id:nanoid()},
          {mode:"basic",hdp:"Cap",options:[], id:nanoid()},
          {mode:"basic",hdp:"Cvp",options:[], id:nanoid()},
        ]
      },
    ],
  },
  {
    id: "valves" ,
    name: "弁膜症",
    items:[
      {mode:"basic",hdp:"Ravs",options:[], id:nanoid()},
      {mode:"basic",hdp:"Ravr",options:[], id:nanoid()},
      {mode:"basic",hdp:"Rmvs",options:[], id:nanoid()},
      {mode:"basic",hdp:"Rmvr",options:[], id:nanoid()},
      {mode:"basic",hdp:"Rtvs",options:[], id:nanoid()},
      {mode:"basic",hdp:"Rtvr",options:[], id:nanoid()},
      {mode:"basic",hdp:"Rpvs",options:[], id:nanoid()},
      {mode:"basic",hdp:"Rpvr",options:[], id:nanoid()},
    ],    
    controllers: []
  },
  {
    id:"assisted_circulation",
    name:"補助循環",
    items:[],
    controllers:[
      {
        id:"impella&ecmo",
        name:"Impella・ECMO",
        items:[
          {mode:"basic",hdp:"Impella",options:[], id:nanoid()},
          {mode:"basic",hdp:"ECMO",options:[], id:nanoid()},
        ]
      },
      {
        id:"iabp",
        name:"IABP",
        items:[
          {mode:"basic",hdp:"IABP",options:[], id:nanoid()},
        ]
      },
    ]
  }
]

export const getTimeSeriesPressureFn = () => {
  const Plv = x => x['Plv']
  const Pla = x => x['Pla']
  const Prv = x => x['Prv']
  const Pra = x => x['Pra']
  const Iasp = x => x['Iasp']
  const Iapp = x=> x['Iapp']
  const AoP = x => x['AoP']
  const PAP = x=>x['PAP']
  return {Plv, Pla, Prv, Pra, Iasp,Iapp, AoP, PAP}
}

export const getTimeSeriesFlowFn = ({ 
  Rcs,Rcp,Ras,Rvs,Rap,Rvp,Ras_prox,Rap_prox,Rmv,Rtv,Cas,Cvs,Cap,Cvp,Cas_prox,Cap_prox,
  LV_Ees,LV_V0,LV_alpha,LV_beta,LV_Tmax,LV_tau,LV_AV_delay,
  LA_Ees,LA_V0,LA_alpha,LA_beta,LA_Tmax,LA_tau,LA_AV_delay,
  RV_Ees,RV_V0,RV_alpha,RV_beta,RV_Tmax,RV_tau,RV_AV_delay,
  RA_Ees,RA_V0,RA_alpha,RA_beta,RA_Tmax,RA_tau,RA_AV_delay,HR,
  Ravs, Ravr, Rmvr, Rmvs, Rpvr, Rpvs, Rtvr, Rtvs,
}) => {
  const Imv = x => x['Imv']
  const Itv = x => x['Itv']
  // const Iao = x => x['Iasp']+x['Iimp']
  const Iasp = x => x['Iasp']
  const Iimp = x => x['Iimp']
  const Ilad = x => x['Ilad']
  const Ilcx = x=> x['Ilcx']
  const Iao = x => x['Iao']
  return {Imv, Itv,   Ilad, Ilcx, Iasp, Iimp, Iao}
}



export const pressureTypes = ['AoP','Pla','Plv','PAP','Pra','Prv']
export const flowTypes = ['Imv','Itv', 'Ilad', 'Ilcx','Iao', 'Iasp', 'Iimp']
export const pressureVolumeTypes = ['LV','LA','RV','RA']
export const controllableHdpTypes = [
  'Volume',"HR",
  'LV_Ees', 'LV_alpha','LV_beta', 'LV_V0', 'LV_Tmax', 'LV_tau', 'LV_AV_delay', 'LA_Ees', 'LA_alpha','LA_beta', 'LA_V0', 'LA_Tmax', 'LA_tau', 'LA_AV_delay', 'RV_Ees', 'RV_alpha','RV_beta', 'RV_V0', 'RV_Tmax', 'RV_tau', 'RV_AV_delay', 'RA_Ees', 'RA_alpha','RA_beta', 'RA_V0', 'RA_Tmax', 'RA_tau', 'RA_AV_delay',
  "Ras","Rap","Rvs","Rvp","Ras_prox","Rap_prox","Rcs","Rcp","Cas","Cap","Cvs","Cvp",
  'Ravs', 'Ravr', 'Rmvs', 'Rmvr', 'Rtvs', 'Rtvr', 'Rpvs', 'Rpvr',
  "ECMO","Impella","IABP","Hb","VO2"
]

export const paramPresets = {
  Normal: {
    name: "Normal",
    baseParamSet: "Normal",
    initialHdps: DEFAULT_HEMODYANMIC_PROPS,
    initialData: DEFAULT_DATA,
    initialTime: DEFAULT_TIME,
  },
  HFrEF: {
    name: "HFrEF",
    baseParamSet: "HFrEF",
    initialHdps: {
      ...DEFAULT_HEMODYANMIC_PROPS,
      LV_Ees: 1.064,
      LV_V0: -19,
      LV_alpha: 0.018,
      LV_beta: 0.7,
      LV_Tmax: 300,
      LV_tau: 39,
      LV_AV_delay: 160,
      HR: 70,
    },
    initialData: DEFAULT_DATA,
    initialTime: DEFAULT_TIME,
  },
  HFpEF: {
    name: "HFpEF",
    baseParamSet: "HFpEF",
    initialHdps: {
      ...DEFAULT_HEMODYANMIC_PROPS,
      LV_Ees: 1.85,
      LV_V0: -28,
      LV_alpha: 0.032,
      LV_beta: 0.34,
      LV_Tmax: 300,
      LV_tau: 36,
      LV_AV_delay: 160,
      HR: 70,
    },
    initialData: DEFAULT_DATA,
    initialTime: DEFAULT_TIME,
  },
}


export const AllHdpOptions = {
  "FlowCurve" : flowTypes,
  "PressureCurve" : pressureTypes,
  "PressureVolumeCurve" : pressureVolumeTypes,
  "Metrics":  metricOptions
}

