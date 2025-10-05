// icon-registry.ts
export interface AppIcon {
  name: string; // Icon name
  usedIn: string; // Where in your app (e.g. "Navbar")
  purpose: string; // Why it’s used (e.g. "Navigation home")
  source: string; // Icon set (Tabler, Heroicons, etc.)
  license: string; // License type
  link: string; // Link to icon page
}

export const ICONS_USED: AppIcon[] = [
  {
    name: 'si:move-duotone',
    usedIn: 'edit-pdf-view',
    purpose: 'mark page',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/si/move-duotone/',
  },
  {
    name: 'Material-symbols:download',
    usedIn: 'toolbar',
    purpose: 'download pdf',
    source: 'Iconify',
    license:
      'Apache License 2.0 https://github.com/google/material-design-icons/blob/master/LICENSE',
    link: 'https://icon-sets.iconify.design/material-symbols/download/',
  },
  {
    name: 'majesticons:image-line',
    usedIn: 'toolbar',
    purpose: 'Insert Image',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/majesticons/image-line/',
  },
  {
    name: 'mdi:trashcan-outline',
    usedIn: 'Page info',
    purpose: 'Delete PDF page',
    source: 'Iconify',
    license:
      'Apache License 2.0 https://github.com/google/material-design-icons/blob/master/LICENSE',
    link: 'https://icon-sets.iconify.design/mdi/trashcan-outline/',
  },
  {
    name: 'tabler:info-square',
    usedIn: 'Page info',
    purpose: 'Page info',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/tabler/info-square/',
  },
  {
    name: 'si:align-left-fill',
    usedIn: 'TextStyle',
    purpose: 'Align left',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/si/align-left-fill/',
  },
  {
    name: 'si:align-center-fill',
    usedIn: 'TextStyle',
    purpose: 'Align center',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/si/align-center-fill/',
  },

  {
    name: 'si:align-right-fill',
    usedIn: 'TextStyle',
    purpose: 'Align right',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/si/align-right-fill/',
  },
  {
    name: 'line-md:link',
    usedIn: 'TextStyle',
    purpose: 'attach link',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/line-md/link/',
  },
  {
    name: 'ooui:bold-b',
    usedIn: 'TextStyle',
    purpose: 'textformat bold',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/ooui/bold-b/',
  },
  {
    name: 'tabler:underline',
    usedIn: 'TextStyle',
    purpose: 'textformat underline',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/tabler/underline/',
  },
  {
    name: 'tabler:italic',
    usedIn: 'TextStyle',
    purpose: 'textformat italic',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/tabler/italic/',
  },
  {
    name: 'hugeicons:text-superscript',
    usedIn: 'TextStyle',
    purpose: 'textformat superscript',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/hugeicons/text-superscript/',
  },
  {
    name: 'hugeicons:text-subscript',
    usedIn: 'TextStyle',
    purpose: 'textformat subscript',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/hugeicons/text-subscript/',
  },
  {
    name: 'charm:tick',
    usedIn: 'checkBox',
    purpose: 'check',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/charm/tick/',
  },
  {
    name: 'fluent:rotate-right-24-filled',
    usedIn: 'Organizer',
    purpose: 'rotate right',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/fluent/rotate-right-24-filled/',
  },
  {
    name: 'iconoir:page-plus',
    usedIn: 'Organizer',
    purpose: 'Add New Page',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/iconoir/page-plus/',
  },
  {
    name: 'ep:right',
    usedIn: 'Organizer',
    purpose: 'Submit',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/ep/right/',
  },
  {
    name: 'clarity:organization-line',
    usedIn: 'Toolbar',
    purpose: 'Organize',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/clarity/organization-line/',
  },
  {
    name: 'si:close-line',
    usedIn: 'App',
    purpose: 'Close window',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/si/close-line/',
  },
  {
    name: 'heroicons-outline:duplicate',
    usedIn: 'App',
    purpose: 'Duplicate',
    source: 'Iconify',
    license: 'MIT https://github.com/halfmage/majesticons/blob/main/LICENSE',
    link: 'https://icon-sets.iconify.design/heroicons-outline/duplicate/',
  },
];
