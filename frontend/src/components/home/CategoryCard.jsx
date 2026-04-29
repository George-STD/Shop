import { Link } from 'react-router-dom'

const CategoryCard = ({ category }) => {
  return (
    <Link 
      to={`/products?category=${category.slug}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-purple-100 to-pink-100">
        {category.image ? (
          <img 
            src={category.image} 
            alt={category.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500">🎁</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
          <h3 className="text-white font-bold text-base sm:text-lg transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">{category.name}</h3>
          {category.productsCount > 0 && (
            <p className="text-white/70 text-sm mt-1 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75">
              {category.productsCount} منتج
            </p>
          )}
          <div className="mt-2 flex items-center gap-1 text-white/80 text-xs font-medium transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-150">
            <span>تصفح</span>
            <span className="transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default CategoryCard
