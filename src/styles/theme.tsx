import { createTheme } from '@mui/material/styles';
import { pink,blueGrey,  } from '@mui/material/colors';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: pink[400]
    },
    secondary:{
      main: blueGrey[600]
    },
    info: {
      main: "#ffffff"
    },
    error: {
      main: pink.A400,
    },
    background: {
      default: '#fff',
    },
  },
});

export default theme;
