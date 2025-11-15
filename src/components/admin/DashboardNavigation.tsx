import React, { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavigationTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  visible: boolean;
}

interface DashboardNavigationProps {
  tabs: NavigationTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const visibleTabs = tabs.filter(tab => tab.visible);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false); // Close mobile menu when tab is selected
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <nav className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-4 py-3">
            <div className="flex space-x-1 overflow-x-auto">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`
                    relative px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out
                    whitespace-nowrap flex items-center gap-2 min-w-fit
                    ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  {tab.icon && <span className="w-4 h-4 flex-shrink-0">{tab.icon}</span>}
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Mobile Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Dashboard
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  {visibleTabs.find(tab => tab.id === activeTab)?.label}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="py-2 border-b border-gray-200 bg-gray-50">
              <div className="space-y-1 px-2">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`
                      w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                      flex items-center gap-3
                      ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-white'
                      }
                    `}
                  >
                    {tab.icon && <span className="w-4 h-4 flex-shrink-0">{tab.icon}</span>}
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alternative: Dropdown Mobile Navigation */}
          <div className="p-2 bg-white">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  size="sm"
                >
                  <div className="flex items-center gap-2">
                    {visibleTabs.find(tab => tab.id === activeTab)?.icon}
                    <span>{visibleTabs.find(tab => tab.id === activeTab)?.label}</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full" align="start">
                {visibleTabs.map((tab) => (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`
                      flex items-center gap-3 cursor-pointer
                      ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : ''}
                    `}
                  >
                    {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Enhanced styling with gradients and animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-in {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DashboardNavigation;