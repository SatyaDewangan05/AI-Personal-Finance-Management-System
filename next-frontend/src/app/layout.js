"use client";

import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { Inter } from "next/font/google";
import "./globals.css";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  ArrowUpIcon,
  BellIcon,
  CreditCardIcon,
  PiggyBankIcon,
  SettingsIcon,
  TrendingUpIcon,
} from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient();

function Sidebar() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-white shadow-md h-screen">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800">FinanceTracker</h1>
      </div>
      <nav className="mt-6">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => router.push("/dashboard")}
        >
          <CreditCardIcon className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => router.push("/transactions")}
        >
          <ArrowUpIcon className="mr-2 h-4 w-4" />
          Transactions
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => router.push("/budgets")}
        >
          <PiggyBankIcon className="mr-2 h-4 w-4" />
          Budgets
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => router.push("/goals")}
        >
          <TrendingUpIcon className="mr-2 h-4 w-4" />
          Goals
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => router.push("/notifications")}
        >
          <BellIcon className="mr-2 h-4 w-4" />
          Notifications
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => router.push("/settings")}
        >
          <SettingsIcon className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </nav>
      <div className="absolute bottom-0 w-64 p-4">
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </aside>
  );
}

function RootLayoutContent({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex">
      {user && <Sidebar />}
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootLayoutContent>{children}</RootLayoutContent>
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
