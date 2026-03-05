(function() {
    'use strict';

    const OSM_BASE_URL = 'https://nominatim.openstreetmap.org/reverse';
    const OSM_FORMAT = 'jsonv2';
    const OSM_ZOOM = 18;
    const RESPONSE_SNIPPET_LIMIT = 200;
    const NOMINATIM_EMAIL = '';
    const NOMINATIM_USER_AGENT = 'creditcardcrack/1.0';

    function parseJsonResponse(response, source) {
        const text = response && response.responseText ? response.responseText : '';
        const status = response && response.status ? response.status : 0;
        if (status && status !== 200) {
            throw new Error(`${source} HTTP ${status}: ${text.slice(0, RESPONSE_SNIPPET_LIMIT)}`);
        }
        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error(`${source} 返回非 JSON：${text.slice(0, RESPONSE_SNIPPET_LIMIT)}`);
        }
    }

    function buildOsmUrl(latitude, longitude) {
        const url = new URL(OSM_BASE_URL);
        url.searchParams.set('format', OSM_FORMAT);
        url.searchParams.set('lat', String(latitude));
        url.searchParams.set('lon', String(longitude));
        url.searchParams.set('zoom', String(OSM_ZOOM));
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('accept-language', 'en');
        if (NOMINATIM_EMAIL) {
            url.searchParams.set('email', NOMINATIM_EMAIL);
        }
        return url.toString();
    }

    function gmGetJson({ url, headers, source }) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                headers,
                onload: function(response) {
                    try {
                        resolve(parseJsonResponse(response, source));
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: function(error) {
                    reject(new Error(`${source} 请求失败: ${error.message}`));
                }
            });
        });
    }

    async function fetchIpInfo() {
        const data = await gmGetJson({
            url: 'https://ip.011102.xyz/',
            headers: { 'Accept': 'application/json' },
            source: 'IP 接口'
        });
        return {
            countryCode: data.IP.Country,
            latitude: data.IP.Latitude,
            longitude: data.IP.Longitude
        };
    }

    function buildAddressInfo(address) {
        const addressInfo = {
            houseNumber: address.house_number || 'N/A',
            building: address.building || 'N/A',
            road: address.road || 'N/A',
            suburb: address.suburb || 'N/A',
            city: address.city || address.town || 'N/A',
            state: address.state || 'N/A',
            postcode: address.postcode || 'N/A',
            country: address.country || 'N/A'
        };
        const addressParts = [
            addressInfo.houseNumber,
            addressInfo.building,
            addressInfo.road,
            addressInfo.suburb
        ].filter(part => part !== 'N/A');
        return {
            ...addressInfo,
            combinedAddress: addressParts.join(', ') || 'N/A'
        };
    }

    async function fetchOsmAddress(ipInfo) {
        const data = await gmGetJson({
            url: buildOsmUrl(ipInfo.latitude, ipInfo.longitude),
            headers: {
                'User-Agent': NOMINATIM_USER_AGENT,
                'Accept': 'application/json'
            },
            source: 'OSM 反查'
        });
        return buildAddressInfo(data.address || {});
    }

    function buildUserInfo(user) {
        return {
            gender: user.gender || 'N/A',
            firstName: (user.name && user.name.first) || 'N/A',
            lastName: (user.name && user.name.last) || 'N/A',
            phone: user.phone || 'N/A',
            SSN: (user.id && user.id.value) || 'N/A'
        };
    }

    async function fetchRandomUser(countryCode) {
        const data = await gmGetJson({
            url: `https://randomuser.me/api/?nat=${countryCode}`,
            headers: { 'Accept': 'application/json' },
            source: 'RandomUser'
        });
        const user = data.results && data.results[0] ? data.results[0] : {};
        return buildUserInfo(user);
    }

    async function fetchGeoAndUserInfo() {
        const ipInfo = await fetchIpInfo();
        const [address, user] = await Promise.all([
            fetchOsmAddress(ipInfo),
            fetchRandomUser(ipInfo.countryCode)
        ]);
        return {
            ip: ipInfo,
            address,
            user
        };
    }

    window.GeoUserInfo = Object.freeze({
        fetchGeoAndUserInfo
    });
})();
