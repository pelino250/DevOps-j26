import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { User as UserIcon, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = () => {
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
            {getInitials()}
          </div>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium">{user.email}</span>
            <span className="text-xs opacity-80">{user.role}</span>
          </div>
          <ChevronDown size={16} className="hidden md:block" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] bg-surface rounded-lg shadow-lg p-1 z-50"
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className="flex items-center gap-3 px-3 py-2 text-sm text-text-primary rounded-md hover:bg-background outline-none cursor-pointer"
            onSelect={() => navigate('/profile')}
          >
            <UserIcon size={16} />
            <span>Profile</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-3 px-3 py-2 text-sm text-text-primary rounded-md hover:bg-background outline-none cursor-pointer"
            onSelect={() => navigate('/settings')}
          >
            <Settings size={16} />
            <span>Settings</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

          <DropdownMenu.Item
            className="flex items-center gap-3 px-3 py-2 text-sm text-danger rounded-md hover:bg-danger/10 outline-none cursor-pointer"
            onSelect={handleLogout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </DropdownMenu.Item>

          <DropdownMenu.Arrow className="fill-surface" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
