import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Menu, MessageCircle, Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Sidebar from "@/components/dashboard/Sidebar";
import EmptyState from "@/components/dashboard/EmptyState";
import TaskDetail from "@/components/dashboard/TaskDetail";
import ChatPanel from "@/components/dashboard/ChatPanel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

function DashboardContent() {
  const { isAuthenticated, loading, profile } = useAuthContext();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  // Close sidebar when task is selected on mobile
  useEffect(() => {
    if (selectedTaskId) {
      setSidebarOpen(false);
    }
  }, [selectedTaskId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 lg:hidden z-40">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-72 bg-sidebar border-sidebar-border"
          >
            <Sidebar
              onTaskSelect={() => setSidebarOpen(false)}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          </SheetContent>
        </Sheet>

        <span className="text-lg font-bold text-gradient">TaskFlow</span>

        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MessageCircle className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-80 bg-card border-border">
            <ChatPanel />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex pt-14 lg:pt-0">
        <AnimatePresence mode="wait">
          {selectedTaskId ? (
            <TaskDetail
              key="task-detail"
              taskId={selectedTaskId}
              onDelete={() => setSelectedTaskId(null)}
            />
          ) : (
            <EmptyState key="empty-state" />
          )}
        </AnimatePresence>
      </main>

      {/* Desktop Chat Panel */}
      <div className="hidden xl:block">
        <ChatPanel />
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  );
}
