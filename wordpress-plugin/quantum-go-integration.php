<?php
/**
 * Plugin Name: 量子围棋游戏集成
 * Plugin URI: https://deepbraintechnology.com/
 * Description: 在您的网站上集成量子围棋游戏，用户可以直接从网站跳转到游戏。
 * Version: 1.0.0
 * Author: DeepBrainTech
 * Author URI: https://deepbraintechnology.com/
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: quantum-go-integration
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 定义插件常量
define('QUANTUM_GO_PLUGIN_URL', plugin_dir_url(__FILE__));
define('QUANTUM_GO_PLUGIN_PATH', plugin_dir_path(__FILE__));

class QuantumGoIntegration {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'add_floating_button'));
        add_filter('the_content', array($this, 'modify_cognigo_content'));
    }
    
    // 添加管理菜单
    public function add_admin_menu() {
        add_options_page(
            '量子围棋游戏设置',
            '围棋游戏',
            'manage_options',
            'quantum-go-settings',
            array($this, 'admin_page')
        );
    }
    
    // 初始化设置
    public function admin_init() {
        register_setting('quantum_go_settings', 'quantum_go_options');
        
        add_settings_section(
            'quantum_go_main_section',
            '游戏设置',
            null,
            'quantum_go_settings'
        );
        
        add_settings_field(
            'game_url',
            '游戏URL',
            array($this, 'game_url_callback'),
            'quantum_go_settings',
            'quantum_go_main_section'
        );
        
        add_settings_field(
            'button_text',
            '按钮文字',
            array($this, 'button_text_callback'),
            'quantum_go_settings',
            'quantum_go_main_section'
        );
        
        add_settings_field(
            'button_position',
            '按钮位置',
            array($this, 'button_position_callback'),
            'quantum_go_settings',
            'quantum_go_main_section'
        );
        
        add_settings_field(
            'enable_floating_button',
            '启用浮动按钮',
            array($this, 'floating_button_callback'),
            'quantum_go_settings',
            'quantum_go_main_section'
        );
    }
    
    // 游戏URL设置
    public function game_url_callback() {
        $options = get_option('quantum_go_options');
        $value = isset($options['game_url']) ? $options['game_url'] : '';
        echo '<input type="url" name="quantum_go_options[game_url]" value="' . esc_attr($value) . '" class="regular-text" placeholder="https://your-game.vercel.app" />';
        echo '<p class="description">输入您的围棋游戏部署地址（Vercel URL）</p>';
    }
    
    // 按钮文字设置
    public function button_text_callback() {
        $options = get_option('quantum_go_options');
        $value = isset($options['button_text']) ? $options['button_text'] : '开始游戏';
        echo '<input type="text" name="quantum_go_options[button_text]" value="' . esc_attr($value) . '" class="regular-text" />';
    }
    
    // 按钮位置设置
    public function button_position_callback() {
        $options = get_option('quantum_go_options');
        $value = isset($options['button_position']) ? $options['button_position'] : 'bottom-right';
        echo '<select name="quantum_go_options[button_position]">';
        echo '<option value="bottom-right"' . selected($value, 'bottom-right', false) . '>右下角</option>';
        echo '<option value="bottom-left"' . selected($value, 'bottom-left', false) . '>左下角</option>';
        echo '<option value="top-right"' . selected($value, 'top-right', false) . '>右上角</option>';
        echo '<option value="top-left"' . selected($value, 'top-left', false) . '>左上角</option>';
        echo '</select>';
    }
    
    // 浮动按钮设置
    public function floating_button_callback() {
        $options = get_option('quantum_go_options');
        $value = isset($options['enable_floating_button']) ? $options['enable_floating_button'] : 1;
        echo '<input type="checkbox" name="quantum_go_options[enable_floating_button]" value="1"' . checked(1, $value, false) . ' />';
        echo '<label>在网站右下角显示浮动游戏按钮</label>';
    }
    
    // 管理页面
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>量子围棋游戏设置</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('quantum_go_settings');
                do_settings_sections('quantum_go_settings');
                submit_button();
                ?>
            </form>
            
            <div class="card" style="max-width: 600px; margin-top: 20px;">
                <h2>使用说明</h2>
                <ol>
                    <li><strong>部署游戏</strong>：首先将您的围棋游戏部署到 Vercel</li>
                    <li><strong>设置URL</strong>：在上方输入您的 Vercel 部署地址</li>
                    <li><strong>自定义按钮</strong>：设置按钮文字和位置</li>
                    <li><strong>保存设置</strong>：点击"保存更改"按钮</li>
                </ol>
                
                <h3>功能说明</h3>
                <ul>
                    <li>✅ 自动修改 "CogniGo™ (Quantum Go)" 的 "Learn more" 按钮链接</li>
                    <li>✅ 添加浮动游戏按钮（可选）</li>
                    <li>✅ 支持自定义按钮文字和位置</li>
                    <li>✅ 响应式设计，适配移动端</li>
                </ul>
            </div>
        </div>
        <?php
    }
    
    // 加载脚本和样式
    public function enqueue_scripts() {
        wp_enqueue_style(
            'quantum-go-style',
            QUANTUM_GO_PLUGIN_URL . 'assets/style.css',
            array(),
            '1.0.0'
        );
        
        wp_enqueue_script(
            'quantum-go-script',
            QUANTUM_GO_PLUGIN_URL . 'assets/script.js',
            array('jquery'),
            '1.0.0',
            true
        );
        
        // 传递设置到前端
        $options = get_option('quantum_go_options');
        wp_localize_script('quantum-go-script', 'quantumGoSettings', array(
            'gameUrl' => isset($options['game_url']) ? $options['game_url'] : '',
            'buttonText' => isset($options['button_text']) ? $options['button_text'] : '开始游戏',
            'buttonPosition' => isset($options['button_position']) ? $options['button_position'] : 'bottom-right',
            'enableFloatingButton' => isset($options['enable_floating_button']) ? $options['enable_floating_button'] : 1
        ));
    }
    
    // 添加浮动按钮
    public function add_floating_button() {
        $options = get_option('quantum_go_options');
        if (!isset($options['enable_floating_button']) || !$options['enable_floating_button']) {
            return;
        }
        
        $game_url = isset($options['game_url']) ? $options['game_url'] : '';
        $button_text = isset($options['button_text']) ? $options['button_text'] : '开始游戏';
        $position = isset($options['button_position']) ? $options['button_position'] : 'bottom-right';
        
        if (empty($game_url)) {
            return;
        }
        
        echo '<div id="quantum-go-floating-button" class="quantum-go-floating quantum-go-' . esc_attr($position) . '">';
        echo '<a href="' . esc_url($game_url) . '" target="_blank" rel="noopener">';
        echo '<span class="quantum-go-icon">🎯</span>';
        echo '<span class="quantum-go-text">' . esc_html($button_text) . '</span>';
        echo '</a>';
        echo '</div>';
    }
    
    // 修改 CogniGo 内容
    public function modify_cognigo_content($content) {
        $options = get_option('quantum_go_options');
        $game_url = isset($options['game_url']) ? $options['game_url'] : '';
        
        if (empty($game_url)) {
            return $content;
        }
        
        // 查找并替换 CogniGo 的 Learn more 链接
        $pattern = '/<a[^>]*href=["\'][^"\']*["\'][^>]*>Learn more<\/a>/i';
        $replacement = '<a href="' . esc_url($game_url) . '" target="_blank" rel="noopener" class="quantum-go-link">Learn more</a>';
        
        return preg_replace($pattern, $replacement, $content);
    }
}

// 初始化插件
new QuantumGoIntegration();

// 激活插件时创建必要的选项
register_activation_hook(__FILE__, function() {
    $default_options = array(
        'game_url' => '',
        'button_text' => '开始游戏',
        'button_position' => 'bottom-right',
        'enable_floating_button' => 1
    );
    
    add_option('quantum_go_options', $default_options);
});

// 停用插件时清理
register_deactivation_hook(__FILE__, function() {
    // 可以选择是否删除设置
    // delete_option('quantum_go_options');
});
?>