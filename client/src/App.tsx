import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { JarvisUltraPremium } from "./components/JarvisUltraPremium";
import { JarvisAuthGate } from "./components/JarvisAuthGate";
import React, { lazy, Suspense } from "react";
import { useAuth } from "./_core/hooks/useAuth";

const Home = lazy(() => import("./pages/Home"));
const JarvisChat = lazy(() => import("./pages/JarvisChat"));
const Tasks = lazy(() => import("./pages/Tasks"));
const SocialMedia = lazy(() => import("./pages/SocialMedia"));
const Ads = lazy(() => import("./pages/Ads"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Automations = lazy(() => import("./pages/Automations"));
const Actions = lazy(() => import("./pages/Actions"));
const Swarm = lazy(() => import("./pages/Swarm"));

const PageFallback = () => (
  <div className="min-h-screen bg-black text-blue-300 flex items-center justify-center font-mono">
    Carregando módulo do Jarvis...
  </div>
);

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-black text-blue-300 flex items-center justify-center font-mono">Validando sessão oficial...</div>;
  }

  if (!isAuthenticated) {
    return <JarvisAuthGate />;
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={() => <JarvisUltraPremium />} />
        <Route path="/dashboard" component={() => <DashboardLayout><Home /></DashboardLayout>} />
        <Route path="/chat" component={() => <DashboardLayout><JarvisChat /></DashboardLayout>} />
        <Route path="/tasks" component={() => <DashboardLayout><Tasks /></DashboardLayout>} />
        <Route path="/social" component={() => <DashboardLayout><SocialMedia /></DashboardLayout>} />
        <Route path="/ads" component={() => <DashboardLayout><Ads /></DashboardLayout>} />
        <Route path="/alerts" component={() => <DashboardLayout><Alerts /></DashboardLayout>} />
        <Route path="/automations" component={() => <DashboardLayout><Automations /></DashboardLayout>} />
        <Route path="/actions" component={() => <DashboardLayout><Actions /></DashboardLayout>} />
        <Route path="/swarm" component={() => <DashboardLayout><Swarm /></DashboardLayout>} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
