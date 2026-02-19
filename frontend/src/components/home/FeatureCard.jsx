const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <h3 className="font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}

export default FeatureCard

