'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminCouponsPage() {
  return (
    <ResourceManager
      title="Coupons"
      endpoint="/admin/coupons"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'type', label: 'Type' },
        { key: 'value', label: 'Value', render: (r) => (r.type === 'PERCENTAGE' ? `${r.value}%` : `₹${r.value}`) },
        { key: 'usedCount', label: 'Used', render: (r) => `${r.usedCount}${r.maxUses ? ` / ${r.maxUses}` : ''}` },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'code', label: 'Code', placeholder: 'e.g. WELCOME50', required: true },
        {
          name: 'type',
          label: 'Discount type',
          type: 'select',
          options: [
            { value: 'PERCENTAGE', label: 'Percentage (%)' },
            { value: 'FIXED', label: 'Fixed (₹)' },
          ],
        },
        { name: 'value', label: 'Value (% or ₹)', type: 'number', required: true },
        { name: 'maxDiscount', label: 'Max discount ₹ (percentage caps)', type: 'number' },
        { name: 'minAmount', label: 'Min course price ₹', type: 'number' },
        { name: 'maxUses', label: 'Max total uses', type: 'number' },
        { name: 'perUserLimit', label: 'Per-user limit', type: 'number' },
        { name: 'expiryAt', label: 'Expiry date', type: 'datetime' },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'ACTIVE', label: 'Active' },
            { value: 'DISABLED', label: 'Disabled' },
          ],
        },
        { name: 'courseId', label: 'Course ID (blank = all courses)', placeholder: 'course uuid' },
      ]}
    />
  );
}
