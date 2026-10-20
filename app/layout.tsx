import './globals.css'
import { ThemeProvider } from 'next-themes'
export const metadata = { title: { default: 'Pipeline CRM', template: '%s · Pipeline CRM' }, description: 'Sales CRM with quotations and approvals' }
import Toaster from '@/components/Toaster'
import CloseDialog from '@/components/CloseDialog'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body><ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}<Toaster /><CloseDialog /></ThemeProvider></body></html>
}
