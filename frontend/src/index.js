import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Define a custom theme to set global styles for the body
const customTheme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'white', // Set the body background to white
      },
      html: {
        bg: 'white', // Also set the html background to white for full coverage
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChakraProvider theme={customTheme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);