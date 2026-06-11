"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { AutoAnimateList } from "@/components/motion/auto-animate-list";

interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  type: string;
  priority?: string;
  actionUrl?: string;
  readAt?: string | null;
}

export function NotificationsPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all");

  function load() {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((json) => {
        setItems(json.notifications ?? []);
        setUnread(json.unreadCount ?? 0);
      })
      .catch(() => setItems([]));
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function markRead(id: string, actionUrl?: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
    load();
    if (actionUrl) {
      setOpen(false);
      router.push(actionUrl);
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setOpen((x) => !x)} className="relative">
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-rose text-[9px] flex items-center justify-center text-white font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="fixed top-16 left-6 z-[210] w-[360px]"
          >
            <Card className="p-3 space-y-2 shadow-premium-lg max-h-96 overflow-y-auto w-[min(360px,calc(100vw-2rem))]">
              <div className="text-sm font-bold text-gold2 flex justify-between items-center">
                <span>مركز الإشعارات</span>
                {unread > 0 && <span className="text-xs text-text3">{unread} غير مقروء</span>}
              </div>
              <div className="flex gap-1 text-[10px]">
                {(["all", "unread", "urgent"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`px-2 py-1 rounded-sm border transition-colors focus-ring ${
                      filter === f
                        ? "border-gold/50 bg-gold/10 text-gold2"
                        : "border-border text-text3 hover:border-border2"
                    }`}
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "الكل" : f === "unread" ? "غير مقروء" : "عاجل"}
                  </button>
                ))}
              </div>
              {items.length === 0 && (
                <div className="text-xs text-text3 py-6 text-center">
                  لا إشعارات — ستظهر تنبيهات العادات والمهام تلقائياً
                </div>
              )}
              <AutoAnimateList>
                {items
                  .filter((n) => {
                    if (filter === "unread") return !n.readAt;
                    if (filter === "urgent") return n.priority === "urgent" || n.priority === "high";
                    return true;
                  })
                  .map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markRead(n.id, n.actionUrl)}
                      className={`w-full text-right text-sm border-b border-border/50 pb-2 hover:bg-surface2/50 rounded px-1 cursor-pointer animate-in fade-in-0 slide-in-from-top-1 duration-200 ${
                        !n.readAt ? "font-medium" : "opacity-70"
                      }`}
                    >
                      {n.title}
                      {n.body && <div className="text-[10px] text-text3 mt-0.5">{n.body}</div>}
                      <div className="flex gap-2 text-[10px] text-text3 mt-0.5">
                        <span>{n.type}</span>
                        {n.priority && (
                          <span className={n.priority === "urgent" ? "text-rose2" : ""}>
                            · {n.priority}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
              </AutoAnimateList>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
