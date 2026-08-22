import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Grouped by topic — sidebar entries are doc IDs (derived from file path under docs/),
 * independent of the flat `slug:` frontmatter every page sets explicitly so URLs stay
 * short (e.g. /personas, not /ux/personas) regardless of which folder organizes it.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'quick-links',
    {
      type: 'category',
      label: 'Overview',
      collapsed: false,
      items: ['overview/what-it-does'],
    },
    {
      type: 'category',
      label: 'Problem & Research',
      collapsed: false,
      items: ['problem/the-problem', 'problem/why-midnight'],
    },
    {
      type: 'category',
      label: 'UX',
      collapsed: false,
      items: [
        'ux/who-it-is-for',
        'ux/personas',
        'ux/user-flow',
        'ux/usability-validation',
      ],
    },
    {
      type: 'category',
      label: 'Engineering',
      collapsed: false,
      items: [
        'engineering/architecture',
        'engineering/compact-contract',
        'engineering/how-to-run',
        'engineering/tests',
        'engineering/demo-walkthrough',
      ],
    },
    {
      type: 'category',
      label: 'Evaluation',
      collapsed: false,
      items: [
        'evaluation/what-we-built-in-wave-1',
        'evaluation/difference-from-existing-examples',
        'evaluation/limitations',
        'evaluation/roadmap',
        'evaluation/adoption-path',
        'evaluation/ecosystem-attribution',
      ],
    },
  ],
};

export default sidebars;
