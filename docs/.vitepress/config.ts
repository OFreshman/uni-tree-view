import process from "node:process";
import { defineConfig } from "vitepress";

const siteBase = process.env.DOCS_BASE ?? "/uni-tree-view/";
const demoBase = process.env.PLAYGROUND_DOCS_BASE ?? `${siteBase}ui/`;
const demoLink = `${demoBase}#/`;
const siteUrl = process.env.DOCS_SITE_URL ?? "https://ofreshman.github.io/uni-tree-view";

export default defineConfig({
  lang: "zh-CN",
  title: "Uni Tree View",
  description: "适用于 uni-app + Vue 3 的跨端树形列表/选择组件，支持微信/支付宝小程序和 H5",
  base: siteBase,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: `${siteBase}favicon.svg` }],
    ["meta", { property: "og:image", content: `${siteUrl}/social-card.png` }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }]
  ],
  lastUpdated: true,
  themeConfig: {
    logo: { src: "/logo.svg", alt: "uni-tree-view Logo" },
    nav: [
      { text: "指南", link: "/guide/introduction", activeMatch: "/guide/" },
      { text: "API", link: "/apis/props", activeMatch: "/apis/" },
      { text: "示例", link: "/examples/basic", activeMatch: "/examples/" },
      { text: "在线演示", link: demoLink }
    ],
    sidebar: {
      "/guide/": [
        {
          text: "开始",
          items: [
            { text: "介绍", link: "/guide/introduction" },
            { text: "安装", link: "/guide/installation" },
            { text: "快速上手", link: "/guide/quick-start" }
          ]
        },
        {
          text: "进阶",
          items: [
            { text: "平台兼容性", link: "/guide/platforms" },
            { text: "常见问题", link: "/guide/faq" }
          ]
        }
      ],
      "/apis/": [
        {
          text: "API 参考",
          items: [
            { text: "Props", link: "/apis/props" },
            { text: "Events", link: "/apis/events" },
            { text: "Slots", link: "/apis/slots" },
            { text: "Methods", link: "/apis/methods" },
            { text: "类型定义", link: "/apis/types" }
          ]
        }
      ],
      "/examples/": [
        {
          text: "示例",
          items: [
            { text: "基础用法", link: "/examples/basic" },
            { text: "单选与多选", link: "/examples/selection" },
            { text: "搜索过滤", link: "/examples/filter" },
            { text: "懒加载", link: "/examples/lazy-load" },
            { text: "虚拟渲染", link: "/examples/virtual" },
            { text: "自定义插槽", link: "/examples/slots" }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/OFreshman/uni-tree-view" }
    ],
    outline: { label: "本页目录", level: [2, 3] },
    docFooter: { prev: "上一页", next: "下一页" },
    lastUpdatedText: "最后更新",
    search: { provider: "local" },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 OFreshman"
    }
  }
});