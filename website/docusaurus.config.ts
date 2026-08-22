import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Attesta',
  tagline: 'Ask for the fact. Not the file.',
  favicon: 'img/attesta-mark.svg',

  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // GitHub Pages deployment target: https://ceciliagalvaoo.github.io/Attesta/
  url: 'https://ceciliagalvaoo.github.io',
  baseUrl: '/Attesta/',

  organizationName: 'ceciliagalvaoo',
  projectName: 'Attesta',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/', // serve docs at the site root — this site IS the docs
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/ceciliagalvaoo/Attesta/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/attesta-mark.svg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Attesta',
      logo: {
        alt: 'Attesta',
        src: 'img/attesta-mark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/ceciliagalvaoo/Attesta',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Attesta',
          items: [
            {label: 'What it does', to: '/what-it-does'},
            {label: 'Architecture', to: '/architecture'},
            {label: 'How to run', to: '/how-to-run'},
          ],
        },
        {
          title: 'Repository',
          items: [
            {label: 'Source code', href: 'https://github.com/ceciliagalvaoo/Attesta'},
            {
              label: 'Compact contract',
              href: 'https://github.com/ceciliagalvaoo/Attesta/blob/main/contract/src/attesta.compact',
            },
          ],
        },
        {
          title: 'Midnight Network',
          items: [
            {label: 'Midnight Docs', href: 'https://docs.midnight.network/'},
            {label: 'Midnight Buildathon', href: 'https://app.akindo.io/wave-hacks/jaMZjqPOBsLXvjdG'},
          ],
        },
      ],
      copyright: `Attesta — built by Cecília Galvão and Pablo Azevedo for the Midnight Buildathon (Wave 1), ${new Date().getFullYear()}. Apache 2.0.`,
    },
    prism: {
      theme: prismThemes.oneLight,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['bash', 'typescript', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
