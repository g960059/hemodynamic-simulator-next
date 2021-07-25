export const InputRanges = {
  LV_Ees: {
    min: 0.2, max: 10, step: 0.01
  },
  LV_V0 : {
    min:0 , max: 50, step: 1
  },
  LV_alpha : {
    min: 0.01, max: 0.07, step: 0.001
  },
  LV_beta : {
    min:0.1 , max:0.75 , step: 0.01
  },
  LV_Tmax : {
    min:100 , max:300 , step: 1
  },
  LV_tau : {
    min:15 , max:120 , step: 1
  },
  LV_AV_delay : {
    min:0 , max: 300, step: 1
  },
  RV_Ees: {
    min: 0.1, max: 3, step: 0.01
  },
  RV_V0 : {
    min:0 , max: 50, step: 1
  },
  RV_alpha : {
    min: 0.01, max: 0.07, step: 0.001
  },
  RV_beta : {
    min:0.1 , max:0.75 , step: 0.01
  },
  RV_Tmax : {
    min:100 , max:600 , step: 1
  },
  RV_tau : {
    min:5 , max:120 , step: 1
  },
  RV_AV_delay : {
    min:0 , max: 300, step: 1
  },
  LA_Ees: {
    min: 0.1, max: 2, step: 0.01
  },
  LA_V0 : {
    min:0 , max: 50, step: 1
  },
  LA_alpha : {
    min: 0.01, max: 0.1, step: 0.001
  },
  LA_beta : {
    min:0.1 , max:0.75 , step: 0.01
  },
  LA_Tmax : {
    min:10 , max:300 , step: 1
  },
  LA_tau : {
    min:15 , max:50 , step: 1
  },
  LA_AV_delay : {
    min:0 , max: 300, step: 1
  },
  RA_Ees: {
    min: 0.05, max: 1, step: 0.01
  },
  RA_V0 : {
    min:0 , max: 50, step: 1
  },
  RA_alpha : {
    min: 0.01, max: 0.07, step: 0.001
  },
  RA_beta : {
    min:0.1 , max:0.75 , step: 0.01
  },
  RA_Tmax : {
    min:50 , max:400 , step: 1
  },
  RA_tau : {
    min:5 , max:120 , step: 1
  },
  RA_AV_delay : {
    min:0 , max: 300, step: 1
  },
  Rcs : {
    min:10 , max: 500, step: 10
  },
  Rcp : {
    min:10 , max: 150, step: 1
  },
  Ras : {
    min:200 , max: 5000, step: 10
  },
  Rap : {
    min:10 , max: 3000, step: 10
  },
  Rvs : {
    min:5 , max: 50, step: 5
  },
  Rvp : {
    min:5 , max: 50, step: 5
  },
  Ras_prox : {
    min:20 , max: 60, step: 1
  },
  Rap_prox : {
    min:10 , max: 60, step: 1
  },
  Cas : {
    min:0.2 , max: 8, step: 0.01
  },
  Cap : {
    min:0.2 , max: 30, step: 0.1
  },
  Cvs : {
    min:1 , max: 120, step: 1
  },
  Cvp : {
    min:1 , max: 50, step: 1
  },
  Cas_prox : {
    min:0.04 , max: 0.5, step: 0.01
  },
  Cap_prox : {
    min:0.1 , max: 3, step: 0.1
  },
  Volume: {
    min: 400, max: 4000, step: 10
  },
  HR: {
    min: 30, max: 150, step: 1
  },
  Ravs:{
    min: 0, max: 100, step:10
  }, 
  Ravr:{
    min: 300, max: 10000, step:100
  }, 
  Rmvr:{
    min: 300, max: 10000, step:100
  }, 
  Rmvs:{
    min: 0, max: 100, step:10
  }, 
  Rpvr:{
    min: 300, max: 10000, step:100
  }, 
  Rpvs:{
    min: 0, max: 100, step:10
  }, 
  Rtvr:{
    min: 300, max: 10000, step:100
  }, 
  Rtvs:{
    min: 0, max: 100, step:10
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
