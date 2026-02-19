import { Link } from 'react-router-dom'

const CategoryCard = ({ category }) => {
  return (
    <Link 
      to={`/products/${category.slug}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
        {category.image ? (
          <img 
            src={category.image} 
            alt={category.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            <i className={`fa ${category.icon || 'fa-gift'} text-gray-400`}></i>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
          <div>
            <h3 className="text-white font-bold text-lg">{category.name}</h3>
            {category.productsCount > 0 && (
              <p className="text-white/80 text-sm">{category.productsCount} ????</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default CategoryCard

