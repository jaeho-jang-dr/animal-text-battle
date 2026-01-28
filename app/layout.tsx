import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import AdminButton from "../components/AdminButton";
import Header from "../components/Header";
import { AuthProvider } from "../contexts/AuthContext";

const nunito = Nunito({
  subsets: ["latin"],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "동물 텍스트 배틀 🦁",
  description: "나만의 동물 캐릭터로 펼치는 즐거운 상상력 대결!",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4ade80",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={nunito.variable}>
      <body className="font-sans min-h-screen bg-[#F0F4F8] text-slate-800 antialiased selection:bg-green-200 selection:text-green-900" suppressHydrationWarning>
        <AuthProvider>
          <div className="relative min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 w-full">
              {children}
            </main>
            <AdminButton />
          </div>

          {/* Desktop Background Decoration - Optional, keeping it subtle or removing if it conflicts */}
          {/* <div className="fixed inset-0 -z-10 hidden min-[450px]:block bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 pointer-events-none">...</div> */}
        </AuthProvider>
      </body>
    </html>
  );
}