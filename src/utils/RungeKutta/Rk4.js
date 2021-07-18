export const rk4 =  (f,args={},logger=null) => (x,t,dt) =>{
  const x_dim = x.length
  const k1  = new Array(x_dim)
  const k2  = new Array(x_dim)
  const k3  = new Array(x_dim)
  const k4  = new Array(x_dim)
  const x_k2  = new Array(x_dim)
  const x_k3  = new Array(x_dim)
  const x_k4  = new Array(x_dim)
  const res = new Array(x_dim)
  let f_1
  if(logger != null){
    f_1 = f(t,x,args,logger)
  }else{
    f_1 = f(t,x,args)
  }
  for(let i=0;i<x_dim; i++){
    k1[i] = f_1[i]*dt
    x_k2[i] = x[i] + k1[i]/2
  }
  const f_2 = f(t+dt/2, x_k2,args)
  for(let i=0;i<x_dim; i++){
    k2[i] =f_2[i] * dt
    x_k3[i] = x[i] + k2[i]/2
  }
  const f_3 = f(t+dt/2, x_k3,args)
  for(let i=0;i<x_dim; i++){
    k3[i] = f_3[i] * dt
    x_k4[i] = x[i] + k3[i]
  }
  const f_4 = f(t+dt,x_k4,args)
  for(let i=0;i<x_dim; i++){
    k4[i] = f_4[i] * dt
  }
  for(let i=0;i<x_dim;i++){
    res[i] = x[i] + (k1[i]+2*k2[i] +2*k3[i] +k4[i])/6
  }
  return res
}

export const sample_func = (t,x) =>{
  return [x[1],-x[0]]
}
