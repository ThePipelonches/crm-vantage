import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* MENU */}
      <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
        <div className="relative h-full">

          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute -right-12 top-4 p-2 bg-secondary rounded-r-md hover:bg-secondary/80 transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          {/* SIDEBAR REAL */}
          <Sidebar />
        </div>
      </div>
    </>
  );
}