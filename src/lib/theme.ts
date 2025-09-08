'use client';
import { createTheme, Theme } from '@mui/material/styles';
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const theme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      light: '#8c8c8c',
      main: '#525252',
      dark: '#101010',
      contrastText: '#ffffff',
    },
    secondary: {
      light: '#6a81d7',
      main: '#024ac6',
      dark: '#002ea4',
      contrastText: '#fff',
    },
    error: {
      light: '#ff3d21',
      main: '#e1261d',
      dark: '#c60202',
      contrastText: '#fff',
    },
    warning: {
      light: '#e8c680',
      main: '#d69012',
      dark: '#c66a02',
      contrastText: '#fff',
    },
    divider: '#404040',
    success: {
      light: '#a8e394',
      main: '#34c602',
      dark: '#008d00',
      contrastText: '#fff',
    },
    info: {
      light: '#6a81d7',
      main: '#024ac6',
      dark: '#002ea4',
      contrastText: '#fff',
    },
  },
  cssVariables: true,
  typography: {
    fontFamily: inter.style.fontFamily,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0
        }
      }
    }
  }
});

export default theme;