import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { useChats, useCreateChat, useDeleteChat } from "@/hooks/use-chats";
import {
  Search,
  Filter,
  Phone,
  Video,
  MoreHorizontal,
  MessageCircle,
  Plus,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function ChatsPage() {
  const { data: chats, isLoading } = useChats();
  const createChatMutation = useCreateChat();
  const deleteChatMutation = useDeleteChat();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const { toast } = useToast();

  const filteredChats = chats?.filter(
    (chat) =>
      (chat.customerName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) || chat.remoteJid.includes(searchTerm),
  );

  const handleCreateChat = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format phone number to WhatsApp JID format
      const formattedNumber = phoneNumber.replace(/\D/g, "") + "@c.us";

      const newChat = await createChatMutation.mutateAsync({
        remoteJid: formattedNumber,
        customerName: customerName.trim() || undefined,
      });

      setSelectedChatId(newChat.id);
      setIsCreateDialogOpen(false);
      setPhoneNumber("");
      setCustomerName("");

      toast({
        title: "Success",
        description: "Chat created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create chat",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      <Sidebar />

      <main className="flex-1 lg:ml-64 flex h-full">
        {/* Chat List Sidebar */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold font-display">Live Chats</h1>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 bg-muted/50 border-transparent focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs text-muted-foreground"
              >
                Unread
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs text-muted-foreground"
              >
                Archived
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading chats...
              </div>
            ) : filteredChats?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <MessageCircle className="h-10 w-10 mb-2 opacity-20" />
                <p>No chats found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredChats?.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={cn(
                      "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left group relative",
                      selectedChatId === chat.id &&
                        "bg-primary/5 hover:bg-primary/10",
                    )}
                  >
                    {selectedChatId === chat.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 font-semibold border border-border">
                        {chat.customerName?.substring(0, 2) || "C"}
                      </div>
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            "font-semibold text-sm truncate",
                            selectedChatId === chat.id
                              ? "text-primary"
                              : "text-foreground",
                          )}
                        >
                          {chat.customerName || chat.remoteJid}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {chat.lastMessageAt
                              ? format(new Date(chat.lastMessageAt), "h:mm a")
                              : ""}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
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
                                      Are you sure you want to delete this chat
                                      with {chat.customerName || chat.remoteJid}
                                      ? This action cannot be undone and will
                                      remove all messages in this conversation.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        deleteChatMutation.mutate(chat.id);
                                        if (selectedChatId === chat.id) {
                                          setSelectedChatId(null);
                                        }
                                      }}
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
                      <p className="text-xs text-muted-foreground truncate group-hover:text-foreground/80 transition-colors">
                        Click to view messages...
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-muted/10 h-full">
          {selectedChatId ? (
            <ChatWindow chatId={selectedChatId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <div className="bg-white p-6 rounded-full shadow-lg mb-6 animate-fade-in">
                <MessageCircle className="h-16 w-16 text-primary/50" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                WhatsApp Web for Business
              </h2>
              <p className="max-w-md text-center mb-8">
                Send and receive messages without keeping your phone online. Use
                WhatsApp on up to 4 linked devices and 1 phone at the same time.
              </p>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  End-to-end encrypted
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Chat Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
            <DialogDescription>
              Enter the phone number to start a new conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="e.g. +1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="name">Customer Name (Optional)</Label>
              <Input
                id="name"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateChat}
              disabled={createChatMutation.isPending}
            >
              {createChatMutation.isPending ? "Creating..." : "Create Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
