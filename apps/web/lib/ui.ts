export const NAV_BASE =
  'px-2.5 py-1.5 rounded-[6px] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors duration-100';
export const NAV_INACTIVE = 'text-fg-muted hover:text-fg hover:bg-hover';
export const NAV_ACTIVE = 'text-fg bg-brand-soft';

export const CHIP_BASE =
  'inline-flex items-center gap-1.5 px-[9px] py-[5px] rounded-[6px] text-[12.5px] font-medium bg-transparent border cursor-pointer transition-colors duration-100 hover:bg-hover hover:text-fg';
export const CHIP_INACTIVE = 'text-fg-muted border-transparent';
export const CHIP_ACTIVE =
  'text-fg bg-brand-soft border-[color:color-mix(in_oklch,var(--brand)_25%,transparent)]';

export const seenClass = (seen: boolean) => (seen ? ' opacity-55 hover:opacity-100' : '');
