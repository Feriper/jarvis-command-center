import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import JarvisChat from "./pages/JarvisChat";
import { JarvisUltraPremium } from "./components/JarvisUltraPremium";
import { JarvisAuthGate } from "./components/JarvisAuthGate";
import React, { useState } from "react";
import Tasks from "./pages/Tasks";
import SocialMedia from "./pages/SocialMedia";
import Ads from "./pages/Ads";
import Alerts from "./pages/Alerts";
import Automations from "./pages/Automations";
import Swarm from "./pages/Swarm";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <JarvisAuthGate onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <Switch>
      <Route path={"/"} component={() => <JarvisUltraPremium />} />
      <Route path={"/dashboard"} component={() => <DashboardLayout><Home /></DashboardLayout>} />
      <Route path={"/chat"} component={() => <DashboardLayout><JarvisChat /></DashboardLayout>} />
      <Route path={"/tasks"} component={() => <DashboardLayout><Tasks /></DashboardLayout>} />
      <Route path={"/social"} component={() => <DashboardLayout><SocialMedia /></DashboardLayout>} />
      <Route path={"/ads"} component={() => <DashboardLayout><Ads /></DashboardLayout>} />
      <Route path={"/alerts"} component={() => <DashboardLayout><Alerts /></DashboardLayout>} />
      <Route path={"/automations"} component={() => <DashboardLayout><Automations /></DashboardLayout>} />
      <Route path={"/swarm"} component={() => <DashboardLayout><Swarm /></DashboardLayout>} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
