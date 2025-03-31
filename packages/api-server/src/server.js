'use strict';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import cardRoutes from './routes/cardRoutes.js';

const fastify = Fastify({
    logger: true
});

/**
 * 配置Swagger文档
 */
async function setupSwagger() {
    await fastify.register(swagger, {
        swagger: {
            info: {
                title: '信用卡管理API',
                description: '用于管理信用卡测试号码的RESTful API',
                version: '1.0.0'
            },
            host: `${process.env.HOST}:${process.env.PORT}`,
            schemes: ['http'],
            consumes: ['application/json'],
            produces: ['application/json'],
            tags: [
                { name: 'cards', description: '信用卡相关接口' }
            ]
        }
    });

    // 配置Swagger UI
    await fastify.register(swaggerUI, {
        routePrefix: '/documentation',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false
        },
        uiHooks: {
            onRequest: function (request, reply, next) { next() },
            preHandler: function (request, reply, next) { next() }
        },
        staticCSP: true,
        transformStaticCSP: (header) => header
    });
}

/**
 * 配置中间件和插件
 */
async function setupMiddleware() {
    // 注册CORS插件
    await fastify.register(cors, {
        origin: true
    });
}

/**
 * 注册路由
 */
async function setupRoutes() {
    // 注册卡片相关路由
    fastify.register(cardRoutes);
}

/**
 * 启动服务器
 */
async function startServer() {
    try {
        await setupSwagger();
        await setupMiddleware();
        await setupRoutes();

        // 优雅关闭处理
        process.on('SIGINT', async () => {
            fastify.log.info('正在关闭应用...');
            try {
                await fastify.close();
                process.exit(0);
            } catch (error) {
                fastify.log.error('关闭应用时出错:', error);
                process.exit(1);
            }
        });

        // 启动服务器
        const port = process.env.PORT || 3000;
        const host = process.env.HOST || '0.0.0.0';
        fastify.listen({ port, host });
        console.log(`服务器运行在 http://${host}:${port}`);
        console.log(`API文档地址: http://${host}:${port}/documentation`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

// 启动程序
startServer(); 