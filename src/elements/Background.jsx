import { styled } from '@mui/material/styles';

const Background = styled('div')({
  position: 'fixed',
  zIndex: -1,
  top: '0px',
  left: '0px',
  width: '100%',
  overflow: 'hidden',
  transform: 'translate3d(0px, 0px, 0px)',
  height: '-webkit-fill-available',
  background: 'radial-gradient(50% 50% at 50% 50%, #3ea8ff 0%, #f5f5f5 100%)',
  opacity: 0.15,
  userSelect: 'none',
  pointerEvents: 'none',
});

export default Background;