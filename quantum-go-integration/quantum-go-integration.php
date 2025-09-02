<?php
/**
 * Plugin Name: 围棋游戏集成
 * Description: 在网站首页添加围棋游戏按钮，并修改COGNIGO卡片的链接
 * Version: 1.0.0
 * Author: DeepBrain Technology
 * Text Domain: quantum-go-integration
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

class QuantumGoIntegration {
    
    public function __construct() {
        add_action('wp_footer', array($this, 'add_quantum_go_button'));
        add_action('wp_footer', array($this, 'modify_cognigo_button'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    // 注册设置
    public function register_settings() {
        register_setting('quantum_go_settings', 'quantum_go_url');
        register_setting('quantum_go_settings', 'quantum_go_button_text');
        register_setting('quantum_go_settings', 'quantum_go_button_position');
    }
    
    // 添加围棋游戏按钮
    public function add_quantum_go_button() {
        if (is_front_page() || is_home()) {
            $game_url = get_option('quantum_go_url', 'https://your-game-domain.com');
            $button_text = get_option('quantum_go_button_text', '围棋游戏');
            $position = get_option('quantum_go_button_position', 'bottom-right');
            
            // 根据位置设置CSS
            $position_css = $this->get_position_css($position);
            
            ?>
            <style>
            .quantum-go-btn {
                position: fixed;
                <?php echo $position_css; ?>
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important;
                padding: 15px 25px;
                border-radius: 50px;
                text-decoration: none;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 16px;
            }
            .quantum-go-btn:hover {
                background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.3);
                color: white !important;
            }
            .quantum-go-btn .icon {
                margin-right: 8px;
                font-size: 18px;
            }
            @media (max-width: 768px) {
                .quantum-go-btn {
                    padding: 12px 20px;
                    font-size: 14px;
                }
            }
            </style>
            
            <a href="<?php echo esc_url($game_url); ?>" class="quantum-go-btn" target="_blank">
                <span class="icon">⚫</span><?php echo esc_html($button_text); ?>
            </a>
            <?php
        }
    }
    
    // 获取位置CSS
    private function get_position_css($position) {
        switch ($position) {
            case 'bottom-left':
                return 'bottom: 30px; left: 30px;';
            case 'top-right':
                return 'top: 30px; right: 30px;';
            case 'top-left':
                return 'top: 30px; left: 30px;';
            case 'bottom-right':
            default:
                return 'bottom: 30px; right: 30px;';
        }
    }
    
    // 修改COGNIGO卡片按钮
    public function modify_cognigo_button() {
        $game_url = get_option('quantum_go_url', 'https://your-game-domain.com');
        ?>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 查找 COGNIGO™ (QUANTUM GO) 卡片的按钮
            const cards = document.querySelectorAll('[class*="card"], .product-card, .service-card, .elementor-widget-container');
            cards.forEach(card => {
                const title = card.querySelector('h3, h2, .title, .card-title, .elementor-heading-title');
                if (title && (title.textContent.includes('COGNIGO') || title.textContent.includes('QUANTUM GO'))) {
                    const button = card.querySelector('a[href*="learn"], .btn, button, .elementor-button');
                    if (button) {
                        button.href = '<?php echo esc_js($game_url); ?>';
                        button.target = '_blank';
                        // 可选：修改按钮文字
                        // button.textContent = '开始游戏';
                    }
                }
            });
        });
        </script>
        <?php
    }
    
    // 添加管理菜单
    public function add_admin_menu() {
        add_options_page(
            '围棋游戏设置',
            '围棋游戏',
            'manage_options',
            'quantum-go-settings',
            array($this, 'settings_page')
        );
    }
    
    // 设置页面
    public function settings_page() {
        if (isset($_POST['submit'])) {
            update_option('quantum_go_url', sanitize_url($_POST['quantum_go_url']));
            update_option('quantum_go_button_text', sanitize_text_field($_POST['quantum_go_button_text']));
            update_option('quantum_go_button_position', sanitize_text_field($_POST['quantum_go_button_position']));
            echo '<div class="notice notice-success"><p>设置已保存！</p></div>';
        }
        
        $game_url = get_option('quantum_go_url', 'https://your-game-domain.com');
        $button_text = get_option('quantum_go_button_text', '围棋游戏');
        $position = get_option('quantum_go_button_position', 'bottom-right');
        ?>
        <div class="wrap">
            <h1>围棋游戏设置</h1>
            <form method="post" action="">
                <?php settings_fields('quantum_go_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">游戏URL</th>
                        <td>
                            <input type="url" name="quantum_go_url" value="<?php echo esc_attr($game_url); ?>" class="regular-text" placeholder="https://your-game-domain.com" />
                            <p class="description">请输入您的围棋游戏的完整URL地址</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">按钮文字</th>
                        <td>
                            <input type="text" name="quantum_go_button_text" value="<?php echo esc_attr($button_text); ?>" class="regular-text" />
                            <p class="description">按钮上显示的文字</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">按钮位置</th>
                        <td>
                            <select name="quantum_go_button_position">
                                <option value="bottom-right" <?php selected($position, 'bottom-right'); ?>>右下角</option>
                                <option value="bottom-left" <?php selected($position, 'bottom-left'); ?>>左下角</option>
                                <option value="top-right" <?php selected($position, 'top-right'); ?>>右上角</option>
                                <option value="top-left" <?php selected($position, 'top-left'); ?>>左上角</option>
                            </select>
                            <p class="description">选择按钮在页面上的显示位置</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <div class="card" style="max-width: 600px; margin-top: 20px;">
                <h3>使用说明</h3>
                <ol>
                    <li>在"游戏URL"字段中输入您的围棋游戏地址</li>
                    <li>自定义按钮文字和位置</li>
                    <li>保存设置后，按钮将出现在网站首页</li>
                    <li>COGNIGO卡片的"LEARN MORE"按钮将自动跳转到围棋游戏</li>
                </ol>
                
                <h4>推荐的云服务部署平台：</h4>
                <ul>
                    <li><strong>Vercel</strong>：适合前端部署，免费且快速</li>
                    <li><strong>Railway</strong>：适合全栈应用，支持Docker</li>
                    <li><strong>Render</strong>：适合后端API，免费额度充足</li>
                    <li><strong>Netlify</strong>：适合静态网站，部署简单</li>
                </ul>
            </div>
        </div>
        <?php
    }
}

// 初始化插件
new QuantumGoIntegration();
?>
