import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';

const NeumoButton = styled(Button)({
  transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
  color: 'rgb(69, 90, 100)',
  boxShadow: '0 2px 4px -2px #21253840',
  backgroundColor: 'white',
  border: '1px solid rgba(92, 147, 187, 0.17)',
  fontWeight: 'bold',
  '&:hover': {
    backgroundColor: 'rgba(239, 246, 251, 0.6)',
    borderColor: 'rgb(207, 220, 230)',
  },
});

export default NeumoButton;