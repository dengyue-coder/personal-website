# Personal Website · 个人作品集站点

一个纯静态、零外部依赖的个人作品集网站，用于展示个人简介、项目经历、博客文章与联系方式。页面采用响应式布局，适配桌面与移动端，并尊重系统的「减弱动态效果」偏好。

- 在线预览：https://hsr.ct.ws
- 技术栈：HTML5 · CSS3 · 原生 JavaScript（ES2019+），无框架、无构建步骤

## 功能模块

- **首页**：个人简介、技能概览、数据概览与主题切换；
- **博客**：文章列表与单篇正文（位于 `posts/`）；
- **项目**：项目卡片与技术标签；
- **关于我**：个人背景、经历与获奖信息；
- **联系我**：邮箱、电话与社交/代码仓库入口；
- **404**：自定义找不到页面。

## 目录结构

```
personal-website/
├── index.html            # 首页
├── blog.html             # 博客列表
├── projects.html         # 项目列表
├── about.html           # 关于我
├── contact.html          # 联系我
├── 404.html              # 错误页
├── posts/                # 单篇文章 HTML
├── assets/
│   ├── css/style.css     # 站点样式
│   ├── js/site.js        # 交互脚本（导航、主题、复制链接等）
│   ├── images/           # 图片素材
│   └── files/            # 简历等附件
├── favicon.svg
├── robots.txt
└── sitemap.xml
```

## 本地预览

无需安装任何依赖，任选一种方式：

```sh
# 方式一：直接用浏览器打开 index.html

# 方式二：启动静态服务器
npx serve .
# 或
python -m http.server 8080
```

## 自定义配置

### GitHub 仓库链接
全站的 GitHub 入口（页脚、联系页、项目卡片、顶栏）由 `assets/js/site.js` 顶部的配置统一控制。把占位地址替换为你自己的 GitHub 主页或仓库链接即可：

```js
var GITHUB_URL = "https://github.com/your-username";
```

### 联系方式
邮箱、电话等联系信息直接写在各页面 HTML 中，按需要修改即可。公开仓库中若不希望保留手机号，可删除对应的 `tel:` 链接，仅保留邮箱。

## 部署

本目录为纯静态文件，可直接上传到任意静态托管（对象存储、GitHub Pages、Vercel、InfinityFree 等）。上传时保持目录结构不变，入口文件为 `index.html`。
