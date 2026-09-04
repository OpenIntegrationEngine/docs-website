import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Open Integration Engine",
  description: "Open Integration Engine documentation",
  srcDir: './docs',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/engine/' },
      { text: 'Launchers', link: '/launchers/' },
      { text: 'Examples', link: '/examples/' },
    ],

    logo: 'https://raw.githubusercontent.com/OpenIntegrationEngine/governance/refs/heads/main/branding/logos/oie_logo_only_white_background.svg',

    editLink: {
      text: 'Edit this page on GitHub',
      pattern: 'https://github.com/openintegrationengine/docs-website/edit/main/docs/:path'
    },

    search: {
      provider: 'local'
    },

    lastUpdated: true,

    outline: [2, 3],

    sidebar: [
      {
        text: 'Engine',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/engine/' },
          { text: 'Core Concepts', link: '/engine/core_concepts'},
          { text: 'Installation', link: '/engine/installation' },
          { text: 'Server Process Management', link: '/engine/server_process_management' },
          { text: 'Accessing the Administrator', link: '/engine/accessing_the_administrator' },
          { text: 'Plugin Guide', link: '/engine/plugins' },
          { text: 'Contributing', link: '/engine/contributing' },
        ]
      },
      { text: 'Launchers', link: '/launchers/' },
      { text: 'Examples', link: '/examples/' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/openintegrationengine' },
      { icon: 'discord', link: 'https://discord.gg/azdehW2Zrx' },
      { icon: 'docker', link: 'https://hub.docker.com/u/openintegrationengine' },
    ]
  },
})
