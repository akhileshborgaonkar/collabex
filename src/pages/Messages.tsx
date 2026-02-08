import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageCircle, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Message = Tables<"messages">;

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation partners (matched profiles)
  useEffect(() => {
    if (!profile) return;
    const fetchConversations = async () => {
      const { data: matchData } = await supabase
        .from("matches")
        .select("profile_a, profile_b")
        .or(`profile_a.eq.${profile.id},profile_b.eq.${profile.id}`);

      if (!matchData || matchData.length === 0) {
        setLoading(false);
        return;
      }

      const partnerIds = matchData.map((m) => m.profile_a === profile.id ? m.profile_b : m.profile_a);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", partnerIds);

      setConversations(profiles || []);
      setLoading(false);
    };
    fetchConversations();
  }, [profile]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!profile || !selectedProfile) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${selectedProfile.id}),and(sender_id.eq.${selectedProfile.id},receiver_id.eq.${profile.id})`)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`messages-${profile.id}-${selectedProfile.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if (
          (msg.sender_id === profile.id && msg.receiver_id === selectedProfile.id) ||
          (msg.sender_id === selectedProfile.id && msg.receiver_id === profile.id)
        ) {
          setMessages((prev) => [...prev, msg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, selectedProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const sendMessage = async () => {
    if (!profile || !selectedProfile || !newMessage.trim()) return;
    await supabase.from("messages").insert({
      sender_id: profile.id,
      receiver_id: selectedProfile.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  const showList = !isMobile || !selectedProfile;
  const showChat = !isMobile || !!selectedProfile;

  return (
    <div className="flex h-[calc(100vh-5rem)] md:h-screen">
      {/* Conversation list */}
      {showList && (
        <div className={cn("border-r border-border bg-card", isMobile ? "w-full" : "w-80")}>
          <div className="p-4 border-b border-border">
            <h1 className="font-display text-xl font-bold">Messages</h1>
          </div>
          <ScrollArea className="h-[calc(100%-4rem)]">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 px-4 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No conversations yet. Match with creators to start chatting!</p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedProfile(c)}
                  className={cn(
                    "flex w-full items-center gap-3 p-4 hover:bg-muted transition-colors text-left",
                    selectedProfile?.id === c.id && "bg-muted"
                  )}
                >
                  <Avatar>
                    <AvatarImage src={c.avatar_url || ""} />
                    <AvatarFallback className="gradient-primary text-primary-foreground text-sm">
                      {c.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.display_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.audience_tier} creator</p>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>
      )}

      {/* Chat area */}
      {showChat && (
        <div className="flex-1 flex flex-col">
          {selectedProfile ? (
            <>
              <div className="flex items-center gap-3 border-b border-border p-4">
                {isMobile && (
                  <Button variant="ghost" size="icon" onClick={() => setSelectedProfile(null)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <Avatar className="h-9 w-9">
                  <AvatarImage src={selectedProfile.avatar_url || ""} />
                  <AvatarFallback className="gradient-primary text-primary-foreground text-xs">
                    {selectedProfile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-display font-semibold">{selectedProfile.display_name}</p>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.sender_id === profile?.id ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                        msg.sender_id === profile?.id
                          ? "gradient-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t border-border p-4">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" className="gradient-primary text-primary-foreground" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-display">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
