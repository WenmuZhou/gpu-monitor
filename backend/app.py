from flask import Flask, render_template, jsonify, request
from flask_cors import CORS # 引入 Flask-CORS，用于处理跨域问题
from fake_nodes import Nodes  # 引入 fake_nodes.py 中的 Nodes 类
from loguru import logger

app = Flask(__name__)
# 允许来自前端应用的跨域请求。在开发环境中，通常允许所有源。
# 在生产环境中，建议只允许您的前端应用的特定来源。
CORS(app) # 默认允许所有来源

nodes_manager = Nodes("all.host") # 初始化节点管理器

@app.route('/')
def index():
    """渲染主仪表盘页面 (如果需要的话，通常由前端路由处理)."""
    # 如果您不打算让Flask渲染前端，这个路由可以移除或修改。
    # 这里我们只是为了完整性保留一个示例。
    return "<h1>GPU 节点监控后端已运行</h1><p>请访问前端应用 (例如: http://localhost:3000) </p>"


@app.route('/api/nodes_data')
def get_nodes_data():
    """API 端点：获取更新后的节点数据。"""
    nodes_manager.update() # 更新节点信息
    return jsonify(nodes_manager.to_dict()) # 返回 JSON 格式的节点数据


@app.route('/api/start_guard', methods=['POST'])
def api_start_guard():
    """API 端点：在指定节点（或所有节点）上启动守护进程。"""
    data = request.get_json() # 获取 POST 请求的 JSON 数据
    hostnames = data.get('hostnames', []) # 获取 hostnames 列表，默认为空列表
    logger.info(f"尝试在以下节点启动守护进程: {hostnames if hostnames else '所有节点'}")
    results = nodes_manager.start_guard(hostnames) # 调用节点管理器的启动方法
    return jsonify({"status": "success", "results": results}) # 返回操作结果


@app.route('/api/stop_guard', methods=['POST'])
def api_stop_guard():
    """API 端点：在指定节点（或所有节点）上停止守护进程。"""
    data = request.get_json()
    hostnames = data.get('hostnames', [])
    logger.info(f"尝试在以下节点停止守护进程: {hostnames if hostnames else '所有节点'}")
    results = nodes_manager.stop_guard(hostnames)
    return jsonify({"status": "success", "results": results})


@app.route('/api/guard_policy', methods=['POST'])
def api_updagte_guard_policy():
    """API 端点：在指定节点（或所有节点）上停止守护进程。"""
    data = request.get_json()
    data = data.get('policy', {})
    data['need_guard_interval'] = data.pop('guard_interval_minutes')
    nodes_manager.update_guard_policy(**data)
    logger.info(f"在全部节点更新守护进程策略: {data}")
    return jsonify({"status": "success"})


if __name__ == '__main__':
    # 运行 Flask 应用，监听所有网络接口的 5000 端口，并关闭调试模式
    app.run(debug=False, host='0.0.0.0', port=5000)