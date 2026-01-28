import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { WidgetPreview } from "@/components/WidgetPreview";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function EmbedTestPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  console.log("user:", user);

  // In a real app, this comes from the tenant record
  // const publicKey = "demo-public-key-123";
  const publicKey = String(user?.publicKey || "");
  console.log("Using publicKey:", user?.publicKey);

  const embedCode = `
<script>
  window.waWidgetConfig = {
    publicKey: "${publicKey}",
  };
</script>
<script src="https://platform.com/widget.js" async></script>
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
              Integration
            </h1>
            <p className="text-muted-foreground mt-1">
              Preview and install your WhatsApp widget.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="border-border/50 shadow-md">
                <CardHeader>
                  <CardTitle>Install Code</CardTitle>
                  <CardDescription>
                    Copy and paste this snippet before the closing{" "}
                    <code>&lt;/body&gt;</code> tag on your website.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative group">
                    <pre className="bg-slate-950 text-slate-50 p-6 rounded-xl text-sm font-mono overflow-x-auto border border-slate-800 shadow-inner">
                      {embedCode}
                    </pre>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {copied ? "Copied!" : "Copy Code"}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800 flex gap-3 items-start">
                    <div className="mt-0.5 bg-blue-200 rounded-full p-1">
                      <ExternalLink className="h-3 w-3 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">
                        Developer Documentation
                      </p>
                      <p>
                        Need more control? Check out our{" "}
                        <a href="#" className="underline">
                          advanced API docs
                        </a>{" "}
                        for custom implementations and events.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Direct Link</CardTitle>
                  <CardDescription>
                    Share a direct link to open the chat in a new window.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-3 py-2 rounded-lg text-sm flex-1 truncate">
                      https://wa.platform.com/chat/{publicKey}
                    </code>
                    <Button variant="outline" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold font-display">
                  Live Preview
                </h2>
                <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                  Interactive Demo
                </span>
              </div>

              {/* Preview Container - simulating a website */}
              <div className="relative border border-border rounded-xl h-[600px] overflow-hidden shadow-2xl bg-white">
                <div className="w-full h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <div className="flex-1 text-center text-xs text-gray-500 font-medium">
                    your-website.com
                  </div>
                </div>

                {/* Dummy Content */}
                <div className="p-8 space-y-6 opacity-30 pointer-events-none">
                  <div className="h-12 w-32 bg-gray-200 rounded-lg" />
                  <div className="h-64 w-full bg-gray-100 rounded-xl" />
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-100 rounded" />
                    <div className="h-4 w-5/6 bg-gray-100 rounded" />
                    <div className="h-4 w-4/6 bg-gray-100 rounded" />
                  </div>
                </div>

                {/* The Widget */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="pointer-events-auto w-full h-full">
                    <WidgetPreview publicKey={publicKey} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
