import PrivacyPageClient from './PrivacyPageClient'

export const metadata = {
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية وحماية البيانات في متجر فور يو للهدايا.',
  alternates: {
    canonical: 'https://foryo.me/privacy',
  },
}

export default function Page() {
  return <PrivacyPageClient />
}
