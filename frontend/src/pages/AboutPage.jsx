import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { FiGift, FiHeart, FiTruck, FiAward, FiUsers, FiStar } from 'react-icons/fi'

const AboutPage = () => {
  const stats = [
    { number: '+50,000', label: 'عميل سعيد' },
    { number: '+10,000', label: 'هدية تم توصيلها' },
    { number: '+500', label: 'منتج فريد' },
    { number: '5', label: 'سنوات خبرة' },
  ]

  const values = [
    {
      icon: FiGift,
      title: 'هدايا استثنائية',
      description: 'نختار بعناية كل منتج لضمان جودته وتميزه'
    },
    {
      icon: FiHeart,
      title: 'شغف بالتفاصيل',
      description: 'نهتم بأدق التفاصيل لنضمن تجربة لا تُنسى'
    },
    {
      icon: FiTruck,
      title: 'توصيل موثوق',
      description: 'نصل إليك في الوقت المحدد مع عناية فائقة بالتغليف'
    },
    {
      icon: FiAward,
      title: 'جودة مضمونة',
      description: 'نعمل مع أفضل العلامات التجارية المحلية والعالمية'
    },
  ]

  const team = [
    { name: 'سارة أحمد', role: 'المؤسس والرئيس التنفيذي', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300' },
    { name: 'محمد علي', role: 'مدير العمليات', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' },
    { name: 'نورة السعيد', role: 'مديرة التسويق', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300' },
    { name: 'خالد العمري', role: 'مدير خدمة العملاء', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300' },
  ]

  return (
    <>
      <Helmet>
        <title>من نحن | For You - قصتنا ورؤيتنا</title>
        <meta name="description" content="تعرف على قصة هدايا، متجر الهدايا الأول في مصر. نؤمن بأن كل هدية تحمل رسالة حب وتقدير." />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero */}
        <div className="relative bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 text-[200px]">🎁</div>
            <div className="absolute bottom-10 left-10 text-[150px]">💝</div>
          </div>
          <div className="container-custom relative">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">نحوّل اللحظات إلى ذكريات</h1>
              <p className="text-xl opacity-90 leading-relaxed">
                في هدايا، نؤمن بأن كل هدية تحمل رسالة حب وتقدير. نسعى لنكون الوجهة الأولى 
                لكل من يبحث عن هدية مميزة تعبر عن مشاعره.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="container-custom -mt-10 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{stat.number}</div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Our Story */}
        <div className="container-custom py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-medium">قصتنا</span>
              <h2 className="text-3xl font-bold mt-2 mb-6">رحلة بدأت بفكرة بسيطة</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  بدأت قصتنا في عام 2019 عندما لاحظنا صعوبة إيجاد هدايا مميزة وفريدة في السوق المصري. 
                  كان الحل التقليدي هو السفر أو البحث لساعات طويلة للعثور على الهدية المثالية.
                </p>
                <p>
                  من هنا جاءت فكرة "هدايا" - منصة تجمع أفضل المنتجات المختارة بعناية من أجود العلامات 
                  التجارية المحلية والعالمية، مع خدمة تغليف هدايا احترافية وتوصيل موثوق.
                </p>
                <p>
                  اليوم، نفخر بخدمة آلاف العملاء في جميع أنحاء مصر، ونواصل التطور لنقدم لكم 
                  تجربة تسوق هدايا لا مثيل لها.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400" 
                alt="هدايا مغلفة"
                className="rounded-2xl shadow-lg"
              />
              <img 
                src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400" 
                alt="باقة هدايا"
                className="rounded-2xl shadow-lg mt-8"
              />
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="bg-gray-50 py-20">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-medium">قيمنا</span>
              <h2 className="text-3xl font-bold mt-2 mb-4">ما يميزنا</h2>
              <p className="text-gray-600">نلتزم بمعايير عالية في كل ما نقدمه</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <value.icon className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="container-custom py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-medium">فريقنا</span>
            <h2 className="text-3xl font-bold mt-2 mb-4">نخبة من المتميزين</h2>
            <p className="text-gray-600">فريق شغوف يعمل لتقديم أفضل تجربة لكم</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, idx) => (
              <div key={idx} className="text-center group">
                <div className="relative mb-4 overflow-hidden rounded-2xl">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold text-lg">{member.name}</h3>
                <p className="text-gray-500">{member.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white py-16">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold mb-4">هل أنت مستعد لإسعاد أحبائك؟</h2>
            <p className="text-xl opacity-90 mb-8">اكتشف مجموعتنا الواسعة من الهدايا المميزة</p>
            <Link to="/products" className="btn-secondary inline-block">
              تصفح المنتجات
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default AboutPage
