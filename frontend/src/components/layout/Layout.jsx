import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileMenu from './MobileMenu';
import CartSidebar from './CartSidebar';
import ContactFab from './ContactFab';
import { useUIStore } from '../../store';

const Layout = ({ children }) => {
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const isCartOpen = useUIStore((state) => state.isCartOpen);

  return (
    <div className="min-h-screen min-h-dvh flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[9999] focus:px-6 focus:py-3 focus:bg-purple-700 focus:text-white focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-300 font-bold text-sm transition-all"
      >
        تخطي إلى المحتوى الرئيسي
      </a>

      <Header />

      <main id="main-content" className="flex-grow">{children || <Outlet />}</main>

      <Footer />

      <ContactFab />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && <MobileMenu />}

      {/* Cart Sidebar */}
      {isCartOpen && <CartSidebar />}
    </div>
  );
};

export default Layout;
