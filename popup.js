document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('status');
    const pageDetection = document.getElementById('pageDetection');
    const scriptDetection = document.getElementById('scriptDetection');
    const buttonDetection = document.getElementById('buttonDetection');
    
    // 檢查是否在支援的網站上
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const isSupportedSite = currentTab.url && currentTab.url.includes('shopee.tw');
        
        // 更新頁面偵測狀態
        if (isSupportedSite) {
            pageDetection.classList.add('active');
            
            // 檢查腳本是否已載入
            try {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'checkStatus'}, function(response) {
                    if (chrome.runtime.lastError) {
                        // 腳本未載入
                        scriptDetection.classList.remove('active');
                        buttonDetection.classList.remove('active');
                        statusElement.innerHTML = '<div style="color: #ff9800;">⚠️ 腳本載入中...</div><div style="font-size: 12px; margin-top: 5px;">請重新整理頁面</div>';
                        statusElement.className = 'status inactive';
                    } else if (response) {
                        // 腳本已載入
                        scriptDetection.classList.add('active');
                        
                        if (response.buttonsFound > 0) {
                            buttonDetection.classList.add('active');
                            statusElement.innerHTML = `<div style="color: #4CAF50;">✓ 工具已啟用</div><div style="font-size: 12px; margin-top: 5px;">已找到 ${response.buttonsFound} 個優惠券卡片</div>`;
                            statusElement.className = 'status active';
                        } else {
                            buttonDetection.classList.remove('active');
                            statusElement.innerHTML = '<div style="color: #ff9800;">⚠️ 未找到優惠券</div><div style="font-size: 12px; margin-top: 5px;">請前往優惠券頁面</div>';
                            statusElement.className = 'status inactive';
                        }
                    } else {
                        // 沒有回應
                        scriptDetection.classList.remove('active');
                        buttonDetection.classList.remove('active');
                        statusElement.innerHTML = '<div style="color: #ff9800;">⚠️ 腳本載入中...</div><div style="font-size: 12px; margin-top: 5px;">請重新整理頁面</div>';
                        statusElement.className = 'status inactive';
                    }
                });
            } catch (error) {
                // 處理錯誤
                scriptDetection.classList.remove('active');
                buttonDetection.classList.remove('active');
                statusElement.innerHTML = '<div style="color: #ff9800;">⚠️ 腳本載入中...</div><div style="font-size: 12px; margin-top: 5px;">請重新整理頁面</div>';
                statusElement.className = 'status inactive';
            }
        } else {
            pageDetection.classList.remove('active');
            scriptDetection.classList.remove('active');
            buttonDetection.classList.remove('active');
            statusElement.innerHTML = '<div>請前往支援的網站使用此工具</div>';
            statusElement.className = 'status inactive';
        }
    });
    
    // 定期更新狀態
    setInterval(() => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            if (currentTab.url && currentTab.url.includes('shopee.tw')) {
                try {
                    chrome.tabs.sendMessage(tabs[0].id, {action: 'checkStatus'}, function(response) {
                        if (chrome.runtime.lastError) {
                            // 忽略錯誤，不更新狀態
                            return;
                        }
                        
                        if (response && response.buttonsFound > 0) {
                            buttonDetection.classList.add('active');
                            statusElement.innerHTML = `<div style="color: #4CAF50;">✓ 工具已啟用</div><div style="font-size: 12px; margin-top: 5px;">已找到 ${response.buttonsFound} 個優惠券卡片</div>`;
                            statusElement.className = 'status active';
                        }
                    });
                } catch (error) {
                    // 忽略錯誤
                }
            }
        });
    }, 2000);
});
