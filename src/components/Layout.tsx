import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Receipt, Settings as SettingsIcon, LogOut, Sun, Moon, Menu, X, Bell } from 'lucide-react';
import { NotificationService } from '../services/NotificationService';
import type { DueTransaction } from '../services/NotificationService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dueTransactions, setDueTransactions] = useState<DueTransaction[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifs, setReadNotifs] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('finova_read_notifs') || '[]');
    } catch {
      return [];
    }
  });

  const handleMarkAsRead = (id: string) => {
    if (!readNotifs.includes(id)) {
      const newRead = [...readNotifs, id];
      setReadNotifs(newRead);
      localStorage.setItem('finova_read_notifs', JSON.stringify(newRead));
    }
  };

  const unreadCount = dueTransactions.filter(t => !readNotifs.includes(t.id)).length;

  useEffect(() => {
    if (user) {
      NotificationService.checkDueTransactions(user.id)
        .then(data => setDueTransactions(data))
        .catch(console.error);
    }
  }, [user]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Transações', path: '/transactions', icon: <Receipt size={20} /> },
    { name: 'Configurações', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  const handleCloseMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      
      {/* Mobile Overlay Background */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
          onClick={handleCloseMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Finova</h2>
          <button 
            onClick={handleCloseMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleCloseMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 md:justify-end shrink-0">
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Open Menu"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">Finova</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 relative"
                aria-label="Notificações"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                )}
              </button>
              
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">
                          {unreadCount} novas
                        </span>
                      )}
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                      {dueTransactions.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center text-gray-400">
                            <Bell size={20} />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma notificação no momento.</p>
                        </div>
                      ) : (
                        dueTransactions.map(t => {
                          const isRead = readNotifs.includes(t.id);
                          return (
                          <div key={t.id} onClick={() => handleMarkAsRead(t.id)} className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer ${isRead ? 'opacity-50 blur-[0.3px] grayscale-[0.5]' : ''}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Lançamento Vencendo</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  A despesa <strong>{t.description}</strong> vence em exatamente 2 dias.
                                </p>
                              </div>
                              {!isRead && <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full shrink-0"></div>}
                            </div>
                            <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-3 bg-red-50 dark:bg-red-900/20 inline-block px-2.5 py-1 rounded-lg">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                            </p>
                          </div>
                        )})
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto pb-20 md:pb-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
