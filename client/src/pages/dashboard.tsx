import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/Sidebar";
import { QRScanner } from "@/components/QRScanner";
import { useChats, useDeleteChat } from "@/hooks/use-chats";
import {
  Users,
  MessageSquare,
  ArrowUpRight,
  Clock,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: chats } = useChats();
  const deleteChat = useDeleteChat();

  const stats = [
    {
      name: "Active Chats",
      value: chats?.length || 0,
      icon: MessageSquare,
      change: "+12%",
      color: "text-blue-600 bg-blue-100",
    },
    {
      name: "Total Customers",
      value: "1,234",
      icon: Users,
      change: "+5%",
      color: "text-purple-600 bg-purple-100",
    },
    {
      name: "Avg Response",
      value: "2m",
      icon: Clock,
      change: "-10%",
      color: "text-green-600 bg-green-100",
    },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Overview of your WhatsApp integration status and metrics.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white px-3 py-1.5 rounded-full border border-border shadow-sm">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              System Operational
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <Card
                key={stat.name}
                className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.name}
                      </p>
                      <h3 className="text-2xl font-bold mt-1 font-display">
                        {stat.value}
                      </h3>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-medium text-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {stat.change}
                    <span className="text-muted-foreground ml-1 font-normal">
                      vs last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Connection Status */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold font-display">
                Connection Status
              </h2>
              <QRScanner />
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold font-display">
                Recent Activity
              </h2>
              <Card className="h-[480px] border-border/50 shadow-sm flex flex-col">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base font-medium">
                    Latest Conversations
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full">
                    {chats?.length ? (
                      <div className="divide-y divide-border/50">
                        {chats.slice(0, 5).map((chat) => (
                          <div
                            key={chat.id}
                            className="p-4 hover:bg-muted/30 transition-colors flex items-center gap-4 cursor-pointer group"
                          >
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {chat.customerName?.substring(0, 2) || "C"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-sm truncate">
                                  {chat.customerName || chat.remoteJid}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                    {chat.lastMessageAt &&
                                      formatDistanceToNow(
                                        new Date(chat.lastMessageAt),
                                        { addSuffix: true },
                                      )}
                                  </span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem
                                            onSelect={(e) => e.preventDefault()}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Chat
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Delete Chat
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete
                                              this chat with{" "}
                                              {chat.customerName ||
                                                chat.remoteJid}
                                              ? This action cannot be undone and
                                              will remove all messages in this
                                              conversation.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                deleteChat.mutate(chat.id)
                                              }
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                Click to view conversation history...
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                        <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                        <p>No active conversations yet.</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
