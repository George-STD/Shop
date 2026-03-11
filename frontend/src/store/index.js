import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Cart Store
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity = 1, options = {}) => {
        const items = get().items
        const variantsKey = options.selectedVariants ? JSON.stringify(options.selectedVariants) : ''
        const existingIndex = items.findIndex(
          item => item.id === product._id && 
                  item.selectedSize === options.selectedSize &&
                  item.selectedColor === options.selectedColor &&
                  item.selectedShape === options.selectedShape &&
                  (item._variantsKey || '') === variantsKey
        )
        
        if (existingIndex > -1) {
          const newItems = [...items]
          newItems[existingIndex].quantity += quantity
          set({ items: newItems })
        } else {
          set({
            items: [...items, {
              id: product._id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              oldPrice: product.oldPrice,
              image: product.images[0]?.url,
              quantity,
              selectedSize: options.selectedSize,
              selectedColor: options.selectedColor,
              selectedShape: options.selectedShape,
              selectedVariants: options.selectedVariants,
              _variantsKey: variantsKey,
              addons: options.addons || [],
              boxSelections: options.boxSelections || [],
              giftWrap: options.giftWrap || { enabled: false }
            }]
          })
        }
      },
      
      removeItem: (id, selectedSize, selectedColor, selectedShape, _variantsKey) => {
        set({
          items: get().items.filter(
            item => !(item.id === id && 
                     item.selectedSize === selectedSize &&
                     item.selectedColor === selectedColor &&
                     item.selectedShape === selectedShape &&
                     (item._variantsKey || '') === (_variantsKey || ''))
          )
        })
      },
      
      updateQuantity: (id, quantity, selectedSize, selectedColor, selectedShape, _variantsKey) => {
        if (quantity < 1) return
        
        const items = get().items.map(item => {
          if (item.id === id && 
              item.selectedSize === selectedSize &&
              item.selectedColor === selectedColor &&
              item.selectedShape === selectedShape &&
              (item._variantsKey || '') === (_variantsKey || '')) {
            return { ...item, quantity }
          }
          return item
        })
        set({ items })
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => {
          let itemTotal = item.price * item.quantity
          if (item.addons) {
            itemTotal += item.addons.reduce((sum, addon) => sum + addon.price, 0)
          }
          if (item.giftWrap?.enabled) {
            itemTotal += 25 // Gift wrap price
          }
          return total + itemTotal
        }, 0)
      },
      
      getItemsCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      }
    }),
    {
      name: 'cart-storage'
    }
  )
)

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      setAuth: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },
      
      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },
      
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },
      
      isAdmin: () => {
        return get().user?.role === 'admin'
      }
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)

// Export useAuthStore as default for backward compatibility
export default useAuthStore

// Wishlist Store (for guests)
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => {
        const items = get().items
        if (!items.find(item => item.id === product._id)) {
          set({
            items: [...items, {
              id: product._id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              oldPrice: product.oldPrice,
              image: product.images[0]?.url
            }]
          })
        }
      },
      
      removeItem: (id) => {
        set({ items: get().items.filter(item => item.id !== id) })
      },
      
      isInWishlist: (id) => {
        return get().items.some(item => item.id === id)
      },
      
      clearWishlist: () => set({ items: [] })
    }),
    {
      name: 'wishlist-storage'
    }
  )
)

// UI Store
export const useUIStore = create((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isCartOpen: false,
  
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  closeSearch: () => set({ isSearchOpen: false }),
  
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  closeCart: () => set({ isCartOpen: false })
}))

