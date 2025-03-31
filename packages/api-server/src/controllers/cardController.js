import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// 批量保存信用卡信息
export async function saveCards(request, reply) {
    const { cards } = request.body;
    
    try {
        const results = {
            saved: [],
            duplicates: []
        };

        for (const card of cards) {
            try {
                const result = await prisma.creditcards.create({
                    data: {
                        card_type: card.card_type,
                        card_number: card.card_number,
                        expire_month: card.expire_month,
                        expire_year: card.expire_year,
                        cvv: card.cvv,
                        formatted_info: card.formatted_info
                    }
                });
                results.saved.push(card.card_number);
            } catch (error) {
                if (error.code === 'P2002') {
                    results.duplicates.push(card.card_number);
                } else {
                    request.log.error('Error processing card:', card.card_number, error);
                    results.duplicates.push(card.card_number);
                }
            }
        }

        return { 
            success: true,
            results: results
        };
    } catch (error) {
        request.log.error('Database error:', error);
        return reply.status(500).send({ 
            success: false, 
            error: error.message 
        });
    }
}

// 添加单张信用卡信息
export async function addCard(request, reply) {
    const card = request.body;
    
    try {
        const result = await prisma.creditcards.create({
            data: {
                card_type: card.card_type,
                card_number: card.card_number,
                expire_month: card.expire_month,
                expire_year: card.expire_year,
                cvv: card.cvv,
                formatted_info: card.formatted_info
            }
        });

        return {
            success: true,
            card_number: result.card_number
        };
    } catch (error) {
        if (error.code === 'P2002') {
            return reply.status(409).send({
                success: false,
                error: '卡号已存在'
            });
        }
        request.log.error('添加卡片错误:', error);
        return reply.status(500).send({
            success: false,
            error: error.message
        });
    }
}

// 删除指定卡号的信用卡信息
export async function deleteCard(request, reply) {
    const { cardNumber } = request.params;
    
    try {
        const result = await prisma.creditcards.delete({
            where: {
                card_number: cardNumber
            }
        });

        return {
            success: true,
            deleted_card: cardNumber
        };
    } catch (error) {
        if (error.code === 'P2025') {
            return reply.status(404).send({
                success: false,
                error: '卡号不存在'
            });
        }
        request.log.error('删除卡片错误:', error);
        return reply.status(500).send({
            success: false,
            error: error.message
        });
    }
}

// 随机获取一条信用卡信息
export async function getRandomCard(request, reply) {
    const { type } = request.query;
    
    try {
        const where = type ? { card_type: type.toUpperCase() } : {};
        const [result] = await prisma.$transaction([
            prisma.creditcards.findMany({
                where,
                take: 1,
                orderBy: {
                    id: 'asc'
                },
                skip: Math.floor(Math.random() * await prisma.creditcards.count({ where }))
            })
        ]);

        if (result.length === 0) {
            return reply.status(404).send({
                success: false,
                error: type ? `没有找到${type}类型的卡片` : '数据库中没有卡片记录'
            });
        }

        return {
            success: true,
            card: result[0]
        };
    } catch (error) {
        request.log.error('随机查询卡片错误:', error);
        return reply.status(500).send({
            success: false,
            error: error.message
        });
    }
}

// 更新一条信用卡信息
export async function updateCard(request, reply) {
    const { cardNumber } = request.params;
    const updates = request.body;
    
    try {
        if (Object.keys(updates).length === 0) {
            return reply.status(400).send({
                success: false,
                error: '没有提供要更新的字段'
            });
        }

        const result = await prisma.creditcards.update({
            where: {
                card_number: cardNumber
            },
            data: updates
        });

        return {
            success: true,
            updated_card: result
        };
    } catch (error) {
        if (error.code === 'P2025') {
            return reply.status(404).send({
                success: false,
                error: '卡号不存在'
            });
        }
        request.log.error('更新卡片错误:', error);
        return reply.status(500).send({
            success: false,
            error: error.message
        });
    }
}


// 卡片库存统计
export async function getCardStats(request, reply) {
    try {
        const totalCount = await prisma.creditcards.count();
        const typeStats = await prisma.$queryRaw`
            SELECT card_type, COUNT(*) as count 
            FROM creditcards 
            GROUP BY card_type
        `;
        
        return {
            success: true,
            stats: {
                total: totalCount,
                by_type: typeStats
            }
        };
    } catch (error) {
        request.log.error('统计卡片错误:', error);
        return reply.status(500).send({
            success: false,
            error: error.message
        });
    }
} 