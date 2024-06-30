/** This component contains the root layout of the application. */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './Providers';
import AntdRegistry from './AntdRegistry';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CAD Tool',
  description: 'A simple CAD tool for the browser',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="en">
        <body className={inter.className}>
          <AntdRegistry>{children}</AntdRegistry>
        </body>
      </html>
    </Providers>
  );
}
