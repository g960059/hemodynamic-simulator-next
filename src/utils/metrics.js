
export class SV {
  constructor(){
    this.lvedv = -Infinity
    this.lvesv = Infinity
  }
  static getLabel(){
    return "SV"
  }
  static getUnit(){
    return "ml"
  }
  update(data, time, hdps){
    const ts = data['t'].map(_t=> (_t - hdps['LV_AV_delay']) % (60000 / data['HR'][0]))
    const _ts = ts.map(_t=> _t< hdps["LV_Tmax"] ? 10000 : _t - hdps["LV_Tmax"])
    const tes = Math.min(..._ts)
    if(tes < 5 ){
      const tesIndex = _ts.findIndex(_t => _t === tes)
      this.lvesv = data['Qlv'][tesIndex];
    }else{
      const ted = Math.max(...ts)
      if(60000/data['HR'][0] - ted  < 5){
        const tedIndex = ts.findIndex(_t => _t === ted)
        this.lvedv = data['Qlv'][tedIndex];
      }
    } 
  }
  reset(){
  }
  get() {
    return (this.lvedv - this.lvesv)?.toPrecision(3)
  }
  getMetric(){
    if (this.lvedv === -Infinity || this.lvesv === Infinity) return null
    else{
      return (this.lvedv - this.lvesv)
    }
  }
}
export class EF extends SV{
  constructor(){
    super()
  }
  static getLabel(){
    return "EF"
  }
  static getUnit(){
    return "%"
  }
  get(){
    return ((this.lvedv - this.lvesv)/this.lvedv*100)?.toFixed(2)
  }
  getMetric(){
    return ((this.lvedv - this.lvesv)/this.lvedv*100)
  }
}
export class LVEDP{
  constructor(){
    this.lvedp = null
  }
  static getLabel(){
    return "LVEDP"
  }
  static getUnit(){
    return "mmHg"
  }
  update(data, time, hdps){
    const ts = data['t'].map(_t=> (_t - hdps['LV_AV_delay']) % (60000 / data['HR'][0]))
    const _ts = ts.map(_t=> _t< hdps["LV_Tmax"] ? 10000 : _t - hdps["LV_Tmax"])
    const ted = Math.max(...ts)
    if(60000/data['HR'][0] - ted  < 5){
      const tedIndex = ts.findIndex(_t => _t === ted)
      this.lvedp = data['Plv'][tedIndex];
    } 
  }
  reset(){
  }
  get(){
    return this.lvedp?.toPrecision(3)
  }
  getMetric(){
    return this.lvedp
  }
}
export class AoP{
  constructor(){
    this.min = Infinity
    this.max = -Infinity
    this.tc=0
    this.min_next= Infinity
    this.max_next = -Infinity
    this.prop = "AoP"
  }
  static getLabel(){
    return "AoP"
  }
  static getUnit(){
    return "mmHg"
  }
  update(data, time, hdps){
    let tp = Math.floor(time / (60000 / data['HR'][0]))
    if(this.tc != tp){
      this.tc = tp;
      this.min = this.min_next;
      this.max = this.max_next;
      this.min_next= Infinity;
      this.max_next = -Infinity;
    }
    this.min_next = Math.min(...data[this.prop],this.min_next);
    this.max_next = Math.max(...data[this.prop],this.max_next);
  }
  reset(){
  }
  get(){
    return Math.floor(this.max) + "/" + Math.floor(this.min)
  }
  getMetric(){
    return this.max
  }
}
export class PAP extends AoP {
  constructor(){
    super();
    this.prop ="PAP"
  }
  static getLabel(){
    return "PAP"
  }
  getMetric(){
    return (this.max+this.min*2)/3
  }
}
export class CVP extends AoP {
  constructor(){
    super();
    this.prop ="Pra"
  }
  static getLabel(){
    return "CVP"
  }
  getMetric(){
    return (this.max+this.min*2)/3
  }
}
export class LAP extends AoP {
  constructor(){
    super();
    this.prop ="Pla"
  }
  static getLabel(){
    return "LAP"
  }
  getMetric(){
    return (this.max+this.min*2)/3
  }
}
export class HR {
  constructor(){
    this.HR = null
  }
  static getLabel(){
    return "HR"
  }
  static getUnit(){
    return "/min"
  }
  update(data, time, hdps){
    this.HR= data['HR'][0]
  }
  reset(){
    this.HR=null
  }
  get(){
    return this.HR?.toPrecision(3)
  }
  getMetric(){
    return this.HR
  }
}


export class LaKickRatio {
  constructor(){
    this.lvedv = -Infinity
    this.lvesv = Infinity
    this.rvedv = -Infinity
    this.rvesv = Infinity
  }
  static getLabel(){
    return "LA_Kick_Ratio"
  }
  static getUnit(){
    return "%"
  }
  update(data, time, hdps){
    const HR = data['HR'][0]
    const tls = data['t'].map(_t=> (_t - hdps['LV_AV_delay']) % (60000 / HR))
    const _tls = tls.map(_t=> _t< hdps["LV_Tmax"] ? 10000 : _t - hdps["LV_Tmax"])
    const tesl = Math.min(..._tls)
    if(tesl < 5 ){
      const teslIndex = _tls.findIndex(_t => _t === tesl)
      this.lvesv = data['Qlv'][teslIndex];
    }else{
      const tedl = Math.max(...tls)
      if(60000/HR - tedl  < 5){
        const tedlIndex = tls.findIndex(_t => _t === tedl)
        this.lvedv = data['Qlv'][tedlIndex];
      }
    } 
    const tsla = data['t'].map(_t=> (_t - hdps['LA_AV_delay']) % (60000 / HR))
    const _tsla = tsla.map(_t=> _t< hdps["LA_Tmax"] ? 10000 : _t - hdps["LA_Tmax"])
    const tesla = Math.min(..._tsla)
    if(tesla < 5 ){
      const teslaIndex = _tsla.findIndex(_t => _t === tesla)
      this.laesv = data['Qla'][teslaIndex];
    }else{
      const tedla = Math.max(...tsla)
      if(60000/HR - tedla  < 5){
        const tedlaIndex = tsla.findIndex(_t => _t === tedla)
        this.laedv = data['Qla'][tedlaIndex];
      }
    }    
  }
  reset(){}
  get() {
    return  ((this.laedv - this.laesv)  / (this.lvedv - this.lvesv) * 100)?.toPrecision(3)
  }
  getMetric(){
    return ((this.laedv - this.laesv)  / (this.lvedv - this.lvesv) * 100)
  }
}
export class CO {
  constructor() {
    this.last_t = 0;
    this.total = 0;
    this.flows = [];
    this.HR = null
  }
  static getLabel(){
    return "CO"
  }
  static getUnit(){
    return "L/min"
  }
  update(data, time, hdps){
    const HR = data['HR'][0]
    this.HR = HR
    const ts = data['t'].map(_t=> _t % (60000 / HR))

    const ts_diff = ts.map((t, i) => i === 0 ? (ts[0]-this.last_t < 0 ? ts[0]-this.last_t+60000 / HR :  ts[0]-this.last_t) : 
      ((t-ts[i-1])<0 ? t-ts[i-1]+60000 / HR : t-ts[i-1])
    )

    if(this.last_t > ts[0] || ts.some((t, i) => i > 0 && t < ts[i-1])){
      if(this.flows.length > 10){
        this.flows.shift()
      }
      if(this.total>0 ){
        this.flows.push(this.total * HR/1000)
      }
      this.total =0;
    }
    this.total += data["Iasp"].reduce((acc, v, i) => acc + v * ts_diff[i], 0)
    this.last_t = ts[ts.length-1]
  }
  reset(){}
  get() {
    return (this.flows.reduce((acc, v) => acc + v, 0) /1000 / this.flows.length)?.toPrecision(3) || 0
  }
  getMetric(){
    return (this.flows.reduce((acc, v) => acc + v, 0) /1000 / this.flows.length) || 0
  }
}

export class SVO2 {
  constructor() {
    this.last_t = 0;
    this.total = 0;
    this.flows = [];
    this.HR = null
    this.Hb = null
    this.VO2 = null
  }
  static getLabel(){
    return "Svo2"
  }
  static getUnit(){
    return "%"
  }
  update(data, time, hdps){
    const HR = data['HR'][0]
    this.HR = HR
    this.Hb = hdps['Hb']
    this.VO2 = hdps['VO2']
    const ts = data['t'].map(_t=> _t % (60000 / HR))

    const ts_diff = ts.map((t, i) => i === 0 ? (ts[0]-this.last_t < 0 ? ts[0]-this.last_t+60000 / HR :  ts[0]-this.last_t) : 
      ((t-ts[i-1])<0 ? t-ts[i-1]+60000 / HR : t-ts[i-1])
    )

    if(this.last_t > ts[0] || ts.some((t, i) => i > 0 && t < ts[i-1])){
      if(this.flows.length > 10){
        this.flows.shift()
      }
      if(this.total>0 ){
        this.flows.push(this.total * HR/1000)
      }
      this.total =0;
    }
    this.total += data["Iasp"].reduce((acc, v, i) => acc + v * ts_diff[i], 0)
    this.last_t = ts[ts.length-1]
  }
  reset(){}
  get() {
    return ((1 - this.VO2 / (1.34*this.Hb * this.flows.reduce((acc, v) => acc + v, 0) /100 / this.flows.length))*100)?.toPrecision(3) || 0
  }
  getMetric(){
    return ((1 - this.VO2 / (1.34*this.Hb * this.flows.reduce((acc, v) => acc + v, 0) /100 / this.flows.length))*100) || 0
  }
}

export class Ilmt {
  constructor() {
    this.last_t = 0;
    this.total = 0;
    this.flows = [];
  }
  static getLabel(){
    return "Ilmt"
  }
  static getUnit(){
    return "ml/min"
  }
  update(data, time, hdps){
    const HR = data['HR'][0]
    const ts = data['t'].map(_t=> _t % (60000 / HR))

    const ts_diff = ts.map((t, i) => i === 0 ? (ts[0]-this.last_t < 0 ? ts[0]-this.last_t+60000 / HR :  ts[0]-this.last_t) : 
      ((t-ts[i-1])<0 ? t-ts[i-1]+60000 / HR : t-ts[i-1])
    )

    if(this.last_t > ts[0] || ts.some((t, i) => i > 0 && t < ts[i-1])){
      if(this.flows.length > 10){
        this.flows.shift()
      }
      if(this.total>0 ){
        this.flows.push(this.total * HR/1000)
      }
      this.total =0;
    }
    this.total += data["Ilmca"].reduce((acc, v, i) => acc + v * ts_diff[i], 0)
    this.last_t = ts[ts.length-1]
  }
  reset(){}
  get() {
    return (this.flows.reduce((acc, v) => acc + v, 0) / this.flows.length)?.toPrecision(3) || 0
  }
  getMetric(){
    return (this.flows.reduce((acc, v) => acc + v, 0) / this.flows.length) || 0
  }
}

export class PVA {
  constructor(){
    this.area=0;
    this.pressures=[];
    this.volumes=[];
    this.tc=0;
    this.areas=[];
  }
  static getLabel(){
    return "PVA"
  }
  static getUnit(){
    return "mmHg·ml"
  }
  update(data, time, hdps){
    const HR = data['HR'][0];
    const len = data['t'].length;
    let pressures = [...data["Plv"]];
    let volumes = [...data["Qlv"]];
    let next_pressures=[];
    let next_volumes=[];
    let ts = data["t"].map(x=>Math.floor(x/(60000/HR)))
    if(this.tc==0){
      this.tc= Math.floor(data['t'][0]/(60000/HR));
    }
    for(let i =0; i<len;i++){
      if(ts[i]===this.tc){
        this.pressures.push(pressures[i]);
        this.volumes.push(volumes[i]);
      }else{
        next_pressures.push(pressures[i]);
        next_volumes.push(volumes[i]);
      }
    }
    if(ts[len-1]!=this.tc){
      let total=0;
      const len_ = this.pressures.length
      for(let i=0;i<len_-5;i+=3){
        total += (this.pressures[i+1]+this.pressures[i+2]+this.pressures[i+3])*(this.volumes[i]+this.volumes[i+1]+this.volumes[i+2]-this.volumes[i+3]-this.volumes[i+4]-this.volumes[i+5])/9;
      }
      this.areas.push(total);
      if(this.areas.length>10){
        this.areas.shift();
      }
      let areas = [...this.areas].sort((a,b)=>a-b);
      this.area = areas[Math.floor(areas.length/2)];
      this.pressures = next_pressures;
      this.volumes = next_volumes;
      this.tc = ts[len-1];
    }
  }
  reset(){}
  get() {
    return Math.round(this.area)
  }
  getMetric(){
    return this.area
  }
}

export class CPO {
  constructor(){
    this.area=0;
    this.pressures=[];
    this.volumes=[];
    this.tc=0;
    this.areas=[];
  }
  static getLabel(){
    return "CPO"
  }
  static getUnit(){
    return "W"
  }
  update(data, time, hdps){
    const HR = data['HR'][0];
    const len = data['t'].length;
    let pressures = [...data["Plv"]];
    let volumes = [...data["Qlv"]];
    let next_pressures=[];
    let next_volumes=[];
    let ts = data["t"].map(x=>Math.floor(x/(60000/HR)))
    if(this.tc==0){
      this.tc= Math.floor(data['t'][0]/(60000/HR));
    }
    for(let i =0; i<len;i++){
      if(ts[i]===this.tc){
        this.pressures.push(pressures[i]);
        this.volumes.push(volumes[i]);
      }else{
        next_pressures.push(pressures[i]);
        next_volumes.push(volumes[i]);
      }
    }
    if(ts[len-1]!=this.tc){
      let total=0;
      const len_ = this.pressures.length
      for(let i=0;i<len_-5;i+=3){
        total += (this.pressures[i+1]+this.pressures[i+2]+this.pressures[i+3])*(this.volumes[i]+this.volumes[i+1]+this.volumes[i+2]-this.volumes[i+3]-this.volumes[i+4]-this.volumes[i+5])/9;
      }
      this.areas.push(total);
      if(this.areas.length>10){
        this.areas.shift();
      }
      let areas = [...this.areas].sort((a,b)=>a-b);
      this.area = areas[Math.floor(areas.length/2)]*101325/760/1000000 * data['HR'][0]/60;
      this.pressures = next_pressures;
      this.volumes = next_volumes;
      this.tc = ts[len-1];
    }
  }
  reset(){}
  get() {
    return this.area.toPrecision(3);
  }
  getMetric(){ 
    return this.area
  }
}



export class CSSVO2 {
  constructor(){
    this.area=0;
    this.pressures=[];
    this.volumes=[];
    this.tc=0;
    this.areas=[];
    this.HR =null
    this.Hb = null;

    this.last_t = 0;
    this.total = 0;
    this.flows = [];
  }
  static getLabel(){
    return "Cssvo2"
  }
  static getUnit(){
    return "%"
  }
  update(data, time, hdps){
    const HR = data['HR'][0];
    this.HR = HR;
    this.Hb = hdps['Hb'];
    const len = data['t'].length;
    let pressures = [...data["Plv"]];
    let volumes = [...data["Qlv"]];
    let next_pressures=[];
    let next_volumes=[];
    const ts_ = data['t'].map(_t=> _t % (60000 / HR))
    let ts = data["t"].map(x=>Math.floor(x/(60000/HR)))

    if(this.tc==0){
      this.tc= Math.floor(data['t'][0]/(60000/HR));
    }
    for(let i =0; i<len;i++){
      if(ts[i]===this.tc){
        this.pressures.push(pressures[i]);
        this.volumes.push(volumes[i]);
      }else{
        next_pressures.push(pressures[i]);
        next_volumes.push(volumes[i]);
      }
    }
    if(ts[len-1]!=this.tc){
      let total=0;
      const len_ = this.pressures.length
      for(let i=0;i<len_-5;i+=3){
        total += (this.pressures[i+1]+this.pressures[i+2]+this.pressures[i+3])*(this.volumes[i]+this.volumes[i+1]+this.volumes[i+2]-this.volumes[i+3]-this.volumes[i+4]-this.volumes[i+5])/9;
      }
      this.areas.push(total);
      if(this.areas.length>10){
        this.areas.shift();
      }
      let areas = [...this.areas].sort((a,b)=>a-b);
      this.area = areas[Math.floor(areas.length/2)];
      this.pressures = next_pressures;
      this.volumes = next_volumes;
      this.tc = ts[len-1];
    }

    const ts_diff = ts_.map((t, i) => i === 0 ? (ts_[0]-this.last_t < 0 ? ts_[0]-this.last_t+60000 / HR :  ts_[0]-this.last_t) : 
      ((t-ts_[i-1])<0 ? t-ts_[i-1]+60000 / HR : t-ts_[i-1])
    )

    if(this.last_t > ts_[0] || ts_.some((t, i) => i > 0 && t < ts_[i-1])){
      if(this.flows.length > 10){
        this.flows.shift()
      }
      if(this.total>0 ){
        this.flows.push(this.total * HR/1000)
      }
      this.total =0;
    }
    this.total += data["Ilmca"].reduce((acc, v, i) => acc + v * ts_diff[i], 0)
    this.last_t = ts_[ts_.length-1]
  }
  reset(){}
  get() {
    const mvo2 = (2.4*this.area+1.0)*1.33*this.HR/10000/20 
    const res = (1 - mvo2 / (1.34*this.Hb * this.flows.reduce((acc, v) => acc + v, 0) /100 / this.flows.length))*100
    return res.toPrecision(3)
  }
  getMetric(){
    const mvo2 = (2.4*this.area+1.0)*1.33*this.HR/10000/20 
    const res = ((1 - mvo2 / (1.34*this.Hb * this.flows.reduce((acc, v) => acc + v, 0) /100 / this.flows.length))*100)
    return res
  }
} 

export const metrics = {
  Aop: AoP,
  Cvp: CVP,
  Pap: PAP,
  Lap: LAP,
  Sv: SV,
  Ef: EF,
  Pv: PVA,
  Cpo: CPO,
  Lvedp: LVEDP,
  Hr: HR,
  Co: CO,
  Lkr: LaKickRatio,
  Ilmt: Ilmt,
  Svo2 : SVO2,
  Cssvo2: CSSVO2
}
export const metricOptions = ["Aop", "Cvp", "Pap", "Lap", "Sv", "Ef", "Pv", "Cpo", "Lvedp", "Hr", "Co", "Lkr", "Ilmt", "Svo2", "Cssvo2"]



// export class PVA {
//   constructor(){
//     this.area=0;
//     this.prev=0;
//     this.areas=[];
//     this.tc=0
//     this.lastP=[];
//     this.lastQ=[];
//   }
//   static getLabel(){
//     return "PVA"
//   }
//   static getUnit(){
//     return "mmHg・ml"
//   }
//   update(data, time, hdps){
//     let HR = data['HR'][0]
//     let tps = data["t"].map(x=>Math.floor(x/(60000/HR)))
//     let index = null;
//     for(let i=0; i< tps.length;i++){
//       if(this.tc!=tps[i]) {
//         index=i;
//         this.tc=tps[i];
//       }
//       let pressures = [...data["Plv"]];
//       let volumes = [...data["Qlv"]];
//       let nextP
//       let nextQ
//       if(index != null){
//         nextP = pressures.splice(index);
//         nextQ = volumes.splice(index);
//       }else{
//         nextP = [pressures[pressures.length-1]];
//         nextQ = [volumes[volumes.length-1]];
//       }
//       console.log("index:",index);
//       console.log("tc:",this.tc);
//       console.log("t:", data["t"]);
//       console.log("tps:",tps);
//       console.log("lastP: ",this.lastP,"lastQ:", this.lastQ);
//       console.log("nextP: ",nextP,"nextQ:", nextQ);
//       pressures = [...this.lastP, ...pressures];
//       volumes = [...this.lastQ,...volumes];
//       this.lastP = nextP;
//       this.lastQ = nextQ;
//       let len = pressures.length
//       for(let i=0;i<len-1;i++){
//         this.prev+=pressures[i]*(volumes[i]- volumes[i+1]);
//       }
//       if(index!=0){
//         this.areas.push(this.prev);
//         this.prev=0;
//         if(this.areas.length>5){
//           this.areas.shift();
//         }
//         let areas = [...this.areas].sort((a,b)=>a-b);
//         this.area = areas[Math.floor(areas.length/2)];
//       }
//     }
//   }
//   reset(){}
//   get() {
//     return Math.round(this.area)
//   }
// }