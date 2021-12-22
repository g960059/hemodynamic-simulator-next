export const InputRanges = {
  LV_Ees: {
    min: 0.2, max: 10, step: 0.01, unit: "mmHg/ml",
  },
  LV_V0 : {
    min:0 , max: 50, step: 1, unit: "ml",
  },
  LV_alpha : {
    min: 0.01, max: 0.07, step: 0.001, unit: "/ml",
  },
  LV_beta : {
    min:0.1 , max:0.75 , step: 0.01, unit: "mmHg",
  },
  LV_Tmax : {
    min:100 , max:300 , step: 1, unit: "ms",
  },
  LV_tau : {
    min:15 , max: 80 , step: 1, unit: "ms",
  },
  LV_AV_delay : {
    min:0 , max: 300, step: 1, unit: "ms",
  },
  RV_Ees: {
    min: 0.1, max: 3, step: 0.01, unit: "mmHg/ml",
  },
  RV_V0 : {
    min:0 , max: 50, step: 1, unit: "ml",
  },
  RV_alpha : {
    min: 0.01, max: 0.07, step: 0.001, unit: "/ml",
  },
  RV_beta : {
    min:0.1 , max:0.75 , step: 0.01, unit: "mmHg",
  },
  RV_Tmax : {
    min:100 , max:600 , step: 1, unit: "ms",
  },
  RV_tau : {
    min:5 , max:120 , step: 1, unit: "ms",
  },
  RV_AV_delay : {
    min:0 , max: 300, step: 1, unit: "ms",
  },
  LA_Ees: {
    min: 0.1, max: 2, step: 0.01, unit: "mmHg/ml",
  },
  LA_V0 : {
    min:0 , max: 50, step: 1, unit: "ml",
  },
  LA_alpha : {
    min: 0.01, max: 0.1, step: 0.001, unit: "/ml",
  },
  LA_beta : {
    min:0.1 , max:0.75 , step: 0.01, unit: "mmHg",
  },
  LA_Tmax : {
    min:10 , max:300 , step: 1, unit: "ms",
  },
  LA_tau : {
    min:15 , max:50 , step: 1, unit: "ms",
  },
  LA_AV_delay : {
    min:0 , max: 300, step: 1, unit: "ms",
  },
  RA_Ees: {
    min: 0.05, max: 1, step: 0.01, unit: "mmHg/ml",
  },
  RA_V0 : {
    min:0 , max: 50, step: 1, unit: "ml",
  },
  RA_alpha : {
    min: 0.01, max: 0.07, step: 0.001, unit: "/ml",
  },
  RA_beta : {
    min:0.1 , max:0.75 , step: 0.01, unit: "mmHg",
  },
  RA_Tmax : {
    min:50 , max:400 , step: 1, unit: "ms",
  },
  RA_tau : {
    min:5 , max:120 , step: 1, unit: "ms",
  },
  RA_AV_delay : {
    min:0 , max: 300, step: 1, unit: "ms",
  },
  Rcs : {
    min:10 , max: 500, step: 10, unit: "mmHg·ms/ml",
  },
  Rcp : {
    min:10 , max: 150, step: 1, unit: "mmHg·ms/ml",
  },
  Ras : {
    min:200 , max: 5000, step: 10, unit: "mmHg·ms/ml",
  },
  Rap : {
    min:10 , max: 3000, step: 10, unit: "mmHg·ms/ml",
  },
  Rvs : {
    min:5 , max: 50, step: 5, unit: "mmHg·ms/ml",
  },
  Rvp : {
    min:5 , max: 50, step: 5, unit: "mmHg·ms/ml",
  },
  Ras_prox : {
    min:20 , max: 60, step: 1, unit: "mmHg·ms/ml",
  },
  Rap_prox : {
    min:10 , max: 60, step: 1, unit: "mmHg·ms/ml",
  },
  Cas : {
    min:0.2 , max: 8, step: 0.01, unit: "ml/mmHg",
  },
  Cap : {
    min:0.2 , max: 30, step: 0.1, unit: "ml/mmHg",
  },
  Cvs : {
    min:1 , max: 120, step: 1, unit: "ml/mmHg",
  },
  Cvp : {
    min:1 , max: 50, step: 1, unit: "ml/mmHg",
  },
  Cas_prox : {
    min:0.04 , max: 0.5, step: 0.01, unit: "ml/mmHg",
  },
  Cap_prox : {
    min:0.1 , max: 3, step: 0.1, unit: "ml/mmHg",
  },
  Volume: {
    min: 400, max: 4000, step: 10, unit: "ml",
  },
  HR: {
    min: 30, max: 150, step: 1, unit: "bpm",
  },
  Ravs:{
    min: 0, max: 100, step:10, unit: "mmHg·ms/ml",
  }, 
  Ravr:{
    min: 300, max: 10000, step:100, unit: "mmHg·ms/ml",
  }, 
  Rmvr:{
    min: 300, max: 10000, step:100, unit: "mmHg·ms/ml",
  }, 
  Rmvs:{
    min: 0, max: 100, step:10, unit: "mmHg·ms/ml",
  }, 
  Rpvr:{
    min: 300, max: 10000, step:100, unit: "mmHg·ms/ml",
  }, 
  Rpvs:{
    min: 0, max: 100, step:10, unit: "mmHg·ms/ml",
  }, 
  Rtvr:{
    min: 300, max: 10000, step:100, unit: "mmHg·ms/ml",
  }, 
  Rtvs:{
    min: 0, max: 100, step:10, unit: "mmHg·ms/ml",
  },
}

export const MutationTimings = {
  'LV_Ees': 'EndDiastolic',
  'LV_alpha': 'EndSystolic',
  'LV_beta': 'EndSystolic',
  'LV_Tmax': 'EndDiastolic',
  'LV_tau': 'EndSystolic',
  'RV_Ees': 'EndDiastolic',
  'RV_alpha': 'EndSystolic',
  'RV_beta': 'EndSystolic',
  'RV_Tmax': 'EndDiastolic',
  'RV_tau': 'EndSystolic',
  'LA_Ees': 'EndDiastolic',
  'LA_alpha': 'EndSystolic',
  'LA_beta': 'EndSystolic',
  'LA_Tmax': 'EndDiastolic',
  'LA_tau': 'EndSystolic',
  'RA_Ees': 'EndDiastolic',
  'RA_alpha': 'EndSystolic',
  'RA_beta': 'EndSystolic',
  'RA_Tmax': 'EndDiastolic',
  'RA_tau': 'EndSystolic',
  'HR': 'HR',
}

export const VDOptions = {
  "avs": [0,70,120,270],//,610
  "avr": [100000,28000,6200,2700],
  "mvs": [0,50,150,520],
  "mvr": [100000,13000,1300,300],
  "tvs": [0,15,60,250],
  "tvr": [100000,30000,5000,400],
  "pvs": [0,250,800,2400],
  "pvr": [100000,10000,2000,800]
}