import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mb-8 p-4 rounded-full bg-destructive/10 text-destructive animate-fade-in">
        <AlertCircle className="h-16 w-16" />
      </div>
      <h1 className="text-4xl font-display font-bold text-foreground mb-4 text-center">Page Not Found</h1>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      
      <Link href="/">
        <Button variant="default" size="lg" className="shadow-lg shadow-primary/20">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
