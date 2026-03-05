# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个信用卡测试号码生成工具集，主要用于支付系统测试和开发环境。项目包含API服务器和浏览器用户脚本两部分。

## 常用命令

### 环境设置
```bash
pnpm install                    # 安装所有依赖
pnpm db:migrate               # 运行数据库迁移
pnpm db:studio                # 打开Prisma Studio数据库管理界面
```

### 开发和运行
```bash
pnpm start:api                # 启动API服务器 (生产模式)
pnpm dev:api                  # 启动API服务器 (开发模式，支持热重载)
```

## 项目架构

### Monorepo结构
项目使用pnpm workspace管理，包含两个主要包：
- `packages/api-server` - 后端API服务器
- `packages/userscripts` - 浏览器用户脚本

### API服务器架构
基于Fastify框架构建，采用MVC架构模式：
- `src/server.js` - 服务器入口，配置Swagger、CORS等中间件
- `src/controllers/` - 控制器层，处理业务逻辑
- `src/routes/` - 路由层，定义API端点
- `src/services/` - 服务层，封装数据操作
- `src/utils/` - 工具函数

### 数据库
- 使用PostgreSQL数据库
- Prisma ORM管理数据模型
- 单表`creditcards`存储信用卡测试信息
- 支持数据库迁移和版本控制

## 核心功能

### 信用卡生成
- 生成符合Luhn算法的有效信用卡号码
- 支持多种卡类型：Visa、MasterCard、Discover、JCB
- 自动生成有效期和CVV码

### API端点
- `GET /random-card` - 获取随机信用卡信息
- `DELETE /card/:cardNumber` - 删除指定卡号
- `POST /save-cards` - 批量保存信用卡信息
- `PUT /card/:cardNumber` - 更新信用卡信息

### 用户脚本
- `StripeHelper.user.js` - Stripe支付表单自动填充
- `GenCreditNum.user.js` - 信用卡号生成工具
- `GeoUserInfo.user.js` - 地理位置和用户信息生成

## 技术栈

- **Runtime**: Node.js >= 18
- **Package Manager**: pnpm >= 10
- **Web Framework**: Fastify
- **Database**: PostgreSQL >= 14
- **ORM**: Prisma
- **API Documentation**: Swagger
- **Userscripts**: Tampermonkey

## 环境配置

在`packages/api-server/.env`中配置：
```ini
DATABASE_URL="postgresql://user:password@localhost:5432/creditcard_db"
HOST="0.0.0.0"
PORT="3000"
```

## API文档

启动服务器后访问 `http://localhost:3227/documentation` 查看Swagger API文档。
