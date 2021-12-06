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
      this?.lvesv = data['Qlv'][tesIndex];
    }else{
      const ted = Math.max(...ts)
      if(60000/data['HR'][0] - ted  < 5){
        const tedIndex = ts.findIndex(_t => _t === ted)
        this?.lvedv = data['Qlv'][tedIndex];
      }
    } 
  }
  reset(){
  }
  get() {
    return (this.lvedv - this.lvesv)?.toPrecision(3)
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
      this?.lvedp = data['Plv'][tedIndex];
    } 
  }
  reset(){
  }
  get(){
    return this.lvedp?.toPrecision(3)
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
    }else{
      this.min_next = Math.min(...data[this.prop],this.min_next);
      this.max_next = Math.max(...data[this.prop],this.max_next)
    }
  }
  reset(){
  }
  get(){
    return Math.floor(this.max) + "/" + Math.floor(this.min)
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
}
export class CVP extends AoP {
  constructor(){
    super();
    this.prop ="Pra"
  }
  static getLabel(){
    return "CVP"
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
}
export class CO {
  constructor(){
    this.lvedv = null
    this.lvesv = null
    this.HR = null
  }
  static getLabel(){
    return "CO"
  }
  static getUnit(){
    return "L/min"
  }
  update(data, time, hdps){
    this?.HR= data['HR'][0]
    const HR = data['HR'][0]
    const ts = data['t'].map(_t=> (_t - hdps['LV_AV_delay']) % (60000 / HR))
    const _ts = ts.map(_t=> _t< hdps["LV_Tmax"] ? 10000 : _t - hdps["LV_Tmax"])
    const tes = Math.min(..._ts)
    if(tes < 5 ){
      const tesIndex = _ts.findIndex(_t => _t === tes)
      this.lvesv = data['Qlv'][tesIndex];
    }else{
      const ted = Math.max(...ts)
      if(60000/HR - ted  < 5){
        const tedIndex = ts.findIndex(_t => _t === ted)
        this?.lvedv = data['Qlv'][tedIndex];
      }
    } 
  }
  reset(){
  }
  get() {
    return ((this.lvedv - this.lvesv) * this.HR /1000)?.toPrecision(3)
  }
}export class LaKickRatio {
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
        this?.lvedv = data['Qlv'][tedlIndex];
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
}
