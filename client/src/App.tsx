import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme/theme-provider";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import TechnicianDashboard from "@/pages/technician-dashboard";
import ChecklistForm from "@/pages/checklist-form";
import Templates from "@/pages/templates";
import Users from "@/pages/users";
import Checklists from "@/pages/checklists";
import Reports from "@/pages/reports";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/technician" component={TechnicianDashboard} />
      <Route path="/checklists" component={Checklists} />
      <Route path="/checklist/:templateId" component={ChecklistForm} />
      <Route path="/templates" component={Templates} />
      <Route path="/users" component={Users} />
      <Route path="/reports" component={Reports} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="claro-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;