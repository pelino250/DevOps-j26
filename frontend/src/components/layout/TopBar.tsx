import { Menu, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { UserMenu } from './UserMenu';
import type { User } from '../../types';

interface TopBarProps {
  onMenuClick: () => void;
  user?: User | null;
}

export function TopBar({ onMenuClick, user }: TopBarProps) {
  return (
    <header className="h-16 bg-primary text-white shadow-md flex items-center justify-between px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden text-white hover:bg-white/20"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </Button>
        <h1 className="text-xl font-bold hidden sm:block">FleeMa</h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative text-white hover:bg-white/20"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full" />
        </Button>

        {/* User menu */}
        {user && <UserMenu user={user} />}
      </div>
    </header>
  );
}
