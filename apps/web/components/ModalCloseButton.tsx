'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function ModalCloseButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="hn-icon-btn"
      aria-label="Close"
      onClick={() => router.back()}
    >
      <X size={16} />
    </button>
  );
}
