// ==UserScript==
// @name         Stripe支付助手
// @namespace    https://github.com/furyolo/creditcardcrack/
// @version      1.0
// @description  在Stripe支付页面添加信用卡和地址信息生成功能
// @author       Andy
// @match        https://checkout.stripe.com/c/pay*
// @match        https://billing.stripe.com/p*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @connect      localhost
// @connect      ip.011102.xyz
// @connect      nominatim.openstreetmap.org
// @connect      randomuser.me
// ==/UserScript==

(function() {
    'use strict';

    // 从API获取随机信用卡信息
    async function fetchRandomCard(cardType) {
        return new Promise((resolve, reject) => {
            const url = cardType ? 
                `http://localhost:3000/random-card?type=${cardType}` : 
                'http://localhost:3000/random-card';

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: { 'Accept': 'application/json' },
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.success && data.card) {
                            resolve(data.card);
                        } else {
                            reject(new Error(data.error || '获取卡片信息失败'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: function(error) {
                    reject(new Error('请求失败: ' + error.message));
                }
            });
        });
    }

    // 获取地理位置和用户信息
    async function fetchGeoAndUserInfo() {
        return new Promise((resolve, reject) => {
            let requestsCompleted = 0;
            
            function checkAllRequestsComplete() {
                requestsCompleted++;
                if (requestsCompleted === 3) {
                    resolve(window.GeoData);
                }
            }

            // 获取IP信息
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://ip.011102.xyz/',
                onload: function(response) {
                    const data = JSON.parse(response.responseText);
                    window.GeoData = window.GeoData || {};
                    window.GeoData.ip = {
                        countryCode: data.IP.Country,
                        latitude: data.IP.Latitude,
                        longitude: data.IP.Longitude
                    };

                    // 获取地址信息
                    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${window.GeoData.ip.latitude}&lon=${window.GeoData.ip.longitude}&zoom=18&addressdetails=1&accept-language=en`;
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: osmUrl,
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        onload: function(osmResponse) {
                            const addressData = JSON.parse(osmResponse.responseText);
                            const address = addressData.address;
                            
                            window.GeoData.address = {
                                houseNumber: address?.house_number || 'N/A',
                                building: address?.building || 'N/A',
                                road: address?.road || 'N/A',
                                suburb: address?.suburb || 'N/A',
                                city: address?.city || address?.town || 'N/A',
                                state: address?.state || 'N/A',
                                postcode: address?.postcode || 'N/A',
                                country: address?.country || 'N/A'
                            };
                            
                            const addressParts = [
                                window.GeoData.address.houseNumber,
                                window.GeoData.address.building,
                                window.GeoData.address.road,
                                window.GeoData.address.suburb
                            ].filter(part => part !== 'N/A');
                            
                            window.GeoData.address.combinedAddress = addressParts.join(', ') || 'N/A';
                            checkAllRequestsComplete();
                        },
                        onerror: function() {
                            checkAllRequestsComplete();
                        }
                    });

                    // 获取随机用户信息
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
                            checkAllRequestsComplete();
                        },
                        onerror: function() {
                            checkAllRequestsComplete();
                        }
                    });

                    checkAllRequestsComplete();
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // 创建UI
    function createUI() {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            z-index: 9999;
            width: 300px;
            max-height: 100vh;
            overflow-y: auto;
            font-family: Arial, sans-serif;
        `;

        // 标题
        const title = document.createElement('h3');
        title.textContent = 'Stripe支付助手';
        title.style.margin = '0 0 15px 0';

        // 信用卡类型选择
        const typeSelect = document.createElement('select');
        typeSelect.innerHTML = `
            <option value="">随机类型</option>
            <option value="VISA">Visa</option>
            <option value="MASTERCARD">MasterCard</option>
            <option value="DISCOVER">Discover</option>
            <option value="JCB">JCB</option>
        `;
        typeSelect.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        `;

        // 生成卡号按钮
        const generateButton = document.createElement('button');
        generateButton.textContent = '获取卡号';
        generateButton.style.cssText = `
            width: 100%;
            padding: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 15px;
            transition: background 0.3s;
        `;

        // 获取地址信息按钮
        const geoButton = document.createElement('button');
        geoButton.textContent = '获取地址信息';
        geoButton.style.cssText = generateButton.style.cssText;

        // 卡号信息显示区域
        const cardInfoDisplay = document.createElement('div');
        cardInfoDisplay.style.cssText = `
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
            margin-bottom: 15px;
            font-size: 14px;
            line-height: 1.5;
            display: none;
        `;

        // 地址信息显示区域
        const geoInfoDisplay = document.createElement('div');
        geoInfoDisplay.style.cssText = cardInfoDisplay.style.cssText;

        // 删除卡号功能
        async function deleteCardFromDB(cardNumber) {
            return new Promise((resolve, reject) => {
                const url = `http://localhost:3000/card/${cardNumber}`;

                GM_xmlhttpRequest({
                    method: 'DELETE',
                    url: url,
                    headers: { 
                        'Accept': 'application/json'
                    },
                    onload: function(response) {
                        try {
                            const data = JSON.parse(response.responseText);
                            if (data.success) {
                                resolve(data);
                            } else {
                                reject(new Error(data.error || '删除卡号失败'));
                            }
                        } catch (error) {
                            reject(error);
                        }
                    },
                    onerror: function(error) {
                        reject(new Error('请求失败: ' + error.message));
                    }
                });
            });
        }

        // 复制文本到剪贴板功能
        function copyToClipboard(text) {
            GM_setClipboard(text);
            
            // 创建一个临时元素显示复制成功
            const notification = document.createElement('div');
            notification.textContent = '已复制!';
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(notification);
            
            // 显示通知
            setTimeout(() => {
                notification.style.opacity = '1';
                
                // 设置定时器自动移除通知
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 1500);
            }, 0);
        }
        
        // 创建复制按钮
        function createCopyButton(text) {
            const button = document.createElement('button');
            button.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                </svg>
            `;
            button.style.cssText = `
                background: #f0f0f0;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                padding: 3px;
                margin-left: 5px;
                vertical-align: middle;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            `;
            
            button.addEventListener('mouseover', () => {
                button.style.background = '#e0e0e0';
            });
            
            button.addEventListener('mouseout', () => {
                button.style.background = '#f0f0f0';
            });
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                copyToClipboard(text);
            });
            
            return button;
        }

        // 拖动功能
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        title.style.cursor = 'move';
        title.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            if (e.target === title) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                container.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            }
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        // 填充地址表单的函数
        function fillAddressFields(doc, fields, data) {
            if (!fields || !Object.values(fields).some(field => field)) return false;

            try {
                const fillInput = (input, value) => {
                    if (!input) return;
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype, "value"
                    ).set;
                    nativeInputValueSetter.call(input, value);
                    input.dispatchEvent(new Event('input', {bubbles: true}));
                    input.dispatchEvent(new Event('change', {bubbles: true}));
                    input.dispatchEvent(new Event('blur', {bubbles: true}));
                };
                
                const fillSelect = (select, value) => {
                    if (!select) return;
                    select.value = value;
                    select.dispatchEvent(new Event('change', {bubbles: true}));
                    select.dispatchEvent(new Event('blur', {bubbles: true}));
                };
                
                if (fields.name) fillInput(fields.name, data.name);
                if (fields.address) fillInput(fields.address, data.address);
                if (fields.city) fillInput(fields.city, data.city);
                if (fields.zip) fillInput(fields.zip, data.zip);
                
                if (fields.state) {
                    if (fields.state.tagName === 'SELECT') {
                        const option = Array.from(fields.state.options).find(opt => 
                            opt.text.toLowerCase().includes(data.state.toLowerCase())
                        );
                        if (option) fillSelect(fields.state, option.value);
                    } else {
                        fillInput(fields.state, data.state);
                    }
                }
                
                if (fields.country) {
                    const option = Array.from(fields.country.options).find(opt => 
                        opt.text.toLowerCase().includes(data.country.toLowerCase())
                    );
                    if (option) fillSelect(fields.country, option.value);
                }
                
                return true;
            } catch {
                return false;
            }
        }

        // 填充信用卡表单的函数
        function fillCardFields(doc, fields, data) {
            if (!fields || !Object.values(fields).some(field => field)) return false;

            try {
                const fillInput = (input, value) => {
                    if (!input) return;
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype, "value"
                    ).set;
                    nativeInputValueSetter.call(input, value);
                    input.dispatchEvent(new Event('input', {bubbles: true}));
                    input.dispatchEvent(new Event('change', {bubbles: true}));
                    input.dispatchEvent(new Event('blur', {bubbles: true}));
                };
                
                if (fields.cardNumber) fillInput(fields.cardNumber, data.cardNumber);
                if (fields.expiry) fillInput(fields.expiry, data.expiry);
                if (fields.cvv) fillInput(fields.cvv, data.cvv);
                
                return true;
            } catch {
                return false;
            }
        }

        // 事件处理
        generateButton.addEventListener('click', async () => {
            generateButton.disabled = true;
            generateButton.textContent = '获取中...';
            
            try {
                const card = await fetchRandomCard(typeSelect.value);
                const month = card.expire_month.padStart(2, '0');
                const year = card.expire_year.slice(-2);
                
                // 准备数据并自动填充
                const cardData = {
                    cardNumber: card.card_number,
                    expiry: `${month}${year}`,
                    cvv: card.cvv
                };
                
                let filled = false;
                const cardFields = {
                    cardNumber: document.querySelector('input[name*="number" i]'),
                    expiry: document.querySelector('input[name*="expiry" i]'),
                    cvv: document.querySelector('input[name*="cvc" i]')
                };
                
                filled = fillCardFields(document, cardFields, cardData);
                
                cardInfoDisplay.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <strong>卡号：</strong>${card.card_number}
                            <span id="copy-card-number"></span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <strong>有效期：</strong>${month}/${year}
                            <span id="copy-card-expiry"></span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <strong>CVV：</strong>${card.cvv}
                            <span id="copy-card-cvv"></span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <strong>类型：</strong>${card.card_type}
                        </div>
                    </div>
                    <button id="deleteCardInfo" style="
                        width: 100%;
                        padding: 10px;
                        background: linear-gradient(to right, #ff416c, #ff4b2b);
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 5px rgba(255, 65, 108, 0.2);
                    ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                        删除卡号
                    </button>
                `;

                // 添加复制按钮
                document.getElementById('copy-card-number').appendChild(createCopyButton(card.card_number));
                document.getElementById('copy-card-expiry').appendChild(createCopyButton(`${month}/${year}`));
                document.getElementById('copy-card-cvv').appendChild(createCopyButton(card.cvv));

                if (!filled) {
                    cardInfoDisplay.insertAdjacentHTML('beforeend', '<div style="color: #ff4b2b; margin-top: 10px; text-align: center;" class="error-message">⚠️ 自动填充失败</div>');
                    setTimeout(() => {
                        const errorMsg = cardInfoDisplay.querySelector('.error-message');
                        if (errorMsg) errorMsg.remove();
                    }, 3000);
                }
                
                cardInfoDisplay.style.display = 'block';

                document.getElementById('deleteCardInfo').addEventListener('click', async () => {
                    const deleteBtn = document.getElementById('deleteCardInfo');
                    const originalContent = deleteBtn.innerHTML;
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = `
                        <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" stroke-width="4" stroke-dasharray="32" stroke-dashoffset="16"/>
                        </svg>
                        删除中...
                    `;
                    deleteBtn.style.opacity = '0.7';
                    
                    try {
                        await deleteCardFromDB(card.card_number);
                        // 添加成功消息
                        cardInfoDisplay.insertAdjacentHTML('beforeend', '<div style="color: #4CAF50; margin-top: 10px; text-align: center;" class="success-message">✓ 卡号已成功删除</div>');
                        
                        // 添加淡出动画
                        cardInfoDisplay.style.transition = 'opacity 0.5s ease';
                        
                        // 等待成功消息显示1.5秒后开始淡出
                        setTimeout(() => {
                            cardInfoDisplay.style.opacity = '0';
                            
                            // 动画结束后清空内容并隐藏显示区域
                            setTimeout(() => {
                                cardInfoDisplay.innerHTML = '';
                                cardInfoDisplay.style.display = 'none';
                                cardInfoDisplay.style.opacity = '1';
                            }, 500);
                        }, 1500);
                    } catch (error) {
                        cardInfoDisplay.insertAdjacentHTML('beforeend', `<div style="color: #ff4b2b; margin-top: 10px; text-align: center;" class="error-message">⚠️ 删除失败: ${error.message}</div>`);
                        setTimeout(() => {
                            const errorMsg = cardInfoDisplay.querySelector('.error-message');
                            if (errorMsg) errorMsg.remove();
                        }, 3000);
                    } finally {
                        deleteBtn.disabled = false;
                        deleteBtn.innerHTML = originalContent;
                        deleteBtn.style.opacity = '1';
                    }
                });
            } catch (error) {
                cardInfoDisplay.innerHTML = `<div style="color: red;">获取卡片失败: ${error.message}</div>`;
                cardInfoDisplay.style.display = 'block';
            } finally {
                generateButton.disabled = false;
                generateButton.textContent = '获取卡号';
            }
        });

        geoButton.addEventListener('click', async () => {
            geoButton.disabled = true;
            geoButton.textContent = '获取中...';
            geoInfoDisplay.innerHTML = '<div>正在获取地址信息...</div>';
            geoInfoDisplay.style.display = 'block';
            
            try {
                const geoData = await fetchGeoAndUserInfo();
                
                // 准备数据并自动填充
                const data = {
                    name: `${geoData.user.firstName} ${geoData.user.lastName}`,
                    address: geoData.address.combinedAddress,
                    city: geoData.address.city,
                    state: geoData.address.state,
                    zip: geoData.address.postcode,
                    country: geoData.address.country
                };
                
                let filled = false;
                const fields = {
                    name: document.querySelector('input[name*="name" i]'),
                    address: document.querySelector('input[name*="address" i]'),
                    city: document.querySelector('input[name*="city" i], input[name*="locality" i]'),
                    state: document.querySelector('select[name*="state" i], input[name*="area" i]'),
                    zip: document.querySelector('input[name*="zip" i], input[name*="postalcode" i]'),
                    country: document.querySelector('select[name*="country" i]')
                };
                
                filled = fillAddressFields(document, fields, data);
                
                geoInfoDisplay.innerHTML = `
                    <div style="margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <strong>姓名：</strong>${geoData.user.firstName} ${geoData.user.lastName}
                            <span id="copy-user-name"></span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <strong>地址：</strong>${geoData.address.combinedAddress}
                            <span id="copy-address"></span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <strong>城市：</strong>${geoData.address.city}
                            <span id="copy-city"></span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <strong>州/省：</strong>${geoData.address.state}
                            <span id="copy-state"></span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <strong>邮编：</strong>${geoData.address.postcode}
                            <span id="copy-zip"></span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <strong>国家：</strong>${geoData.address.country}
                        </div>
                    </div>
                `;
                
                // 添加复制按钮
                document.getElementById('copy-user-name').appendChild(
                    createCopyButton(`${geoData.user.firstName} ${geoData.user.lastName}`)
                );
                document.getElementById('copy-address').appendChild(
                    createCopyButton(geoData.address.combinedAddress)
                );
                document.getElementById('copy-city').appendChild(
                    createCopyButton(geoData.address.city)
                );
                document.getElementById('copy-state').appendChild(
                    createCopyButton(geoData.address.state)
                );
                document.getElementById('copy-zip').appendChild(
                    createCopyButton(geoData.address.postcode)
                );

                if (!filled) {
                    geoInfoDisplay.insertAdjacentHTML('beforeend', '<div style="color: #ff4b2b; margin-top: 10px; text-align: center;" class="error-message">⚠️ 自动填充失败</div>');
                    setTimeout(() => {
                        const errorMsg = geoInfoDisplay.querySelector('.error-message');
                        if (errorMsg) errorMsg.remove();
                    }, 3000);
                }
            } catch (error) {
                geoInfoDisplay.innerHTML = `<div style="color: red;">获取地址信息失败: ${error.message}</div>`;
            } finally {
                geoButton.disabled = false;
                geoButton.textContent = '获取地址信息';
            }
        });

        // 组装UI
        container.appendChild(title);
        container.appendChild(typeSelect);
        container.appendChild(generateButton);
        container.appendChild(cardInfoDisplay);
        container.appendChild(geoButton);
        container.appendChild(geoInfoDisplay);
        document.body.appendChild(container);
    }

    // 等待页面加载完成后创建UI
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
})(); 