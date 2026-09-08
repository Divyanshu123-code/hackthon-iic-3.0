import React from 'react';

export default function NavBar({ activeTab, onNavigate }) {
  const navItems = [
    { id: 'home', label: 'घर', icon: 'agriculture' },
    { id: 'schedule', label: 'तारीख', icon: 'calendar_month' },
    { id: 'queue', label: 'नंबर', icon: 'confirmation_number' },
    { id: 'payment', label: 'रुपये', icon: 'payments' }
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)] border-t border-outline-variant/30">
      <div className="flex justify-around items-center h-20 px-pad-xs max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-secondary font-label-md font-bold' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
              <span className="font-label-sm text-label-sm leading-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
