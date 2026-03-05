// ==UserScript==
// @name         获取地址和用户信息
// @namespace    https://github.com/furyolo/creditcardcrack/
// @version      1.0
// @description  获取IP地理位置、详细地址信息以及随机用户数据的组合工具
// @author       Andy
// @match        https://uncoder.eu.org/cc-checker/*
// @grant        GM_xmlhttpRequest
// @connect      ipapi.co
// @connect      ip.011102.xyz
// @connect      nominatim.openstreetmap.org
// @connect      randomuser.me
// ==/UserScript==

(function() {
    'use strict';
    
    // 测试模式开关
    const DEBUG = false;
    
    // 测试日志函数
    function debugLog(...args) {
        if (DEBUG) {
            console.log(...args);
        }
    }

    const OSM_BASE_URL = 'https://nominatim.openstreetmap.org/reverse';
    const OSM_FORMAT = 'jsonv2';
    const OSM_ZOOM = 18;
    const NOMINATIM_EMAIL = '';
    const NOMINATIM_USER_AGENT = 'creditcardcrack/1.0';

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

    function parseJsonResponse(response, source) {
        const text = response && response.responseText ? response.responseText : '';
        if (response && response.status && response.status !== 200) {
            throw new Error(`${source} HTTP ${response.status}: ${text.slice(0, 200)}`);
        }
        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error(`${source} 返回非 JSON：${text.slice(0, 200)}`);
        }
    }
    
    // 创建全局命名空间
    window.GeoData = {
        ip: {},
        address: {},
        user: {}
    };
    
    // 用于跟踪请求完成状态
    let requestsCompleted = 0;
    
    // 检查所有请求是否完成并触发事件
    function checkAllRequestsComplete() {
        requestsCompleted++;
        if (requestsCompleted === 3) { // 总共有3个请求
            const event = new CustomEvent('geoDataReady', { detail: window.GeoData });
            window.dispatchEvent(event);
        }
    }
    
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://ip.011102.xyz/',
        onload: function(response) {
            let data;
            try {
                data = parseJsonResponse(response, 'IP 接口');
            } catch (error) {
                console.error('IP接口解析失败:', error);
                checkAllRequestsComplete();
                return;
            }
            
            // 保存IP地理位置数据
            window.GeoData.ip = {
                countryCode: data.IP.Country,
                latitude: data.IP.Latitude,
                longitude: data.IP.Longitude
            };
            
            debugLog('国家代码:', window.GeoData.ip.countryCode);
            debugLog('纬度:', window.GeoData.ip.latitude);
            debugLog('经度:', window.GeoData.ip.longitude);
            
            // 使用获取到的经纬度查询详细地址
            const osmUrl = buildOsmUrl(window.GeoData.ip.latitude, window.GeoData.ip.longitude);
            
            // 发送OSM请求
            GM_xmlhttpRequest({
                method: 'GET',
                url: osmUrl,
                headers: {
                    'User-Agent': NOMINATIM_USER_AGENT,
                    'Accept': 'application/json'
                },
                onload: function(osmResponse) {
                    let addressData;
                    try {
                        addressData = parseJsonResponse(osmResponse, 'OSM 反查');
                    } catch (error) {
                        console.error('获取地址详情失败:', error);
                        checkAllRequestsComplete();
                        return;
                    }
                    const address = addressData.address;
                    
                    window.GeoData.address = {
                        houseNumber: address && address.house_number ? address.house_number : 'N/A',
                        building: address && address.building || 'N/A',
                        road: address && address.road || 'N/A',
                        suburb: address && address.suburb || 'N/A',
                        city: address && address.city || address && address.town || 'N/A',
                        state: address && address.state || 'N/A',
                        postcode: address && address.postcode || 'N/A',
                        country: address && address.country || 'N/A'
                    };
                    
                    // 组合地址（过滤掉N/A值）
                    const addressParts = [
                        window.GeoData.address.houseNumber,
                        window.GeoData.address.building,
                        window.GeoData.address.road, 
                        window.GeoData.address.suburb
                    ].filter(part => part !== 'N/A');
                    
                    window.GeoData.address.combinedAddress = addressParts.join(', ') || 'N/A';
                    
                    debugLog('门牌号:', window.GeoData.address.houseNumber);
                    debugLog('建筑:', window.GeoData.address.building);
                    debugLog('街道:', window.GeoData.address.road);
                    debugLog('区:', window.GeoData.address.suburb);
                    debugLog('组合地址:', window.GeoData.address.combinedAddress);
                    debugLog('城市:', window.GeoData.address.city);
                    debugLog('州/省:', window.GeoData.address.state);
                    debugLog('邮编:', window.GeoData.address.postcode);
                    debugLog('国家:', window.GeoData.address.country);
                    
                    checkAllRequestsComplete();
                },
                onerror: function(error) {
                    console.error('获取地址详情失败:', error);
                    checkAllRequestsComplete();
                }
            });
            
            // 同时发送RandomUser请求
            const randomUserUrl = `https://randomuser.me/api/?nat=${window.GeoData.ip.countryCode}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url: randomUserUrl,
                onload: function(userResponse) {
                    let userData;
                    try {
                        userData = parseJsonResponse(userResponse, 'RandomUser');
                    } catch (error) {
                        console.error('获取用户数据失败:', error);
                        checkAllRequestsComplete();
                        return;
                    }
                    const user = userData.results[0];
                    
                    window.GeoData.user = {
                        gender: user.gender || 'N/A',
                        firstName: user.name.first || 'N/A',
                        lastName: user.name.last || 'N/A',
                        phone: user.phone || 'N/A',
                        SSN: user.id.value || 'N/A'
                    };
                    
                    debugLog('性别:', window.GeoData.user.gender);
                    debugLog('名:', window.GeoData.user.firstName);
                    debugLog('姓:', window.GeoData.user.lastName);
                    debugLog('电话:', window.GeoData.user.phone);
                    debugLog('SSN:', window.GeoData.user.SSN);
                    
                    checkAllRequestsComplete();
                },
                onerror: function(error) {
                    console.error('获取用户数据失败:', error);
                    checkAllRequestsComplete();
                }
            });
            
            checkAllRequestsComplete(); // IP请求完成
        },
        onerror: function(error) {
            console.error('请求失败:', error);
            checkAllRequestsComplete();
        }
    });
})(); 
