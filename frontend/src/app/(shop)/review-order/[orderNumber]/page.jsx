import ReviewOrderClient from './ReviewOrderClient';

export const metadata = {
  title: 'تقييم الطلب | For You - فور يو',
  description: 'شاركنا تقييمك ورأيك في تجربة التسوق وبوكس الهدايا',
  robots: { index: false, follow: false },
};

export default function Page({ params }) {
  return <ReviewOrderClient orderNumber={params.orderNumber} />;
}
