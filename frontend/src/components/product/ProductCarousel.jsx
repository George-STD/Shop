'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function ProductCarousel({
  items = [],
  renderItem,
  spaceBetween = 16,
  slidesPerView = 2,
  navigation = false,
  pagination = false,
  autoplay = false,
  breakpoints,
  className = '',
  slideClassName = '',
}) {
  if (!items || items.length === 0) return null;

  const modules = [];
  if (autoplay) modules.push(Autoplay);
  if (navigation) modules.push(Navigation);
  if (pagination) modules.push(Pagination);

  return (
    <Swiper
      modules={modules}
      spaceBetween={spaceBetween}
      slidesPerView={slidesPerView}
      navigation={navigation}
      pagination={pagination}
      autoplay={autoplay}
      breakpoints={breakpoints}
      className={className}
    >
      {items.map((item, index) => (
        <SwiperSlide key={item._id || item.id || index} className={slideClassName}>
          {renderItem ? renderItem(item, index) : null}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
