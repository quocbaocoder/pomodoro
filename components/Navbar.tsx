import React from 'react';
import { View, Settings } from '../types';
import { TimerIcon } from './icons/TimerIcon';
import { ListChecksIcon } from './icons/ListChecksIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { UsersIcon } from './icons/UsersIcon';

interface NavbarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  settings: Settings;
}

const themeClasses = {
  cyan: { text: 'text-cyan-400', hoverText: 'hover:text-cyan-300' },
  magenta: { text: 'text-fuchsia-400', hoverText: 'hover:text-fuchsia-300' },
  green: { text: 'text-emerald-400', hoverText: 'hover:text-emerald-300' },
};

const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView, settings }) => {
  const navItems = [
    { view: 'timer' as View, label: 'Đồng hồ', icon: <TimerIcon /> },
    { view: 'homework' as View, label: 'Nhiệm vụ', icon: <ListChecksIcon /> },
    { view: 'stats' as View, label: 'Thống kê', icon: <BarChartIcon /> },
    { view: 'group' as View, label: 'Học Nhóm', icon: <UsersIcon /> },
    { view: 'settings' as View, label: 'Cài đặt', icon: <SettingsIcon /> },
  ];
  
  const currentTheme = themeClasses[settings.theme];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/50 backdrop-blur-lg border-t border-white/10 shadow-lg z-40">
      <div className="max-w-md mx-auto flex justify-around">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition-colors duration-200 ${
                isActive ? currentTheme.text : `text-slate-400 ${currentTheme.hoverText}`
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
