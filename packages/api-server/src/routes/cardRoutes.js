import { saveCards, addCard, deleteCard, getRandomCard, updateCard, getCardStats } from '../controllers/cardController.js';

// JSON Schema 定义
const cardSchema = {
    type: 'object',
    required: ['cards'],
    properties: {
        cards: {
            type: 'array',
            items: {
                type: 'object',
                required: ['card_type', 'card_number', 'expire_month', 'expire_year', 'cvv', 'formatted_info'],
                properties: {
                    card_type: { type: 'string' },
                    card_number: { type: 'string' },
                    expire_month: { type: 'string' },
                    expire_year: { type: 'string' },
                    cvv: { type: 'string' },
                    formatted_info: { type: 'string' }
                }
            }
        }
    }
};

const singleCardSchema = {
    type: 'object',
    required: ['card_type', 'card_number', 'expire_month', 'expire_year', 'cvv', 'formatted_info'],
    properties: {
        card_type: { type: 'string' },
        card_number: { type: 'string' },
        expire_month: { type: 'string' },
        expire_year: { type: 'string' },
        cvv: { type: 'string' },
        formatted_info: { type: 'string' }
    }
};

const updateCardSchema = {
    type: 'object',
    properties: {
        card_type: { type: 'string' },
        expire_month: { type: 'string' },
        expire_year: { type: 'string' },
        cvv: { type: 'string' },
        formatted_info: { type: 'string' }
    },
    minProperties: 1
};

// 定义路由
export default function cardRoutes(fastify, options, done) {
    // 批量保存信用卡信息
    fastify.post('/save-cards', {
        schema: {
            tags: ['cards'],
            description: '批量保存信用卡信息',
            body: cardSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        results: {
                            type: 'object',
                            properties: {
                                saved: { 
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                duplicates: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, saveCards);

    // 添加单张信用卡信息
    fastify.post('/add-card', {
        schema: {
            tags: ['cards'],
            description: '添加单张信用卡信息',
            body: singleCardSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        card_number: { type: 'string' }
                    }
                },
                409: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, addCard);

    // 删除指定卡号的信用卡信息
    fastify.delete('/card/:cardNumber', {
        schema: {
            tags: ['cards'],
            description: '删除指定卡号的信用卡信息',
            params: {
                type: 'object',
                required: ['cardNumber'],
                properties: {
                    cardNumber: { 
                        type: 'string',
                        description: '要删除的信用卡号'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        deleted_card: { type: 'string' }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, deleteCard);

    // 随机获取一条信用卡信息
    fastify.get('/random-card', {
        schema: {
            tags: ['cards'],
            description: '随机获取一条信用卡信息',
            querystring: {
                type: 'object',
                properties: {
                    type: { 
                        type: 'string',
                        description: '信用卡类型(可选)',
                        enum: ['VISA', 'MASTERCARD', 'DISCOVER', 'JCB']
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        card: {
                            type: 'object',
                            properties: {
                                card_type: { type: 'string' },
                                card_number: { type: 'string' },
                                expire_month: { type: 'string' },
                                expire_year: { type: 'string' },
                                cvv: { type: 'string' },
                                formatted_info: { type: 'string' }
                            }
                        }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, getRandomCard);

    // 更新一条信用卡信息
    fastify.put('/card/:cardNumber', {
    schema: {
        tags: ['cards'],
        description: '更新指定卡号的信用卡信息',
        params: {
            type: 'object',
            required: ['cardNumber'],
            properties: {
                cardNumber: { 
                    type: 'string',
                    description: '要更新的信用卡号'
                }
            }
        },
        body: updateCardSchema,
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    updated_card: {
                        type: 'object',
                        properties: {
                            card_type: { type: 'string' },
                            card_number: { type: 'string' },
                            expire_month: { type: 'string' },
                            expire_year: { type: 'string' },
                            cvv: { type: 'string' },
                            formatted_info: { type: 'string' }
                        }
                    }
                }
            },
            400: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    error: { type: 'string' }
                }
            },
            404: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    error: { type: 'string' }
                }
            },
            500: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    error: { type: 'string' }
                }
            }
        }
        }
    }, updateCard);
    
    // 获取卡片库存统计
    fastify.get('/card-stats', {
        schema: {
            tags: ['cards'],
            description: '获取卡片库存统计',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        stats: {
                            type: 'object',
                            properties: {
                                total: { type: 'number' },
                                by_type: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            card_type: { type: 'string' },
                                            count: { type: 'number' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, getCardStats);

    done();
} 