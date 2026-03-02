import WishlistPageClient from './WishlistPageClient'

export const metadata = {
  title: 'قائمة الأمنيات',
  description: 'قائمة الهدايا المفضلة لديك في فور يو.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <WishlistPageClient />
}
