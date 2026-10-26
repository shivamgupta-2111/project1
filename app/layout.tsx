/** Root layout: loads the font, sets up light/dark theme and mounts the toast messages. */
import './globals.css'
import { ThemeProvider } from 'next-themes'
export const metadata = {
  title: { default: 'Pipeline CRM', template: '%s · Pipeline CRM' },
  description: 'Sales CRM with quotations and approvals',
}
import Toaster from '@/components/Toaster'
import CloseDialog from '@/components/CloseDialog'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <CloseDialog />
        </ThemeProvider>
      </body>
    </html>
  )
}
