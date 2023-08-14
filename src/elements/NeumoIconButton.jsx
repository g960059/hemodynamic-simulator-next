import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

const NeumoIconButton = styled(IconButton)(({ theme }) => ({
  transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color', 'color'], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.easeInOut,
  }),
  color: theme.palette.text.secondary,
  boxShadow: theme.shadows[2],
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.action.hover,
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[4],
  },
}));

export default NeumoIconButton;