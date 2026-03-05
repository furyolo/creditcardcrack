const TRUE_VALUES = new Set(['true', '1', 'yes']);
const FALSE_VALUES = new Set(['false', '0', 'no']);

const API_KEY_HEADER = 'x-api-key';
const STATUS_UNAUTHORIZED = 401;

function normalizeHeaderValue(value) {
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }
    if (typeof value === 'string') {
        return value;
    }
    return '';
}

export function parseRequiredBoolean(name) {
    const rawValue = process.env[name];
    if (!rawValue) {
        throw new Error(`Missing required env: ${name}`);
    }
    const normalized = rawValue.trim().toLowerCase();
    if (TRUE_VALUES.has(normalized)) {
        return true;
    }
    if (FALSE_VALUES.has(normalized)) {
        return false;
    }
    throw new Error(`Invalid boolean env value for ${name}: ${rawValue}`);
}

export function resolveApiKeyConfig() {
    const requireApiKey = parseRequiredBoolean('REQUIRE_API_KEY');
    const apiKey = (process.env.API_KEY ?? '').trim();

    if (requireApiKey && !apiKey) {
        throw new Error('API_KEY is required when REQUIRE_API_KEY is true');
    }

    return { requireApiKey, apiKey };
}

export function buildApiKeyAuthHook({ requireApiKey, apiKey }) {
    if (!requireApiKey) {
        return async function noAuth() {};
    }

    return async function apiKeyAuth(request, reply) {
        const provided = normalizeHeaderValue(request.headers[API_KEY_HEADER]);
        if (provided === apiKey) {
            return;
        }
        reply.status(STATUS_UNAUTHORIZED).send({
            success: false,
            error: 'Unauthorized'
        });
    };
}
