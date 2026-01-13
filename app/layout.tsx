import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CLI CEO Governance Dashboard',
  description: 'Cost intelligence, quality gates, and audit trails for AI operations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <nav className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="text-xl font-bold">
                  CLI CEO Governance
                </Link>
                <div className="flex gap-6">
                  <Link href="/" className="hover:text-primary">
                    Home
                  </Link>
                  <Link href="/cost" className="hover:text-primary">
                    Cost Dashboard
                  </Link>
                  <Link href="/quality" className="hover:text-primary">
                    Quality Gates
                  </Link>
                  <Link href="/audit" className="hover:text-primary">
                    Audit Trail
                  </Link>
                  <Link href="/vibe" className="hover:text-primary">
                    Vibe Integration
                  </Link>
                </div>
              </div>
            </nav>
          </header>
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t py-6 text-center text-sm text-muted-foreground">
            <p>CLI CEO Governance Dashboard - Built with Next.js 14</p>
          </footer>
        </div>
      </body>
    </html>
  )
}
