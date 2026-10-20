/**
 * Per-company look. A company listed here gets its own colour palette across the whole app while
 * someone is signed in to it (CSS variables under html[data-brand=<key>] in globals.css) and its
 * wordmark in the side-menu header. Other companies keep the Cloud AOS look (Electric Blue).
 * The sign-in page always stays neutral, so it never hints at which company is behind it.
 */
export interface CompanyBrand {
  key: string;
  /** Accent for the side-menu header glow, the active-page marker and the avatar. */
  accent: string;
  /** Wordmark in the side-menu header: one file for light surfaces, one for dark. */
  wordmark?: { light: string; dark: string; alt: string };
  /** Page colours painted before the styles load, so a reload never flashes another palette. */
  page: { light: string; dark: string };
}

export const COMPANY_BRANDS: Record<string, CompanyBrand> = {
  // Chemag Trading: Green #005b21, Red #e21b20, White #FDFDFD, Black #0f0d0d.
  '8300': {
    key: 'ba8300', // neutral key: the stylesheet also loads on the sign-in page
    accent: '#005b21',
    wordmark: { light: '/brand/chemag/logo-light.png', dark: '/brand/chemag/logo-dark.png', alt: 'Chemag' },
    page: { light: '#FDFDFD', dark: '#000000' }, // dark: the original true-black dark theme
  },
};

export const DEFAULT_PAGE = { light: '#f3f4f7', dark: '#000000' };

/** localStorage key holding the brand of the company last opened in this browser. */
export const BRAND_KEY = 'cloudaos_brand';

export function brandOf(ba: string | undefined | null): CompanyBrand | null {
  return (ba && COMPANY_BRANDS[ba]) || null;
}

/** Applies (or clears) a company's palette on the page. */
export function applyBrand(brand: CompanyBrand | null) {
  if (typeof document === 'undefined') return;
  const doc = document.documentElement;
  if (brand) doc.dataset.brand = brand.key;
  else delete doc.dataset.brand;
  // The first paint sets an inline page colour; hand it back to the stylesheet.
  doc.style.backgroundColor = '';
  try {
    if (brand) localStorage.setItem(BRAND_KEY, JSON.stringify({ key: brand.key, page: brand.page }));
    else localStorage.removeItem(BRAND_KEY);
  } catch {}
}
