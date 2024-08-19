export const e = (_t, Tmax, tau, HR)=>{
  const t_ = _t % (60000/HR)
  if(t_ < Tmax){
    const base = Math.exp(-(60000/HR-3*Tmax/2)/tau)/2
    return (-Math.cos(Math.PI * t_/Tmax)+1)/2 *(1-base) + base
  }else{
    if(t_ < 9 * Tmax/8){
      return (Math.cos(2 * Math.PI * t_/Tmax)+1)/2 
    }else{
      return Math.exp(-(t_-9*Tmax/8)/tau) * (2 + Math.sqrt(2)) / 4
    }
  }
}

export const P = (V, t,Ees,V0, alpha, beta,Tmax, tau, AV_delay,HR)=>{
  const Ped = beta * (Math.exp(alpha*(V-V0))-1) 
  const Pes = Ees * (V-V0)
  return Ped + e(t-AV_delay,Tmax,tau,HR)*(Pes-Ped)
}

const Qiabp = (t,AV_delay,Tmax,HR, Qdrive,Qbase, DelayInflation,DelayDeflation) => {
  const t_ = (t-AV_delay) % (60000/HR)
  if(t_ < Tmax + DelayInflation){
    return Qbase
  }else if(t_ < Tmax +DelayInflation+ 100){
    return (Qdrive-Qbase) * (t_-Tmax-DelayInflation)/100 + Qbase
  }else if(t_ - AV_delay < 60000/HR  - 120){
    return Qdrive
  }else if(t_ - AV_delay < 60000/HR  - 80){
    return (-Qdrive) * (t_- 60000/HR - AV_delay + 120)/40 + Qdrive
  }else if(t_ - AV_delay < 60000/HR  - 40){
    return Qbase * (t_- 60000/HR - AV_delay + 80)/40
  }else{
    return Qbase
  }
}


const keys = ["t","Qvs", "Qas", "Qap", "Qvp", "Qlv", "Qla", "Qrv", "Qra", "Qas_prox","Qap_prox","Plv", "Pla", "Prv", "Pra","Ias","Ics","Imv","Ivp","Iap","Icp","Itv","Ivs","Iasp","Iapp", "AoP", "PAP", "HR", "Ilmca", "Ilad", "Ilcx", "Iimp", "Iao"]

export const pvFunc = (t,[Qvs, Qas, Qap, Qvp, Qlv, Qla, Qrv, Qra, Qas_prox,Qda, Qap_prox,Qtube, Qlmca, Qdiag, Qlad, Qlad1, Qlad2, Qlad3, Qlad4, Qlcx, Qlcx1, Qlcx2, Qlcx3, Qmarg1, Qmarg2, Qmarg3, Qlcv, Ilmca, Idiag, Ilad, Ilad1, Ilad2, Ilad3, Ilad4, Ilcx, Ilcx1, Ilcx2, Ilcx3, Imarg1, Imarg2, Imarg3],
    { Rcs,Rcp,Ras,Rvs,Rap,Rvp,Ras_prox,Rap_prox,Rmv,Rtv,Cas,Cvs,Cap,Cvp,Cas_prox,Cap_prox,
      LV_Ees,LV_V0,LV_alpha,LV_beta,LV_Tmax,LV_tau,LV_AV_delay,
      LA_Ees,LA_V0,LA_alpha,LA_beta,LA_Tmax,LA_tau,LA_AV_delay,
      RV_Ees,RV_V0,RV_alpha,RV_beta,RV_Tmax,RV_tau,RV_AV_delay,
      RA_Ees,RA_V0,RA_alpha,RA_beta,RA_Tmax,RA_tau,RA_AV_delay,HR,
      Ravs, Ravr, Rmvr, Rmvs, Rpvr, Rpvs, Rtvr, Rtvs, impella_type, impella_aux_level,ecmo_speed,Ctube,Rtube,
      Clmca, Clad, Clad1, Clad2, Clad3, Clad4, Cdiag, Clcx, Clcx1, Clcx2, Clcx3, Cmarg1, Cmarg2, Cmarg3, Clcv, 
      Rlmca, Rlad, Rlad1, Rlad2, Rlad3, Rlad4, Rdiag, Rlcx, Rlcx1, Rlcx2, Rlcx3, Rmarg1, Rmarg2, Rmarg3, Rlcv, 
      Llmca, Llad, Llad1, Llad2, Llad3, Llad4, Ldiag, Llcx, Llcx1, Llcx2, Llcx3, Lmarg1, Lmarg2, Lmarg3,
      Rz3, Rz4, Rz5, Rz6, Rz7, Rz8, Rz9, Rz10, Hb,
      Ciabp,Rda,Cda,Qdrive,Qbase,RadiusDscAorta,LengthIabp,DelayInflation,DelayDeflation, IabpFreq
    } ={}
    ,logger =null
    )=>{
    const Plv = P(Qlv,t, LV_Ees, LV_V0, LV_alpha, LV_beta, LV_Tmax, LV_tau, LV_AV_delay, HR)
    const Pla = P(Qla,t, LA_Ees, LA_V0, LA_alpha, LA_beta, LA_Tmax, LA_tau, LA_AV_delay, HR)
    const Prv = P(Qrv,t, RV_Ees, RV_V0, RV_alpha, RV_beta, RV_Tmax, RV_tau, RV_AV_delay, HR)
    const Pra = P(Qra,t, RA_Ees, RA_V0, RA_alpha, RA_beta, RA_Tmax, RA_tau, RA_AV_delay, HR)
    let qiabp = 0
    let Rda_modified = Rda
    if(IabpFreq != 0 ){
      let t_ = (t-LV_AV_delay) % (60000 * IabpFreq /HR)
      if( 0 <= t_ && t_ <= 60000 / HR){
        qiabp = Qiabp(t,LV_AV_delay, LV_Tmax,HR, Qdrive,Qbase, DelayInflation,DelayDeflation)
        let r = 1- (qiabp/(RadiusDscAorta**2)/Math.PI/LengthIabp)
        Rda_modified =  Rda / (r **2)
      }else{
        qiabp = Qbase
        let r = 1- (qiabp/(RadiusDscAorta**2)/Math.PI/LengthIabp)
        Rda_modified =  Rda / (r ** 2)
      }
    }
    const Ida = (Qas_prox/Cas_prox - Qda/Cda - qiabp/Ciabp)/Rda_modified
    const Ias = (Qda/Cda-Qas/Cas)/Ras  
    const Ics = (Qas/Cas-Qvs/Cvs)/Rcs
    const Ivs = (Qvs/Cvs-Pra)/Rvs

    const Ivp = (Qvp/Cvp-Pla)/Rvp
    const Iap = (Qap/Cap-Qvp/Cvp)/Rap
    const Icp = (Qap_prox/Cap_prox-Qap/Cap)/Rcp
   

    const gradTV = Pra-Prv;
    const Itv = gradTV > 0 ?
      (Rtvs === 0 ? gradTV/Rtv : (-Rtv+Math.sqrt(Rtv**2+4*Rtvs*gradTV))/2/Rtvs) :
      (Rtvr === 100000 ? gradTV/(Rtv+Rtvr) : (-Rtv-Math.sqrt(Rtv**2-4*Rtvr*gradTV))/2/Rtvr)
    const gradMV = Pla - Plv;
    const Imv = gradMV > 0 ? 
      (Rmvs === 0 ? gradMV/Rmv : (-Rmv+Math.sqrt(Rmv**2+4*Rmvs*gradMV))/2/Rmvs) :
      (Rmvr === 100000 ? gradMV/(Rmv+Rmvr) : (-Rmv-Math.sqrt(Rmv**2-4*Rmvr*gradMV))/2/Rmvr)
    const gradAV = Plv-Qas_prox/Cas_prox
    const Iasp = gradAV > 0 ?
      (Ravs === 0 ? gradAV/Ras_prox : (-Ras_prox+Math.sqrt(Ras_prox**2+4*Ravs*gradAV))/2/Ravs):
      (Ravr === 100000 ? gradAV/(Ras_prox+Ravr) : (-Ras_prox-Math.sqrt(Ras_prox**2-4*Ravr*gradAV))/2/Ravr)
    const gradPV = Prv-Qap_prox/Cap_prox;
    const Iapp =gradPV > 0 ? 
      (Rpvs === 0 ? gradPV/Rap_prox : (-Rap_prox+Math.sqrt(Rap_prox**2+4*Rpvs*gradPV))/2/Rpvs):
      (Rpvr === 100000 ? gradPV/(Rap_prox+Rpvr) : (-Rap_prox-Math.sqrt(Rap_prox**2-4*Rpvr*gradPV))/2/Rpvr)

    const Iimp = implella[impella_type][impella_aux_level](-gradAV)/30

    const deltaP = Qtube/Ctube-Qvs/Cvs
    const Ip = ecmo_speed ==0 ? 0 : (2.43*10**(-5)*ecmo_speed*deltaP + 2.86*10**(-2)*ecmo_speed - 0.153*deltaP-15.7)/1000;
    const Itube= ecmo_speed ==0 ? 0 : (Qtube/Ctube - Qas_prox/Cas_prox)/Rtube;

    const Klv = 1

    const Iz3 = (Qlad1/Clad1 - Klv * Plv) / Rz3
    const Iz4 = (Qlad3/Clad3 - Klv * Plv) / Rz4
    const Iz5 = (Qlad4/Clad4 - Klv * Plv) / Rz5
    const Iz6 = (Qmarg1/Cmarg1 - Klv * Plv ) / Rz6
    const Iz7 = (Qmarg2/Cmarg2 - Klv * Plv ) / Rz7
    const Iz8 = (Qmarg3/Cmarg3 - Klv * Plv ) / Rz8
    const Iz9 = (Qlcx3/Clcx3 - Klv * Plv)/ Rz9
    const Iz10 = (Qdiag/Cdiag - Klv * Plv) / Rz10
    const Ilcv = (Qlcv/Clcv - Pra) / Rlcv
    const Rh_left = 0.07 * Ilmca

    if(logger != null){
      let AoP = Qas_prox/Cas_prox + Iasp*Ras_prox
      let PAP = Qap_prox/Cap_prox + Iapp*Rap_prox
      let Iao = Iasp+Iimp
      const vals = [t,Qvs, Qas, Qap, Qvp, Qlv, Qla, Qrv, Qra, Qas_prox,Qap_prox,Plv, Pla, Prv, Pra,Ias,Ics,Imv,Ivp,Iap,Icp,Itv,Ivs,Iasp,Iapp, AoP, PAP, HR, Ilmca, Ilad, Ilcx, Iimp, Iao]
      for(let i =0; i< keys.length; i++){
        if([ "Ilmca", "Ilad", "Ilcx", "Iimp", "Iao","Ics","Imv","Ivp","Iap","Icp","Itv","Ivs","Iasp","Iapp"].includes(keys[i])){
          vals[i] = vals[i]*1000
        }
        (logger[keys[i]]||(logger[keys[i]]=[])).push(vals[i]);
      }
      // console.log(t% (60000/HR),[Qvs, Qas, Qap, Qvp, Qlv, Qla, Qrv, Qra, Qas_prox,Qda, Qap_prox,Qtube, Qlmca, Qdiag, Qlad, Qlad1, Qlad2, Qlad3, Qlad4, Qlcx, Qlcx1, Qlcx2, Qlcx3, Qmarg1, Qmarg2, Qmarg3, Qlcv, Ilmca, Idiag, Ilad, Ilad1, Ilad2, Ilad3, Ilad4, Ilcx, Ilcx1, Ilcx2, Ilcx3, Imarg1, Imarg2, Imarg3]);
    }
    

    // Qvs, Qas, Qap, Qvp, Qlv, Qla, Qrv, Qra, Qas_prox,Qda, Qap_prox,Qtube,
    // Qlmca, Qdiag, Qlad, Qlad1, Qlad2, Qlad3, Qlad4, Qlcx, Qlcx1, Qlcx2, Qlcx3, Qmarg1, Qmarg2, Qmarg3, Qlcv, Ilmca, Idiag, Ilad, Ilad1, Ilad2, Ilad3, Ilad4, Ilcx, Ilcx1, Ilcx2, Ilcx3, Imarg1, Imarg2, Imarg3
    return [Ics-Ivs-Ip, Ias-Ics, Icp-Iap, Iap-Ivp, Imv-Iasp-Iimp, Ivp-Imv, Itv-Iapp, Ivs-Itv, Iasp-Ida+Iimp+Itube, Ida-Ias, Iapp-Icp, Ip-Itube,
      Ilmca-Idiag-Ilcx-Ilad,Idiag-Iz10,Ilad-Ilad1-Ilad2,Ilad1-Iz3,Ilad2-Ilad3-Ilad4,Ilad3-Iz4, Ilad4-Iz5,Ilcx-Imarg1-Ilcx1,Ilcx1-Imarg2-Ilcx2,Ilcx2-Imarg3-Ilcx3,Ilcx3-Iz9, Imarg1-Iz6,Imarg2-Iz7,Imarg3-Iz8, Iz3+Iz4+Iz5+Iz6+Iz7+Iz8+Iz9+Iz10-Ilcv, 
      -((Rlmca+Rh_left)*Ilmca + Qlmca/Clmca -(Qas_prox/Cas_prox + Iasp*Ras_prox))/Llmca,
      -(Rdiag*Idiag + Qdiag/Cdiag - Qlmca/Clmca)/Ldiag,
      -(Rlad*Ilad + Qlad/Clad - Qlmca/Clmca)/Llad,
      -(Rlad1*Ilad1 + Qlad1/Clad1 - Qlad/Clad)/Llad1,
      -(Rlad2*Ilad2 + Qlad2/Clad2 - Qlad/Clad)/Llad2,
      -(Rlad3*Ilad3 + Qlad3/Clad3 - Qlad2/Clad2)/Llad3,
      -(Rlad4*Ilad4 + Qlad4/Clad4 - Qlad2/Clad2)/Llad4,
      -(Rlcx*Ilcx + Qlcx/Clcx - Qlmca/Clmca)/Llcx,
      -(Rlcx1*Ilcx1 + Qlcx1/Clcx1 - Qlcx/Clcx)/Llcx1,
      -(Rlcx2*Ilcx2 + Qlcx2/Clcx2 - Qlcx1/Clcx1)/Llcx2,
      -(Rlcx3*Ilcx3 + Qlcx3/Clcx3 - Qlcx2/Clcx2)/Llcx3,
      -(Rmarg1*Imarg1 + Qmarg1/Cmarg1 - Qlcx/Clcx)/Lmarg1,
      -(Rmarg2*Imarg2 + Qmarg2/Cmarg2 - Qlcx1/Clcx1)/Lmarg2,
      -(Rmarg3*Imarg3 + Qmarg3/Cmarg3 - Qlcx2/Clcx2)/Lmarg3,
      // (Qas_prox/Cas_prox-Qas/Cas- Ras*Ias) / Las,
      // Iasp >= 0 ? (Plv-Qas_prox/Cas_prox - Iasp*Ras_prox - Ravs * (Ias ^ 2)) / Las_prox : (Plv - Qas_prox/Cas_prox - Iasp*Ras_prox + Ravr * (Ias ^ 2)) / Las_prox,
    ]
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