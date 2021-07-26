export const get_pressure = (times,series,y_index=null,x_index=null) => {
  const x = x_index === null ? times:get_column(series,x_index)
  const y = get_column(series, y_index)
  return zip_series(x,y)
}

export const get_pressure_volue = (times,series)=>{
  const Vs = get_column(series, 4)
  const Ps = u_P(Vs,times, 0.029,  0.34, 5,2.21,  300,  25,  160, 60)
  return zip_series(Vs,Ps)
}

export const get_column = (matrix, col_index)=>{
  const ml = matrix.length
  const col = new Array(ml)
  for(let i=0; i<ml; i++){
    col[i] = matrix[i][col_index]
  }
  return col
}

export const zip_cols = (matrix, [x_index,y_index])=>{
  const ml = matrix.length
  const res = new Array(ml)
  for(let i=0; i<ml; i++){
    res[i] = {x: matrix[i][x_index], y: matrix[i][y_index]}
  }
  return res
}

export const extract_track = (matrix, [x_index,y_index])=>{
  const ml = matrix.length
  const res = new Array(ml)
  for(let i=0; i<ml; i++){
    res[i] = [matrix[i][x_index],matrix[i][y_index]]
  }
  return res
}


export const get_col_chamber = col_index => matrix=>{
  const ml = matrix.length
  const col = new Array(ml)
  for(let i=0; i<ml; i++){
    col[i] = matrix[i][col_index]
  }
  return col
}

export const zip_series = (x,y) =>{
  const len =  x.length
  const res = new Array(len)
  for(let i=0; i<len; i++){
    res[i] = [x[i],y[i]]
  }
  return res
}

export const zip_series_with_label = (x,y) =>{
  const len =  x.length
  const res = new Array(len)
  for(let i=0; i<len; i++){
    res[i] = {x:x[i],y:y[i]}
  }
  return res
}

export const getMax = (data) => {
  let i = data.length;
  let max = [0,0];
  while (i--) {
    if (data[i].x > max[0]) { max[0] = data[i].x }
    if (data[i].y > max[1]) { max[1] = data[i].y }
  }
  return max
}

export const getMinMaxY = (data) => {
  let i = data.length;
  let yMin = 0;
  let yMax = 0
  while (i--) {
    if (data[i].y > yMax) {yMax = data[i].y }
    if (data[i].y < yMin) {yMin = data[i].y }
  }
  return [yMin,yMax]
}

export const extractTimeSereis = (matrix,y_index,  last_log_time, acc_time, strokeTime)=>{
  const ml = matrix.length
  const res = new Array(ml)
  for(let i=0; i<ml; i++){
    if(matrix[i]['t'] - last_log_time > 0){
      res[i] = {
        x: matrix[i]['t'] - last_log_time + acc_time,
        y: matrix[i][y_index]
      }
    }else{
      res[i] = {
        x: matrix[i]['t'] - last_log_time + acc_time + strokeTime,
        y: matrix[i][y_index]
      }      
    }
  }
  return res
}
export const extractTimeSereisDivider = (matrix,y_index, divider,last_log_time, acc_time, strokeTime)=>{
  const ml = matrix.length
  const res = new Array(ml)
  for(let i=0; i<ml; i++){
    if(matrix[i]['t'] - last_log_time > 0){
      res[i] = {
        x: matrix[i]['t'] - last_log_time + acc_time,
        y: matrix[i][y_index] / divider
      }
    }else{
      res[i] = {
        x: matrix[i]['t'] - last_log_time + acc_time + strokeTime,
        y: matrix[i][y_index] / divider
      }      
    }
  }
  return res
}

const get_series = (times,series,y_index=null,x_index=null) => {
  const x = x_index === null ? times:get_column(series,x_index)
  const y = get_column(series, y_index)
  return zip_series(x,y)
}

const PV_Loop = (chamber) =>{
  const model_props = useContext(ModelPropertyContext);
  const chamber_volume_mapping = {"LV":4, "LA":5, "RV":6, "RA":7}
  const [c_Ees,c_V0,c_alpha, c_beta, c_Tmax, c_tau, c_AV_delay] = ['Ees','V0','alpha', 'beta', 'Tmax', 'tau', 'AV_delay'].map(x=>chamber+'_'+x)
  const [Ees,V0,alpha, beta, Tmax, tau, AV_delay] = [model_props[c_Ees],model_props[c_V0],model_props[c_alpha], model_props[c_beta], model_props[c_Tmax], model_props[c_tau], model_props[c_AV_delay]] 
  const HR = model_props['HR']
  return  (times,series)=>{
      const Vs = get_column(series, chamber_volume_mapping[chamber])
      const Ps = u_P(Vs,times, Ees,V0,alpha, beta, Tmax, tau, AV_delay, HR)
      return zip_series(Vs,Ps)
    }
} 

export const downSampling = (data, threshold) => {
  var data_length = data.length;
  if (threshold >= data_length || threshold === 0) {
      return data; // Nothing to do
  }

  var sampled = [],
      sampled_index = 0;

  // Bucket size. Leave room for start and end data points
  var every = (data_length - 2) / (threshold - 2);

  var a = 0,  // Initially a is the first point in the triangle
      max_area_point,
      max_area,
      area,
      next_a;

  sampled[ sampled_index++ ] = data[ a ]; // Always add the first point

  for (var i = 0; i < threshold - 2; i++) {

      // Calculate point average for next bucket (containing c)
      var avg_x = 0,
          avg_y = 0,
          avg_range_start  = Math.floor( ( i + 1 ) * every ) + 1,
          avg_range_end    = Math.floor( ( i + 2 ) * every ) + 1;
      avg_range_end = avg_range_end < data_length ? avg_range_end : data_length;

      var avg_range_length = avg_range_end - avg_range_start;

      for ( ; avg_range_start<avg_range_end; avg_range_start++ ) {
        avg_x += data[ avg_range_start ][ 0 ] * 1; // * 1 enforces Number (value may be Date)
        avg_y += data[ avg_range_start ][ 1 ] * 1;
      }
      avg_x /= avg_range_length;
      avg_y /= avg_range_length;

      // Get the range for this bucket
      var range_offs = Math.floor( (i + 0) * every ) + 1,
          range_to   = Math.floor( (i + 1) * every ) + 1;

      // Point a
      var point_a_x = data[ a ][ 0 ] * 1, // Enforce Number (value may be Date)
          point_a_y = data[ a ][ 1 ] * 1;

      max_area = area = -1;

      for ( ; range_offs < range_to; range_offs++ ) {
          // Calculate triangle area over three buckets
          area = Math.abs( ( point_a_x - avg_x ) * ( data[ range_offs ][ 1 ] - point_a_y ) -
                      ( point_a_x - data[ range_offs ][ 0 ] ) * ( avg_y - point_a_y )
                    ) * 0.5;
          if ( area > max_area ) {
              max_area = area;
              max_area_point = data[ range_offs ];
              next_a = range_offs; // Next a is this b
          }
      }

      sampled[ sampled_index++ ] = max_area_point; // Pick this point from the bucket
      a = next_a; // This a is the next a (chosen b)
  }

  sampled[ sampled_index++ ] = data[ data_length - 1 ]; // Always add last

  return sampled;
}


export const shallowCompare = (obj1, obj2) =>
Object.keys(obj1).length === Object.keys(obj2).length &&
Object.keys(obj1).every(key => obj1[key] === obj2[key]);