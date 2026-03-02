import AccountPageClient from './AccountPageClient'

export const metadata = {
  title: 'حسابي',
  description: 'إدارة حسابك في فور يو - متجر الهدايا.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AccountPageClient />
}
