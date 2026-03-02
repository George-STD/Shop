import ContactPageClient from './ContactPageClient'

export const metadata = {
  title: 'تواصل معنا',
  description: 'تواصل مع فريق فور يو لأي استفسارات أو مساعدة. نحن هنا لمساعدتك في اختيار الهدية المثالية.',
  alternates: {
    canonical: 'https://foryo.me/contact',
  },
}

export default function Page() {
  return <ContactPageClient />
}
