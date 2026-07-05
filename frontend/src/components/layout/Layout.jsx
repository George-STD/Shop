import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import MobileMenu from './MobileMenu'
import CartSidebar from './CartSidebar'
import ContactFab from './ContactFab'
import BuildBoxFloatingWidget from './BuildBoxFloatingWidget'
import { useUIStore } from '../../store'

const Layout = ({ children }) => {
  const { isMobileMenuOpen, isCartOpen } = useUIStore()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {children || <Outlet />}
      </main>
      
      <Footer />

      <ContactFab />
      <BuildBoxFloatingWidget />
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && <MobileMenu />}
      
      {/* Cart Sidebar */}
      {isCartOpen && <CartSidebar />}
    </div>
  )
}

export default Layout
