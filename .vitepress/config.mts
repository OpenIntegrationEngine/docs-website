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
      { text: 'Contributing', link: '/engine/contributing' },
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
      { text: 'Overview', link: '/engine/' },
      {
        text: 'Concepts',
        collapsed: false,
        items: [
          { text: 'Architecture', link: '/engine/architecture_overview' },
          { text: 'Message Lifecycle and Storage', link: '/engine/message_lifecycle' },
          { text: 'Threading and Ordering', link: '/engine/threading_and_ordering' },
          { text: 'Queueing', link: '/engine/queueing' },
          { text: 'Deploy, Start, and Channel State', link: '/engine/channel_state' },
          { text: 'Data Types and Formats', link: '/engine/data_types_and_formats' },
        ]
      },
      { text: 'Glossary', link: '/engine/glossary' },
      {
        text: 'Getting Started',
        collapsed: true,
        items: [
          { text: 'Installation', link: '/engine/installation' },
          { text: 'Server Process Management', link: '/engine/server_process_management' },
          { text: 'Accessing the Administrator', link: '/engine/accessing_the_administrator' },
        ]
      },
      {
        text: 'Migrating from Mirth Connect',
        link: '/engine/migrating_from_mirth_connect',
        collapsed: true,
        items: [
          { text: 'Linux', link: '/engine/migrating_linux' },
          { text: 'Windows', link: '/engine/migrating_windows' },
          { text: 'macOS', link: '/engine/migrating_macos' },
        ]
      },
      {
        text: 'Administrators',
        collapsed: true,
        items: [
          { text: 'Desktop Administrator', link: '/engine/desktop_administrator' },
          { text: 'Web Administrator', link: '/engine/web_administrator' },
          { text: 'Dashboard and Monitoring', link: '/engine/dashboard_and_monitoring' },
        ]
      },
      {
        text: 'Channels',
        collapsed: true,
        items: [
          { text: 'Channels', link: '/engine/channels' },
          { text: 'Channel Development Guide', link: '/engine/channel_development_guide' },
          { text: 'Filters and Transformers', link: '/engine/filters_and_transformers' },
        ]
      },
      {
        text: 'Connectors',
        collapsed: true,
        items: [
          { text: 'Sources', link: '/engine/connector_reference_sources' },
          { text: 'Destinations', link: '/engine/connector_reference_destinations' },
          { text: 'Polling Settings', link: '/engine/polling_settings' },
        ]
      },
      {
        text: 'Scripting',
        collapsed: true,
        items: [
          { text: 'Script Scope and User API', link: '/engine/script_scope_and_user_api' },
          { text: 'JavaScript Editor', link: '/engine/javascript_editor' },
          { text: 'Code Templates', link: '/engine/code_templates' },
          { text: 'Global Scripts', link: '/engine/global_scripts' },
          { text: 'Velocity Variable Replacement', link: '/engine/velocity_variable_replacement' },
          { text: 'Source Map Variables', link: '/engine/source_map_variables' },
          { text: 'Debugger', link: '/engine/debugger' },
        ]
      },
      {
        text: 'Configuration',
        collapsed: true,
        items: [
          { text: 'Server Configuration', link: '/engine/server_configuration' },
          { text: 'Database Support', link: '/engine/database_support' },
          { text: 'Configuration Properties Reference', link: '/engine/configuration_properties_reference' },
        ]
      },
      {
        text: 'Operations',
        collapsed: true,
        items: [
          { text: 'User Management', link: '/engine/user_management' },
          { text: 'Alerts and Notifications', link: '/engine/alerts_and_notifications' },
          { text: 'Logging', link: '/engine/logging' },
          { text: 'Data Pruning and Maintenance', link: '/engine/data_pruning_and_maintenance' },
          { text: 'Upgrade Guide', link: '/engine/upgrade_guide' },
        ]
      },
      {
        text: 'Security',
        collapsed: true,
        items: [
          { text: 'Security and Compliance', link: '/engine/security_and_compliance' },
          { text: 'Security Posture and Hardening', link: '/engine/security_posture_and_hardening' },
        ]
      },
      {
        text: 'Extensions',
        collapsed: true,
        items: [
          { text: 'Plugin Guide', link: '/engine/plugins' },
        ]
      },
      {
        text: 'CLI and API',
        collapsed: true,
        items: [
          { text: 'Command Line Interface', link: '/engine/command_line_interface' },
          { text: 'REST API', link: '/engine/rest_api' },
        ]
      },
      {
        text: 'Help and Reference',
        collapsed: true,
        items: [
          { text: 'Frequently Asked Questions', link: '/engine/frequently_asked_questions' },
          { text: 'Troubleshooting', link: '/engine/troubleshooting' },
        ]
      },
      { text: 'Building from Source', link: '/engine/building_from_source' },
      { text: 'Contributing', link: '/engine/contributing' },
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
