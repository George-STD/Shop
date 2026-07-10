import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiArrowRight, FiArrowLeft, FiGift, FiUser, FiDollarSign, FiSmile, FiHeart, FiStar } from 'react-icons/fi'
import { occasionsAPI } from '../services/api'

const recipients = [
  { id: 'زوجة', name: 'زوجة', icon: '👩' },
  { id: 'زوج', name: 'زوج', icon: '👨' },
  { id: 'أم', name: 'أم', icon: '👩‍🦳' },
  { id: 'أب', name: 'أب', icon: '👨‍🦳' },
  { id: 'أخت', name: 'أخت', icon: '👧' },
  { id: 'أخ', name: 'أخ', icon: '👦' },
  { id: 'صديقة', name: 'صديقة', icon: '👩‍❤️‍👩' },
  { id: 'صديق', name: 'صديق', icon: '👨‍❤️‍👨' },
  { id: 'أطفال', name: 'أطفال', icon: '🧒' },
  { id: 'عروسين', name: 'عروسين', icon: '👰‍♀️🤵‍♂️' },
]

const priceRanges = [
  { id: 'under200', name: 'أقل من 200 ج.م', min: 0, max: 200 },
  { id: '200-500', name: '200 - 500 ج.م', min: 200, max: 500 },
  { id: '500-1000', name: '500 - 1000 ج.م', min: 500, max: 1000 },
  { id: 'over1000', name: 'أكثر من 1000 ج.م', min: 1000, max: '' },
]

const ageGroups = [
  { id: 'child', name: 'طفل (تحت 12)', icon: '👶', keywords: ['ألعاب', 'أطفال', 'مرح', 'لعبة'] },
  { id: 'teen', name: 'مراهق (13-19)', icon: '🎧', keywords: ['شباب', 'موضة', 'ستايل', 'تقنية', 'مرح'] },
  { id: 'young', name: 'شباب (20-35)', icon: '🚀', keywords: ['عصري', 'ساعة', 'عطر', 'عملي', 'أنيق'] },
  { id: 'mature', name: 'ناضج (36-50)', icon: '💼', keywords: ['كلاسيك', 'محفظة', 'فخم', 'راقي', 'ديكور'] },
  { id: 'senior', name: 'كبير المقام (50+)', icon: '👑', keywords: ['تذكار', 'فخم', 'سبحة', 'عناية', 'راقي'] },
]

const personalities = [
  { id: 'romantic', name: 'رومانسي وعاطفي', icon: '💝', keywords: ['ورد', 'رومانسي', 'دبدوب', 'حب', 'قلب'] },
  { id: 'geek', name: 'عملي ومحب للتقنية', icon: '💻', keywords: ['تقنية', 'إلكترونيات', 'ساعة', 'ذكي', 'مكتب'] },
  { id: 'chill', name: 'هادئ ويحب الاسترخاء', icon: '☕', keywords: ['استرخاء', 'قهوة', 'كتاب', 'عناية', 'شمعة'] },
  { id: 'active', name: 'نشيط ومحب للحياة', icon: '🏃‍♂️', keywords: ['رياضة', 'عملي', 'كاجوال', 'مرح', 'طاقة'] },
  { id: 'classic', name: 'كلاسيكي وتقليدي', icon: '🎩', keywords: ['جلد', 'كلاسيك', 'محفظة', 'قلم', 'فخم'] },
]

const sweetsPreference = [
  { id: 'yes', name: 'يعشقها جداً!', icon: '😍', keywords: ['شوكولاتة', 'حلوى', 'كيك', 'نوتيلا', 'بوكس'] },
  { id: 'maybe', name: 'قليلاً كإضافة', icon: '😋', keywords: ['شوكولاتة'] },
  { id: 'no', name: 'لا يفضلها', icon: '🙅‍♂️', keywords: [] },
]

const TOTAL_STEPS = 6

const GiftFinderPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const { data: occasions = [] } = useQuery({
    queryKey: ['occasions'],
    queryFn: () => occasionsAPI.getAll().then(res => res.data.data)
  })

  const [selections, setSelections] = useState({
    occasion: null,
    recipient: null,
    age: null,
    personality: null,
    sweets: null,
    priceRange: null,
  })

  const handleSelect = (key, value) => {
    setSelections(prev => ({ ...prev, [key]: value }))
  }

  const canProceed = () => {
    switch (step) {
      case 1: return selections.occasion
      case 2: return selections.recipient
      case 3: return selections.age
      case 4: return selections.personality
      case 5: return selections.sweets
      case 6: return selections.priceRange
      default: return false
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
    } else {
      // Gather AI Search Keywords
      const keywords = []
      
      const ageObj = ageGroups.find(a => a.id === selections.age)
      if (ageObj) keywords.push(...ageObj.keywords)

      const personObj = personalities.find(p => p.id === selections.personality)
      if (personObj) keywords.push(...personObj.keywords)

      const sweetsObj = sweetsPreference.find(s => s.id === selections.sweets)
      if (sweetsObj) keywords.push(...sweetsObj.keywords)

      // Join keywords for MongoDB text search
      const searchQuery = keywords.join(' ')
      
      const selectedRecipient = recipients.find(r => r.id === selections.recipient)?.name || ''
      const priceObj = priceRanges.find(p => p.id === selections.priceRange)

      const params = new URLSearchParams({
        occasion: selections.occasion || '',
        recipient: selectedRecipient,
        minPrice: priceObj?.min || '',
        maxPrice: priceObj?.max || '',
        search: searchQuery, // This will trigger the smart matching
        page: 1,
      })
      navigate(`/products?${params.toString()}`)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <FiGift className="text-5xl text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">ما هي المناسبة؟</h2>
              <p className="text-gray-500">لنجعل هديتك تليق بالحدث تماماً</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {occasions.map((item) => (
                <button
                  key={item._id}
                  onClick={() => handleSelect('occasion', item.name)}
                  className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 ${
                    selections.occasion === item.name
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-100 shadow-md transform scale-105'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-4xl block mb-3">{item.icon}</span>
                  <span className="font-semibold text-gray-800">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <FiUser className="text-5xl text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">لمن ستهديها؟</h2>
              <p className="text-gray-500">حدد الشخص لتخصيص الخيارات له خصيصاً</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
              {recipients.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect('recipient', item.id)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all duration-300 ${
                    selections.recipient === item.id
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-100 shadow-md transform scale-105'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-3xl block mb-2">{item.icon}</span>
                  <span className="font-medium text-sm text-gray-800">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <FiStar className="text-5xl text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">كم يبلغ من العمر تقريباً؟</h2>
              <p className="text-gray-500">العمر يلعب دوراً كبيراً في اختيار الهدية المثالية</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
              {ageGroups.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect('age', item.id)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all duration-300 ${
                    selections.age === item.id
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-100 shadow-md transform scale-105'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-3xl block mb-2">{item.icon}</span>
                  <span className="font-medium text-sm text-gray-800">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <FiSmile className="text-5xl text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">كيف تصف شخصيته؟</h2>
              <p className="text-gray-500">الذكاء الاصطناعي سيقوم بمطابقة الهدايا مع طبيعة هذا الشخص</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {personalities.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect('personality', item.id)}
                  className={`p-5 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col items-center justify-center ${
                    selections.personality === item.id
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-100 shadow-md transform scale-105'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-4xl block mb-3">{item.icon}</span>
                  <span className="font-semibold text-gray-800">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <FiHeart className="text-5xl text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">هل يحب الشوكولاتة والحلويات؟</h2>
              <p className="text-gray-500">لنعرف إن كان البوكس سيحتاج للمزيد من السعادة المسكرة</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {sweetsPreference.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect('sweets', item.id)}
                  className={`p-5 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col items-center justify-center ${
                    selections.sweets === item.id
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-100 shadow-md transform scale-105'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-4xl block mb-3">{item.icon}</span>
                  <span className="font-semibold text-gray-800">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 6:
        return (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <FiDollarSign className="text-5xl text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">ما هي ميزانيتك للهدية؟</h2>
              <p className="text-gray-500">سنرشح لك الأفضل دائماً ضمن نطاقك المفضل</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
              {priceRanges.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect('priceRange', item.id)}
                  className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 ${
                    selections.priceRange === item.id
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-100 shadow-md transform scale-105'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-bold text-lg text-gray-800">{item.name}</span>
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
            مساعد الهدايا الذكي (AI)
          </div>
          <p className="text-gray-600 max-w-xl mx-auto">
            أجب عن الأسئلة البسيطة التالية وسنقوم بتحليل شخصية واهتمامات المهدى إليه لتقديم ترشيحات دقيقة ومذهلة خصيصاً له.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-purple-600">الخطوة {step} من {TOTAL_STEPS}</span>
            <span className="text-sm text-gray-500">{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content Box */}
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

          <div className="relative z-10">
            {renderStep()}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100 relative z-10">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-gray-500 hover:text-purple-600 font-medium transition-colors"
              >
                <FiArrowRight />
                الرجوع
              </button>
            ) : (
              <Link to="/" className="text-gray-400 hover:text-red-500 font-medium transition-colors">
                إلغاء الخروج
              </Link>
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`btn-primary px-8 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-purple-500/30 transition-all ${
                !canProceed() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:-translate-y-1'
              }`}
            >
              {step === TOTAL_STEPS ? 'حلل الشخصية واعثر على الهدية' : 'التالي'}
              <FiArrowLeft />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GiftFinderPage
