"use client";
import { EditModeProvider } from "@/components/EditMode";
import { SiteDataProvider } from "@/lib/site-context";
import { ThemeProvider } from "@/lib/theme-context";
export function Providers({ children }) {
    return (<ThemeProvider>
      <SiteDataProvider>
        <EditModeProvider>{children}</EditModeProvider>
      </SiteDataProvider>
    </ThemeProvider>);
}
