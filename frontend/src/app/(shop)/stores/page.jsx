import StoresPageClient from './StoresPageClient'

export const metadata = {
  title: 'فروعنا',
  description: 'اكتشف فروع فور يو (For You) للهدايا في مصر. زورنا في أقرب فرع واستمتع بتجربة تسوق فريدة.',
  alternates: { canonical: 'https://foryo.me/stores' },
  openGraph: {
    title: 'فروعنا | For You - فور يو',
    description: 'اكتشف فروع فور يو للهدايا في مصر.',
    url: 'https://foryo.me/stores',
  },
}

export default function Page() {
  return <StoresPageClient />
}
