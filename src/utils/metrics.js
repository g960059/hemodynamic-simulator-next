import {getHdProps} from "./utils"


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


export class ESV {
  constructor(){

    this.last_t = 0;
    this.total = 0;
    this.flows = [];
    this.HR = null
  }
  static getLabel(){
    return "Effective SV"
  }
  static getUnit(){
    return "ml"
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
        this.flows.push(this.total/1000)  
      }
      this.total =0;
    }
    this.total += data["Iasp"].reduce((acc, v, i) => acc + v * ts_diff[i], 0)
    this.last_t = ts[ts.length-1]
  }
  reset(){
    this.last_t = 0;
    this.total = 0;
    this.flows = [];
    this.HR = null
  }
  get() {
    return (this.flows.reduce((acc, v) => acc + v, 0) / this.flows.length)?.toPrecision(3) || 0
  }
  getMetric(){
    return (this.flows.reduce((acc, v) => acc + v, 0) / this.flows.length) || 0
  }
}

export class RVSV {
  constructor(){
    this.rvedv = -Infinity
    this.rvesv = Infinity
  }
  static getLabel(){
    return "right ventricular SV"
  }
  static getUnit(){
    return "ml"
  }
  update(data, time, hdps){
    const ts = data['t'].map(_t=> (_t - hdps['RV_AV_delay']) % (60000 / data['HR'][0]))
    const _ts = ts.map(_t=> _t< hdps["RV_Tmax"] ? 10000 : _t - hdps["RV_Tmax"])
    const tes = Math.min(..._ts)
    if(tes < 5 ){
      const tesIndex = _ts.findIndex(_t => _t === tes)
      this.rvesv = data['Qrv'][tesIndex];
    }else{
      const ted = Math.max(...ts)
      if(60000/data['HR'][0] - ted  < 5){
        const tedIndex = ts.findIndex(_t => _t === ted)
        this.rvedv = data['Qrv'][tedIndex];
      }
    } 
  }
  reset(){
  }
  get() {
    return (this.rvedv - this.rvesv)?.toPrecision(3)
  }
  getMetric(){
    if (this.rvedv === -Infinity || this.rvesv === Infinity) return null
    else{
      return (this.rvedv - this.rvesv)
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

export class RVEDP{
  constructor(){
    this.rvedp = null
  }
  static getLabel(){
    return "RVEDP"
  }
  static getUnit(){
    return "mmHg"
  }
  update(data, time, hdps){
    const ts = data['t'].map(_t=> (_t - hdps['RV_AV_delay']) % (60000 / data['HR'][0]))
    const _ts = ts.map(_t=> _t< hdps["RV_Tmax"] ? 10000 : _t - hdps["RV_Tmax"])
    const ted = Math.max(...ts)
    if(60000/data['HR'][0] - ted  < 5){
      const tedIndex = ts.findIndex(_t => _t === ted)
      this.rvedp = data['Prv'][tedIndex];
    } 
  }
  reset(){
  }
  get(){
    return this.rvedp?.toPrecision(3)
  }
  getMetric(){
    return this.rvedp
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

export class CVP {
  constructor() {
    this.values = [];
    this.lastTime = 0;
    this.cycleTime = 0;
  }

  static getLabel() {
    return "CVP";
  }

  static getUnit() {
    return "mmHg";
  }

  update(data, time, hdps) {
    const HR = data['HR'][0];
    this.cycleTime = 60000 / HR;

    const newValues = data['Pra'];
    const newTimes = data['t'];

    for (let i = 0; i < newValues.length; i++) {
      this.values.push({ value: newValues[i], time: newTimes[i] });
    }

    // 1周期以上古いデータを削除
    while (this.values.length > 0 && this.values[this.values.length - 1].time - this.values[0].time > this.cycleTime) {
      this.values.shift();
    }
  }

  reset() {
    this.values = [];
    this.lastTime = 0;
  }

  get() {
    if (this.values.length === 0) return 0;
    const sum = this.values.reduce((acc, val) => acc + val.value, 0);
    return (sum / this.values.length).toFixed(1);
  }

  getMetric() {
    return parseFloat(this.get());
  }
}

export class PCWP {
  constructor() {
    this.values = [];
    this.lastTime = 0;
    this.cycleTime = 0;
  }

  static getLabel() {
    return "PCWP";
  }

  static getUnit() {
    return "mmHg";
  }

  update(data, time, hdps) {
    const HR = data['HR'][0];
    this.cycleTime = 60000 / HR;

    const newValues = data['Pla'];
    const newTimes = data['t'];

    for (let i = 0; i < newValues.length; i++) {
      this.values.push({ value: newValues[i], time: newTimes[i] });
    }

    // 1周期以上古いデータを削除
    while (this.values.length > 0 && this.values[this.values.length - 1].time - this.values[0].time > this.cycleTime) {
      this.values.shift();
    }
  }

  reset() {
    this.values = [];
    this.lastTime = 0;
  }

  get() {
    if (this.values.length === 0) return 0;
    const sum = this.values.reduce((acc, val) => acc + val.value, 0);
    return (sum / this.values.length).toFixed(1);
  }

  getMetric() {
    return parseFloat(this.get());
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

export class SW {
  constructor(){
    this.area=0;
    this.pressures=[];
    this.volumes=[];
    this.tc=0;
    this.areas=[];
  }
  static getLabel(){
    return "SW"
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
        total += (this.pressures[i+1]+this.pressures[i+2]+this.pressures[i+3])*
        (this.volumes[i]+this.volumes[i+1]+this.volumes[i+2]-this.volumes[i+3]-this.volumes[i+4]-this.volumes[i+5])/9;
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

export class PVA {
  constructor(){
    this.area=0;
    this.pressures=[];
    this.volumes=[];
    this.areas=[];
    this.lvedv = -Infinity;
    this.lvesv = Infinity;
    this.measuring = false;
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
    const {alpha, beta, Ees, V0} = getHdProps["LV"](hdps)

    let pressures = [...data["Plv"]];
    let volumes = [...data["Qlv"]];

    const ts = data['t'].map(_t=> (_t - hdps['LV_AV_delay']) % (60000 / data['HR'][0]))
    const _ts = ts.map(_t=> _t< hdps["LV_Tmax"] ? 10000 : _t - hdps["LV_Tmax"])
    const tes = Math.min(..._ts)
    if(tes < 5 ){
      const tesIndex = _ts.findIndex(_t => _t === tes)
      this.lvesv = data['Qlv'][tesIndex];
      if(this.lvedv !== -Infinity ){
        let total=0;
        const len_ = this.pressures.length
        for(let i=0;i<len_-5;i+=3){
          total += (this.pressures[i+1]+this.pressures[i+2]+this.pressures[i+3])*
          (this.volumes[i]+this.volumes[i+1]+this.volumes[i+2]-this.volumes[i+3]-this.volumes[i+4]-this.volumes[i+5])/9;
        }
        total += (this.lvesv - V0) ** 2 * Ees / 2 + beta * ((Math.exp(alpha * (this.lvedv - V0))-1)/alpha - this.lvedv + V0)
        this.areas.push(total);
        if(this.areas.length>10){
          this.areas.shift();
        }
        let areas = [...this.areas].sort((a,b)=>a-b);
        this.area = areas[Math.floor(areas.length/2)];
      }

      this.measuring = false
      this.pressures = []
      this.volumes = []
    }else{
      const ted = Math.max(...ts)
      if(60000/data['HR'][0] - ted  < 5){
        const tedIndex = ts.findIndex(_t => _t === ted)
        this.lvedv = data['Qlv'][tedIndex];
        this.measuring = true
      }
    } 
    if(this.measuring){
      for(let i =0; i<len;i++){
        this.pressures.push(pressures[i]);
        this.volumes.push(volumes[i]);
      }
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

export class PVA_SW_Ratio {
  constructor() {
    this.pva = new PVA();
    this.sw = new SW();
    this.ratio = 0;
  }

  static getLabel() {
    return "SW/PVA";
  }

  static getUnit() {
    return "";
  }

  update(data, time, hdps) {
    this.pva.update(data, time, hdps);
    this.sw.update(data, time, hdps);
    if (this.pva.getMetric() !== 0) {
      this.ratio = this.sw.getMetric() / this.pva.getMetric();
    } else {
      this.ratio = 0;
    }
  }

  reset() {
    this.pva.reset();
    this.sw.reset();
  }

  get() {
    return this.ratio.toFixed(2);
  }

  getMetric() {
    return this.ratio;
  }
}

export class CSSVO2 {
  constructor(){

    this.pva = new PVA();
    this.ilmt = new Ilmt();
    this.HR =null
    this.Hb = null;
  }
  static getLabel(){
    return "Cssvo2"
  }
  static getUnit(){
    return "%"
  }
  update(data, time, hdps){
    this.HR = data['HR'][0];
    this.Hb = hdps['Hb'];
    this.pva.update(data, time, hdps);
    this.ilmt.update(data, time, hdps);
  }
  reset(){}
  get() {
    const mvo2 = (2.4*this.pva.get()+1.0)*1.33*this.HR/10000/20 
    const res = (1 - mvo2 / (1.34*this.Hb * this.ilmt.getMetric()/100))*100
    return res.toPrecision(3)
  }
  getMetric(){
    const mvo2 = (2.4*this.pva.get()+1.0)*1.33*this.HR/10000/20 
    const res = ((1 - mvo2 / (1.34*this.Hb * this.ilmt.getMetric()/100))*100)
    return res
  }
} 

export class LVEa {
  constructor(){
    this.lvedv = -Infinity
    this.lvesv = Infinity
    this.lvesp = -Infinity
  }
  static getLabel(){
    return "Ea(LV)"
  }
  static getUnit(){
    return "mmHg/ml"
  }
  update(data, time, hdps){
    const ts = data['t'].map(_t=> (_t - hdps['LV_AV_delay']) % (60000 / data['HR'][0]))
    const _ts = ts.map(_t=> _t< hdps["LV_Tmax"] ? 10000 : _t - hdps["LV_Tmax"])
    const tes = Math.min(..._ts)
    if(tes < 5 ){
      const tesIndex = _ts.findIndex(_t => _t === tes)
      this.lvesv = data['Qlv'][tesIndex];
      this.lvesp = data['Plv'][tesIndex];
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
    return (this.lvesp / (this.lvedv - this.lvesv))?.toPrecision(3)
  }
  getMetric(){
    if (this.lvedv === -Infinity || this.lvesv === Infinity || this.lvesp === -Infinity) return null
    else{
      return this.lvesp / (this.lvedv - this.lvesv)
    }
  }
}

export class RVEa {
  constructor(){
    this.rvedv = -Infinity
    this.rvesv = Infinity
    this.rvesp = -Infinity
  }
  static getLabel(){
    return "Ea(RV)"
  }
  static getUnit(){
    return "mmHg/ml"
  }
  update(data, time, hdps){
    const ts = data['t'].map(_t=> (_t - hdps['RV_AV_delay']) % (60000 / data['HR'][0]))
    const _ts = ts.map(_t=> _t< hdps["RV_Tmax"] ? 10000 : _t - hdps["RV_Tmax"])
    const tes = Math.min(..._ts)
    if(tes < 5 ){
      const tesIndex = _ts.findIndex(_t => _t === tes)
      this.rvesv = data['Qrv'][tesIndex];
      this.rvesp = data['Prv'][tesIndex];
    }else{
      const ted = Math.max(...ts)
      if(60000/data['HR'][0] - ted  < 5){
        const tedIndex = ts.findIndex(_t => _t === ted)
        this.rvedv = data['Qrv'][tedIndex];
      }
    } 
  }
  reset(){
  }
  get() {
    return (this.rvesp / (this.rvedv - this.rvesv))?.toPrecision(3)
  }
  getMetric(){
    if (this.rvedv === -Infinity || this.rvesv === Infinity || this.rvesp === -Infinity) return null
    else{
      return this.rvesp / (this.rvedv - this.rvesv)
    }
  }
}



class BasicMetric {
  constructor(prop) {
    this.prop = prop;
    this.values = [];
  }

  static getLabel() {
    return this.name;
  }

  static getUnit() {
    return "";
  }

  update(data, time, hdps) {
    if (Array.isArray(data[this.prop])) {
      this.values = this.values.concat(data[this.prop]);
    } else {
      this.values.push(data[this.prop]);
    }
  }

  get() {
    return this.values.map(v => v?.toPrecision(3));
  }

  getMetric() {
    return this.values;
  }
}

export class Time extends BasicMetric {
  constructor() { super('t'); }
  static getLabel() { return "Time"; }
  static getUnit() { return "s"; }
}

// Volume metrics
export class Qvs extends BasicMetric {
  constructor() { super('Qvs'); }
  static getLabel() { return "Systemic Venous Volume"; }
  static getUnit() { return "ml"; }
}

export class Qas extends BasicMetric {
  constructor() { super('Qas'); }
  static getLabel() { return "Systemic Arterial Volume"; }
  static getUnit() { return "ml"; }
}

export class Qap extends BasicMetric {
  constructor() { super('Qap'); }
  static getLabel() { return "Pulmonary Arterial Volume"; }
  static getUnit() { return "ml"; }
}

export class Qvp extends BasicMetric {
  constructor() { super('Qvp'); }
  static getLabel() { return "Pulmonary Venous Volume"; }
  static getUnit() { return "ml"; }
}

export class Qlv extends BasicMetric {
  constructor() { super('Qlv'); }
  static getLabel() { return "Left Ventricular Volume"; }
  static getUnit() { return "ml"; }
}

export class Qla extends BasicMetric {
  constructor() { super('Qla'); }
  static getLabel() { return "Left Atrial Volume"; }
  static getUnit() { return "ml"; }
}

export class Qrv extends BasicMetric {
  constructor() { super('Qrv'); }
  static getLabel() { return "Right Ventricular Volume"; }
  static getUnit() { return "ml"; }
}

export class Qra extends BasicMetric {
  constructor() { super('Qra'); }
  static getLabel() { return "Right Atrial Volume"; }
  static getUnit() { return "ml"; }
}

export class Qas_prox extends BasicMetric {
  constructor() { super('Qas_prox'); }
  static getLabel() { return "Proximal Systemic Arterial Volume"; }
  static getUnit() { return "ml"; }
}

export class Qap_prox extends BasicMetric {
  constructor() { super('Qap_prox'); }
  static getLabel() { return "Proximal Pulmonary Arterial Volume"; }
  static getUnit() { return "ml"; }
}

// Pressure metrics
export class Plv extends BasicMetric {
  constructor() { super('Plv'); }
  static getLabel() { return "Left Ventricular Pressure"; }
  static getUnit() { return "mmHg"; }
}

export class Pla extends BasicMetric {
  constructor() { super('Pla'); }
  static getLabel() { return "Left Atrial Pressure"; }
  static getUnit() { return "mmHg"; }
}

export class Prv extends BasicMetric {
  constructor() { super('Prv'); }
  static getLabel() { return "Right Ventricular Pressure"; }
  static getUnit() { return "mmHg"; }
}

export class Pra extends BasicMetric {
  constructor() { super('Pra'); }
  static getLabel() { return "Right Atrial Pressure"; }
  static getUnit() { return "mmHg"; }
}

// Flow metrics
export class Ias extends BasicMetric {
  constructor() { super('Ias'); }
  static getLabel() { return "Systemic Arterial Flow"; }
  static getUnit() { return "ml/s"; }
}

export class Ics extends BasicMetric {
  constructor() { super('Ics'); }
  static getLabel() { return "Systemic Capillary Flow"; }
  static getUnit() { return "ml/s"; }
}

export class Imv extends BasicMetric {
  constructor() { super('Imv'); }
  static getLabel() { return "Mitral Valve Flow"; }
  static getUnit() { return "ml/s"; }
}

export class Ivp extends BasicMetric {
  constructor() { super('Ivp'); }
  static getLabel() { return "Pulmonary Venous Flow"; }
  static getUnit() { return "ml/s"; }
}

export class Iap extends BasicMetric {
  constructor() { super('Iap'); }
  static getLabel() { return "Pulmonary Arterial Flow"; }
  static getUnit() { return "ml/s"; }
}

export class Icp extends BasicMetric {
  constructor() { super('Icp'); }
  static getLabel() { return "Pulmonary Capillary Flow"; }
  static getUnit() { return "ml/s"; }
}

export class Itv extends BasicMetric {
  constructor() { super('Itv'); }
  static getLabel() { return "Tricuspid Valve Flow"; }
  static getUnit() { return "ml/s"; }
}

export class Ivs extends BasicMetric {
  constructor() { super('Ivs'); }
  static getLabel() { return "Systemic Venous Flow"; }
  static getUnit() { return "ml/s"; }
}

export class Iasp extends BasicMetric {
  constructor() { super('Iasp'); }
  static getLabel() { return "Aortic Valve Flow"; }
  static getUnit() { return "ml/s"; }
}

export class Iapp extends BasicMetric {
  constructor() { super('Iapp'); }
  static getLabel() { return "Pulmonary Valve Flow"; }
  static getUnit() { return "ml/s"; }
}



// メトリクスのエクスポート
export const metrics = {
  Qvs, Qas, Qap, Qvp, Qlv, Qla, Qrv, Qra, Qas_prox, Qap_prox,
  Plv, Pla, Prv, Pra,
  Ias, Ics, Imv, Ivp, Iap, Icp, Itv, Ivs, Iasp, Iapp,
  Aop: AoP,
  Pap: PAP,
  Cvp: CVP,
  Pcwp: PCWP,
  Sv: SV,
  Ef: EF,
  ESV,
  RVSV,
  LVEa,
  RVEa,
  Pv: PVA,
  Sw: SW,
  Cpo: CPO,
  Lvedp: LVEDP,
  Rvedp: RVEDP,
  Hr: HR,
  Co: CO,
  Lkr: LaKickRatio,
  Ilmt: Ilmt,
  Svo2 : SVO2,
  Cssvo2: CSSVO2,
  PvaSwRatio: PVA_SW_Ratio,
};

// メトリクスのカテゴリー
export const metricCategories = {
  "Volumes": ["Qvs", "Qas", "Qap", "Qvp", "Qlv", "Qla", "Qrv", "Qra", "Qas_prox", "Qap_prox"],
  "Pressures": ["Plv", "Pla", "Prv", "Pra"],
  "Flows": ["Ias", "Ics", "Imv", "Ivp", "Iap", "Icp", "Itv", "Ivs", "Iasp", "Iapp"],
  "Calculated Metrics": ["Aop", "Cvp", "Pap", "Lap", "Sv", "Ef", "ESV", "Pv","Sw", "Cpo", "Lvedp", "Rvedp", "Hr", "Co", "Ilmt", "Svo2", "Cssvo2","PvaSwRatio", "Pcwp", "LVEa", "RVEa", "RVSV"]
};
export const metricOptions = ["Aop", "Cvp", "Pap", "Lap", "Sv", "Ef", "ESV", "Pv","Sw", "Cpo", "Lvedp", "Rvedp", "Hr", "Co", "Ilmt", "Svo2", "Cssvo2","PvaSwRatio", "Pcwp", "LVEa", "RVEa", "RVSV"]



