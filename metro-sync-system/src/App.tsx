import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Passengers from "./pages/Passengers";
import Cards from "./pages/Cards";
import CardTypes from "./pages/CardTypes";
import Stations from "./pages/Stations";
import Trips from "./pages/Trips";
import Transactions from "./pages/Transactions";
import FareRules from "./pages/FareRules";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <main className="flex-1">
              <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card/95 backdrop-blur px-6 shadow-sm">
                <SidebarTrigger />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">Public Transport Card System</h2>
                </div>
              </header>
              <div className="p-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/passengers" element={<Passengers />} />
                  <Route path="/cards" element={<Cards />} />
                  <Route path="/card-types" element={<CardTypes />} />
                  <Route path="/stations" element={<Stations />} />
                  <Route path="/trips" element={<Trips />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/fare-rules" element={<FareRules />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
