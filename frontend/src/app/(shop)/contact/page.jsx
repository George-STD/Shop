import ContactPageClient from './ContactPageClient'

export const metadata = {
  title: 'تواصل معنا',
  description: 'تواصل مع فريق فور يو (For You) لأي استفسارات. نحن هنا لمساعدتك في اختيار الهدية المثالية. اتصل بنا أو راسلنا عبر الواتساب.',
  alternates: { canonical: 'https://foryo.me/contact' },
  openGraph: {
    title: 'تواصل معنا | For You - فور يو',
    description: 'تواصل مع فريق فور يو - متجر الهدايا.',
    url: 'https://foryo.me/contact',
  },
}

export default function Page() {
  return <ContactPageClient />
}
