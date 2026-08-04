import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiGift,
  FiUser,
  FiHeart,
  FiSmile,
  FiCheckCircle,
  FiRefreshCw,
  FiShoppingCart,
  FiArrowRight,
  FiArrowLeft,
  FiZap,
  FiHelpCircle,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { giftFinderAPI } from '../services/api';
import { useCartStore } from '../store';
import toast from 'react-hot-toast';

const RECIPIENTS_LIST = [
  { id: 'أم', name: 'أم', icon: '👩‍👧' },
  { id: 'أب', name: 'أب', icon: '👨‍👦' },
  { id: 'زوجة', name: 'زوجة / خطيبة', icon: '💍' },
  { id: 'زوج', name: 'زوج / خطيب', icon: '👔' },
  { id: 'صديقة', name: 'صديقة', icon: '👭' },
  { id: 'صديق', name: 'صديق', icon: '👬' },
  { id: 'أخت', name: 'أخت', icon: '🎀' },
  { id: 'أخ', name: 'أخ', icon: '🧢' },
  { id: 'عروسين', name: 'عروسين', icon: '💒' },
  { id: 'أطفال', name: 'أطفال', icon: '🧸' },
];

const OCCASIONS_LIST = [
  { id: 'عيد ميلاد', name: 'عيد ميلاد', icon: '🎂' },
  { id: 'ذكرى زواج', name: 'ذكرى زواج', icon: '💑' },
  { id: 'زفاف', name: 'زفاف / خطوبة', icon: '💍' },
  { id: 'تخرج', name: 'تخرج / نجاح', icon: '🎓' },
  { id: 'عيد الحب', name: 'عيد الحب / الفالانتاين', icon: '❤️' },
  { id: 'مولود جديد', name: 'مولود جديد', icon: '👶' },
  { id: 'شكر وتقدير', name: 'شكر وتقدير', icon: '💐' },
  { id: 'بدون مناسبة', name: 'مفاجأة بدون مناسبة', icon: '✨' },
];

const PERSONALITY_TAGS = [
  { id: 'عاشق القهوة', label: '☕ عاشق للقهوة والروتين الصباحي' },
  { id: 'رومانسي', label: '🌸 رومانسي وعاطفي' },
  { id: 'هدوء واسترخاء', label: '🧘 محب للهدوء والاسترخاء' },
  { id: 'فخامة وأناقة', label: '👑 عاشق للفخامة والأناقة' },
  { id: 'قراءة وكتب', label: '📚 محب للكتب والهدوء' },
  { id: 'عناية بالبشرة', label: '💆 مهتم بالعناية الشخصية والبشرة' },
  { id: 'عاشق الشوكولاتة', label: '🍫 محب للشوكولاتة والحلويات' },
  { id: 'عصري وتقني', label: '💻 عصري وعاشق للتكنولوجيا' },
];

const MOOD_OPTIONS = [
  { id: 'فخامة ودلال', title: '✨ فخامة ودلال استثنائي', desc: 'هدية راقية تعكس التقدير العالي' },
  { id: 'حب ودفء', title: '❤️ حب ودفء عميق', desc: 'لمسة عاطفية صادقة تلامس القلب' },
  { id: 'بهجة ومفاجأة', title: '🎉 فرحة ومفاجأة مبهجة', desc: 'طاقة إيجابية وألوان تشيع البهجة' },
  { id: 'راحة واسترخاء', title: '🕊️ راحة واسترخاء وسلام', desc: 'لحظات من الدلال والعناية الذاتية' },
];

const BUDGET_RANGES = [
  { id: 'under-500', label: 'أقل من 500 ج.م' },
  { id: '500-1000', label: '500 - 1,000 ج.م' },
  { id: '1000-2000', label: '1,000 - 2,000 ج.م' },
  { id: 'above-2000', label: 'أكثر من 2,000 ج.م' },
  { id: 'open', label: 'ميزانية مفتوحة ✨' },
];

const TOTAL_STEPS = 4;

const GiftFinderPage = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const { addItem } = useCartStore();

  const [answers, setAnswers] = useState({
    recipient: '',
    occasion: '',
    personalities: [],
    customPersonality: '',
    mood: '',
    budgetRange: '',
    customNotes: '',
  });

  const [aiResult, setAiResult] = useState(null);

  const handleTogglePersonality = (tagLabel) => {
    setAnswers((prev) => {
      const exists = prev.personalities.includes(tagLabel);
      if (exists) {
        return { ...prev, personalities: prev.personalities.filter((p) => p !== tagLabel) };
      } else {
        return { ...prev, personalities: [...prev.personalities, tagLabel] };
      }
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!answers.recipient && !!answers.occasion;
      case 2:
        return answers.personalities.length > 0 || answers.customPersonality.trim().length > 0;
      case 3:
        return !!answers.mood;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      submitToAi();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const submitToAi = async () => {
    setIsLoading(true);
    setLoadingTextIndex(0);

    const loadingInterval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % 3);
    }, 2500);

    try {
      const payload = {
        recipient: answers.recipient,
        occasion: answers.occasion,
        personality: [
          ...answers.personalities,
          answers.customPersonality ? `تفاصيل إضافية: ${answers.customPersonality}` : '',
        ]
          .filter(Boolean)
          .join(', '),
        interests: answers.personalities.join(', '),
        mood: answers.mood,
        budgetRange: answers.budgetRange,
        customNotes: answers.customNotes,
      };

      const res = await giftFinderAPI.getAiRecommendations(payload);
      if (res.data?.success && res.data?.data) {
        setAiResult(res.data.data);
        toast.success('تم تحليل الشخصية واختيار أفضل 5 بوكسات جاهزة بنجاح! ✨');
      } else {
        toast.error('حدث خطأ في جلب التوصيات، حاول مرة أخرى.');
      }
    } catch (error) {
      console.error('AI Recommendation Error:', error);
      toast.error(error.response?.data?.message || 'تعذر الاتصال بالذكاء الاصطناعي، يرجى المحاولة لاحقاً.');
    } finally {
      clearInterval(loadingInterval);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setAiResult(null);
    setAnswers({
      recipient: '',
      occasion: '',
      personalities: [],
      customPersonality: '',
      mood: '',
      budgetRange: '',
      customNotes: '',
    });
  };

  const handleAddToCart = (product) => {
    addItem(product, 1);
    toast.success(`تمت إضافة "${product.name}" إلى سلة التسوق! 🛒`);
  };

  const loadingMessages = [
    'جاري تحليل نمط وشخصية المستلم واهتماماته بواسطة الذكاء الاصطناعي...',
    'جاري فحص ومطابقة البوكسات الجاهزة المتوفرة بالمتجر انتخاب الأنسب...',
    'جاري تقييم نسب التوافق وصياغة أسباب الاختيار للبوكسات الخمسة المثالية...',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-white to-pink-50/30 py-12 px-4 sm:px-6 lg:px-8 dir-rtl">
      <div className="max-w-4xl mx-auto">
        {/* Top AI Badge & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-medium shadow-lg shadow-purple-500/20 mb-4 animate-pulse">
            <HiSparkles className="text-amber-300" size={18} />
            <span>مساعد الهدايا الذكي (Gemini AI)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            اعثر على الهدية المثالية عبر <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">تحليل الذكاء الاصطناعي</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            أجب عن الأسئلة التالية، وسيقوم الذكاء الاصطناعي بتحليل شخصية واهتمامات مستلم الهدية واختيار <strong className="text-purple-700">أفضل 5 بوكسات هدايا جاهزة</strong> تناسبه تماماً.
          </p>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-purple-100 text-center animate-fade-in my-8">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-pink-200 border-b-pink-500 animate-spin-slow"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <HiSparkles className="text-purple-600 text-3xl animate-bounce" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-3">جاري تحليل الذكاء الاصطناعي...</h3>
            <p className="text-purple-600 font-medium text-base h-12 transition-all duration-500">
              {loadingMessages[loadingTextIndex]}
            </p>

            <div className="w-full bg-gray-100 h-2.5 rounded-full mt-6 overflow-hidden max-w-md mx-auto">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-full animate-pulse rounded-full"></div>
            </div>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {!isLoading && aiResult && (
          <div className="space-y-8 animate-fade-in">
            {/* AI Personality Profile Summary Banner */}
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-purple-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-gradient-to-tr from-amber-400 to-pink-500 rounded-2xl shadow-lg shrink-0">
                  <HiSparkles className="text-white text-2xl" />
                </div>
                <div>
                  <div className="inline-block bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-amber-300 mb-2 border border-white/10">
                    👑 النمط الشخصي: {aiResult.recipientArchetype || 'شخصية فريدة وراقية'}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">تحليل الشخصية والنمط الإهدائي</h2>
                  <p className="text-purple-100 text-sm sm:text-base leading-relaxed">
                    {aiResult.personalitySummary}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended 5 Ready Gift Boxes */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FiGift className="text-pink-600" />
                    <span>أفضل 5 بوكسات هدايا جاهزة اخترناها لك</span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">تمت مطابقتها خصيصاً بناءً على تحليل الذكاء الاصطناعي</p>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-all"
                >
                  <FiRefreshCw size={16} />
                  <span>إعادة التحليل</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiResult.recommendedBoxes?.map((item, index) => {
                  const box = item.product;
                  const isTopMatch = index === 0;

                  return (
                    <div
                      key={box._id || index}
                      className={`bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border flex flex-col ${
                        isTopMatch
                          ? 'md:col-span-2 border-2 border-purple-500 ring-4 ring-purple-500/10'
                          : 'border-gray-100 hover:border-pink-200'
                      }`}
                    >
                      {/* Top Match Tag */}
                      {isTopMatch && (
                        <div className="bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <HiSparkles />
                            <span>الخيار الأكثر ملاءمة وشعبية ✨</span>
                          </span>
                          <span>توافق {item.matchScore}%</span>
                        </div>
                      )}

                      <div className={`p-6 flex-1 flex flex-col ${isTopMatch ? 'md:flex-row md:items-center md:gap-8' : ''}`}>
                        {/* Image & Match Score */}
                        <div className={`relative shrink-0 mb-4 ${isTopMatch ? 'md:mb-0 md:w-64' : 'w-full h-52'} overflow-hidden rounded-2xl bg-gray-50`}>
                          <img
                            src={box.images?.[0]?.url || '/placeholder-box.png'}
                            alt={box.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {!isTopMatch && (
                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-purple-700 shadow-md border border-purple-100 flex items-center gap-1">
                              <FiZap className="text-amber-500" />
                              <span>توافق {item.matchScore}%</span>
                            </div>
                          )}
                        </div>

                        {/* Box Info & AI Reasoning */}
                        <div className="flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="text-xl font-bold text-gray-900">{box.name}</h4>
                              <div className="text-lg font-extrabold text-purple-700 whitespace-nowrap">
                                {box.salePrice || box.price} ج.م
                              </div>
                            </div>

                            {/* Included products / Short desc */}
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                              {box.shortDescription || box.description?.substring(0, 120)}
                            </p>

                            {/* AI Match Reason Box */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3.5 rounded-2xl border border-purple-100/60 text-xs sm:text-sm text-purple-900 leading-relaxed">
                              <span className="font-bold block text-purple-700 mb-1 flex items-center gap-1">
                                <HiSparkles className="text-amber-500" />
                                <span>لماذا اختار الذكاء الاصطناعي هذا البوكس؟</span>
                              </span>
                              {item.matchReason}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              onClick={() => handleAddToCart(box)}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                            >
                              <FiShoppingCart size={18} />
                              <span>إضافة للسلة</span>
                            </button>

                            <Link
                              to={`/product/${box.slug}`}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-2xl transition-all text-sm text-center"
                            >
                              عرض التفاصيل
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Reset Callout */}
              <div className="text-center pt-8">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 bg-white border-2 border-purple-600 text-purple-700 hover:bg-purple-50 font-bold px-8 py-3.5 rounded-2xl shadow-sm transition-all"
                >
                  <FiRefreshCw />
                  <span>تحليل شخصية جديدة أو تجربة أسئلة أخرى</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WIZARD QUESTIONNAIRE FORM */}
        {!isLoading && !aiResult && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 relative">
            {/* Step Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
                <span>الخطوة {step} من {TOTAL_STEPS}</span>
                <span>{Math.round((step / TOTAL_STEPS) * 100)}% أكملت</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* STEP 1: Recipient & Occasion */}
            {step === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-2xl mx-auto mb-3">
                      <FiUser />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">لمن تريد تقديم هذه الهدية؟</h2>
                    <p className="text-sm text-gray-500">اختر صلة القرابة أو المستلم الأقرب</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {RECIPIENTS_LIST.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, recipient: item.id }))}
                        className={`p-4 rounded-2xl border-2 text-center transition-all duration-300 ${
                          answers.recipient === item.id
                            ? 'border-purple-600 bg-purple-50/70 shadow-md text-purple-900 font-bold scale-[1.02]'
                            : 'border-gray-100 hover:border-purple-200 text-gray-700 bg-gray-50/50'
                        }`}
                      >
                        <span className="text-3xl block mb-2">{item.icon}</span>
                        <span className="text-sm font-semibold">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 text-2xl mx-auto mb-3">
                      <FiGift />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">ما هي المناسبة الجميلة؟</h2>
                    <p className="text-sm text-gray-500">اختر نوع المناسبة ليختار الذكاء الاصطناعي ما يناسبها</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {OCCASIONS_LIST.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, occasion: item.id }))}
                        className={`p-4 rounded-2xl border-2 text-center transition-all duration-300 ${
                          answers.occasion === item.id
                            ? 'border-pink-500 bg-pink-50/70 shadow-md text-pink-900 font-bold scale-[1.02]'
                            : 'border-gray-100 hover:border-pink-200 text-gray-700 bg-gray-50/50'
                        }`}
                      >
                        <span className="text-3xl block mb-2">{item.icon}</span>
                        <span className="text-sm font-semibold">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Personality & Vibe */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-2xl mx-auto mb-3">
                    <FiSmile />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">ما هي صفات واهتمامات هذا الشخص؟</h2>
                  <p className="text-sm text-gray-500">اختر خياراً أو أكثر، أو اكتب وصفك الخاص ليحلله الذكاء الاصطناعي</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PERSONALITY_TAGS.map((tag) => {
                    const isSelected = answers.personalities.includes(tag.label);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTogglePersonality(tag.label)}
                        className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-sm'
                            : 'border-gray-100 hover:border-purple-200 text-gray-700 bg-gray-50/50'
                        }`}
                      >
                        <span className="text-sm">{tag.label}</span>
                        {isSelected && <FiCheckCircle className="text-purple-600 text-lg shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    صف شخصيته أو اهتماماته بطريقتك الخاصة (اختياري):
                  </label>
                  <textarea
                    rows={3}
                    value={answers.customPersonality}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, customPersonality: e.target.value }))}
                    placeholder="مثال: بتحب العطور الفواحة، والأشياء الأنيقة الرقيقة، وتهتم بالتفاصيل والتغليف الفاخر..."
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm text-gray-800"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Mood & Feeling */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 text-2xl mx-auto mb-3">
                    <FiHeart />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">ما الشعور أو الانطباع المطلوب من الهدية؟</h2>
                  <p className="text-sm text-gray-500">اختر الطابع الذي تريد أن يتركه البوكس في قلبه</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MOOD_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, mood: item.title }))}
                      className={`p-5 rounded-2xl border-2 text-right transition-all ${
                        answers.mood === item.title
                          ? 'border-pink-500 bg-pink-50/70 shadow-md'
                          : 'border-gray-100 hover:border-pink-200 bg-gray-50/50'
                      }`}
                    >
                      <h4 className="font-bold text-gray-900 text-base mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Budget & Custom Notes */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-2xl mx-auto mb-3">
                    <FiZap />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">الميزانية وملاحظات ختامية</h2>
                  <p className="text-sm text-gray-500">اختر الميزانية المناسبة وأضف أي تفاصيل خاصة تود أن يأخذها الذكاء الاصطناعي بالحسبان</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">نطاق الميزانية المفضل:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {BUDGET_RANGES.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, budgetRange: b.label }))}
                        className={`p-3.5 rounded-xl border-2 text-center text-sm font-semibold transition-all ${
                          answers.budgetRange === b.label
                            ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm'
                            : 'border-gray-100 hover:border-purple-200 text-gray-700 bg-gray-50/50'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ملاحظات إضافية للذكاء الاصطناعي (اختياري):
                  </label>
                  <textarea
                    rows={3}
                    value={answers.customNotes}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, customNotes: e.target.value }))}
                    placeholder="مثال: يفضل أن يحتوي البوكس على شمعة معطرة ومج حراري، ويتجنب الألوان الغامقة..."
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm text-gray-800"
                  />
                </div>
              </div>
            )}

            {/* NAVIGATION BUTTONS */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-100 mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm"
                >
                  <FiArrowRight />
                  <span>السابق</span>
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="button"
                disabled={!canProceed()}
                onClick={handleNext}
                className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all text-sm ${
                  canProceed()
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/25 hover:scale-[1.02]'
                    : 'bg-gray-300 cursor-not-allowed shadow-none'
                }`}
              >
                <span>{step === TOTAL_STEPS ? 'تحليل الشخصية واختيار البوكسات ✨' : 'التالي'}</span>
                <FiArrowLeft />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftFinderPage;
