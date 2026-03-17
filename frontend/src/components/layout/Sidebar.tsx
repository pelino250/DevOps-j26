import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  UserCog,
  MapPin,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Vehicles', icon: Truck, path: '/vehicles' },
  { label: 'Drivers', icon: UserCog, path: '/drivers' },
  { label: 'Trips', icon: MapPin, path: '/trips' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar({ open, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50',
          'w-64 bg-surface shadow-lg',
          'transform transition-transform duration-300 ease-in-out',
          'flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Truck className="text-primary" size={32} />
            <span className="text-xl font-bold text-primary">FleeMa</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  'text-text-primary hover:bg-primary/10',
                  isActive && 'bg-primary/10 text-primary font-semibold'
                )
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-text-secondary text-center">
            FleeMa v0.1.0
          </div>
        </div>
      </aside>
    </>
  );
}
