// ==UserScript==
// @name         获取地址和用户信息
// @namespace    https://github.com/furyolo/creditcardcrack/
// @version      1.0
// @description  获取IP地理位置、详细地址信息以及随机用户数据的组合工具
// @author       Andy
// @match        https://uncoder.eu.org/cc-checker/*
// @grant        GM_xmlhttpRequest
// @require      file:///D:/Coding/creditcardcrack/packages/userscripts/GeoUserInfo.lib.js
// @connect      ipapi.co
// @connect      ip.011102.xyz
// @connect      nominatim.openstreetmap.org
// @connect      randomuser.me
// ==/UserScript==

(function() {
    'use strict';

    const DEBUG = true;

    function debugLog(...args) {
        if (DEBUG) {
            console.log(...args);
        }
    }

    function ensureLibrary() {
        if (!window.GeoUserInfo || typeof window.GeoUserInfo.fetchGeoAndUserInfo !== 'function') {
            throw new Error('GeoUserInfo.lib.js 未加载');
        }
        return window.GeoUserInfo;
    }

    function dispatchGeoData(geoData) {
        window.GeoData = geoData;
        const event = new CustomEvent('geoDataReady', { detail: geoData });
        window.dispatchEvent(event);
    }

    function logGeoData(geoData) {
        const ip = geoData.ip || {};
        const address = geoData.address || {};
        const user = geoData.user || {};

        debugLog('国家代码:', ip.countryCode || 'N/A');
        debugLog('纬度:', ip.latitude || 'N/A');
        debugLog('经度:', ip.longitude || 'N/A');

        debugLog('门牌号:', address.houseNumber || 'N/A');
        debugLog('建筑:', address.building || 'N/A');
        debugLog('街道:', address.road || 'N/A');
        debugLog('区:', address.suburb || 'N/A');
        debugLog('组合地址:', address.combinedAddress || 'N/A');
        debugLog('城市:', address.city || 'N/A');
        debugLog('州/省:', address.state || 'N/A');
        debugLog('邮编:', address.postcode || 'N/A');
        debugLog('国家:', address.country || 'N/A');

        debugLog('性别:', user.gender || 'N/A');
        debugLog('名:', user.firstName || 'N/A');
        debugLog('姓:', user.lastName || 'N/A');
        debugLog('电话:', user.phone || 'N/A');
        debugLog('SSN:', user.SSN || 'N/A');
    }

    async function init() {
        try {
            const geoData = await ensureLibrary().fetchGeoAndUserInfo();
            dispatchGeoData(geoData);
            logGeoData(geoData);
        } catch (error) {
            console.error('获取地址和用户信息失败:', error);
        }
    }

    init();
})();
