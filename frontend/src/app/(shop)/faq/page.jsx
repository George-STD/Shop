import FAQPageClient from './FAQPageClient';
import { PAGE_METADATA } from '../../../lib/metadata';
import { STRINGS } from '../../../constants';

export const metadata = PAGE_METADATA.faq;

const allFaqItems = (STRINGS.FAQ_PAGE?.CATEGORIES || []).flatMap((cat) => cat.questions || []);

function FAQJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}

export default function Page() {
  return (
    <>
      <FAQJsonLd />
      <FAQPageClient />
    </>
  );
}
