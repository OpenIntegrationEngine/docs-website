import {defineConfig} from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'

const SUBMODULES_ROOT = path.resolve(__dirname, '../docs')

// Generate sidebar items from /engine
function sidebarFromRemote(remote: string) {
  const filePath = path.join(SUBMODULES_ROOT, remote, 'docs.json')
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data)
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Open Integration Engine",
  description: "Open Integration Engine documentation",
  srcDir: './docs',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/engine' },
      { text: 'Examples', link: '/examples' },
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

    sidebar: [
      {
        text: 'Engine',
        collapsed: false,
        items: [
          { text: 'Overview', link: 'engine' },
          { text: 'Contributing', link: 'engine/contributing' },
        ]
      },
      {
        text: 'Launchers',
        collapsed: false,
        items: [
          { text: 'Overview', link: 'launchers' },
        ]
      },
      {
        text: 'Examples',
        collapsed: false,
        items: [
          { text: 'Overview', link: 'examples' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/openintegrationengine' },
      { icon: 'discord', link: 'https://discord.gg/azdehW2Zrx' },
      { icon: 'docker', link: 'https://hub.docker.com/u/openintegrationengine' },
    ]
  },
})
