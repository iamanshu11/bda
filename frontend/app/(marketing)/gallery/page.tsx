import Image from 'next/image';
import { buildMetadata } from '@/lib/seo';
import { serverFetch } from '@/lib/server-api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { galleryImages } from '@/frontend-data/pages';
import type { ApiGalleryItem } from '@/types/api';

export const metadata = buildMetadata({
  title: 'Gallery',
  description:
    'A glimpse into life at Bokaro Defence Academy — classrooms, training grounds, SSB sessions, events and campus facilities.',
  path: '/gallery',
  keywords: ['BDA gallery', 'defence academy campus', 'Bokaro academy photos'],
});

const fallback: ApiGalleryItem[] = galleryImages.map((img) => ({
  id: img.id,
  imageUrl: img.src,
  title: img.caption,
  category: img.category,
}));

export default async function GalleryPage() {
  const live = await serverFetch<ApiGalleryItem[]>('/gallery');
  const images = live && live.length > 0 ? live : fallback;

  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Moments of discipline, training and celebration from our campus."
        breadcrumbs={[{ name: 'Gallery', path: '/gallery' }]}
      />

      <section className="bg-background py-20">
        <Container>
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
            {images.map((img, i) => (
              <Reveal key={img.id} index={i % 3} className="break-inside-avoid">
                <figure className="group relative overflow-hidden rounded-xl">
                  <Image
                    src={img.imageUrl}
                    alt={img.title ?? 'Gallery image'}
                    width={800}
                    height={600}
                    className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {(img.title || img.category) && (
                    <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-navy-950/85 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                      {img.title && <span className="text-sm font-semibold text-white">{img.title}</span>}
                      {img.category && (
                        <span className="rounded-full bg-rust-500 px-2 py-0.5 text-xs font-medium text-white">
                          {img.category}
                        </span>
                      )}
                    </figcaption>
                  )}
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
