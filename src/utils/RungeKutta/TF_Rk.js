import * as tf from '@tensorflow/tfjs'

export const rk4 =  f => (y,t, dt) =>{
  const res = tf.tidy(()=>{
    const k1 = f(t,y).mul(dt)
    const k2 = f(t.add(dt.div(2)),y.add(k1.div(2))).mul(dt)
    const k3 = f(t.add(dt.div(2)),y.add(k2.div(2))).mul(dt)
    const k4 = f(t.add(dt),y.add(k3)).mul(dt)
    return tf.keep(y.add(tf.addN([k1,k2.mul(2),k3.mul(2),k4]).div(6)))
  })
  return res
}

const rk = (f, y0, t0, dt, max_step) =>{
  const result = tf.tidy(()=>{
    let t = t0
    let y = y0
    let T = []
    let Y = []
    const rk_ = rk4(f)
    for (let step=0; step<=max_step; step++) {
      y = rk_(y,t,dt)
      t = t.add(dt)
      Y.push(y)
      T.push(t)
    }
    return [tf.stack(T).arraySync(), tf.stack(Y).transpose().arraySync()]    
  })
  return result
}

export default rk

// const sample_func = (t,x) =>{
//   return tf.tensor([[0,1],[-1,0]]).dot(x)
// }

// // console.log(sample_func(0, tf.tensor([10,0])).arraySync())
// res = rk4(sample_func)(tf.tensor([5,5]), tf.scalar(0), tf.scalar(0.01))
// console.log(res.arraySync())

// let res = rk(sample_func, tf.tensor([5,5]), tf.scalar(0), tf.scalar(0.01), 100)
// console.log(res)
// console.log(tf.memory())

// const sample_func = (t,x) =>{
//   return tf.tensor([[0,1],[-1,0]]).dot(x)
// }

// const [data, setData] = useState([{data: [[0,[5,5]]]}])
// const dt = 0.1
// const tf_dt = tf.scalar(dt)
// useEffect(() => {
//   const interval = setInterval(()=>{
//     setData(data => {
//       const tmp_data =  data[0]['data']
//       const [t,x] = tmp_data[tmp_data.length-1]
//       const tf_t = tf.scalar(t)
//       const tf_x = tf.tensor(x)
//       const new_x = rk4(sample_func)(tf_x,tf_t,tf_dt).arraySync()
//       const new_t = t+dt
//       const new_series = [...tmp_data, [new_t,new_x]]
//       return [{data: new_series}]
//     })
//   }, 100)  
//   return () => {
//     clearInterval(interval)
//   }
// }, []);