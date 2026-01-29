import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Tenant } from "@shared/schema";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [themeColor, setThemeColor] = useState("#25D366");
  const [agentName, setAgentName] = useState("Support Agent");
  const [greetingMessage, setGreetingMessage] = useState(
    "Hello! How can we help you?",
  );
  const [allowedDomains, setAllowedDomains] = useState("");

  // Fetch tenant data
  const { data: tenant } = useQuery<Tenant>({
    queryKey: ["tenant", user?.tenantId],
    enabled: !!user?.tenantId,
    queryFn: async () => {
      const response = await fetch(`/api/tenant/${user!.tenantId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch tenant");
      return response.json();
    },
  });

  // Load current settings
  useEffect(() => {
    if (tenant) {
      const config = tenant.config || {};
      setThemeColor(config.themeColor || "#25D366");
      setAgentName(config.agentName || "Support Agent");
      setGreetingMessage(
        config.greetingMessage || "Hello! How can we help you?",
      );
      const domains = Array.isArray(tenant.allowedDomains)
        ? tenant.allowedDomains
        : typeof tenant.allowedDomains === 'string'
        ? JSON.parse(tenant.allowedDomains)
        : [];
      setAllowedDomains(domains.join("\n"));
    }
  }, [tenant]);

  const handleSaveAppearance = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/tenant/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          themeColor,
          agentName,
          greetingMessage,
        }),
      });

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your widget appearance has been updated.",
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDomains = async () => {
    setLoading(true);
    try {
      const domains = allowedDomains
        .split("\n")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      const response = await fetch("/api/tenant/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          allowedDomains: domains,
        }),
      });

      if (response.ok) {
        toast({
          title: "Domains updated",
          description: "Allowed domains have been updated successfully.",
        });
      } else {
        throw new Error("Failed to update domains");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update domains. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
              Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure your widget appearance and agent preferences.
            </p>
          </div>

          <Tabs defaultValue="widget" className="w-full">
            <TabsList className="bg-white/50 backdrop-blur-sm border border-border/50 p-1 mb-8">
              <TabsTrigger value="widget" className="px-6">
                Widget Configuration
              </TabsTrigger>
              <TabsTrigger value="account" className="px-6">
                Account & Security
              </TabsTrigger>
              <TabsTrigger value="billing" className="px-6">
                Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="widget" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how the chat widget looks on your website.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="themeColor">Theme Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="themeColor"
                          type="color"
                          className="w-12 h-12 p-1 rounded-lg cursor-pointer"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                        />
                        <Input
                          type="text"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="flex-1 font-mono uppercase"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agentName">Agent Name</Label>
                      <Input
                        id="agentName"
                        placeholder="e.g. Support Team"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="greeting">Greeting Message</Label>
                    <Textarea
                      id="greeting"
                      placeholder="Enter the first message users will see..."
                      className="resize-none"
                      rows={3}
                      value={greetingMessage}
                      onChange={(e) => setGreetingMessage(e.target.value)}
                    />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={handleSaveAppearance}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Allowed Domains</CardTitle>
                  <CardDescription>
                    Restrict which websites can embed your chat widget.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Domains (one per line)</Label>
                    <Textarea
                      placeholder="example.com&#10;myshop.com&#10;* (allow all)"
                      className="font-mono text-sm"
                      rows={4}
                      value={allowedDomains}
                      onChange={(e) => setAllowedDomains(e.target.value)}
                    />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleSaveDomains}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Update Domains
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>
                    Update your password and session settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Account settings are managed by your organization admin.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
