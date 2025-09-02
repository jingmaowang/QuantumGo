/**
 * 量子围棋游戏集成插件 JavaScript
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // 获取设置
    var settings = quantumGoSettings || {};
    
    // 初始化浮动按钮
    initFloatingButton();
    
    // 初始化游戏链接
    initGameLinks();
    
    // 添加点击统计
    addClickTracking();
    
    /**
     * 初始化浮动按钮
     */
    function initFloatingButton() {
        if (!settings.enableFloatingButton || !settings.gameUrl) {
            return;
        }
        
        var $button = $('#quantum-go-floating-button');
        if ($button.length === 0) {
            return;
        }
        
        // 添加悬停效果
        $button.hover(
            function() {
                $(this).addClass('quantum-go-hover');
            },
            function() {
                $(this).removeClass('quantum-go-hover');
            }
        );
        
        // 添加点击效果
        $button.find('a').on('click', function(e) {
            // 添加加载状态
            $button.addClass('quantum-go-loading');
            
            // 延迟移除加载状态（给用户反馈）
            setTimeout(function() {
                $button.removeClass('quantum-go-loading');
            }, 1000);
            
            // 统计点击
            trackClick('floating_button');
        });
    }
    
    /**
     * 初始化游戏链接
     */
    function initGameLinks() {
        if (!settings.gameUrl) {
            return;
        }
        
        // 查找所有游戏链接
        $('.quantum-go-link').each(function() {
            var $link = $(this);
            
            // 添加点击效果
            $link.on('click', function(e) {
                // 统计点击
                trackClick('game_link');
                
                // 添加点击动画
                $link.addClass('quantum-go-clicked');
                setTimeout(function() {
                    $link.removeClass('quantum-go-clicked');
                }, 200);
            });
        });
    }
    
    /**
     * 添加点击统计
     */
    function addClickTracking() {
        // 监听所有游戏相关链接的点击
        $(document).on('click', 'a[href*="' + settings.gameUrl + '"]', function() {
            var linkType = $(this).hasClass('quantum-go-link') ? 'game_link' : 'other_link';
            trackClick(linkType);
        });
    }
    
    /**
     * 统计点击
     */
    function trackClick(type) {
        // 发送统计数据到服务器（可选）
        if (typeof gtag !== 'undefined') {
            gtag('event', 'click', {
                'event_category': 'quantum_go',
                'event_label': type,
                'value': 1
            });
        }
        
        // 本地存储统计
        var stats = JSON.parse(localStorage.getItem('quantum_go_stats') || '{}');
        stats[type] = (stats[type] || 0) + 1;
        stats.last_click = new Date().toISOString();
        localStorage.setItem('quantum_go_stats', JSON.stringify(stats));
    }
    
    /**
     * 检查游戏状态
     */
    function checkGameStatus() {
        if (!settings.gameUrl) {
            return;
        }
        
        // 定期检查游戏是否可访问
        $.ajax({
            url: settings.gameUrl,
            method: 'HEAD',
            timeout: 5000,
            success: function() {
                // 游戏可访问
                $('.quantum-go-floating, .quantum-go-link').removeClass('quantum-go-offline');
            },
            error: function() {
                // 游戏不可访问
                $('.quantum-go-floating, .quantum-go-link').addClass('quantum-go-offline');
            }
        });
    }
    
    /**
     * 显示通知
     */
    function showNotification(message, type) {
        var $notification = $('<div class="quantum-go-notification quantum-go-' + type + '">' + message + '</div>');
        $('body').append($notification);
        
        // 显示动画
        setTimeout(function() {
            $notification.addClass('quantum-go-show');
        }, 100);
        
        // 自动隐藏
        setTimeout(function() {
            $notification.removeClass('quantum-go-show');
            setTimeout(function() {
                $notification.remove();
            }, 300);
        }, 3000);
    }
    
    /**
     * 初始化页面加载完成后的操作
     */
    function initPageLoad() {
        // 检查游戏状态
        checkGameStatus();
        
        // 定期检查游戏状态（每5分钟）
        setInterval(checkGameStatus, 5 * 60 * 1000);
        
        // 显示欢迎消息（首次访问）
        var isFirstVisit = !localStorage.getItem('quantum_go_visited');
        if (isFirstVisit && settings.gameUrl) {
            setTimeout(function() {
                showNotification('欢迎体验量子围棋游戏！', 'success');
                localStorage.setItem('quantum_go_visited', 'true');
            }, 2000);
        }
    }
    
    // 页面加载完成后初始化
    initPageLoad();
    
    /**
     * 处理窗口大小变化
     */
    $(window).on('resize', function() {
        // 重新计算浮动按钮位置
        var $button = $('#quantum-go-floating-button');
        if ($button.length > 0) {
            $button.removeClass('quantum-go-mobile quantum-go-desktop');
            if ($(window).width() <= 768) {
                $button.addClass('quantum-go-mobile');
            } else {
                $button.addClass('quantum-go-desktop');
            }
        }
    });
    
    /**
     * 处理滚动事件
     */
    $(window).on('scroll', function() {
        var $button = $('#quantum-go-floating-button');
        if ($button.length > 0) {
            var scrollTop = $(window).scrollTop();
            if (scrollTop > 100) {
                $button.addClass('quantum-go-scrolled');
            } else {
                $button.removeClass('quantum-go-scrolled');
            }
        }
    });
});

// 添加额外的 CSS 类
jQuery(document).ready(function($) {
    // 添加点击动画样式
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            .quantum-go-clicked {
                transform: scale(0.95);
                transition: transform 0.1s ease;
            }
            
            .quantum-go-offline {
                opacity: 0.5;
                pointer-events: none;
            }
            
            .quantum-go-offline::after {
                content: '游戏暂时不可用';
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                background: #ff4444;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                white-space: nowrap;
            }
            
            .quantum-go-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            
            .quantum-go-notification.quantum-go-show {
                transform: translateX(0);
            }
            
            .quantum-go-notification.quantum-go-success {
                background: #4CAF50;
            }
            
            .quantum-go-notification.quantum-go-error {
                background: #f44336;
            }
            
            .quantum-go-notification.quantum-go-info {
                background: #2196F3;
            }
        `)
        .appendTo('head');
});
