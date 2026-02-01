# ChronoFlow AI

<div align="center">
  <h3>一款生成炫酷动态时序图的网页应用</h3>
  <p>通过 AI 生成炫酷科技风动态时序图</p>

  <a href="https://zcc123.com/chronoflow-ai/" target="_blank">
    <img src="https://img.shields.io/badge/🌐-在线演示-blue?style=for-the-badge" alt="在线演示">
  </a>
  <a href="https://zcc123.com/chronoflow-ai/" target="_blank">
    <strong>立即体验 →</strong>
  </a>

  <a href="#安装">安装</a> •
  <a href="#功能特性">功能特性</a> •
  <a href="#使用方法">使用方法</a> •
  <a href="#技术栈">技术栈</a>
</div>

**English Version:** [English Documentation](./README.md)

---

## 📖 目录

- [产品概述](#产品概述)
- [目标用户](#目标用户)
- [功能特性](#功能特性)
- [安装](#安装)
- [使用方法](#使用方法)
- [配置说明](#配置说明)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 产品概述

ChronoFlow AI 是一款专为产品经理和短视频创作者设计的创新网页应用。它可以让用户通过几个简单的点击操作，生成炫酷的动态时序图。

**核心价值**：只需上传时序图图片或用自然语言描述，AI 就会自动生成炫酷科技风的动态时序图。时序图支持点击逐步展示，配有箭头动画、流动光点、粒子特效等视觉效果。

---

## 目标用户

### 产品经理
- **痛点**：传统时序图工具（ProcessOn、Draw.io）操作繁琐，画出来的图缺乏视觉冲击力，难以在演示时吸引注意力。
- **解决方案**：快速生成视觉吸引力强的动态图表，在需求评审会上抓住眼球。

### 短视频创作者
- **痛点**：缺乏专业动画制作能力，但想要展示动态的步骤流程。
- **解决方案**：生成可以录屏直接使用的动画时序图素材。

---

## 功能特性

### 核心功能

- **🔑 API 密钥配置** - 在顶部栏输入 Gemini API Key，保存到本地存储供 AI 功能使用
- **📤 图片上传与识别** - 上传时序图图片（PNG/JPG），AI 自动识别节点、连接和文字
- **💬 自然语言输入** - 用自然语言描述流程（如"用户登录，系统验证密码，返回token"），AI 生成图表
- **🎨 动态时序图生成** - Three.js 渲染节点和连接线，应用炫酷科技风效果（渐变、发光、科幻字体）
  - 支持最多 20 个节点
  - 支持分支逻辑（if-else）
  - 支持循环逻辑（loops）
- **✏️ 手动编辑** - 添加/删除/修改节点和连接线，设置分支和循环
- **▶️ 动态展示模式** - 点击节点逐步展示，配有炫酷动画：
  - 箭头描边动画
  - 连接线上的流动光点
  - 目标节点的粒子特效

### 辅助功能

- **🔄 重置** - 重置时序图到初始状态
- **⏭️ 跳转** - 通过时间轴跳转到任意步骤
- **📷 导出静态图** - 导出为 PNG/SVG 用于文档
- **🎬 导出动画序列** - 导出所有关键帧为 ZIP 文件

---

## 安装

### 前置要求

- Node.js（建议 v18 或更高版本）
- npm 或 yarn 包管理器

### 克隆并安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/chronoflow-ai.git
cd chronoflow-ai

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

应用将在 `http://localhost:5173` 可用

### 生产环境构建

```bash
npm run build
npm run preview
```

---

## 使用方法

### 流程一：上传图片生成时序图

1. 打开应用，在顶部栏输入 Gemini API Key，点击"保存"
2. 左侧选择"上传图片"标签页
3. 点击上传区域或拖拽时序图图片
4. 上传成功后显示缩略图预览
5. 点击"识别并生成"按钮
6. 系统使用 Gemini 识别图片并生成图表数据
7. 中间画布区渲染出炫酷科技风的时序图
8. 如果识别不准确，切换到"手动编辑"标签页调整

### 流程二：自然语言生成时序图

1. 打开应用，在顶部栏输入 Gemini API Key，点击"保存"
2. 左侧选择"自然语言"标签页
3. 在文本框中输入流程描述，如"用户登录，系统验证密码，如果正确返回token并跳转首页，否则提示错误"
4. 点击"生成时序图"按钮
5. 系统使用 AI 解析描述并生成图表数据
6. 中间画布区渲染出炫酷科技风的时序图
7. 如果不满意，切换到"手动编辑"标签页调整

### 流程三：动态展示与录屏

1. 生成时序图后，点击右侧"动态模式"切换按钮
2. 时序图进入动态展示状态，所有节点和连接线变为未展示状态
3. 打开录屏软件（OBS、QuickTime）开始录制
4. 点击第一个节点，观看箭头动画、流动光点、粒子特效
5. 继续点击下一个节点，逐步展示整个流程
6. 如需重新录制，点击"重置"按钮回到初始状态
7. 停止录制，得到动态时序图视频

### 流程四：导出图片

1. 生成时序图后，点击右侧"导出静态图"按钮
2. 在弹出的对话框中选择 PNG 或 SVG 格式
3. 系统将当前画布状态渲染为图片并下载
4. 或点击"导出动画序列"按钮
5. 选择格式后，系统自动播放完整动画流程
6. 每个关键帧保存为一张图片
7. 所有图片打包成 ZIP 文件下载

---

## 配置说明

### API Key 设置

1. 在顶部输入框输入 Gemini API Key
2. 点击"保存"按钮
3. 密钥保存到浏览器 LocalStorage
4. 该密钥将用于所有 AI 功能

**注意**：从 [Google AI Studio](https://makersuite.google.com/app/apikey) 获取您的 API Key

### 语言切换

- 点击右上角的语言切换按钮
- 切换 英文 / 中文
- 选择保存到浏览器 LocalStorage
- 默认语言：英文

---

## 技术栈

- **框架**：React 19（Vite + TypeScript）
- **3D 渲染**：Three.js + React Three Fiber
- **AI 模型**：Google Gemini 3 Pro Image Preview
- **状态管理**：React Hooks + Context API
- **国际化**：i18next
- **图标**：Lucide React
- **导出**：html-to-image, JSZip
- **部署**：静态站点（Vercel、Netlify 等）

### 动画实现

- **箭头动画**：Three.js Line + TubeGeometry，配合 shader 实现描边动画
- **流动光点**：粒子系统（Points）沿路径移动
- **粒子特效**：Three.js ParticleSystem，实现光点汇聚/扩散效果

---

## 项目结构

```
chronoflow-ai/
├── public/
├── src/
│   ├── components/         # React 组件
│   │   ├── APISetting.tsx
│   │   ├── Canvas.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── InputPanel.tsx
│   │   └── Timeline.tsx
│   ├── services/           # API 服务
│   ├── locales/            # i18n 翻译文件
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 入口文件
│   └── ...
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 贡献指南

欢迎贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件。

---

<div align="center">
  <p>Made with ❤️ by ChronoFlow AI Team</p>
</div>
