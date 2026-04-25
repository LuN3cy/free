# 大乐透号码生成与分析系统 (Super Lotto Generator & Analyzer)

这是一款专为“中国体育彩票超级大乐透”设计的全栈 Web 应用。它提供了最新的开奖数据同步、历史走势分析（冷热号统计），以及基于纯随机或历史概率的号码生成功能，为广大彩民和数据分析爱好者提供参考与娱乐。

## 🌟 核心功能 (Core Features)

- **📊 首页大盘 (Dashboard)**
  - 展示最新一期大乐透开奖结果及详情。
  - 支持一键同步最新开奖数据，后台自动爬取并存入本地数据库。
- **🎲 号码生成器 (Generator)**
  - **纯随机生成**：完全随机产生前区和后区号码。
  - **智能预测生成**：基于历史开奖数据的冷热概率进行加权生成。
  - 支持自定义生成组数，快速获取推荐组合。
- **📈 历史与走势 (History & Stats)**
  - 列表呈现最近的历史开奖记录。
  - 统计并展示前区与后区的“冷热号”（出现频率最高和最低的号码），为选号提供数据支撑。

## 💻 技术栈 (Tech Stack)

本项目采用前后端分离架构，但在开发环境下可在一个仓库中统一运行：

**前端 (Frontend)**
- **框架**: React 18 + TypeScript + Vite
- **路由**: React Router v7
- **状态管理**: Zustand
- **样式**: Tailwind CSS 3 + clsx + tailwind-merge
- **图标**: Lucide React

**后端 (Backend)**
- **运行环境**: Node.js
- **框架**: Express
- **数据库**: SQLite (better-sqlite3)
- **数据抓取**: axios + cheerio

## 📁 项目结构 (Project Structure)

```text
/workspace
├── api/                  # 后端 Express 服务端代码
│   ├── db/               # 数据库初始化及配置
│   ├── routes/           # API 路由定义
│   ├── services/         # 业务逻辑与爬虫服务
│   └── server.ts         # 后端入口文件
├── src/                  # 前端 React 源代码
│   ├── components/       # 可复用 UI 组件
│   ├── hooks/            # 自定义 React Hooks
│   ├── lib/              # 工具函数
│   ├── pages/            # 页面组件 (Dashboard, Generator, History)
│   ├── store/            # Zustand 状态管理
│   ├── App.tsx           # 根组件
│   └── main.tsx          # 前端入口文件
├── .trae/                # 项目设计与架构文档
├── lottery.db            # SQLite 数据库文件
├── package.json          # 项目依赖与脚本
├── vite.config.ts        # Vite 构建配置
└── tailwind.config.js    # Tailwind CSS 配置
```

## 🚀 快速开始 (Quick Start)

### 1. 环境准备
确保您的计算机上已安装了 [Node.js](https://nodejs.org/) (推荐 v18+)。

### 2. 安装依赖
在项目根目录下执行以下命令安装所有依赖：
```bash
npm install
```

### 3. 运行项目 (开发模式)
本项目配置了 `concurrently`，可以一键同时启动前端和后端服务：
```bash
npm run dev
```
- **前端页面** 通常运行在 `http://localhost:5173`
- **后端 API** 通常运行在 `http://localhost:3000`

### 4. 构建与生产运行
```bash
# 构建前端项目
npm run build

# 预览构建后的前端产物
npm run preview
```

## 📡 后端 API 概览

| 接口路径 | 方法 | 描述 |
| :--- | :---: | :--- |
| `/api/lottery/latest` | GET | 获取最新一期或多期开奖数据 |
| `/api/lottery/sync` | POST | 触发爬虫同步最新开奖数据到数据库 |
| `/api/lottery/stats` | GET | 获取前区和后区的冷热号统计数据 |

## 🗄️ 数据库设计 (Database)

采用轻量级的 SQLite 存储历史开奖记录，核心表 `lottery_records` 设计如下：

| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `period` | VARCHAR(20) | 期号 (主键, 如 "23044") |
| `front_zone` | VARCHAR(50) | 前区号码 (逗号分隔) |
| `back_zone` | VARCHAR(20) | 后区号码 (逗号分隔) |
| `draw_date` | VARCHAR(20) | 开奖日期 |
| `created_at` | DATETIME | 记录插入时间 |

## 📄 许可证 (License)

本项目仅供学习与娱乐使用，请理性看待彩票，切勿沉迷。
