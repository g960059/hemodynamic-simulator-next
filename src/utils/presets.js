import { nanoid } from 'nanoid'

export const DEFAULT_DATA = [517.0283988780775, 139.6755778937746, 342.074495051476, 114.12917857876639, 138.23726297508844, 72.32261938109193, 92.40876881733028, 59.370961675606274, 7.629709285843546, 17.12302746294433,0]
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
}

export const DEFAULT_CONTROLLER = [
  {
    id: "basic",
    name: "基本",
    tabs: [{name: "基本",hdps:['Volume','HR','LV_Ees','LV_alpha','Ras']}],
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
      {mode:"basic",hdp:'Ras',options:[], id:nanoid()}
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
    items:[
      {mode:"basic",hdp:"Impella",options:[], id:nanoid()},
      {mode:"basic",hdp:"ECMO",options:[], id:nanoid()},
    ],
    controllers:[]
  }
]
