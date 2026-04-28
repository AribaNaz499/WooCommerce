import { createTheme } from '@mui/material/styles';

// 1. Create your custom Material-UI theme
// This is where you configure all your styling, including typography.
const theme = createTheme({
  // We're configuring the typography section of the theme
  typography: {
    fontFamily: '"Alexandria", sans-serif',
    // You can also define specific settings for different font variants
    // such as font weights or line heights for headers and body text
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    body1: {
      fontWeight: 400,
    },
    button: {
      fontWeight: 500,
    },
  },
});


export default theme