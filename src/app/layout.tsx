import type { Metadata } from "next";
import "./globals.css";
import { Theme, ThemeProvider, createTheme } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import theme from '@/lib/theme';
import { GlobalStyles } from '@mui/material';


export const metadata: Metadata = {
  title: "vE-IDS",
  description: "Virtual Enterprise Information Display System",
};

const styles = <GlobalStyles
            styles={{
              button: {
                borderRadius: '0px'
              },
            }}
            />

export default function RootLayout(props: any) {
   const { children } = props;
   return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            {styles}
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
     </html>
   );
}
