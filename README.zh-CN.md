# Credit Card Test Tool | 信用卡测试工具

**Language / 语言选择:**
[English](README.md) | **中文**

---

一个用于生成测试用信用卡号码和相关信息的完整工具集，专为支付系统开发和测试环境设计。

## 📋 目录

- [功能特点](#功能特点)
- [系统要求](#系统要求)
- [项目架构](#项目架构)
- [快速开始](#快速开始)
- [API文档](#api文档)
- [用户脚本](#用户脚本)
- [常见问题](#常见问题)

## ✨ 功能特点

### 🎴 信用卡生成

- 生成符合 Luhn 算法的有效测试卡号
- 支持多种卡类型：Visa、MasterCard、Discover、JCB
- 自动生成有效期（MM/YYYY）和 CVV 码
- 支持批量生成和单张生成
- 数据库持久化存储

### 🌍 地理位置服务

- 基于真实 IP 自动获取地理位置
- 使用 OpenStreetMap 反向地理编码
- 生成完整的地址信息（门牌号、街道、城市、州、邮编）
- 自动匹配国家代码

### 👤 用户信息生成

- 生成随机测试用户姓名
- 生成符合国家格式的电话号码
- 生成 SSN/身份证号码
- 支持多国家用户信息（基于 IP 地理位置）

### 🤖 浏览器自动化

- **StripeHelper** - Stripe 支付表单自动填充
- **GenCreditNum** - 信用卡号生成和管理界面
- **GeoUserInfo** - 地理位置和用户信息获取
- 智能表单字段识别
- 一键复制功能
- 拖拽式悬浮窗口

### 🔐 API 安全

- API Key 鉴权机制
- 可配置的鉴权开关
- 请求头验证（x-api-key）

## 📦 系统要求

- **Node.js** >= 18.0.0
- **pnpm** >= 10.0.0
- **PostgreSQL** >= 14
- **浏览器扩展**: Tampermonkey（Chrome/Firefox/Edge）

## 🏗️ 项目架构

```
creditcardcrack/
├── packages/
│   ├── api-server/              # 后端 API 服务
│   │   ├── src/
│   │   │   ├── server.js        # Fastify 服务器入口
│   │   │   ├── controllers/     # 业务逻辑控制器
│   │   │   │   └── cardController.js
│   │   │   ├── routes/          # API 路由定义
│   │   │   │   └── cardRoutes.js
│   │   │   ├── hooks/           # 请求钩子（鉴权）
│   │   │   │   └── apiKeyAuth.js
│   │   │   └── db/              # 数据库客户端
│   │   │       └── prismaClient.js
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # 数据模型定义
│   │   │   └── migrations/      # 数据库迁移
│   │   └── package.json
│   │
│   └── userscripts/             # 浏览器用户脚本
│       ├── StripeHelper.user.js      # Stripe 表单助手
│       ├── GenCreditNum.user.js      # 卡号生成器
│       ├── GeoUserInfo.user.js       # 地理信息获取
│       └── GeoUserInfo.lib.js        # 共享库
│
├── package.json                 # 根项目配置
├── CLAUDE.md                    # AI 助手指南
└── README.md                    # 项目文档
```

### 技术栈

**后端:**
- Fastify - 高性能 Web 框架
- Prisma - 现代化 ORM
- PostgreSQL - 关系型数据库
- Swagger/OpenAPI - API 文档

**前端/脚本:**
- Tampermonkey - 用户脚本管理器
- GM API - 跨域请求和存储

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/creditcardcrack.git
cd creditcardcrack
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建 `packages/api-server/.env` 文件：

```ini
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/creditcards?schema=public"

# 服务器配置
HOST="0.0.0.0"
PORT="3227"

# API 鉴权（可选）
REQUIRE_API_KEY=true
API_KEY=your_secret_api_key_here
```

**鉴权说明：**
- `REQUIRE_API_KEY=false` - 禁用鉴权（仅本地开发）
- `REQUIRE_API_KEY=true` - 启用鉴权（生产环境推荐）

### 4. 初始化数据库

```bash
# 运行数据库迁移
pnpm db:migrate

# （可选）打开数据库管理界面
pnpm db:studio
```

### 5. 启动 API 服务器

```bash
# 生产模式
pnpm start:api

# 开发模式（支持热重载）
pnpm dev:api
```

服务器将运行在 `http://localhost:3227`

### 6. 安装用户脚本

#### 方法 1: 从本地文件安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 打开 Tampermonkey 仪表盘
3. 点击 "实用工具" → "导入"
4. 选择 `packages/userscripts/` 目录下的文件：
   - `GeoUserInfo.lib.js` （必须先安装）
   - `StripeHelper.user.js`
   - `GenCreditNum.user.js`
   - `GeoUserInfo.user.js`

#### 方法 2: 通过 URL 安装（如果服务器已配置）

访问以下 URL 并点击安装：
- `http://localhost:3227/scripts/StripeHelper.user.js`
- `http://localhost:3227/scripts/GenCreditNum.user.js`
- `http://localhost:3227/scripts/GeoUserInfo.user.js`

**首次使用：**
启用 API Key 鉴权后，用户脚本首次调用接口会提示输入 API Key，输入后将自动保存。

## 📚 API 文档

启动服务器后访问 Swagger 文档：
```
http://localhost:3227/documentation
```

### 主要端点

所有请求需要在请求头中携带 `x-api-key`（如果启用鉴权）。

#### 获取随机卡号
```http
GET /random-card?type=visa
```

**查询参数：**
- `type` (可选): 卡类型 - `visa`, `mastercard`, `discover`, `jcb`

**响应示例：**
```json
{
  "success": true,
  "card": {
    "card_type": "VISA",
    "card_number": "4532123456789012",
    "expire_month": "12",
    "expire_year": "2028",
    "cvv": "123",
    "formatted_info": "4532 1234 5678 9012 | 12/2028 | 123"
  }
}
```

#### 批量保存卡号
```http
POST /save-cards
Content-Type: application/json

{
  "cards": [
    {
      "card_type": "VISA",
      "card_number": "4532123456789012",
      "expire_month": "12",
      "expire_year": "2028",
      "cvv": "123",
      "formatted_info": "4532 1234 5678 9012 | 12/2028 | 123"
    }
  ]
}
```

#### 删除卡号
```http
DELETE /card/4532123456789012
```

#### 更新卡号信息
```http
PUT /card/4532123456789012
Content-Type: application/json

{
  "expire_month": "06",
  "expire_year": "2029"
}
```

#### 获取统计信息
```http
GET /stats
```

**响应示例：**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "by_type": [
      { "card_type": "VISA", "count": 80 },
      { "card_type": "MASTERCARD", "count": 70 }
    ]
  }
}
```

## 🔧 用户脚本

### StripeHelper - Stripe 支付助手

**适用页面：**
- `https://checkout.stripe.com/c/pay*`
- `https://billing.stripe.com/p*`

**功能：**
- 自动填充信用卡信息
- 自动填充账单地址
- 一键复制卡号/CVV/邮编
- 删除已使用的卡号

**使用方法：**
1. 访问 Stripe 支付页面
2. 点击悬浮窗口中的"生成信用卡"按钮
3. 选择卡类型（Visa/MasterCard/Discover/JCB）
4. 点击"获取地址信息"自动填充地址
5. 表单将自动填充完成

### GenCreditNum - 信用卡生成器

**适用页面：**
- `https://uncoder.eu.org/cc-checker/*`

**功能：**
- 生成单张或批量信用卡号
- 实时 Luhn 算法验证
- 一键复制功能
- 保存到数据库

### GeoUserInfo - 地理信息助手

**适用页面：**
- `https://uncoder.eu.org/cc-checker/*`

**功能：**
- 基于 IP 获取地理位置
- 生成完整地址信息
- 生成随机用户信息
- 自动匹配国家代码

## ❓ 常见问题

### 1. 数据库连接失败

**问题：** `Error: Can't reach database server`

**解决方案：**
- 确认 PostgreSQL 服务正在运行
- 验证 `.env` 中的 `DATABASE_URL` 是否正确
- 检查数据库用户权限
- 确认数据库已创建：`CREATE DATABASE creditcards;`

### 2. 用户脚本不生效

**问题：** 脚本安装后没有显示悬浮窗口

**解决方案：**
- 确认 Tampermonkey 已启用
- 检查脚本是否在正确的网站上运行（查看 `@match` 规则）
- 打开浏览器控制台查看错误信息
- 确认 `GeoUserInfo.lib.js` 已正确安装

### 3. API 请求失败 (401 Unauthorized)

**问题：** `{"success": false, "error": "Missing API key"}`

**解决方案：**
- 确认 `.env` 中 `REQUIRE_API_KEY=true`
- 在用户脚本中输入正确的 API Key
- 检查请求头是否包含 `x-api-key`
- 本地测试可设置 `REQUIRE_API_KEY=false`

### 4. 跨域请求被阻止

**问题：** CORS 错误

**解决方案：**
- 确认 Tampermonkey 中的 `@connect` 指令包含目标域名
- API 服务器已启用 CORS（默认配置）
- 使用 `GM_xmlhttpRequest` 而非 `fetch`

### 5. 生成的卡号无效

**问题：** Luhn 算法验证失败

**解决方案：**
- 检查 BIN 前缀是否正确
- 确认卡号长度为 16 位
- 验证生成逻辑中的 Luhn 校验和计算

### 6. 地址信息获取失败

**问题：** OpenStreetMap API 返回错误

**解决方案：**
- 检查网络连接
- 确认 IP 地理位置服务可用
- OSM Nominatim 有请求频率限制，请适当延迟请求
- 检查 `@connect` 权限是否包含相关域名

## ⚠️ 免责声明

本项目仅用于教育目的和开发测试环境。生成的信用卡号码仅为测试数据，不得用于任何真实交易或非法活动。使用本工具进行任何非法活动造成的后果由使用者自行承担。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request
