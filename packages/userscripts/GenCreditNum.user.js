// ==UserScript==
// @name         信用卡号生成器
// @namespace    https://github.com/furyolo/creditcardcrack/
// @version      1.0
// @description  生成有效的信用卡测试号码
// @author       Andy
// @match        https://uncoder.eu.org/cc-checker/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @connect      localhost
// ==/UserScript==

(function() {
    'use strict';

    // Luhn算法验证
    function luhnCheck(num) {
        const arr = (num + '').split('').reverse().map(x => parseInt(x));
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
            if (i % 2 !== 0) {
                let doubled = arr[i] * 2;
                if (doubled > 9) doubled -= 9;
                arr[i] = doubled;
            }
            sum += arr[i];
        }
        return sum % 10 === 0;
    }

    // 生成随机数字
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 生成信用卡号
    function generateCreditCard(cardType = 'visa') {
        let bins;
        if (cardType.toLowerCase() === 'visa') {
            bins = ['4532', '4539', '4556', '4916', '4929', '4485', '4716'];
        } else if (cardType.toLowerCase() === 'mastercard') {
            bins = ['5123', '5234', '5452', '5567', '5187', '5289', '5445'];
        } else if (cardType.toLowerCase() === 'discover') {
            bins = ['6011', '6441', '6442', '6443', '6444', '6445', '6446', '6447', '6448', '6449'];
        } else if (cardType.toLowerCase() === 'jcb') {
            bins = ['3528', '3529', '3530', '3531', '3532', '3533', '3534', '3535'];
        } else {
            throw new Error("不支持的卡类型");
        }

        let ccNum = bins[Math.floor(Math.random() * bins.length)];

        // 生成剩余数字
        while (ccNum.length < 15) {
            ccNum += getRandomInt(0, 9);
        }

        // 计算校验位
        let sum = 0;
        let isEven = false;
        for (let i = ccNum.length - 1; i >= 0; i--) {
            let digit = parseInt(ccNum[i]);
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            isEven = !isEven;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        ccNum += checkDigit;

        // 生成有效期和CVV
        const currentYear = new Date().getFullYear();
        const month = getRandomInt(1, 12).toString().padStart(2, '0');
        const year = (currentYear + getRandomInt(1, 5)).toString().slice(-2);
        const cvv = getRandomInt(100, 999).toString();

        return {
            number: ccNum,
            expiry: `${month}/${year}`,
            cvv: cvv,
            type: cardType.toUpperCase()
        };
    }

    // 生成多个卡号
    function generateCards(count = 10, cardType = 'both') {
        const cards = [];
        for (let i = 0; i < count; i++) {
            let currentType;
            if (cardType.toLowerCase() === 'both') {
                const types = ['visa', 'mastercard', 'discover', 'jcb'];
                currentType = types[Math.floor(Math.random() * types.length)];
            } else {
                currentType = cardType;
            }
                
            let card = generateCreditCard(currentType);
            while (!luhnCheck(card.number)) {
                card = generateCreditCard(currentType);
            }
            cards.push(card);
        }
        return cards;
    }

    // 格式化卡片信息
    function formatCardInfo(card) {
        const [month, year] = card.expiry.split('/');
        return `${card.number}|${month}|20${year}|${card.cvv}`;
    }

    // 复制文本到剪贴板
    function copyToClipboard(card, button, isMultiple = false) {
        let formattedText;
        if (isMultiple && Array.isArray(card)) {
            formattedText = card.map(c => formatCardInfo(c)).join('\n');
        } else {
            formattedText = formatCardInfo(card);
        }
        
        GM_setClipboard(formattedText);
        const originalText = button.textContent;
        button.textContent = '已复制!';
        button.style.background = '#e8f5e9';
        button.style.color = '#2e7d32';
        button.style.borderColor = '#c8e6c9';
        
        // 显示复制的具体内容
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: #333;
            color: white;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            white-space: pre;
            opacity: 0;
            transition: opacity 0.3s;
            max-height: 200px;
            overflow-y: auto;
        `;
        tooltip.textContent = formattedText;
        button.parentNode.appendChild(tooltip);
        
        // 显示工具提示
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 50);
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = isMultiple ? '#4CAF50' : '#f0f0f0';
            button.style.color = isMultiple ? 'white' : '#666';
            button.style.borderColor = isMultiple ? '#4CAF50' : '#ddd';
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.remove(), 300);
        }, 1500);
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
            max-width: 400px;
            max-height: 80vh;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
        `;

        const title = document.createElement('h3');
        title.textContent = '信用卡号生成器';
        title.style.marginTop = '0';
        title.style.marginBottom = '15px';

        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = `
            margin-bottom: 15px;
            flex-shrink: 0;
        `;

        const typeSelect = document.createElement('select');
        typeSelect.innerHTML = `
            <option value="both">Visa + MasterCard + Discover + JCB</option>
            <option value="visa">仅Visa</option>
            <option value="mastercard">仅MasterCard</option>
            <option value="discover">仅Discover</option>
            <option value="jcb">仅JCB</option>
        `;
        typeSelect.style.cssText = `
            width: 100%;
            padding: 5px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        `;

        const generateButton = document.createElement('button');
        generateButton.textContent = '生成卡号';
        generateButton.style.cssText = `
            flex: 1;
            padding: 8px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        generateButton.onmouseover = () => generateButton.style.background = '#45a049';
        generateButton.onmouseout = () => generateButton.style.background = '#4CAF50';

        const copyAllButton = document.createElement('button');
        copyAllButton.textContent = '复制全部';
        copyAllButton.style.cssText = `
            padding: 8px 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
            display: none;
        `;
        copyAllButton.onmouseover = () => copyAllButton.style.background = '#45a049';
        copyAllButton.onmouseout = () => copyAllButton.style.background = '#4CAF50';

        const saveButton = document.createElement('button');
        saveButton.textContent = '保存到数据库';
        saveButton.style.cssText = `
            padding: 8px 16px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
            display: none;
        `;
        saveButton.onmouseover = () => saveButton.style.background = '#1976D2';
        saveButton.onmouseout = () => saveButton.style.background = '#2196F3';

        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = `
            flex-grow: 1;
            overflow-y: auto;
            margin-top: 10px;
            padding-right: 10px;
            max-height: calc(80vh - 150px);
            scrollbar-width: thin;
            scrollbar-color: #888 #f1f1f1;
        `;

        // 添加自定义滚动条样式
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .credit-card-result::-webkit-scrollbar {
                width: 8px;
            }
            .credit-card-result::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            .credit-card-result::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 4px;
            }
            .credit-card-result::-webkit-scrollbar-thumb:hover {
                background: #555;
            }
        `;
        document.head.appendChild(styleSheet);
        resultDiv.classList.add('credit-card-result');

        // 创建消息提示容器
        const messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        `;
        document.body.appendChild(messageContainer);

        // 显示消息的函数
        function showMessage(content, type = 'info', duration = 3000) {
            const message = document.createElement('div');
            message.style.cssText = `
                position: relative;
                padding: 20px;
                border-radius: 10px;
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                font-family: Arial, sans-serif;
                font-size: 13px;
                line-height: 1.4;
                margin: 0;
                max-width: 400px;
                opacity: 0;
                transform: translateY(-20px);
                transition: all 0.3s ease;
                pointer-events: auto;
            `;

            // 根据消息类型设置样式
            let buttonColor;
            switch(type) {
                case 'success':
                    buttonColor = '#4CAF50';
                    break;
                case 'error':
                    buttonColor = '#f44336';
                    break;
                case 'warning':
                    buttonColor = '#ff9800';
                    break;
                default:
                    buttonColor = '#2196F3';
            }

            // 支持HTML内容
            if (content.includes('<div')) {
                // 如果是保存结果的复杂消息
                message.innerHTML = content;
            } else {
                // 如果是简单消息，使用卡片样式
                message.innerHTML = `
                    <div style="
                        margin-bottom: 15px;
                        font-weight: 500;
                        font-size: 14px;
                        color: #333;
                    ">通知</div>
                    <div style="color: #666;">${content}</div>
                `;
            }
            
            // 添加关闭按钮
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '×';
            closeButton.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                width: 24px;
                height: 24px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 18px;
                color: #666;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                transition: all 0.3s;
                border-radius: 4px;
            `;
            closeButton.onmouseover = () => {
                closeButton.style.background = '#f5f5f5';
            };
            closeButton.onmouseout = () => {
                closeButton.style.background = 'none';
            };
            closeButton.onclick = () => removeMessage();
            message.appendChild(closeButton);

            // 将消息添加到容器
            messageContainer.appendChild(message);

            // 触发动画
            setTimeout(() => {
                message.style.opacity = '1';
                message.style.transform = 'translateY(0)';
            }, 10);

            // 自动移除消息
            const removeMessage = () => {
                message.style.opacity = '0';
                message.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    if (message.parentNode === messageContainer) {
                        messageContainer.removeChild(message);
                    }
                }, 300);
            };

            if (duration > 0) {
                setTimeout(removeMessage, duration);
            }

            return message;
        }

        // 修改保存到数据库的函数中的提示部分
        async function saveToDatabase() {
            const successPanel = document.querySelector('.panel-body.success');
            if (!successPanel) {
                showMessage('没有找到有效的卡号信息！', 'error');
                return;
            }

            // 获取所有div元素
            const cardDivs = successPanel.getElementsByTagName('div');
            const cards = Array.from(cardDivs).map(div => {
                const cardInfoMatch = div.textContent.match(/(\d+\|\d{2}\|\d{4}\|\d{3})/);
                if (!cardInfoMatch) {
                    return null;
                }
                
                const [number, month, year, cvv] = cardInfoMatch[1].split('|');
                return {
                    card_type: number.startsWith('4') ? 'VISA' : 
                              number.startsWith('5') ? 'MASTERCARD' : 
                              number.startsWith('6') ? 'DISCOVER' :
                              number.startsWith('35') ? 'JCB' : 'UNKNOWN',
                    card_number: number,
                    expire_month: month,
                    expire_year: year,
                    cvv: cvv,
                    formatted_info: cardInfoMatch[1]
                };
            }).filter(card => card !== null);

            if (cards.length === 0) {
                showMessage('没有找到有效的卡号信息！', 'error');
                return;
            }

            try {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'http://localhost:3000/save-cards',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({
                            cards: cards,
                            dbConfig: {
                                database: 'postgres',
                                user: 'postgres',
                                password: '123456'
                            }
                        }),
                        onload: function(response) {
                            try {
                                const result = JSON.parse(response.responseText);
                                if (result.success) {
                                    const savedCount = result.results.saved.length;
                                    const duplicateCount = result.results.duplicates.length;
                                    
                                    let message = `<div style="
                                        font-family: Arial, sans-serif;
                                        padding: 20px;
                                    ">
                                        <div style="
                                            margin-bottom: 15px;
                                            font-weight: 500;
                                            font-size: 14px;
                                            color: #333;
                                        ">保存结果</div>`;
                                    
                                    if (savedCount > 0) {
                                        message += `
                                            <div style="
                                            margin-bottom: 15px;border: 1px solid #ddd;border-radius: 8px;padding: 15px;background:rgba(249, 249, 249, 0.7);">
                                                <div style="
                                                    font-weight: 500;
                                                    color: #4CAF50;
                                                    margin-bottom: 8px;
                                                ">
                                                    ✅ 成功保存 ${savedCount} 个卡号
                                                </div>
                                                <div style="
                                                    font-size: 13px;
                                                    color: #666;
                                                    line-height: 1.5;
                                                ">${result.results.saved.join('<br>')}</div>
                                            </div>`;
                                    }
                                    
                                    if (duplicateCount > 0) {
                                        message += `
                                            <div style="
                                            margin-bottom: 15px;border: 1px solid #ddd;border-radius: 8px;padding: 15px;background:rgba(249, 249, 249, 0.7);">
                                                <div style="
                                                    font-weight: 500;
                                                    color: #f44336;
                                                    margin-bottom: 8px;
                                                ">
                                                    ❌ ${duplicateCount} 个重复卡号
                                                </div>
                                                <div style="
                                                    font-size: 13px;
                                                    color: #666;
                                                    line-height: 1.5;
                                                ">${result.results.duplicates.join('<br>')}</div>
                                            </div>`;
                                    }
                                    message += '</div>';
                                    
                                    showMessage(message, 'success', 5000);
                                    resolve(result);
                                } else {
                                    throw new Error(result.error || '保存失败');
                                }
                            } catch (error) {
                                reject(error);
                                // 只有在不是空响应的情况下才显示解析失败
                                if (response && response.responseText !== undefined) {
                                    showMessage(`
                                        <div style="
                                            margin-bottom: 15px;
                                            border: 1px solid #ddd;
                                            border-radius: 8px;
                                            padding: 15px;
                                            background:rgba(249, 249, 249, 0.7);
                                        ">
                                            <div style="
                                                font-weight: 500;
                                                color: #f44336;
                                                margin-bottom: 8px;
                                            ">
                                                ❌ 响应解析失败
                                            </div>
                                            <div style="
                                                font-size: 13px;
                                                color: #666;
                                                line-height: 1.5;
                                            ">
                                                <p>无法解析服务器响应：${error.message}</p>
                                                <p>响应内容：${response.responseText}</p>
                                            </div>
                                        </div>
                                    `, 'error', 8000);
                                }
                            }
                        },
                        onerror: function(error) {
                            reject(error);
                            // 获取错误信息
                            const errorMessage = error.error || error.message || error.statusText || '服务器连接失败';
                            
                            // 检查各种可能的连接错误情况
                            if (
                                (errorMessage && errorMessage.includes('connect')) ||  // 连接错误
                                error.status === 0 ||                                  // 服务器未响应
                                error.readyState === 0 ||                             // 请求未发送
                                !error.status                                         // 无状态码
                            ) {
                                showMessage(`
                                    <div style="
                                        margin-bottom: 15px;
                                        border: 1px solid #ddd;
                                        border-radius: 8px;
                                        padding: 15px;
                                        background:rgba(249, 249, 249, 0.7);
                                    ">
                                        <div style="
                                            font-weight: 500;
                                            color: #f44336;
                                            margin-bottom: 8px;
                                        ">
                                            ❌ 服务器连接失败
                                        </div>
                                        <div style="
                                            font-size: 13px;
                                            color: #666;
                                            line-height: 1.5;
                                        ">
                                            <p>无法连接到服务器，请检查：</p>
                                            <ul style="margin: 8px 0; padding-left: 20px;">
                                                <li>服务器是否已启动（node server.js）</li>
                                                <li>端口3000是否正确开放</li>
                                                <li>防火墙设置是否正确</li>
                                            </ul>
                                        </div>
                                    </div>
                                `, 'error', 8000);
                            } else {
                                // 其他错误情况
                                showMessage(`
                                    <div style="
                                        margin-bottom: 15px;
                                        border: 1px solid #ddd;
                                        border-radius: 8px;
                                        padding: 15px;
                                        background:rgba(249, 249, 249, 0.7);
                                    ">
                                        <div style="
                                            font-weight: 500;
                                            color: #f44336;
                                            margin-bottom: 8px;
                                        ">
                                            ❌ 请求失败
                                        </div>
                                        <div style="
                                            font-size: 13px;
                                            color: #666;
                                            line-height: 1.5;
                                        ">
                                            <p>错误信息：${errorMessage}</p>
                                            <p>状态码：${error.status || '无'}</p>
                                        </div>
                                    </div>
                                `, 'error', 8000);
                            }
                        },
                        ontimeout: function() {
                            reject(new Error('请求超时'));
                            showMessage(`
                                <div style="margin-bottom: 15px; font-weight: 500; font-size: 14px; color: #333;">
                                    请求超时
                                </div>
                                <div style="color: #666;">
                                    服务器响应时间过长，可能原因：
                                    <ul style="margin: 8px 0; padding-left: 20px;">
                                        <li>服务器负载过高</li>
                                        <li>网络连接不稳定</li>
                                        <li>服务器处理能力受限</li>
                                    </ul>
                                </div>
                            `, 'warning', 8000);
                        }
                    });
                });
            } catch (error) {
                showMessage('保存失败：' + error.message, 'error');
            }
        }

        saveButton.onclick = saveToDatabase;

        generateButton.onclick = async () => {
            resultDiv.innerHTML = '<div style="text-align: center;">生成中...</div>';
            const cards = generateCards(10, typeSelect.value);
            
            // 显示复制全部按钮和保存按钮
            copyAllButton.style.display = 'block';
            saveButton.style.display = 'block';
            
            copyAllButton.onclick = (e) => {
                e.stopPropagation();
                copyToClipboard(cards, copyAllButton, true);
            };
            
            // 填入CC Checker文本框
            const textarea = document.querySelector('textarea');
            if (textarea) {
                const formattedCards = cards.map(card => formatCardInfo(card)).join('\n');
                textarea.value = formattedCards;
                
                // 触发input事件以激活START按钮
                const inputEvent = new Event('input', { bubbles: true });
                textarea.dispatchEvent(inputEvent);

                // 点击提交按钮
                const submitButton = document.querySelector('button[type="submit"][name="valid"]');
                if (submitButton) {
                    submitButton.click();
                }
            }
            
            // 预先生成所有cardId
            const cardIds = cards.map(() => 'card-' + Math.random().toString(36).slice(2, 11));
            
            let html = '';
            cards.forEach((card, index) => {
                const cardId = cardIds[index];
                const buttonId = 'copy-btn-' + cardId;
                html += `
                    <div style="
                        margin-bottom: 15px;
                        padding: 15px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        background: #f9f9f9;
                        transition: transform 0.2s, box-shadow 0.2s;
                        cursor: pointer;
                        position: relative;
                    " id="${cardId}" 
                       onmouseover="this.style.transform='scale(1.01)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';"
                       onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 10px;
                        ">
                            <div style="font-weight: bold; color: #333;">类型: ${card.type}</div>
                            <button id="${buttonId}" style="
                                padding: 4px 8px;
                                background: #f0f0f0;
                                border: 1px solid #ddd;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                color: #666;
                                transition: all 0.2s;
                            " onmouseover="this.style.background='#e0e0e0'"
                               onmouseout="this.style.background='#f0f0f0'">
                                复制卡号
                            </button>
                        </div>
                        <div style="
                            font-family: monospace;
                            font-size: 1.1em;
                            margin-bottom: 8px;
                            padding: 8px;
                            background: #fff;
                            border-radius: 4px;
                            border: 1px solid #eee;
                        ">${card.number}</div>
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 8px;
                            color: #666;
                        ">
                            <div>有效期: ${card.expiry}</div>
                            <div>CVV: ${card.cvv}</div>
                        </div>
                    </div>
                `;
            });
            
            resultDiv.innerHTML = html;

            // 添加复制按钮事件监听器
            cards.forEach((card, index) => {
                const cardId = cardIds[index];
                const buttonId = 'copy-btn-' + cardId;
                const copyButton = document.getElementById(buttonId);
                if (copyButton) {
                    copyButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        copyToClipboard(card, copyButton);
                    });
                }
            });
        };

        buttonContainer.appendChild(generateButton);
        buttonContainer.appendChild(copyAllButton);
        buttonContainer.appendChild(saveButton);
        controlsDiv.appendChild(typeSelect);
        controlsDiv.appendChild(buttonContainer);
        container.appendChild(title);
        container.appendChild(controlsDiv);
        container.appendChild(resultDiv);
        document.body.appendChild(container);

        // 添加拖动功能
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

                setTranslate(currentX, currentY, container);
            }
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }
    }

    // 初始化
    createUI();
})();
