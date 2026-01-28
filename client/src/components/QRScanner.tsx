import { Loader2, RefreshCw, CheckCircle2, PowerOff } from "lucide-react";
import { useWhatsAppStatus, useWhatsAppLogout } from "@/hooks/use-whatsapp";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo } from "react";

export function QRScanner() {
  // --- Hooks at top level ---
  const { data, isLoading, refetch } = useWhatsAppStatus();
  const [qr, setQr] = useState<string>(""); // blob URL
  const { mutate: logout, isPending: isLoggingOut } = useWhatsAppLogout();

  const status = data?.status || "disconnected";
  const qrCode = data?.qr;

  console.log("WhatsApp Status:", status);
  console.log("QR Code length:", qrCode?.length || 0);

  // --- Convert Base64 QR to Blob URL safely ---
  const qrBlobUrl = useMemo(() => {
    if (!qrCode) return "";
    const byteCharacters = atob(qrCode.split(",")[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: "image/png" });
    return URL.createObjectURL(blob);
  }, [qrCode]);

  useEffect(() => {
    setQr(qrBlobUrl);
    return () => {
      if (qrBlobUrl) URL.revokeObjectURL(qrBlobUrl);
    };
  }, [qrBlobUrl]);

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p>Checking connection status...</p>
      </div>
    );
  }

  // --- Render QR / Connection states ---
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border/50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">WhatsApp Connection</h3>
          <p className="text-sm text-muted-foreground">
            Manage your WhatsApp Business instance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
              status === "connected"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : status === "qr_ready"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        {status === "connected" ? (
          <div className="text-center animate-fade-in">
            <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You are connected!</h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
              Your WhatsApp Business account is successfully linked. You can now
              send and receive messages from the dashboard.
            </p>
            <Button
              variant="destructive"
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="min-w-[140px]"
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PowerOff className="mr-2 h-4 w-4" />
              )}
              Disconnect
            </Button>
          </div>
        ) : status === "qr_ready" && qr ? (
          <div className="text-center animate-fade-in">
            <div className="bg-white p-4 rounded-xl shadow-lg mb-6 inline-block border border-gray-100">
              <img src={qr} alt="QR Code" width={256} height={256} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Scan with WhatsApp</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
              Open WhatsApp on your phone, go to Settings &gt; Linked Devices
              &gt; Link a Device, and scan this code.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 py-2 px-4 rounded-full">
              <Loader2 className="h-3 w-3 animate-spin" />
              Waiting for scan...
            </div>
          </div>
        ) : (
          <div className="text-center animate-fade-in">
            <div className="h-20 w-20 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connecting to Server</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
              Please wait while we establish a secure connection to the WhatsApp
              gateway...
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
