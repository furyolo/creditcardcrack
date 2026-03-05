const DUPLICATE_ERROR_CODE = 'P2002';
const NOT_FOUND_ERROR_CODE = 'P2025';

const STATUS_BAD_REQUEST = 400;
const STATUS_CONFLICT = 409;
const STATUS_NOT_FOUND = 404;
const STATUS_SERVER_ERROR = 500;

function mapCardData(card) {
    return {
        card_type: card.card_type,
        card_number: card.card_number,
        expire_month: card.expire_month,
        expire_year: card.expire_year,
        cvv: card.cvv,
        formatted_info: card.formatted_info
    };
}

function isDuplicateError(error) {
    return error?.code === DUPLICATE_ERROR_CODE;
}

function isNotFoundError(error) {
    return error?.code === NOT_FOUND_ERROR_CODE;
}

function sendError(reply, status, message) {
    return reply.status(status).send({
        success: false,
        error: message
    });
}

function logServerError(request, reply, message, error) {
    request.log.error(message, error);
    return sendError(reply, STATUS_SERVER_ERROR, error.message);
}

export function buildCardController({ prisma }) {
    return {
        saveCards: buildSaveCards(prisma),
        addCard: buildAddCard(prisma),
        deleteCard: buildDeleteCard(prisma),
        getRandomCard: buildGetRandomCard(prisma),
        updateCard: buildUpdateCard(prisma),
        getCardStats: buildGetCardStats(prisma)
    };
}

function buildSaveCards(prisma) {
    return async function saveCards(request, reply) {
        const { cards } = request.body;
        const results = { saved: [], duplicates: [] };

        try {
            for (const card of cards) {
                try {
                    await prisma.creditcards.create({
                        data: mapCardData(card)
                    });
                    results.saved.push(card.card_number);
                } catch (error) {
                    if (isDuplicateError(error)) {
                        results.duplicates.push(card.card_number);
                        continue;
                    }
                    throw error;
                }
            }
        } catch (error) {
            return logServerError(request, reply, 'Database error:', error);
        }

        return {
            success: true,
            results
        };
    };
}

function buildAddCard(prisma) {
    return async function addCard(request, reply) {
        const card = request.body;

        try {
            const result = await prisma.creditcards.create({
                data: mapCardData(card)
            });

            return {
                success: true,
                card_number: result.card_number
            };
        } catch (error) {
            if (isDuplicateError(error)) {
                return sendError(reply, STATUS_CONFLICT, '卡号已存在');
            }
            return logServerError(request, reply, '添加卡片错误:', error);
        }
    };
}

function buildDeleteCard(prisma) {
    return async function deleteCard(request, reply) {
        const { cardNumber } = request.params;

        try {
            await prisma.creditcards.delete({
                where: {
                    card_number: cardNumber
                }
            });

            return {
                success: true,
                deleted_card: cardNumber
            };
        } catch (error) {
            if (isNotFoundError(error)) {
                return sendError(reply, STATUS_NOT_FOUND, '卡号不存在');
            }
            return logServerError(request, reply, '删除卡片错误:', error);
        }
    };
}

function buildGetRandomCard(prisma) {
    return async function getRandomCard(request, reply) {
        const { type } = request.query;
        const where = type ? { card_type: type.toUpperCase() } : {};

        try {
            const total = await prisma.creditcards.count({ where });
            if (total === 0) {
                return sendError(
                    reply,
                    STATUS_NOT_FOUND,
                    type ? `没有找到${type}类型的卡片` : '数据库中没有卡片记录'
                );
            }

            const skip = Math.floor(Math.random() * total);
            const cards = await prisma.creditcards.findMany({
                where,
                take: 1,
                skip,
                orderBy: {
                    id: 'asc'
                }
            });

            return {
                success: true,
                card: cards[0]
            };
        } catch (error) {
            return logServerError(request, reply, '随机查询卡片错误:', error);
        }
    };
}

function buildUpdateCard(prisma) {
    return async function updateCard(request, reply) {
        const { cardNumber } = request.params;
        const updates = request.body;

        if (Object.keys(updates).length === 0) {
            return sendError(reply, STATUS_BAD_REQUEST, '没有提供要更新的字段');
        }

        try {
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
            if (isNotFoundError(error)) {
                return sendError(reply, STATUS_NOT_FOUND, '卡号不存在');
            }
            return logServerError(request, reply, '更新卡片错误:', error);
        }
    };
}

function buildGetCardStats(prisma) {
    return async function getCardStats(request, reply) {
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
            return logServerError(request, reply, '统计卡片错误:', error);
        }
    };
}
