'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function ModalCloseButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="inline-flex w-7 h-7 items-center justify-center rounded-md text-fg-muted bg-transparent border-0 cursor-pointer hover:text-fg hover:bg-hover transition-colors duration-100"
      aria-label="Close"
      onClick={() => router.back()}
    >
      <X size={16} />
    </button>
  );
}
