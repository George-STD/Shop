const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="feature-card group flex items-center gap-4 p-5 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 cursor-default">
      <div className="feature-icon-container">
        <span>{icon}</span>
      </div>
      <div>
        <h3 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}

export default FeatureCard
