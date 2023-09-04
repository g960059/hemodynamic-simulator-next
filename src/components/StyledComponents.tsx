import {Button, ButtonProps, IconButton, IconButtonProps} from '@mui/material'
import {styled } from '@mui/material/styles';

export const NeumoButton =  styled(Button)<ButtonProps>(() => ({
  transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
  color: "rgb(69, 90, 100)",
  boxShadow: "0 2px 4px -2px #21253840",
  backgroundColor: "white",
  border: "1px solid rgba(92, 147, 187, 0.17)",
  fontWeight:"bold",
  "&:hover":{
    backgroundColor: "rgba(239, 246, 251, 0.6)",
    borderColor: "rgb(207, 220, 230)"
  }
}))

export const NerumoIconButton = styled(IconButton)<IconButtonProps>(() => ({
  color:"#93a5b1",
  boxShadow:"0 0 2px #4b57a926, 0 10px 12px -4px #0009651a",
  width:"44px",
  height:"44px",
  backgroundColor:"white",
  borderRadius:"50%",
  transition:".3s",
  "&:hover":{
    boxShadow:"0 25px 25px -10px #00096540",
    transform: "translateY(-2px)",
    color: "#f76685",
    backgroundColor:"white",
  }
}))
  

// export const NeumoLoadingButton =  styled(LoadingButton)<LoadingButtonProps>(() => ({
//   transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
//   color: "rgb(69, 90, 100)",
//   boxShadow: "0 2px 4px -2px #21253840",
//   backgroundColor: "white",
//   border: "1px solid rgba(92, 147, 187, 0.17)",
//   fontWeight:"bold",
//   "&:hover":{
//     backgroundColor: "rgba(239, 246, 251, 0.6)",
//     borderColor: "rgb(207, 220, 230)"
//   }
// }))

export const FaintNeumoIconButton = styled(IconButton)<IconButtonProps>(() => ({
  transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
  color: "#b3b3b3",
  backgroundColor: "#f1f4f9",
  border: "none",
  "&:hover":{
    backgroundColor: "#e5f2ff",
    color: "#3ea8ff"
  },
  "& .MuiOutlinedInput-notchedOutline": {border:"none"}
}))
