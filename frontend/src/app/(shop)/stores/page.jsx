import StoresPageClient from './StoresPageClient'

export const metadata = {
  title: 'متجرنا أونلاين',
  description: 'فور يو (For You) متجر هدايا أونلاين في مصر. نوصّل لكل المحافظات — تسوق من بيتك واستلم هديتك لحد الباب.',
  alternates: { canonical: 'https://foryo.me/stores' },
  openGraph: {
    title: 'متجرنا أونلاين | For You - فور يو',
    description: 'فور يو متجر هدايا أونلاين في مصر. نوصّل لكل المحافظات.',
    url: 'https://foryo.me/stores',
  },
}

export default function Page() {
  return <StoresPageClient />
}
