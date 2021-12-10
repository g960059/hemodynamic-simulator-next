export const e = (_t, Tmax, tau, HR)=>{
  const t_ = _t % (60000/HR)
  if(t_ < Tmax){
    const base = Math.exp(-(60000/HR-3*Tmax/2)/tau)/2
    return (Math.sin(Math.PI * t_/Tmax- Math.PI/2)+1)/2 *(1-base) + base
  }else{
    if(t_ < 3*Tmax/2){
      return (Math.sin(Math.PI * t_/Tmax- Math.PI/2)+1)/2 
    }else{
      return Math.exp(-(t_-3*Tmax/2)/tau)/2
    }
  }
}

// use memo

export const P = (V, t,Ees,V0, alpha, beta,Tmax, tau, AV_delay,HR)=>{
  const Ped = beta * (Math.exp(alpha*(V-V0))-1) 
  const Pes = Ees * (V-V0)
  return Ped + e(t-AV_delay,Tmax,tau,HR)*(Pes-Ped)
}

const keys = ["t","Qvs", "Qas", "Qap", "Qvp", "Qlv", "Qla", "Qrv", "Qra", "Qas_prox","Qap_prox","Plv", "Pla", "Prv", "Pra","Ias","Ics","Imv","Ivp","Iap","Icp","Itv","Ivs","Iasp","Iapp", "AoP", "PAP",'HR']

export const pvFunc = (t,[Qvs, Qas, Qap, Qvp, Qlv, Qla, Qrv, Qra, Qas_prox,Qap_prox,Qtube],
    { Rcs,Rcp,Ras,Rvs,Rap,Rvp,Ras_prox,Rap_prox,Rmv,Rtv,Cas,Cvs,Cap,Cvp,Cas_prox,Cap_prox,
      LV_Ees,LV_V0,LV_alpha,LV_beta,LV_Tmax,LV_tau,LV_AV_delay,
      LA_Ees,LA_V0,LA_alpha,LA_beta,LA_Tmax,LA_tau,LA_AV_delay,
      RV_Ees,RV_V0,RV_alpha,RV_beta,RV_Tmax,RV_tau,RV_AV_delay,
      RA_Ees,RA_V0,RA_alpha,RA_beta,RA_Tmax,RA_tau,RA_AV_delay,HR,
      Ravs, Ravr, Rmvr, Rmvs, Rpvr, Rpvs, Rtvr, Rtvs, impella_type, impella_aux_level,ecmo_speed,Ctube,Rtube
    } ={}
    ,logger =null
    )=>{
    const Plv = P(Qlv,t, LV_Ees, LV_V0, LV_alpha, LV_beta, LV_Tmax, LV_tau, LV_AV_delay, HR)
    const Pla = P(Qla,t, LA_Ees, LA_V0, LA_alpha, LA_beta, LA_Tmax, LA_tau, LA_AV_delay, HR)
    const Prv = P(Qrv,t, RV_Ees, RV_V0, RV_alpha, RV_beta, RV_Tmax, RV_tau, RV_AV_delay, HR)
    const Pra = P(Qra,t, RA_Ees, RA_V0, RA_alpha, RA_beta, RA_Tmax, RA_tau, RA_AV_delay, HR)

    let Ias = (Qas/Cas-Qvs/Cvs)/Ras
    let Ics = (Qas_prox/Cas_prox-Qas/Cas)/Rcs  
    let Imv = (Pla-Plv) > 0 ? (Pla-Plv)/(Rmv+Rmvs) : (Pla-Plv)/(Rmv+Rmvr)
    let Ivp = (Qvp/Cvp-Pla)/Rvp
    let Iap = (Qap/Cap-Qvp/Cvp)/Rap
    let Icp = (Qap_prox/Cap_prox-Qap/Cap)/Rcp
    let Itv = (Pra-Prv)>0 ? (Pra-Prv)/(Rtv+Rtvs) : (Pra-Prv)/(Rtv+Rtvr)
    let Ivs = (Qvs/Cvs-Pra)/Rvs
    let deltaAvp = Plv-Qas_prox/Cas_prox
    let Iasp = deltaAvp > 0 ? (deltaAvp)/(Ras_prox+Ravs) : (deltaAvp)/(Ras_prox+Ravr)
    let Iimp = implella[impella_type][impella_aux_level](-deltaAvp)/30
    let Iapp =(Prv-Qap_prox/Cap_prox) > 0 ? (Prv-Qap_prox/Cap_prox)/(Rap_prox+Rpvs) : (Prv-Qap_prox/Cap_prox)/(Rap_prox+Rpvr) 
    const deltaP = Qtube/Ctube-Qvs/Cvs
    const Ip = ecmo_speed ==0 ? 0 : (2.43*10**(-5)*ecmo_speed*deltaP + 2.86*10**(-2)*ecmo_speed - 0.153*deltaP-15.7)/1000;
    const Itube= ecmo_speed ==0 ? 0 : (Qtube/Ctube - Qas_prox/Cas_prox)/Rtube;

    if(logger != null){
      let AoP = Qas_prox/Cas_prox + Iasp*Ras_prox
      let PAP = Qap_prox/Cap_prox + Iapp*Rap_prox
      const vals = [t,Qvs, Qas, Qap, Qvp, Qlv, Qla, Qrv, Qra, Qas_prox,Qap_prox,Plv, Pla, Prv, Pra,Ias,Ics,Imv,Ivp,Iap,Icp,Itv,Ivs,Iasp,Iapp, AoP, PAP, HR]
      for(let i =0; i< keys.length; i++){
        (logger[keys[i]]||(logger[keys[i]]=[])).push(vals[i]);
      }
    }
    return [Ias-Ivs-Ip, Ics-Ias, Icp-Iap, Iap-Ivp, Imv-Iasp-Iimp, Ivp-Imv, Itv-Iapp, Ivs-Itv, Iasp-Ics+Iimp+Itube, Iapp-Icp, Ip-Itube]
}

//0:Qvs, 1:Qas,2:Qap,3:Qvp,4:Qlv,5:Qla,6:Qrv,7:Qra,8:Qas_prox,9:Qap_prox,10:Plv,11:Pla,12:Prv,13:Pra,14:Ias,15:Ics,16:Imv,17:Ivp,18:Iap,19:Icp,20:Itv,21:Ivs,22:Iasp,23:Iapp
//{LV:[4,10],LA:[5,11],RV:[6,12],RA:[7,13]}

export const u_P=(V,T, Ees,V0,alpha, beta, Tmax, tau, AV_delay, HR) =>{
  const len = V.length
  const res = new Array(len)
  for(let i=0;i<len;i++){
    res[i] = P(V[i],T[i], Ees,V0, alpha, beta, Tmax, tau, AV_delay, HR)
  }
  return res
}

export const implella = {
  None:{
    P1: h => 0,
    P2: h => 0,
    P3: h => 0,
    P4: h => 0,
    P5: h => 0,
    P6: h => 0,
    P7: h => 0,
    P8: h => 0,
    P9: h => 0,
  },
  "2.5": {
    P1: h => -5.8*10**(-7)*h**4+5.44*10**(-5)* h **3-2.1*10**(-3)* h **2+0.012*h +1.16,
    P2: h => -1.55*10**(-8)*h**4+2.35*10**(-6)*h**3-3.02*10**(-4)*h**2+9.71*10**(-4)*h+1.73,
    P3: h => -5.02*10**(-9)*h**4+6.12*10**(-7)*h**3-1.64*10**(-4)*h**2+2.91*10**(-3)*h+1.91,
    P4: h => -6.84*10**(-9)*h**4+1.06*10**(-6)*h**3-1.75*10**(-4)*h**2+1.84*10**(-3)*h+2.01,
    P5: h => 3.61*10**(-9)*h**4-1.39*10**(-6)*h**3+4.93*10**(-5)*h**2-7.98*10**(-3)*h+2.23,
    P6: h =>  3.73*10**(-9)*h**4-1.51*10**(-6)*h**3+8.73*10**(-5)*h**2-9.33*10**(-3)*h+2.36,
    P7: h =>  2.52*10**(-9)*h**4-1.21*10**(-6)*h**3+8.37*10**(-5)*h**2-9.40*10**(-3)*h+2.47,
    P8: h =>  1.01*10**(-9)*h**4-7.04*10**(-7)*h**3+4.74*10**(-5)*h**2-7.59*10**(-3)*h+2.62,
    P9: h =>  -6.31*10**(-11)*h**4-2.55*10**(-7)*h**3-1.90*10**(-6)*h**2-5.58*10**(-3)*h+2.61,
  },
  "CP": {
    P1: h=> 1.567*10**(-6)*h**4-1.351*10**(-4)*h**3+2.719*10**(-3)*h**2-3.315*10**(-2)*h+1.836,
    P2: h=> 2.362*10**(-7)*h**4-4.116*10**(-5)*h**3+1.899*10**(-3)*h**2-4.289*10**(-2)*h+2.655,
    P3: h=> 1.058*10**(-7)*h**4-2.308*10**(-5)*h**3+1.248*10**(-3)*h**2-3.528*10**(-2)*h+2.81,
    P4: h=> 1.335*10**(-7)*h**4-2.876*10**(-5)*h**3+1.711*10**(-3)*h**2-4.597*10**(-2)*h+3.041,
    P5: h=> 8.358*10**(-8)*h**4-2.047*10**(-5)*h**3+1.373*10**(-3)*h**2-4.246*10**(-2)*h+3.229,
    P6: h=> 5.736*10**(-8)*h**4-1.586*10**(-5)*h**3+1.201*10**(-3)*h**2-4.124*10**(-2)*h+3.419,
    P7: h=> 2.939*10**(-8)*h**4-9.829*10**(-6)*h**3+8.823*10**(-4)*h**2-3.647*10**(-2)*h+3.683,
    P8: h=> 1.984*10**(-8)*h**4-7.442*10**(-6)*h**3+7.403*10**(-4)*h**2-3.422*10**(-2)*h+3.866,
    P9: h=> 1.775*10**(-8)*h**4-6.962*10**(-6)*h**3+7.433*10**(-4)*h**2-3.556*10**(-2)*h+4.054,
  },
  "5.0" : {
    P1: h=> -1.658*10**(-8)*h**4+3.664*10**(-6)*h**3-2.096*10**(-4)*h**2-5.325*10**(-2)*h+1.730,
    P2: h=> -4.494*10**(-8)*h**4+1.258*10**(-5)*h**3-1.096*10**(-3)*h**2-5.899*10**(-3)*h+2.828,
    P3: h=> -4.409*10**(-8)*h**4+1.335*10**(-5)*h**3-1.320*10**(-3)*h**2+1.297*10**(-2)*h+3.224,
    P4: h=> -2.526*10**(-8)*h**4+9.042*10**(-6)*h**3-1.067*10**(-3)*h**2+1.463*10**(-2)*h+3.522,
    P5: h=> -1.452*10**(-8)*h**4+6.151*10**(-6)*h**3-8.624*10**(-4)*h**2+1.570*10**(-2)*h+3.794,
    P6: h=> -5.08*10**(-9)*h**4+3.12*10**(-6)*h**3-5.9*10**(-4)*h**2+1.27*10**(-2)*h+4.087,
    P7: h=> 6.95*10**(-9)*h**4-1.31*10**(-6)*h**3-9.4*10**(-5)*h**2-1.16*10**(-3)*h+4.438,
    P8: h=> 1.49*10**(-8)*h**4-4.54*10**(-6)*h**3+3.02*10**(-4)*h**2-1.32*10**(-2)*h+4.772,
    P9: h=> 2.62*10**(-9)*h**4-1.08*10**(-6)*h**3+3.33*10**(-5)*h**2-5.0*10**(-3)*h+5.25,
  }
}


export default pvFunc