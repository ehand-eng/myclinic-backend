import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X, Calendar, User, Phone, BookOpen, Mail } from 'lucide-react';
import { useState } from 'react';
import { getRoleDisplayName } from '@/lib/roleUtils';
import MyBookingsModal from '@/components/MyBookingsModal';

const Header = () => {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const userStr = localStorage.getItem('current_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    window.location.href = '/login';
  };

  const handleProfile = () => {
    window.location.href = '/profile';
  };

  const scrollToAppointment = () => {
    const el = document.querySelector('.hero-banner-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <MyBookingsModal
        isOpen={showMyBookings}
        onClose={() => setShowMyBookings(false)}
      />

      {/* Medilab Top Bar */}
      <div className="medilab-topbar hidden md:block">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <a href="mailto:booking@docspot-connect.com" className="flex items-center space-x-2 hover:text-white transition-colors">
              <Mail className="h-4 w-4" />
              <span>booking@docspot-connect.com</span>
            </a>
            <a href="tel:+94771234567" className="flex items-center space-x-2 hover:text-white transition-colors">
              <Phone className="h-4 w-4" />
              <span>+94 77 123 4567</span>
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-white transition-colors" aria-label="Facebook">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="font-poppins font-bold text-2xl text-medilab-heading">
              MyClinic
            </Link>

            {isMobile ? (
              <>
                <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-medilab-heading">
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>

                {mobileMenuOpen && (
                  <div className="fixed inset-0 z-50 bg-white pt-16">
                    <div className="absolute top-4 right-4">
                      <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                        <X className="h-6 w-6 text-medilab-heading" />
                      </Button>
                    </div>
                    <div className="container mx-auto px-4 py-8 flex flex-col space-y-4">
                      <Link
                        to="/"
                        className="text-lg font-medium text-medilab-heading hover:text-medilab-primary transition-colors p-3 rounded-lg hover:bg-medilab-section-bg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Home
                      </Link>
                      <Link
                        to="/about"
                        className="text-lg font-medium text-medilab-heading hover:text-medilab-primary transition-colors p-3 rounded-lg hover:bg-medilab-section-bg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        About Us
                      </Link>

                      <Link
                        to="/contact"
                        className="text-lg font-medium text-medilab-heading hover:text-medilab-primary transition-colors p-3 rounded-lg hover:bg-medilab-section-bg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Contact
                      </Link>

                      {user && (!user.role || user.role === 'online') && (
                        <button
                          onClick={() => {
                            setShowMyBookings(true);
                            setMobileMenuOpen(false);
                          }}
                          className="text-lg font-medium text-medilab-heading hover:text-medilab-primary transition-colors p-3 rounded-lg hover:bg-medilab-section-bg text-left"
                        >
                          My Bookings
                        </button>
                      )}

                      <div className="pt-4 flex flex-col space-y-3">
                        {user ? (
                          <>
                            <button onClick={handleProfile} className="text-center py-2 text-medilab-heading hover:text-medilab-primary font-medium">
                              Profile
                            </button>
                            <button onClick={handleLogout} className="text-center py-2 text-red-600 hover:text-red-700 font-medium">
                              Logout
                            </button>
                          </>
                        ) : (
                          <Link
                            to="/login"
                            className="medilab-btn text-center"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Login
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Desktop Nav Links */}
                <nav className="flex items-center space-x-8">
                  <Link to="/" className="text-medilab-body hover:text-medilab-primary font-medium transition-colors text-[15px]">
                    Home
                  </Link>
                  <Link to="/about" className="text-medilab-body hover:text-medilab-primary font-medium transition-colors text-[15px]">
                    About
                  </Link>

                  <Link to="/contact" className="text-medilab-body hover:text-medilab-primary font-medium transition-colors text-[15px]">
                    Contact
                  </Link>
                </nav>

                {/* Right side: Auth + CTA */}
                <div className="flex items-center space-x-4">
                  {user ? (
                    <>
                      <div className="text-right mr-2">
                        <div className="text-sm font-medium text-medilab-heading">
                          {user.email}
                        </div>
                        {user.role && (
                          <div className="text-xs text-medilab-primary font-medium">
                            {getRoleDisplayName(user.role)}
                          </div>
                        )}
                      </div>
                      {(!user.role || user.role === 'online') && (
                        <button
                          onClick={() => setShowMyBookings(true)}
                          className="px-3 py-1.5 rounded-full bg-medilab-section-bg hover:bg-medilab-light-bg text-medilab-primary text-sm font-medium transition-colors flex items-center gap-1.5"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          My Bookings
                        </button>
                      )}
                      <button
                        onClick={handleProfile}
                        className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-medilab-heading text-sm font-medium transition-colors"
                      >
                        Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="medilab-btn inline-flex items-center"
                    >
                      Login
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
