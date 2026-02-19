import { Link } from 'react-router-dom'

const OccasionCard = ({ name, icon, color }) => {
  return (
    <Link 
      to={`/products?occasion=${encodeURIComponent(name)}`}
      className="group"
    >
      <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${color} text-white text-center transition-transform hover:scale-105`}>
        <span className="text-4xl mb-3 block">{icon}</span>
        <h3 className="font-bold">{name}</h3>
      </div>
    </Link>
  )
}

export default OccasionCard

