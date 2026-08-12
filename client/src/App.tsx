import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// Lazy-load heavy pages that are NOT the landing page
// This means the browser only downloads them when the user navigates there
const Auth = lazy(() => import("./pages/Auth"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const EventSections = lazy(() => import("@/pages/EventSections"));
const RegisterModel = lazy(() => import("@/pages/RegisterModel"));
const ContestantPoster = lazy(() => import("@/pages/ContestantPoster"));
const MerchandiseStore = lazy(() => import("@/pages/MerchandiseStore"));
const PaymentPage = lazy(() => import("@/pages/PaymentPage"));
const PaymentDashboard = lazy(() => import("@/pages/PaymentDashboard"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-[#d4af37] text-xl font-semibold animate-pulse">Loading...</div>
  </div>
);

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/login"} component={Auth} />
        <Route path={"/register"} component={RegisterModel} />
        <Route path={"/gallery"} component={Gallery} />
        <Route path={"/admin"} component={AdminDashboard} />
        <Route path={"/event-sections"} component={EventSections} />
        <Route path={"/poster-generator"} component={ContestantPoster} />
        <Route path={"/merchandise"} component={MerchandiseStore} />
        <Route path={"/payment/:orderId"} component={PaymentPage} />
        <Route path={"/my-orders"} component={PaymentDashboard} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
        defaultTheme="light"
        // switchable
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
