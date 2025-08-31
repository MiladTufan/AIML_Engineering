// icon-registry.ts
export interface AppIcon {
  name: string;        // Icon name
  usedIn: string;      // Where in your app (e.g. "Navbar")
  purpose: string;     // Why it’s used (e.g. "Navigation home")
  source: string;      // Icon set (Tabler, Heroicons, etc.)
  license: string;     // License type
  link: string;        // Link to icon page
}

export const ICONS_USED: AppIcon[] = [
  {
    name: 'si:move-duotone',
    usedIn: 'edit-pdf-view',
    purpose: 'mark page',
    source: 'Iconify',
    license: 'MIT',
    link: 'https://icon-sets.iconify.design/si/move-duotone/'
  },
  {
    name: 'Material-symbols:download',
    usedIn: 'toolbar',
    purpose: 'download pdf',
    source: 'Iconify',
    license: 'Apache License 2.0 https://github.com/google/material-design-icons/blob/master/LICENSE',
    link: 'https://icon-sets.iconify.design/material-symbols/download/'
  },

  
  // ➕ add more icons here as you use them
];
