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
    name: 'home',
    usedIn: 'Navbar',
    purpose: 'Go to homepage',
    source: 'Tabler Icons',
    license: 'MIT',
    link: 'https://icon-sets.iconify.design/tabler/home/'
  },
  {
    name: 'search',
    usedIn: 'Header',
    purpose: 'Search function',
    source: 'Heroicons',
    license: 'MIT',
    link: 'https://icon-sets.iconify.design/heroicons/search/'
  }
  // ➕ add more icons here as you use them
];
