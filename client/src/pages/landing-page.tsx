import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  Layout,
  Shield,
  Paintbrush,
  ArrowRight,
} from "lucide-react";
import { WidgetPreview } from "@/components/WidgetPreview";

export default function LandingPage() {
  const demoPublicKey = "pk_ynoukx7uw";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">WA Platform</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Login
          </Link>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 px-4 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-left duration-1000">
                <div className="space-y-4">
                  <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Embed WhatsApp in{" "}
                    <span className="text-primary">2 Minutes</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    The complete platform for CRMs and websites to offer
                    WhatsApp support. Multi-tenant, secure, and ready to scale.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild className="px-8">
                    <Link href="/signup">
                      Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="px-8">
                    <Link href="/demo.html">View Demo</Link>
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden"
                      >
                        <img
                          src={`https://i.pravatar.cc/150?u=${i}`}
                          alt="user"
                        />
                      </div>
                    ))}
                  </div>
                  <p>Trusted by 1,000+ companies worldwide</p>
                </div>
              </div>
              <div className="relative lg:h-[600px] rounded-xl overflow-hidden shadow-2xl border bg-card animate-in fade-in slide-in-from-right duration-1000">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.1),rgba(0,0,0,0.5))]" />
                <div className="relative p-6 h-full flex flex-col">
                  <div className="w-full h-8 bg-muted border-b flex items-center px-4 gap-2 rounded-t-lg">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <div className="h-2 w-2 rounded-full bg-yellow-400" />
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 p-8 space-y-4 opacity-20 pointer-events-none">
                    <div className="h-8 w-32 bg-foreground rounded" />
                    <div className="h-32 w-full bg-foreground rounded" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-foreground rounded" />
                      <div className="h-4 w-5/6 bg-foreground rounded" />
                    </div>
                  </div>
                  <div className="absolute bottom-8 right-8 w-[300px] h-[400px] pointer-events-auto">
                    <WidgetPreview publicKey={demoPublicKey} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background border-y">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Built for Scale
              </h2>
              <p className="max-w-[900px] text-muted-foreground mx-auto md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Everything you need to provide a professional WhatsApp
                experience to your users.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "Multi-Tenant",
                  icon: Layout,
                  desc: "Separate sessions and data for every company.",
                },
                {
                  title: "Real-time",
                  icon: MessageSquare,
                  desc: "Instant message delivery via Socket.IO.",
                },
                {
                  title: "Custom Branding",
                  icon: Paintbrush,
                  desc: "Personalize the widget for every tenant.",
                },
                {
                  title: "Secure",
                  icon: Shield,
                  desc: "Domain allowlisting and secure embed keys.",
                },
              ].map((f, i) => (
                <Card
                  key={i}
                  className="border-none shadow-none bg-transparent hover:bg-muted/30 transition-colors p-6 rounded-2xl group"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">{f.title}</h3>
                  <p className="text-muted-foreground">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center max-w-6xl space-y-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to get started?
            </h2>
            <p className="max-w-[600px] mx-auto opacity-90 md:text-xl">
              Join thousands of developers building the future of customer
              communication.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="px-8">
                <Link href="/signup">Create Account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8"
              >
                <Link href="/login">Agent Login</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 md:px-6 border-t bg-muted/30">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 max-w-6xl">
          <p className="text-xs text-muted-foreground">
            © 2026 WA Platform Inc. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <a className="text-xs hover:underline underline-offset-4" href="#">
              Terms of Service
            </a>
            <a className="text-xs hover:underline underline-offset-4" href="#">
              Privacy
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
