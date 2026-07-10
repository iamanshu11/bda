'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminGalleryPage() {
  return (
    <ResourceManager
      title="Gallery"
      endpoint="/admin/gallery"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'order', label: 'Order' },
      ]}
      fields={[
        { name: 'title', label: 'Title' },
        { name: 'imageUrl', label: 'Image', type: 'image', required: true },
        { name: 'category', label: 'Category' },
        { name: 'order', label: 'Order', type: 'number' },
      ]}
    />
  );
}
