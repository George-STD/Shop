import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiArrowLeft, FiGift, FiHeart, FiDollarSign, FiUser } from 'react-icons/fi'

const occasions = [
  { id: 'birthday', name: 'عيد ميلاد', icon: '🎂' },
  { id: 'wedding', name: 'زفاف', icon: '💒' },
  { id: 'graduation', name: 'تخرج', icon: '🎓' },
  { id: 'baby', name: 'مولود جديد', icon: '👶' },
  { id: 'eid', name: 'عيد', icon: '🌙' },
  { id: 'anniversary', name: 'ذكرى زواج', icon: '💍' },
  { id: 'thank-you', name: 'شكر وتقدير', icon: '🙏' },
  { id: 'get-well', name: 'سلامات', icon: '💐' },
]

const recipients = [
  { id: 'her', name: 'لها', icon: '👩' },
  { id: 'him', name: 'له', icon: '👨' },
  { id: 'kids', name: 'للأطفال', icon: '👧' },
  { id: 'family', name: 'للعائلة', icon: '👨‍👩‍👧‍👦' },
  { id: 'friends', name: 'للأصدقاء', icon: '👥' },
  { id: 'colleagues', name: 'للزملاء', icon: '💼' },
]

const priceRanges = [
  { id: 'under200', name: 'أقل من 200 ج.م', min: 0, max: 200 },
  { id: '200-500', name: '200 - 500 ج.م', min: 200, max: 500 },
  { id: '500-1000', name: '500 - 1000 ج.م', min: 500, max: 1000 },
  { id: 'over1000', name: 'أكثر من 1000 ج.م', min: 1000, max: '' },
]

const interests = [
  { id: 'chocolate', name: 'شوكولاتة', icon: '🍫' },
  { id: 'flowers', name: 'ورود', icon: '🌹' },
  { id: 'perfume', name: 'عطور', icon: '🧴' },
  { id: 'jewelry', name: 'مجوهرات', icon: '💎' },
  { id: 'home', name: 'ديكور منزلي', icon: '🏠' },
  { id: 'tech', name: 'تقنية', icon: '📱' },
  { id: 'books', name: 'كتب', icon: '📚' },
  { id: 'wellness', name: 'عناية وجمال', icon: '💆' },
]

const GiftFinderPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selections, setSelections] = useState({
    occasion: null,
    recipient: null,
    priceRange: null,
    interests: [],
  })

  const handleSelect = (key, value) => {
    if (key === 'interests') {
      setSelections(prev => ({
        ...prev,
        interests: prev.interests.includes(value)
          ? prev.interests.filter(i => i !== value)
          : [...prev.interests, value]
      }))
    } else {
      setSelections(prev => ({ ...prev, [key]: value }))
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return selections.occasion
      case 2: return selections.recipient
      case 3: return selections.priceRange
      case 4: return selections.interests.length > 0
      default: return false
    }
  }

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      const params = new URLSearchParams({
        occasion: selections.occasion || '',
        recipient: selections.recipient || '',
        minPrice: priceRanges.find(p => p.id === selections.priceRange)?.min || '',
        maxPrice: priceRanges.find(p => p.id === selections.priceRange)?.max || '',
      })
      navigate(`/products?${params.toString()}`)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <div className="text-center mb-8">
              <FiGift className="text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">ما هي المناسبة؟</h2>
              <p className="text-gray-500">اختر المناسبة لنساعدك في اختيار الهدية المثالية</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {occasions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect('occasion', item.id)}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    selections.occasion === item.id
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <span className="text-4xl block mb-2">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div>
            <div className="text-center mb-8">
              <FiUser className="text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">لمن الهدية؟</h2>
              <p className="text-gray-500">حدد الشخص المراد إهداؤه</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {recipients.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect('recipient', item.id)}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    selections.recipient === item.id
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <span className="text-4xl block mb-2">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div>
            <div className="text-center mb-8">
              <FiDollarSign className="text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">ما ميزانيتك؟</h2>
              <p className="text-gray-500">حدد نطاق السعر المناسب</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
              {priceRanges.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect('priceRange', item.id)}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    selections.priceRange === item.id
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <span className="font-medium text-lg">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div>
            <div className="text-center mb-8">
              <FiHeart className="text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">ما اهتماماته؟</h2>
              <p className="text-gray-500">اختر اهتمام واحد أو أكثر</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {interests.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect('interests', item.id)}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    selections.interests.includes(item.id)
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <span className="text-4xl block mb-2">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Helmet>
        <title>باحث الهدايا | For You - اعثر على الهدية المثالية</title>
        <meta name="description" content="استخدم باحث الهدايا الذكي للعثور على الهدية المثالية لأي مناسبة. أجب على بعض الأسئلة واحصل على توصيات مخصصة." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white py-12">
        <div className="container-custom">
          {/* Progress */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      s <= step ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`w-16 md:w-24 h-1 ${
                        s < step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 shadow-lg">
            {renderStep()}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 text-gray-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <FiArrowRight />
                  السابق
                </button>
              ) : (
                <Link to="/" className="text-gray-600 hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  إلغاء
                </Link>
              )}

              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`btn-primary flex items-center gap-2 ${!canProceed() && 'opacity-50 cursor-not-allowed'}`}
              >
                {step === 4 ? 'عرض النتائج' : 'التالي'}
                <FiArrowLeft />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default GiftFinderPage
