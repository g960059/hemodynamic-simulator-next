import React, {useState, useEffect} from "react";
import { InputAdornment, MuiInput, TextField, InputBase as MuiInputBase} from "@mui/material";
import { withStyles } from '@mui/styles';

export const Input = withStyles((theme) => ({
  root: {
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    border: '1px solid #5c93bb2b',
    '&:hover': {
      borderColor: '#3ea8ff',
    },    
  },
  input: {
    border: 'none',
    padding: '4px 0 4px 4px'
  },
  "& p.MuiTypography-root":{
    fontSize: "0.7rem"
  }
}))(MuiInputBase);


const ReactiveInput = ({value, updateValue, unit=null, type ='number',variant='outlined', ...args}) => {
  const [tmpValue, setTmpValue] = useState();
  useEffect(() => {
    setTmpValue(value)
  }, [value]);
  if(variant == 'outlined'){
    return (
      <TextField
        value={tmpValue}
        type = {type}
        onChange={e=>{
          if(e.target.value==''){
            if(type === 'number'){
              setTmpValue(NaN)
            }else{
              setTmpValue('')
            }
          }else{
            if(type === 'number'){
              setTmpValue(Number(e.target.value))
            }else{
              setTmpValue(e.target.value)
            }
          }
        }}
        onBlur = {e => {if(tmpValue!=0 && e.target.value != '') updateValue(tmpValue)}}
        onKeyDown={e => {
          if (e.key == 'Enter' && tmpValue!=0 && e.currentTarget.value != '') {
            updateValue(tmpValue);
            e.currentTarget.blur();
          }
        }}
        InputProps = {unit && {endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }}
        inputProps ={{type: "text", inputmode:"numeric", pattern: "\d*" ,min:0, style: {textAlign: 'right'}}}
        sx={{"& .MuiInputBase-root":{
          backgroundColor: '#f1f5f9',
          borderRadius: '4px', 
          border: '1px solid #5c93bb2b',
          '&:hover': { 
            borderColor: '#3ea8ff'
          }},
          "& input": {border: 'none',padding: '8px 0 8px 16px'},
          "& p.MuiTypography-root":{
            fontSize: "0.7rem"
          }
        }}
        {...args}
      />  
    )
  }else{
    if(variant == 'standard'){
      return (
        <Input
          value={tmpValue}
          type = {type}
          onChange={e=>{
            if(e.target.value==''){
              if(type === 'number'){
                setTmpValue(NaN)
              }else{
                setTmpValue('')
              }
            }else{
              if(type === 'number'){
                setTmpValue(Number(e.target.value))
              }else{
                setTmpValue(e.target.value)
              }
            }
          }}
          onBlur = {e => {if(tmpValue!=0 && e.target.value != '') updateValue(tmpValue)}}
          onKeyDown={e => {
            if (e.key == 'Enter' && tmpValue!=0 && e.currentTarget.value != '') {
              updateValue(tmpValue);
              e.currentTarget.blur();
            }
          }}
          inputProps ={{type: "text", inputmode:"numeric", pattern: "\d*" ,min:0, style: {textAlign: 'right'}}}
          endAdornment = {unit && <InputAdornment position="end">{unit}</InputAdornment> }
          sx={{
            "& p.MuiTypography-root":{
              fontSize: "0.7rem"
            },
            "& .MuiInputAdornment-root.MuiInputAdornment-positionEnd": {
              paddingRight: "6px",
              paddingTop:"6px",
            }
          }}
          {...args}
        />  
      )    
    }else{
      return <></>
    }
  }
}

export default ReactiveInput