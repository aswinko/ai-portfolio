import { ThemeProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes/dist/types';
import React from 'react'

// Application theme provider
function AppThemeProvider({ children, ...props }: ThemeProviderProps) {
    return (
      <ThemeProvider enableColorScheme {...props}>
        {children}
      </ThemeProvider>
    );
  }

export default AppThemeProvider