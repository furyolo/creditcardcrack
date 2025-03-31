// ==UserScript==
// @name         获取地址和用户信息
// @namespace    https://github.com/furyolo/creditcardcrack/
// @version      1.0
// @description  获取IP地理位置、详细地址信息以及随机用户数据的组合工具
// @author       Andy
// @match        https://uncoder.eu.org/cc-checker/*
// @grant        GM_xmlhttpRequest
// @connect      ipapi.co
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
            const data = JSON.parse(response.responseText);
            
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
            const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${window.GeoData.ip.latitude}&lon=${window.GeoData.ip.longitude}&zoom=18&addressdetails=1&accept-language=en`;
            
            // 发送OSM请求
            GM_xmlhttpRequest({
                method: 'GET',
                url: osmUrl,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                },
                onload: function(osmResponse) {
                    const addressData = JSON.parse(osmResponse.responseText);
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
                    const userData = JSON.parse(userResponse.responseText);
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