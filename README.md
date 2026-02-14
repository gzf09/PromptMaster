# PromptMaster

PromptMaster 是一个个人 AI Prompt 管理系统，用于创建、组织、收藏和优化 AI 提示词。集成 Google Gemini API 提供 AI 驱动的 Prompt 优化与灵感生成功能。

## 功能特性

### Prompt 管理
- 创建、编辑、删除 Prompt，支持标题、内容、描述、分类、标签和可见性设置
- Prompt 收藏功能
- 一键复制 Prompt 内容到剪贴板
- 按分类、关键词、标签搜索和筛选
- 热门标签快捷筛选

### AI 能力
- **Prompt 优化** — 调用 Gemini API 对 Prompt 进行结构化优化，提升清晰度和效果
- **灵感生成** — 基于主题自动生成创意 Prompt 建议

### 多用户与权限
- 三种角色：`admin`（管理员）、`user`（普通用户）、`guest`（访客）
- 管理员可管理用户（添加 / 删除）、切换用户身份
- 访客仅可浏览社区公开 Prompt
- 新用户首次登录强制修改密码
- Prompt 可见性控制（公开 / 私有）

### 社区功能
- 公开 Prompt 在社区视图中对所有用户可见
- 私有 Prompt 仅创建者可见

### 分类系统
- 内置系统分类：编程、写作、图像生成、数据分析、学习、其他
- 支持自定义用户分类的增删

### 国际化与主题
- 中文 / 英文双语切换
- 亮色 / 暗色主题，支持跟随系统偏好
- 响应式设计，适配桌面与移动端

### 数据持久化
- 所有数据存储在浏览器 localStorage
- 内置数据版本管理与自动迁移系统，确保升级时旧数据平滑迁移

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS |
| 图标 | lucide-react |
| AI | Google Gemini API (`gemini-3-flash-preview`) |
| 状态管理 | React Hooks（useState / useEffect / useMemo） |
| 持久化 | localStorage + 迁移系统 |
| 路由 | 无（基于状态的视图切换） |

## 项目结构

```
promptmaster/
├── App.tsx                  # 根组件，所有应用状态的单一数据源
├── index.tsx                # React 入口
├── index.html               # HTML 模板（Tailwind CDN、Import Maps）
├── types.ts                 # TypeScript 类型定义
├── components/
│   ├── Sidebar.tsx          # 侧边栏导航、分类、用户切换、主题/语言切换
│   ├── PromptList.tsx       # Prompt 卡片网格展示
│   ├── PromptEditor.tsx     # Prompt 创建/编辑弹窗，含 AI 优化
│   ├── Login.tsx            # 登录页
│   ├── ChangePassword.tsx   # 首次登录修改密码
│   ├── UserManagement.tsx   # 用户管理弹窗（管理员）
│   ├── Toast.tsx            # 通知提示组件
│   └── Icon.tsx             # lucide-react 图标导出
├── services/
│   └── geminiService.ts     # Gemini API 集成（优化 & 灵感生成）
├── utils/
│   ├── translations.ts      # 国际化翻译（zh/en）
│   ├── migrations.ts        # localStorage 数据版本迁移
│   └── generateId.ts        # 安全 UUID 生成（兼容非 HTTPS 环境）
├── vite.config.ts           # Vite 构建配置
├── tsconfig.json            # TypeScript 配置
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 18

### 安装与运行

```bash
# 安装依赖
npm install

# 配置 Gemini API Key
# 在 .env.local 文件中设置 GEMINI_API_KEY

# 启动开发服务器（0.0.0.0:3000）
npm run dev

# 生产构建（输出到 dist/）
npm run build

# 预览生产构建
npm run preview
```

### 环境变量

在项目根目录创建 `.env.local` 文件：

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Vite 会在构建时将其注入为 `process.env.API_KEY` 和 `process.env.GEMINI_API_KEY`。

## 默认账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| Admin User | password | 管理员 |
| Jane Doe | password | 普通用户 |
| Guest | — | 访客（无需密码） |

管理员新建用户的默认密码为 `123456`，首次登录时强制修改。

## 架构说明

PromptMaster 是一个纯前端单页应用（SPA），没有后端服务。所有状态集中在 `App.tsx` 中管理，通过 props 向下传递给子组件。

**状态持久化模式：**

```typescript
// 初始化时从 localStorage 读取
const [data, setData] = useState(() => {
  const saved = localStorage.getItem('promptmaster_KEY');
  return saved ? JSON.parse(saved) : DEFAULT;
});

// 变更时自动写入 localStorage
useEffect(() => {
  localStorage.setItem('promptmaster_KEY', JSON.stringify(data));
}, [data]);
```

**数据迁移系统：** 应用启动时，在 React 状态初始化之前同步执行 localStorage 数据迁移。通过版本号（`promptmaster_schema_version`）追踪迁移进度，确保数据结构变更时旧数据自动升级。

**视图切换：** 没有使用路由库。通过 `selectedCategoryId` 状态控制当前视图（我的 Prompt / 社区 / 收藏 / 具体分类），弹窗通过独立的布尔状态控制。

## localStorage 键

| 键名 | 说明 |
|------|------|
| `promptmaster_data` | Prompt 数据数组 |
| `promptmaster_categories` | 分类数据数组 |
| `promptmaster_users` | 用户数据数组 |
| `promptmaster_theme` | 主题偏好（light / dark） |
| `promptmaster_lang` | 语言偏好（zh / en） |
| `promptmaster_schema_version` | 数据迁移版本号 |

## License

MIT
