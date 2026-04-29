import { Link } from 'react-router-dom'

const OccasionCard = ({ name, icon, color }) => {
  return (
    <Link 
      to={`/products?occasion=${encodeURIComponent(name)}`}
      className="group"
    >
      <div className={`occasion-card relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${color} text-white text-center transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20`}>
        {/* Decorative sparkle */}
        <div className="absolute top-2 left-2 text-white/20 text-xs opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-45">✦</div>
        <div className="absolute bottom-2 right-2 text-white/20 text-xs opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 group-hover:-rotate-45">✦</div>
        
        <span className="text-4xl mb-3 block transform transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">{icon}</span>
        <h3 className="font-bold text-sm sm:text-base drop-shadow-sm">{name}</h3>
      </div>
    </Link>
  )
}

export default OccasionCard
