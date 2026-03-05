import { useState } from 'react'
import { FiPhone, FiMail, FiMapPin, FiClock, FiSend, FiMessageCircle } from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa'
import toast from 'react-hot-toast'

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً')
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    setLoading(false)
  }

  const contactInfo = [
    { icon: FiPhone, title: 'اتصل بنا', value: '+20 12 86153004', link: 'tel:+201286153004' },
    { icon: FaWhatsapp, title: 'واتساب', value: '+20 12 86153004', link: 'https://wa.me/201286153004' },
    { icon: FiMail, title: 'البريد الإلكتروني', value: 'dev.george.osama@gmail.com', link: 'mailto:dev.george.osama@gmail.com' },
    { icon: FiClock, title: 'ساعات العمل', value: 'متاحين على مدار الساعة', link: null },
  ]

  const socialLinks = [
    { icon: FaInstagram, name: 'Instagram', link: 'https://www.instagram.com/foryou._.21' },
    { icon: FaFacebookF, name: 'Facebook', link: 'https://www.facebook.com/share/1BzYfakvLp/?mibextid=wwXIfr' },
    { icon: FaYoutube, name: 'YouTube', link: 'https://www.youtube.com/@foryou-l1k' },
  ]

  return (
    <>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
          <div className="container-custom text-center">
            <h1 className="text-4xl font-bold mb-4">تواصل معنا</h1>
            <p className="text-xl opacity-90">نحن هنا لمساعدتك في كل ما تحتاجه</p>
          </div>
        </div>

        <div className="container-custom py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Cards */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-6">معلومات التواصل</h2>
                <div className="space-y-4">
                  {contactInfo.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.link || '#'}
                      className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                        item.link ? 'hover:bg-gray-50' : ''
                      }`}
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <item.icon className="text-xl text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{item.title}</h3>
                        <p className="text-gray-600">{item.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">تابعنا</h2>
                <div className="flex gap-3">
                  {socialLinks.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.link}
                      className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-100 hover:to-pink-100 hover:text-transparent transition-colors"
                    >
                      <item.icon className="text-xl" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Store Location */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">موقعنا</h2>
                <div className="flex items-start gap-3 mb-4">
                  <FiMapPin className="text-purple-600 text-xl flex-shrink-0 mt-1" />
                  <p className="text-gray-600">
                    القاهرة، المقطم<br />
                    شارع 9
                  </p>
                </div>
                <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3455.123!2d31.3!3d30.01!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDAwJzM2LjAiTiAzMcKwMTgnMDAuMCJF!5e0!3m2!1sar!2seg"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <FiMessageCircle className="text-3xl text-purple-600" />
                  <div>
                    <h2 className="text-2xl font-bold">أرسل لنا رسالة</h2>
                    <p className="text-gray-500">سنرد عليك في أقرب وقت ممكن</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">الاسم الكامل *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="input-field"
                        placeholder="أدخل اسمك"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">البريد الإلكتروني *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="input-field"
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">رقم الهاتف</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="input-field"
                        placeholder="+20 1X XXXX XXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">الموضوع *</label>
                      <select
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="input-field"
                      >
                        <option value="">اختر الموضوع</option>
                        <option value="inquiry">استفسار عام</option>
                        <option value="order">استفسار عن طلب</option>
                        <option value="complaint">شكوى</option>
                        <option value="suggestion">اقتراح</option>
                        <option value="corporate">طلبات الشركات</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">رسالتك *</label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="input-field resize-none"
                      placeholder="اكتب رسالتك هنا..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto md:px-12"
                  >
                    {loading ? (
                      'جاري الإرسال...'
                    ) : (
                      <>
                        <FiSend />
                        إرسال الرسالة
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* FAQ Hint */}
              <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">❓</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">هل لديك سؤال شائع؟</h3>
                  <p className="text-gray-600">
                    تحقق من <a href="/faq" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline">الأسئلة الشائعة</a> للحصول على إجابات سريعة
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ContactPage
