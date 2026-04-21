import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BUSINESS_CONFIG, STORAGE_KEYS } from '../constants'

const parseStock = (value) => {
  const stock = Number(value)
  if (!Number.isFinite(stock)) return null
  return Math.max(0, Math.floor(stock))
}

// Cart Store
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity = 1, options = {}) => {
        const items = get().items
        const requestedQuantity = Math.max(1, Math.floor(Number(quantity) || 1))
        const stockLimit = parseStock(product?.stock)
        const maxAllowed = stockLimit ?? Number.MAX_SAFE_INTEGER

        if (stockLimit === 0) {
          return { success: false, reason: 'out_of_stock', maxStock: 0 }
        }

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
          const currentQuantity = newItems[existingIndex].quantity
          const nextQuantity = Math.min(currentQuantity + requestedQuantity, maxAllowed)

          if (nextQuantity === currentQuantity) {
            return { success: false, reason: 'stock_limit_reached', maxStock: stockLimit }
          }

          newItems[existingIndex].quantity = nextQuantity
          if (stockLimit !== null) {
            newItems[existingIndex].stock = stockLimit
          }

          set({ items: newItems })
          return {
            success: true,
            quantity: nextQuantity,
            capped: nextQuantity < currentQuantity + requestedQuantity,
            maxStock: stockLimit,
          }
        } else {
          const finalQuantity = Math.min(requestedQuantity, maxAllowed)

          set({
            items: [...items, {
              id: product._id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              oldPrice: product.oldPrice,
              image: product.images[0]?.url,
              quantity: finalQuantity,
              stock: stockLimit,
              selectedSize: options.selectedSize,
              selectedColor: options.selectedColor,
              selectedShape: options.selectedShape,
              selectedVariants: options.selectedVariants,
              _variantsKey: variantsKey,
              addons: options.addons || [],
              boxSelections: options.boxSelections || []
            }]
          })

          return {
            success: true,
            quantity: finalQuantity,
            capped: finalQuantity < requestedQuantity,
            maxStock: stockLimit,
          }
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
        const requestedQuantity = Math.max(1, Math.floor(Number(quantity) || 1))
        let result = { success: false, reason: 'not_found' }
        let changed = false
        
        const items = get().items.map(item => {
          if (item.id === id && 
              item.selectedSize === selectedSize &&
              item.selectedColor === selectedColor &&
              item.selectedShape === selectedShape &&
              (item._variantsKey || '') === (_variantsKey || '')) {
            const stockLimit = parseStock(item.stock)
            const maxAllowed = stockLimit ?? Number.MAX_SAFE_INTEGER
            const nextQuantity = Math.min(requestedQuantity, maxAllowed)

            result = {
              success: true,
              quantity: nextQuantity,
              capped: nextQuantity < requestedQuantity,
              maxStock: stockLimit,
            }

            if (nextQuantity === item.quantity) {
              return item
            }

            changed = true
            return { ...item, quantity: nextQuantity }
          }
          return item
        })

        if (changed) {
          set({ items })
        }

        return result
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => {
          let itemTotal = item.price * item.quantity
          if (item.addons) {
            itemTotal += item.addons.reduce((sum, addon) => sum + addon.price, 0)
          }
          return total + itemTotal
        }, 0)
      },
      
      getItemsCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      }
    }),
    {
      name: STORAGE_KEYS.CART
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
        localStorage.setItem(STORAGE_KEYS.TOKEN, token)
        set({ user, token, isAuthenticated: true })
      },
      
      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
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
      name: STORAGE_KEYS.AUTH,
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
              image: product.images[0]?.url,
              stock: parseStock(product.stock)
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
      name: STORAGE_KEYS.WISHLIST
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

