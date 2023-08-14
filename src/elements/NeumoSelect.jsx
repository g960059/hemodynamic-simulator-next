import { styled } from '@mui/material/styles';
import { Select } from '@mui/material';

const NeumoSelect = styled(Select)(({ theme }) => ({
  backgroundColor: '#f1f5f9',
  borderRadius: '4px',
  border: '1px solid #5c93bb2b',
  '&:hover': {
    borderColor: '#3ea8ff',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input': {
    paddingTop: '8px',
    paddingBottom: '8px',
  },
}));

export default NeumoSelect;