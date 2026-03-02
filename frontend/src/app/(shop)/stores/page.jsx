import StoresPageClient from './StoresPageClient'

export const metadata = {
  title: 'فروعنا',
  description: 'اكتشف فروع فور يو للهدايا في مصر. زورنا في أقرب فرع.',
  alternates: {
    canonical: 'https://foryo.me/stores',
  },
}

export default function Page() {
  return <StoresPageClient />
}
