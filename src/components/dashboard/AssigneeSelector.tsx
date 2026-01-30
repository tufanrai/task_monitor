import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { useDataContext, UserWithRole } from '@/contexts/DataContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssigneeSelectorProps {
  assignees: string[];
  onAssigneesChange: (assignees: string[]) => void;
  disabled?: boolean;
}

export default function AssigneeSelector({ 
  assignees, 
  onAssigneesChange, 
  disabled = false 
}: AssigneeSelectorProps) {
  const { users } = useDataContext();
  const [open, setOpen] = useState(false);

  // Filter to only show admins and employees (not clients)
  const assignableUsers = users.filter(user => 
    user.role === 'admin' || user.role === 'employee'
  );

  const toggleAssignee = (userId: string) => {
    if (assignees.includes(userId)) {
      onAssigneesChange(assignees.filter(id => id !== userId));
    } else {
      onAssigneesChange([...assignees, userId]);
    }
  };

  const removeAssignee = (userId: string) => {
    onAssigneesChange(assignees.filter(id => id !== userId));
  };

  const getAssignedUsers = (): UserWithRole[] => {
    return users.filter(u => assignees.includes(u.user_id));
  };

  return (
    <div className="space-y-2">
      {/* Display current assignees */}
      <div className="flex flex-wrap gap-2">
        {getAssignedUsers().map((user) => (
          <div
            key={user.user_id}
            className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-lg text-sm"
          >
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
              {user.avatar || user.name?.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-foreground">{user.name}</span>
            <span className="text-xs text-muted-foreground capitalize">({user.role})</span>
            {!disabled && (
              <button
                onClick={() => removeAssignee(user.user_id)}
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        {assignees.length === 0 && (
          <span className="text-sm text-muted-foreground">No assignees</span>
        )}
      </div>

      {/* Add assignee button */}
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Assign
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <ScrollArea className="max-h-64">
              {assignableUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2 text-center">
                  No employees or admins available
                </p>
              ) : (
                <div className="space-y-1">
                  {assignableUsers.map((user) => {
                    const isAssigned = assignees.includes(user.user_id);
                    return (
                      <button
                        key={user.user_id}
                        onClick={() => toggleAssignee(user.user_id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                          isAssigned 
                            ? 'bg-primary/10 text-foreground' 
                            : 'hover:bg-secondary text-foreground'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                          {user.avatar || user.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {user.role}
                          </p>
                        </div>
                        {isAssigned && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
