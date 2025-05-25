from flask import Flask, render_template, jsonify, request
from fake_nodes import Nodes  # 引入 nodes.py 中的 Nodes 类
from loguru import logger

app = Flask(__name__)
nodes_manager = Nodes("host")


@app.route('/')
def index():
    """Renders the main dashboard page."""
    return render_template('index.html')


@app.route('/api/nodes_data')
def get_nodes_data():
    """API endpoint to get updated nodes data."""
    nodes_manager.update()
    return jsonify(nodes_manager.to_dict())


@app.route('/api/start_guard', methods=['POST'])
def api_start_guard():
    """API endpoint to start guard on specified nodes (or all if empty list)."""
    data = request.get_json()
    hostnames = data.get('hostnames', [])
    logger.info(f"Attempting to start guard on: {hostnames if hostnames else 'ALL nodes'}")
    results = nodes_manager.start_guard(hostnames)
    return jsonify({"status": "success", "results": results})


@app.route('/api/stop_guard', methods=['POST'])
def api_stop_guard():
    """API endpoint to stop guard on specified nodes (or all if empty list)."""
    data = request.get_json()
    hostnames = data.get('hostnames', [])
    logger.info(f"Attempting to stop guard on: {hostnames if hostnames else 'ALL nodes'}")
    results = nodes_manager.stop_guard(hostnames)
    return jsonify({"status": "success", "results": results})


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)