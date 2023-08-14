import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

const FaintNeumoButton = styled(IconButton)({
  transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
  color: "#b3b3b3",
  backgroundColor: "#f1f4f9",
  border: "none",
  '&:hover': {
    backgroundColor: "#fff2f2",
    color: "#ec407a"
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: "none"
  }
});

export default FaintNeumoButton;