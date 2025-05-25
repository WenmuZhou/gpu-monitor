import random
from datetime import datetime, timedelta
from collections import defaultdict, deque
from typing import List, Union
from loguru import logger

# Simulated classes for the fake version

class FakeGPU:
    def __init__(self, index: int):
        self.index = index
        self.name = f"Fake GPU {index}"
        self.temperature = random.uniform(30, 80)  # Simulate temperature between 30°C to 80°C
        self.utilization = random.uniform(0, 100)  # Simulate utilization between 0% to 100%
        self.memory_used = random.randint(0, 16000)  # Simulate used memory (in MiB)
        self.memory_total = 16000  # 16GB total memory for all GPUs
        self.power_draw = random.uniform(50, 250)  # Simulate power draw between 50W and 250W

    def __str__(self):
        return (
            f"[GPU {self.index}] {self.name} | "
            f"温度: {self.temperature:.2f}°C | "
            f"利用率: {self.utilization:.2f}% | "
            f"显存: {self.memory_used}/{self.memory_total} MiB | "
            f"功率: {self.power_draw:.2f} W | "
        )


class FakeNode:
    def __init__(self, hostname: str, need_guard_interval=10):
        self.hostname = hostname
        self.gpus = [FakeGPU(i) for i in range(4)]  # Fake 4 GPUs on each node
        self.is_guard_running = False
        self.need_guard_interval = need_guard_interval  # Minutes
        self.last_update_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.power_history = defaultdict(lambda: deque())

    def update_gpu_info(self):
        """Fake update of GPU info."""
        for gpu in self.gpus:
            gpu.temperature = random.uniform(30, 80)
            gpu.utilization = random.uniform(0, 100)
            gpu.memory_used = random.randint(0, gpu.memory_total)
            gpu.power_draw = random.uniform(50, 250)
        self.update_time()

    def update_guard_status(self, flag):
        """Simulate checking guard status."""
        self.is_guard_running =flag
        self.update_time()

    def update_time(self):
        self.last_update_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    def start_guard(self):
        """Simulate starting the guard."""
        if self.is_guard_running:
            logger.info(f"[{self.hostname}] 守护进程已运行")
        else:
            self.is_guard_running = True
            logger.info(f"[{self.hostname}] 启动守护进程成功")

    def stop_guard(self):
        """Simulate stopping the guard."""
        if not self.is_guard_running:
            logger.info(f"[{self.hostname}] 守护进程未运行")
        else:
            self.is_guard_running = False
            logger.info(f"[{self.hostname}] 停止守护进程成功")

    def need_guard(self):
        """Simulate checking if the node needs a guard based on power draw."""
        return random.choice([True, False])

    def to_dict(self) -> dict:
        """Fake dictionary representation."""
        self.update_gpu_info()

        data = {
            'hostname': self.hostname,
            'gpus': [{
                'index': gpu.index,
                'name': gpu.name,
                'temperature': gpu.temperature,
                'utilization': gpu.utilization,
                'memory_used': gpu.memory_used,
                'memory_total': gpu.memory_total,
                'power_draw': gpu.power_draw,
            } for gpu in self.gpus],
            'guard_running': self.is_guard_running,
            'last_updated': self.last_update_time
        }
        return data


class Nodes:
    def __init__(self, host_file_path: str):
        self.host_file_path = host_file_path
        self.nodes = self._load_nodes()
        for node in self.nodes:
            logger.info(f"加载节点: {node.hostname} 完成")

    def _load_nodes(self) -> List[FakeNode]:
        # Simulate loading nodes from a fake file
        nodes = []
        for i in range(5):  # Fake 5 nodes for the simulation
            node = FakeNode(f"fake-node-{i}")
            nodes.append(node)
        return nodes

    def to_dict(self) -> List[dict]:
        nodes_data = [node.to_dict() for node in self.nodes]
        return nodes_data

    def update(self):
        for node in self.nodes:
            node.update_gpu_info()

    def start_guard(self, host_names: Union[List[str], None] = None):
        if host_names is None or len(host_names) == 0:
            host_names = [node.hostname for node in self.nodes]
        for node in self.nodes:
            if node.hostname in host_names:
                node.start_guard()
        return {node.hostname: node.is_guard_running for node in self.nodes}

    def stop_guard(self, host_names: Union[List[str], None] = None):
        if host_names is None or len(host_names) == 0:
            host_names = [node.hostname for node in self.nodes]
        print(host_names)
        for node in self.nodes:
            if node.hostname in host_names:
                node.stop_guard()
        return {node.hostname: not node.is_guard_running for node in self.nodes}

    def need_guard(self, host_names: Union[List[str], None] = None) -> dict:
        if host_names is None or len(host_names) == 0:
            host_names = [node.hostname for node in self.nodes]
        status = {}
        for node in self.nodes:
            if node.hostname in host_names:
                status[node.hostname] = node.need_guard()
        return status


# Fake testing code
if __name__ == "__main__":
    nodes = Nodes("host")  # Fake file path
    print(nodes.to_dict())
    # Simulate starting and stopping guards
    nodes.start_guard()
    nodes.stop_guard()
