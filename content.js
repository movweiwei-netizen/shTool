(function() {
    'use strict';

    function buildShopeeUrl(voucherUrl) {
        const evcodeMatch = voucherUrl.match(/evcode=([^&]+)/);
        const signatureMatch = voucherUrl.match(/signature=([^&]+)/);
        const promotionIdMatch = voucherUrl.match(/promotionId=(\d+)/);

        if (evcodeMatch && signatureMatch && promotionIdMatch) {
            const evcode = evcodeMatch[1];
            const signature = signatureMatch[1];
            const promotionId = promotionIdMatch[1];
            return `https://shopee.tw/search?evcode=${evcode}&preSource=voucher-pages%2Fwallet&promotionId=${promotionId}&signature=${signature}&utm_content=tajs----&utm_medium=affiliates&utm_source=an_16366650006`;
        }
        return null;
    }

    function showAlert(title, text, icon='info') {
        if (typeof Swal === 'undefined') {
            setTimeout(() => showAlert(title, text, icon), 100);
            return;
        }
        Swal.fire({
            title,
            text,
            icon,
            confirmButtonColor: '#d0011b'
        });
    }

    function checkVoucherStatus(cardElement) {
        const statusSpans = cardElement.querySelectorAll('.lvIwMO div span, .z0Xxct span, .WHIV6W span, .F2MklE, .vqJoas, .OPj1Ym span');
        let statusText = '';
        statusSpans.forEach(span => {
            if(span.textContent) {
                const text = span.textContent.trim();
                if (text === '領取' || text === '兌換完畢' || text === '已兌換完畢' || text === '已領取' || text === '已使用') {
                    statusText = text;
                }
            }
        });

        const svgTexts = cardElement.querySelectorAll('svg text');
        svgTexts.forEach(textElement => {
            const text = textElement.textContent.trim();
            if (text === '已兌換完畢' || text === '已領取' || text === '已使用') {
                statusText = text;
            }
        });

        const disabledElements = cardElement.querySelectorAll('.nt35kv, .zVvLvp, .UM3epg, .sx8fQN');
        if (disabledElements.length > 0) {
            disabledElements.forEach(element => {
                const text = element.textContent.trim();
                if (text.includes('兌換完畢') || text.includes('已兌換') || text.includes('已領取')) {
                    statusText = '已兌換完畢';
                }
            });
        }

        const overlayElements = cardElement.querySelectorAll('.nvzMks, .GrDv19');
        if (overlayElements.length > 0) {
            overlayElements.forEach(overlay => {
                if (overlay.querySelector('svg[fill="#BDBDBD"]') ||
                    overlay.querySelector('text[fill="#BDBDBD"]') ||
                    overlay.textContent.includes('已兌換完畢')) {
                    statusText = '已兌換完畢';
                }
            });
        }

        const cardStyles = window.getComputedStyle(cardElement);
        if (cardStyles.opacity < 1 || cardStyles.filter.includes('grayscale')) {
            const allText = cardElement.textContent;
            if (allText.includes('兌換完畢') || allText.includes('已兌換') || allText.includes('已領取')) {
                statusText = '已兌換完畢';
            }
        }

    // 再次判斷
    if (!statusText) {
        const allText = cardElement.textContent;
        if (allText.includes('領取')) {
            statusText = '領取';
        } else if (allText.includes('兌換完畢') || allText.includes('已兌換') || allText.includes('已領取') || allText.includes('已使用')) {
            statusText = '已兌換完畢';
        }
    }

        return statusText;
    }

    function createButton(voucherUrl, cardElement) {
        const newBtn = document.createElement('a');
        newBtn.textContent = '查詢可用商品';
        newBtn.href = '#';
        newBtn.className = 'custom-voucher-btn-safe';
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const statusText = checkVoucherStatus(cardElement);

            if (statusText === '領取') {
                showAlert('提醒', '請先 領取優惠券 再查詢可用商品', 'warning');
                return;
            }
            if (statusText === '兌換完畢' || statusText === '已兌換完畢' || statusText === '已領取' || statusText === '已使用') {
                showAlert('錯誤', '此優惠券 已兌換完畢 或 已使用', 'error');
                return;
            }

            const searchUrl = buildShopeeUrl(voucherUrl);
            if (searchUrl) {
                window.open(searchUrl, '_blank');
            } else {
                showAlert('錯誤', '無法解析折扣碼網址', 'error');
            }
        });
        return newBtn;
    }

    function addCustomButtons() {
        const allCards = document.querySelectorAll('.Ozujd4, .TVjANi, ._hsjbR.n8iYL8, .BBE8vQ, .Hvy133, .EHXP6I.eYf2xv.yymuwL, .kxI6jR [data-testid="vcCard"]');
        allCards.forEach(card => {
            const link = card.querySelector('a[href*="/voucher/details"], a[href*="evcode="], a[href*="promotionId="]');
            if (!link) return;

            if (!card.querySelector('.custom-voucher-btn-safe')) {
                const voucherUrl = link.href;
                const newBtn = createButton(voucherUrl, card);

                let insertTarget = link;

                const ruleLink = card.querySelector('a[aria-label*="term"], a[href*="使用規則"], .wFLABo');
                if (ruleLink) {
                    insertTarget = ruleLink;
                }

                insertTarget.insertAdjacentElement('afterend', newBtn);
            }
        });
    }

    // 監聽來自 popup 的訊息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'checkStatus') {
            const buttons = document.querySelectorAll('.custom-voucher-btn-safe');
            sendResponse({ buttonsFound: buttons.length });
            return true; // 保持訊息通道開啟
        }
    });

    // 初始化
    function init() {
        // 等待 SweetAlert2 載入
        const checkSweetAlert = () => {
            if (typeof Swal !== 'undefined') {
                setTimeout(addCustomButtons, 1000);
                
                const observer = new MutationObserver(() => {
                    setTimeout(addCustomButtons, 300);
                });
                observer.observe(document.body, { childList: true, subtree: true });

                let scrollTimeout;
                window.addEventListener('scroll', () => {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        addCustomButtons();
                    }, 500);
                });
            } else {
                setTimeout(checkSweetAlert, 100);
            }
        };

        checkSweetAlert();
    }

    // 如果頁面已經載入完成，直接初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
