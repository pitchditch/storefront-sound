import { PropsWithChildren } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { NavLink, Link } from "react-router-dom";
import { Phone, Upload, List, Settings } from "lucide-react";

const MissingUrlBanner = () => {
  const url = localStorage.getItem("CALL_TRIGGER_URL");
  if (url) return null;
  return (
    <div className="container mx-auto px-4 py-2">
      <Alert>
        <AlertTitle>Missing Vercel Trigger URL</AlertTitle>
        <AlertDescription>
          Add your Vercel Trigger URL in Settings to start making calls. {" "}
          <Link to="/settings" className="underline">Open Settings</Link>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export const AppLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg">BC Pressure Washing</Link>
          <nav className="hidden sm:flex gap-6 text-sm">
            <NavLink to="/" className={({isActive})=> isActive?"text-primary":"text-muted-foreground hover:text-foreground"}>Call</NavLink>
            <NavLink to="/bulk" className={({isActive})=> isActive?"text-primary":"text-muted-foreground hover:text-foreground"}>Bulk</NavLink>
            <NavLink to="/logs" className={({isActive})=> isActive?"text-primary":"text-muted-foreground hover:text-foreground"}>Logs</NavLink>
            <NavLink to="/settings" className={({isActive})=> isActive?"text-primary":"text-muted-foreground hover:text-foreground"}>Settings</NavLink>
          </nav>
        </div>
        <Separator />
        <MissingUrlBanner />
      </header>
      <main className="flex-1">{children}</main>

      {/* Sticky bottom nav for mobile */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 border-t bg-background z-50">
        <div className="grid grid-cols-4">
          <NavLink to="/" className={({isActive})=>`flex flex-col items-center py-2 ${isActive?"text-primary":"text-muted-foreground"}`}>
            <Phone size={20} />
            <span className="text-xs">Call</span>
          </NavLink>
          <NavLink to="/bulk" className={({isActive})=>`flex flex-col items-center py-2 ${isActive?"text-primary":"text-muted-foreground"}`}>
            <Upload size={20} />
            <span className="text-xs">Bulk</span>
          </NavLink>
          <NavLink to="/logs" className={({isActive})=>`flex flex-col items-center py-2 ${isActive?"text-primary":"text-muted-foreground"}`}>
            <List size={20} />
            <span className="text-xs">Logs</span>
          </NavLink>
          <NavLink to="/settings" className={({isActive})=>`flex flex-col items-center py-2 ${isActive?"text-primary":"text-muted-foreground"}`}>
            <Settings size={20} />
            <span className="text-xs">Settings</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};
