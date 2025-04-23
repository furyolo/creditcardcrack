# Credit Card Generator Tool

一个用于生成有效测试用信用卡号码的工具集，主要用于支付系统测试和开发环境。

## 功能特点

- **信用卡生成**

  - 生成符合 Luhn 算法的有效信用卡号码
  - 支持多种信用卡类型 (Visa, MasterCard, Discover, JCB)
  - 自动生成有效期和CVV码
  - 支持批量生成和单张生成

- **地址信息生成**

  - 基于IP自动获取地理位置信息
  - 生成真实有效的地址信息
  - 支持多国家地址格式
  - 自动匹配国家代码

- **用户信息生成**

  - 生成随机用户姓名
  - 生成有效的电话号码
  - 生成SSN号码
  - 支持多国家用户信息

- **表单自动填充**

  - 支持Stripe支付表单自动填充
  - 智能识别表单字段
  - 支持信用卡和地址信息一键填充
  - 支持删除已使用的卡号

## 系统要求

- Node.js >= 18
- pnpm >= 10
- PostgreSQL >= 14
- 现代浏览器（Chrome、Firefox、Edge等）

## 项目结构

```text
creditcardcrack/
├── packages/                     # 项目代码包
│   ├── api-server/               # 后端 API 服务器
│   │   ├── src/                  # 源代码
│   │   │   ├── server.js         # 服务器入口文件
│   │   │   └── routes/           # API路由定义
│   │   ├── prisma/               # Prisma ORM配置
│   │   │   ├── schema.prisma     # 数据库模型定义
│   │   │   └── migrations/       # 数据库迁移文件
│   │   ├── .env                  # 环境配置
│   │   └── package.json          # 依赖管理
│   │
│   └── userscripts/              # 浏览器用户脚本
│       ├── StripeHelper.user.js  # Stripe支付助手
│       ├── GenCreditNum.user.js  # 信用卡号生成工具
│       └── GeoUserInfo.js        # 地理和用户信息助手
│
├── .gitignore                    # Git忽略文件
└── README.md                     # 项目说明文档
```

## 安装与使用

### API 服务器

1. 克隆项目并进入目录

   ```bash
   git clone https://github.com/yourusername/creditcardcrack.git
   cd creditcardcrack
   ```

2. 安装依赖

   ```bash
   pnpm install
   ```

3. 配置环境变量

   ```bash
   cp packages/api-server/.env.example packages/api-server/.env
   ```

   编辑 `.env` 文件，配置以下信息：

   ```ini
   DATABASE_URL="postgresql://user:password@localhost:5432/creditcard_db"
   ```

4. 初始化数据库

   ```bash
   # 在项目根目录执行
   pnpm db:migrate
   # 或者在api-server目录下执行
   cd packages/api-server
   npx prisma migrate dev
   ```

5. 启动服务器

   ```bash
   # 在项目根目录执行
   pnpm start:api
   # 或者在api-server目录下执行
   cd packages/api-server
   pnpm start
   ```

### 用户脚本安装

1. 安装浏览器扩展

   - Chrome: 安装 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: 安装 [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - Edge: 安装 [Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. 安装用户脚本（以下两种方法二选一）：

   **方法1: 从本地文件安装**

   - 打开Tampermonkey -> 仪表盘 -> 实用工具 -> 导入脚本
   - 选择项目中 `packages/userscripts/` 目录下的 `.js` 和 `.user.js` 文件

   **方法2: 如果服务器已配置脚本访问路径**

   - 启动API服务器后访问 `http://localhost:3000/scripts/StripeHelper.user.js`
   - 点击"安装"按钮
   - 重复上述步骤安装 `GeoUserInfo.js` 和 `GenCreditNum.user.js`

## API 文档

启动服务器后，可通过以下地址访问 Swagger API 文档：
`http://localhost:3000/documentation`

### 主要API端点

- `GET /random-card` - 获取随机信用卡信息
- `DELETE /card/:cardNumber` - 删除指定卡号
- `POST /save-cards` - 批量保存信用卡信息
- `PUT /card/:cardNumber` - 更新信用卡信息

## 常见问题

1. **数据库连接失败**

   - 检查数据库服务是否运行
   - 验证数据库连接字符串是否正确
   - 确认数据库用户权限

2. **用户脚本不生效**

   - 确认Tampermonkey已正确安装
   - 检查脚本是否在正确的网站上运行
   - 查看浏览器控制台是否有错误信息

3. **API请求失败**

   - 确认API服务器正在运行
   - 检查网络连接
   - 验证请求URL和参数是否正确

4. **生成的信用卡号码安全性**

   - 生成的卡号仅用于测试环境
   - 所有生成的卡号都带有特殊标记
   - 定期清理已使用的测试卡号
   - 不建议在生产环境中使用

5. **批量生成时的性能问题**

   - 建议单次生成不超过100张卡
   - 使用数据库缓存提高性能
   - 可以通过API参数调整生成速度
   - 支持断点续传功能

6. **地址信息的准确性**

   - 地址数据来源于公开地理数据库
   - 定期更新地址库确保准确性
   - 支持手动修正地址信息
   - 提供地址验证API

7. **跨浏览器兼容性**

   - 完整支持Chrome、Firefox和Edge最新版本
   - Safari需要额外配置
   - 移动浏览器可能存在限制
   - 建议使用Chrome获得最佳体验

8. **数据保护和隐私**

   - 所有生成的数据仅存储在本地
   - 支持数据自动清理功能
   - 不收集任何真实用户信息
   - 提供数据导出和删除功能

## 更新日志

### v1.0.0 (2024-03-31)

- 初始版本发布
- 支持基本信用卡生成功能
- 支持地址和用户信息生成
- 支持Stripe表单自动填充

## 贡献指南

1. Fork 项目

2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)

3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)

4. 推送到分支 (`git push origin feature/AmazingFeature`)

5. 创建 Pull Request

## 许可证

本项目仅用于教育目的和开发测试，不得用于任何非法活动。使用本工具进行任何非法活动造成的后果由使用者自行承担。

## 联系方式

- 提交 Issue
