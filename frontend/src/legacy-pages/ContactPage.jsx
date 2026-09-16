import { useState } from 'react';
import { FiMail, FiMapPin, FiClock, FiSend, FiMessageCircle, FiCheckCircle } from 'react-icons/fi';
import { FaInstagram, FaFacebookF, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import { STRINGS } from '../constants';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success(STRINGS.CONTACT_PAGE.SUCCESS_MESSAGE || 'تم إرسال رسالتك بنجاح!');
    setSubmitted(true);
    setLoading(false);
  };

  const contactInfo = [
    {
      icon: FiMail,
      title: STRINGS.CONTACT_PAGE.EMAIL_LABEL,
      value: 'support@foryo.me',
      link: 'mailto:support@foryo.me',
    },
    { icon: FiClock, title: STRINGS.CONTACT_PAGE.WORKING_HOURS, value: STRINGS.CONTACT_PAGE.ALWAYS_AVAILABLE, link: null },
  ];

  const socialLinks = [
    { icon: FaInstagram, name: 'Instagram', link: 'https://www.instagram.com/foryou._.21' },
    {
      icon: FaFacebookF,
      name: 'Facebook',
      link: 'https://www.facebook.com/share/1BzYfakvLp/?mibextid=wwXIfr',
    },
    { icon: FaYoutube, name: 'YouTube', link: 'https://www.youtube.com/@foryou-l1k' },
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white py-16">
          <div className="container-custom text-center">
            <h1 className="text-4xl font-bold mb-4">{STRINGS.CONTACT_PAGE.HERO_TITLE}</h1>
            <p className="text-xl opacity-90">{STRINGS.CONTACT_PAGE.HERO_SUBTITLE}</p>
          </div>
        </div>

        <div className="container-custom py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Cards */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-6">{STRINGS.CONTACT_PAGE.CONTACT_INFO}</h2>
                <div className="space-y-4">
                  {contactInfo.map((item, idx) => {
                    const cardBody = (
                      <>
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <item.icon className="text-xl text-purple-600" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">{item.title}</h3>
                          <p className="text-gray-600">{item.value}</p>
                        </div>
                      </>
                    );

                    return item.link ? (
                      <a
                        key={idx}
                        href={item.link}
                        className="flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-purple-500 outline-none"
                      >
                        {cardBody}
                      </a>
                    ) : (
                      <div
                        key={idx}
                        className="flex items-start gap-4 p-4 rounded-xl"
                      >
                        {cardBody}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">{STRINGS.CONTACT_PAGE.FOLLOW_US}</h2>
                <div className="flex gap-3">
                  {socialLinks.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`تابعنا على ${item.name}`}
                      className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500 outline-none"
                    >
                      <item.icon className="text-xl" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Store Location */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">{STRINGS.CONTACT_PAGE.OUR_LOCATION}</h2>
                <div className="flex items-start gap-3 mb-4">
                  <FiMapPin className="text-purple-600 text-xl flex-shrink-0 mt-1" />
                  <p className="text-gray-600">
                    {STRINGS.CONTACT_PAGE.ADDRESS_LINE1}
                    <br />
                    {STRINGS.CONTACT_PAGE.ADDRESS_LINE2}
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
                  </div>
                </div>

                {submitted ? (
                  <div className="text-center py-10 px-6 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg shadow-purple-500/20">
                      <FiCheckCircle />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">تم استلام رسالتك بنجاح!</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت عبر بريدك الإلكتروني.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <a
                        href="https://wa.me/201286153004"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 text-sm"
                      >
                        <FaWhatsapp className="text-lg" />
                        <span>محادثة فورية عبر واتساب</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({ name: '', email: '', subject: '', message: '' });
                        }}
                        className="inline-flex items-center gap-2 bg-white text-purple-700 border border-purple-200 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all text-sm"
                      >
                        <span>إرسال رسالة أخرى</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="contact-full-name" className="block text-gray-700 font-medium mb-2">
                          {STRINGS.CONTACT_PAGE.FULL_NAME}
                        </label>
                        <input
                          id="contact-full-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="input-field"
                          placeholder={STRINGS.CONTACT_PAGE.ENTER_NAME}
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="block text-gray-700 font-medium mb-2">
                          {STRINGS.CONTACT_PAGE.EMAIL_REQUIRED}
                        </label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="input-field"
                          placeholder="example@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className="block text-gray-700 font-medium mb-2">
                        {STRINGS.CONTACT_PAGE.SUBJECT}
                      </label>
                      <select
                        id="contact-subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="input-field"
                      >
                        <option value="">{STRINGS.CONTACT_PAGE.SELECT_SUBJECT}</option>
                        <option value="inquiry">{STRINGS.CONTACT_PAGE.SUBJECTS.GENERAL_INQUIRY}</option>
                        <option value="order">{STRINGS.CONTACT_PAGE.SUBJECTS.ORDER_INQUIRY}</option>
                        <option value="complaint">{STRINGS.CONTACT_PAGE.SUBJECTS.COMPLAINT}</option>
                        <option value="suggestion">{STRINGS.CONTACT_PAGE.SUBJECTS.SUGGESTION}</option>
                        <option value="corporate">{STRINGS.CONTACT_PAGE.SUBJECTS.CORPORATE_REQUESTS}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="contact-message" className="block text-gray-700 font-medium mb-2">
                        {STRINGS.CONTACT_PAGE.YOUR_MESSAGE}
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="input-field resize-none"
                        placeholder={STRINGS.CONTACT_PAGE.WRITE_MESSAGE_HERE}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto md:px-12"
                    >
                      {loading ? (
                        STRINGS.CONTACT_PAGE.SENDING
                      ) : (
                        <>
                          <FiSend />
                          {STRINGS.CONTACT_PAGE.SEND_BUTTON}
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* FAQ Hint */}
              <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">❓</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{STRINGS.CONTACT_PAGE.HAVE_QUESTION}</h3>
                  <p className="text-gray-600">
                    {STRINGS.CONTACT_PAGE.CHECK_FAQ_1}{' '}
                    <a
                      href="/faq"
                      className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:underline"
                    >
                      {STRINGS.CONTACT_PAGE.CHECK_FAQ_2}
                    </a>{' '}
                    {STRINGS.CONTACT_PAGE.CHECK_FAQ_3}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
