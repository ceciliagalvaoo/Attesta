import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * One flat, ordered sidebar — the whole site is Attesta's documentation, so there's no
 * need for nested categories. Order follows the narrative a judge actually reads in:
 * what it is, why it exists, who it's for, how it works, what's real, how to verify it,
 * and what's honestly still missing.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'quick-links',
    'what-it-does',
    'the-problem',
    'who-it-is-for',
    'personas',
    'user-flow',
    'why-midnight',
    'what-we-built-in-wave-1',
    'architecture',
    'compact-contract',
    'how-to-run',
    'tests',
    'demo-walkthrough',
    'usability-validation',
    'difference-from-existing-examples',
    'limitations',
    'roadmap',
    'adoption-path',
    'ecosystem-attribution',
  ],
};

export default sidebars;
