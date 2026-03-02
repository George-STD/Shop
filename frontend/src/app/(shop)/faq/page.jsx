import FAQPageClient from './FAQPageClient'

export const metadata = {
  title: 'الأسئلة الشائعة',
  description: 'إجابات على الأسئلة الشائعة حول الطلبات والشحن والدفع والإرجاع في فور يو - متجر الهدايا.',
  alternates: {
    canonical: 'https://foryo.me/faq',
  },
}

export default function Page() {
  return <FAQPageClient />
}
