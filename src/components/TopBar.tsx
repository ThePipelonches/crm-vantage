import React, { useState } from 'react';
import { Bell, Menu, Search, User } from 'lucide-react';

interface TopBarProps {
  title?: string;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  title = '',
  showMenuButton = false,
  onMenuClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [lateCount] = useState(0); // 🔥 TEMPORAL

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-secondary rounded-md"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        )}

        {title && (
          <h1 className="text-lg font-semibold text-foreground hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-10 w-48 md:w-64"
          />
        </div>

        <button className="relative p-2 hover:bg-secondary rounded-md">
          <Bell className="w-5 h-5 text-foreground" />
          {lateCount > 0 && (
            <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded-full">
              {lateCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;