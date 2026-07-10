'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { achievers } from '@/frontend-data/home';

export function HallOfFame() {
  return (
    <section className="bg-navy-800 py-20" aria-label="Hall of Fame">
      <Container>
        <SectionHeading
          eyebrow="Academic Excellence"
          title="Hall of Fame"
          subtitle="Giving wings to a million dreams, a million more to go"
          invert
        />

        <div className="mt-12 [--swiper-pagination-bottom:0px] [--swiper-pagination-bullet-inactive-color:#7f9fd8] [--swiper-pagination-color:#e59a5f]">
          <Swiper
            modules={[Autoplay, Pagination]}
            slidesPerView={1.2}
            spaceBetween={20}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 4 },
            }}
            className="!pb-12"
          >
            {achievers.map((a) => (
              <SwiperSlide key={a.id}>
                <figure className="rounded-2xl bg-navy-700/60 p-5 text-center ring-1 ring-white/10">
                  <div className="relative mx-auto aspect-square w-28 overflow-hidden rounded-lg ring-2 ring-rust-400">
                    <Image
                      src={a.image}
                      alt={`${a.name}, ${a.rank}`}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-4">
                    <p className="font-heading text-lg font-bold text-rust-300">{a.rank}</p>
                    <p className="mt-1 font-semibold text-white">{a.name}</p>
                    <p className="text-sm text-navy-100/70">{a.exam}</p>
                  </figcaption>
                </figure>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Container>
    </section>
  );
}
