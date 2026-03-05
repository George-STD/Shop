import TermsPageClient from './TermsPageClient'

export const metadata = {
  title: 'الشروط والأحكام',
  description: 'الشروط والأحكام الخاصة باستخدام متجر فور يو (For You) للهدايا. تعرف على حقوقك والتزاماتك.',
  alternates: { canonical: 'https://foryo.me/terms' },
}

export default function Page() {
  return <TermsPageClient />
}
