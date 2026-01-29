import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Paperclip, MoreVertical } from "lucide-react";
import { useWidgetConfig } from "@/hooks/use-widget";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface WidgetPreviewProps {
  publicKey: string;
}

export function WidgetPreview({ publicKey }: WidgetPreviewProps) {
  const { data, isLoading } = useWidgetConfig(publicKey);
  console.log("💖 Widget config data in preview:", data);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ id: number; text: string; isUser: boolean }[]>([
    { id: 1, text: "Hello! Is this service available in my region?", isUser: true },
    { id: 2, text: "Hi there! Yes, we operate globally. How can I help you today?", isUser: false },
  ]);
  

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading widget preview...</div>;

  if (!data) return <div className="p-4 text-sm text-destructive">Invalid public key</div>;

  const { themeColor, greetingMessage, agentName, logoUrl } = data.config || {};

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const newMsg = { id: Date.now(), text: message, isUser: true };
    setMessages([...messages, newMsg]);
    setMessage("");

    // Simulate response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "Thanks for your message! An agent will be with you shortly.", 
        isUser: false 
      }]);
    }, 1000);
  };

  return (
    <div className="relative w-full h-[600px] border border-border rounded-xl bg-gray-50/50 overflow-hidden shadow-inner flex items-end justify-end p-6 sm:p-10">
      
      {/* Widget Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-24 right-6 sm:right-10 w-[350px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border/50 z-20"
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div 
              className="p-4 text-white flex items-center justify-between shadow-md"
              style={{ backgroundColor: themeColor }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <MessageCircle className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">{data.name}</h3>
                  <p className="text-xs opacity-90">{agentName}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-white/10 rounded-full transition-colors"><MoreVertical className="h-5 w-5" /></button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-[#efe7dd] p-4 overflow-y-auto flex flex-col gap-3" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
              <div className="bg-yellow-50 border border-yellow-100 p-2 rounded-lg text-xs text-center text-yellow-800 shadow-sm mx-4 mb-2">
                Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
              </div>
              
              <div className="self-center bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm text-xs font-medium text-gray-500 my-2">
                Today
              </div>

              {/* Greeting */}
              <div className="self-start max-w-[80%]">
                <div className="bg-white p-3 rounded-tr-lg rounded-bl-lg rounded-br-lg shadow-sm text-sm text-gray-800">
                  {greetingMessage}
                </div>
                <div className="text-[10px] text-gray-500 mt-1 ml-1">10:00 AM</div>
              </div>

              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.isUser ? "self-end items-end" : "self-start items-start")}>
                  <div 
                    className={cn(
                      "p-3 rounded-lg shadow-sm text-sm",
                      msg.isUser 
                        ? "bg-[#d9fdd3] text-gray-800 rounded-tr-none" 
                        : "bg-white text-gray-800 rounded-tl-none"
                    )}
                  >
                    {msg.text}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 mx-1">10:05 AM</div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 py-2 px-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!message.trim()}
                  className="p-2 bg-transparent text-gray-400 hover:text-primary disabled:opacity-50 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
            
            <div className="bg-gray-50 text-[10px] text-center py-1 text-gray-400 border-t border-gray-100">
              Powered by WaPlatform
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-10 h-16 w-16 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 hover:shadow-2xl"
        style={{ backgroundColor: themeColor }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-8 w-8" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="h-8 w-8" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Notification Badge */}
        {!isOpen && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </motion.button>
    </div>
  );
}
