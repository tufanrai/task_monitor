import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col items-center justify-center p-8"
    >
      <motion.div
        initial={{ y: 10 }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-6"
      >
        <div className="p-6 rounded-3xl bg-card border border-border/50">
          <ClipboardList className="w-16 h-16 text-muted-foreground/50" strokeWidth={1} />
        </div>
      </motion.div>
      
      <h2 className="text-2xl font-semibold text-foreground mb-2">No Task Selected</h2>
      <p className="text-muted-foreground text-center max-w-sm">
        Select a task from the sidebar to view its details, or create a new one to get started.
      </p>
    </motion.div>
  );
}
