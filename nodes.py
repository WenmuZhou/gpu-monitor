import os
import time
import socket
import subprocess
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import List, Union
from loguru import logger

# 当前脚本文件夹
script_dir = os.path.dirname(os.path.abspath(__file__))

from dataclasses import dataclass
import json

@dataclass
class GPU:
    index: int
    name: str
    temperature: float          # 摄氏度
    utilization: float          # 百分比
    memory_used: int            # MiB
    memory_total: int           # MiB
    power_draw: float           # W

    @classmethod
    def from_dict(cls, data: dict):
        """从字典创建 GPU 实例"""
        return cls(
            index=int(data.get('index', 0)),
            name=str(data.get('name', 'Unknown')),
            temperature=float(data.get('temperature', 0)),
            utilization=float(data.get('utilization', 0)),
            memory_used=int(data.get('memory_used', 0)),
            memory_total=int(data.get('memory_total', 0)),
            power_draw=float(data.get('power_draw', 0)),
        )

    def to_dict(self):
        return {
            'index': self.index,
            'name': self.name,
            'temperature': self.temperature,
            'utilization': self.utilization,
            'memory_used': self.memory_used,
            'memory_total': self.memory_total,
            'power_draw': self.power_draw,
        }

    def update(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    def __str__(self):
        return (
            f"[GPU {self.index}] {self.name} | "
            f"温度: {self.temperature}°C | "
            f"利用率: {self.utilization}% | "
            f"显存: {self.memory_used}/{self.memory_total} MiB | "
            f"功率: {self.power_draw} W | "
        )


class Node:
    # 一个在管理本机和远程机器的类，所有执行命令和文件操作相关的函数都需要支持本地和远程机器
    def __init__(self, hostname: str, need_guard_interval=10):
        self.hostname = hostname
        self.gpus = []
        self.is_guard_running = False
        self.need_guard_interval = need_guard_interval # 分钟级别的死亡时间

        self.power_history = defaultdict(lambda: deque())
        self.is_local = self._check_is_local()
        self.tmp_folder = f"./tmp/{self.hostname}"
        os.makedirs(self.tmp_folder, exist_ok=True)
        self.guard_name = f"gpu_guard_{self.hostname}"
        self.update_gpu_info()
        self.update_guard_status()
        self.last_update_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        

    def _check_is_local(self) -> bool:
        local_hostnames = {
            socket.gethostname(),
            socket.getfqdn(),
            "localhost",
            "127.0.0.1"
        }
        if self.hostname in local_hostnames:
            return True
        # 额外尝试解析hostname的IP对比本机IP
        try:
            host_ip = socket.gethostbyname(self.hostname)
            local_ips = socket.gethostbyname_ex(socket.gethostname())[2]
            if host_ip in local_ips:
                return True
        except Exception:
            pass
        return False

    def run_cmd(self, cmd: str, timeout=30) -> str:
        try:
            if self.is_local:
                result = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=timeout)
            else:
                ssh_cmd = ["ssh", self.hostname, cmd]
                result = subprocess.run(ssh_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=timeout)
            if result.returncode != 0:
                logger.info(f"[{self.hostname}] 命令执行失败: {result.stderr.strip()}")
                return ""
            return result.stdout.strip()
        except subprocess.TimeoutExpired:
            logger.info(f"[{self.hostname}] 命令执行超时")
            return ""
        except Exception as e:
            logger.info(f"[{self.hostname}] 运行命令异常: {e}")
            return ""

    def update_time(self):
        self.last_update_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    def update_gpu_info(self) -> List:
        query = (
            "nvidia-smi --query-gpu=index,name,temperature.gpu,utilization.gpu,"
            "memory.used,memory.total,power.draw --format=csv,noheader,nounits"
        )
        output = self.run_cmd(query)
        if not output:
            return []

        self.gpus = []
        for line in output.splitlines():
            parts = [p.strip() for p in line.split(',')]
            if len(parts) != 7:
                continue
            try:
                gpu = GPU(
                    index=int(parts[0]),
                    name=parts[1],
                    temperature=float(parts[2]),
                    utilization=float(parts[3]),
                    memory_used=int(parts[4]),
                    memory_total=int(parts[5]),
                    power_draw=float(parts[6])
                )
                self.gpus.append(gpu)
                self.record_power(gpu.index, gpu.power_draw)
                self.update_time()
            except Exception as e:
                logger.info(f"[{self.hostname}] 解析 GPU 信息失败: {e}")

    def update_guard_status(self):
        """
        通过进程名关键字判断守护进程是否运行。
        process_keyword: 守护进程脚本名或者唯一关键字，用于进程匹配。
        """
        # ps命令查找包含关键字的进程（排除grep自身进程）
        cmd = f"ps aux | grep '{self.guard_name}' | grep -v grep"
        result = self.run_cmd(cmd)

        self.update_time()

        if result:
            # 找到匹配的进程行，守护进程在运行
            self.is_guard_running = True
        else:
            self.is_guard_running =  False

    def update(self):
        self.update_gpu_info()
        self.update_guard_status()

    def start_guard(self):
        self.update_guard_status()
        if self.is_guard_running:
            logger.info(f"[{self.hostname}] 守护进程已运行")
            return

        cmd = f"cd {script_dir} && bash start_task.sh {self.guard_name} {os.path.join(self.tmp_folder, 'gpu_guard.log')}"
        output = self.run_cmd(cmd)
        if not output:
            logger.warning(f"[{self.hostname}] 启动守护进程失败")
        else:
            time.sleep(1)
            self.update_guard_status()
            if self.is_guard_running:
                logger.info(f"[{self.hostname}] 启动守护脚本成功")
            else:
                logger.warning(f"[{self.hostname}] 启动守护脚本失败")

    def stop_guard(self):
        self.update_guard_status()
        if not self.is_guard_running:
            logger.info(f"[{self.hostname}] 守护进程未运行")
            return
        cmd = f"pkill -f {self.guard_name}"
        output = self.run_cmd(cmd)
        if not output:
            logger.error(f"[{self.hostname}] 终止守护进程失败")
        else:
            time.sleep(1)

            self.update_guard_status()
            if not self.is_guard_running:
                logger.info(f"[{self.hostname}] 守护进程已终止")
            else:
                logger.warning(f"[{self.hostname}] 守护进程终止失败")

    def record_power(self, gpu_index: int, power_draw: float):
        now = datetime.now()
        history = self.power_history[gpu_index]
        history.append((now, power_draw))

        cutoff = now - timedelta(minutes=30)
        while history and history[0][0] < cutoff:
            history.popleft()

    def need_guard(self) -> bool:
        for index, records in self.power_history.items():
            recent = [p for t, p in records if t >= datetime.now() - timedelta(minutes=self.need_guard_interval)]
            if not recent:
                continue
            avg_power = sum(recent) / len(recent)
            if avg_power >= 100:
                return False
        return True

    def to_dict(self) -> dict:
        """返回当前机器的GPU信息和守护进程状态的JSON字符串"""
        self.update_gpu_info()
        self.update_guard_status()

        data = {
            'hostname': self.hostname,
            'gpus': [gpu.to_dict() for gpu in self.gpus],
            'guard_running': self.is_guard_running,
            'last_updated': self.last_update_time,
            'need_guard': self.need_guard()
        }
        return data


class Nodes:
    def __init__(self, host_file_path: str):
        self.host_file_path = host_file_path
        self.nodes = self._load_nodes()
        # 打印加载的节点信息
        for node in self.nodes:
            logger.info(f"加载节点: {node.hostname} 完成")

    def _load_nodes(self) -> List[Node]:
        nodes = []
        try:
            with open(self.host_file_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue  # 跳过空行和注释
                    # 格式示例：columbia-induced-pride-gvl-jun-zhou10-master-0 slots=8
                    parts = line.split()
                    hostname = parts[0]  # 取第一个字段为机器名
                    node = Node(hostname)
                    nodes.append(node)
        except Exception as e:
            logger.info(f"读取host文件失败: {e}")
        return nodes

    def to_dict(self) -> List[dict]:
        nodes_data = [node.to_dict() for node in self.nodes]
        return nodes_data

    def update(self):
        for node in self.nodes:
            node.update()

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

if __name__ == "__main__":
    nodes = Nodes("/etc/volcano/all.host")
    print(nodes.to_dict())
    # Simulate starting and stopping guards
    nodes.start_guard()
    nodes.stop_guard()
