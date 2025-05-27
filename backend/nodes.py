import os
import time
import socket
import subprocess
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import List, Union
from loguru import logger

from dataclasses import dataclass
import json
from fabric import Connection, Config
from paramiko.ssh_exception import SSHException, NoValidConnectionsError

script_dir = os.path.dirname(os.path.abspath(__file__))

@dataclass
class GPU:
    index: int
    name: str
    temperature: float
    utilization: float
    memory_used: int
    memory_total: int
    power_draw: float

    def to_dict(self):
        return self.__dict__

    def update(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    def __str__(self):
        return (
            f"[GPU {self.index}] {self.name} | 温度: {self.temperature}°C | "
            f"利用率: {self.utilization}% | 显存: {self.memory_used}/{self.memory_total} MiB | "
            f"功率: {self.power_draw} W"
        )


class Node:
    def __init__(self, hostname: str, need_guard_interval=10, active_power_threshold=100):
        self.hostname = hostname
        self.gpus = []
        self.is_guard_running = False
        self.need_guard_interval = need_guard_interval
        self.active_power_threshold = active_power_threshold

        self.power_history = defaultdict(lambda: deque())
        self.is_local = self._check_is_local()
        self.tmp_folder = f"../tmp/{self.hostname}"
        os.makedirs(self.tmp_folder, exist_ok=True)
        self.guard_name = f"gpu_guard_{self.hostname}"
        self.last_update_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        self.conn = None
        self.is_online = self._init_connection_if_remote()

        self.update_gpu_info()
        self.update_guard_status()

    def _check_is_local(self) -> bool:
        local_hostnames = {socket.gethostname(), socket.getfqdn(), "localhost", "127.0.0.1"}
        if self.hostname in local_hostnames:
            return True
        try:
            host_ip = socket.gethostbyname(self.hostname)
            local_ips = socket.gethostbyname_ex(socket.gethostname())[2]
            return host_ip in local_ips
        except Exception:
            return False

    def _init_connection_if_remote(self) -> bool:
        if self.is_local:
            return True
        try:
            config = Config(overrides={'connect_timeout': 5})
            self.conn = Connection(self.hostname, config=config)
            self.conn.open()
            return True
        except Exception as e:
            logger.warning(f"[{self.hostname}] SSH连接失败: {e}")
            self.conn = None
            return False

    def run_cmd(self, cmd: str, timeout=300) -> str:
        if not self.is_online:
            logger.warning(f"[{self.hostname}] 离线状态，跳过命令: {cmd}")
            return False, ""
        try:
            if self.is_local:
                result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=timeout, shell=True)
                if result.returncode in (0, 1):
                    return True, result.stdout.strip()
                if result.returncode == -15 and 'pkill' in cmd:
                    return True, ""
                logger.error(f"[{self.hostname}] 本地命令失败: {result.stderr.strip()}")
                return False, ""
            else:
                if self.conn is None:
                    self.is_online = self._init_connection_if_remote()
                    if not self.is_online:
                        return False, ""
                result = self.conn.run(cmd, hide=True, timeout=timeout, warn=True)
                return True, result.stdout.strip()
        except (SSHException, NoValidConnectionsError) as e:
            logger.warning(f"[{self.hostname}] SSH连接中断: {e}，尝试重连")
            self.conn = None
            self.is_online = self._init_connection_if_remote()
            return self.run_cmd(cmd, timeout)
        except Exception as e:
            logger.warning(f"[{self.hostname}] 命令执行异常: {e}")
            return False, ""

    def update_time(self):
        self.last_update_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    def update_gpu_info(self) -> List:
        query = (
            "nvidia-smi --query-gpu=index,name,temperature.gpu,utilization.gpu," 
            "memory.used,memory.total,power.draw --format=csv,noheader,nounits"
        )
        status, output = self.run_cmd(query)
        if not status:
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

    def record_power(self, gpu_index: int, power_draw: float):
        now = datetime.now()
        history = self.power_history[gpu_index]
        history.append((now, power_draw))

        cutoff = now - timedelta(minutes=30)
        while history and history[0][0] < cutoff:
            history.popleft()

    def update_guard_status(self):
        cmd = f"ps aux | grep '{self.guard_name}' | grep -v grep"
        status, result = self.run_cmd(cmd)
        self.update_time()
        self.is_guard_running = bool(status and result)

    def update_guard_policy(self, need_guard_interval, active_power_threshold):
        self.active_power_threshold = active_power_threshold
        self.need_guard_interval = need_guard_interval

    def update(self):
        self.update_gpu_info()
        self.update_guard_status()

    def start_guard(self):
        self.update_guard_status()
        if self.is_guard_running:
            logger.info(f"[{self.hostname}] 守护进程已运行")
            return

        cmd = f"cd {script_dir} && bash start_task.sh {self.guard_name} {os.path.join(self.tmp_folder, 'gpu_guard.log')}"
        status, output = self.run_cmd(cmd)
        if not status:
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
        status, output = self.run_cmd(cmd)
        if not status:
            logger.error(f"[{self.hostname}] 终止守护进程失败")
        else:
            time.sleep(1)
            self.update_guard_status()
            if not self.is_guard_running:
                logger.info(f"[{self.hostname}] 守护进程已终止")
            else:
                logger.warning(f"[{self.hostname}] 守护进程终止失败")

    def need_guard(self) -> bool:
        now = datetime.now()
        for index, records in self.power_history.items():
            recent = [p for t, p in records if t >= now - timedelta(minutes=self.need_guard_interval)]
            if not recent:
                return True
            avg_power = sum(recent) / len(recent)
            if avg_power < self.active_power_threshold:
                return True
        return False

    def to_dict(self) -> dict:
        self.update_gpu_info()
        self.update_guard_status()
        return {
            'hostname': self.hostname,
            'gpus': [gpu.to_dict() for gpu in self.gpus],
            'guard_running': self.is_guard_running,
            'last_updated': self.last_update_time,
            'need_guard': self.need_guard(),
            'is_online': self.is_online
        }


class Nodes:
    def __init__(self, host_file_path: str):
        self.host_file_path = host_file_path
        self.nodes = self._load_nodes()

    def _load_nodes(self) -> List[Node]:
        nodes = []
        try:
            with open(self.host_file_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    parts = line.split()
                    hostname = parts[0]
                    node = Node(hostname)
                    nodes.append(node)
                    logger.info(f"加载节点: {node.hostname} 完成")
        except Exception as e:
            logger.info(f"读取host文件失败: {e}")
        return nodes

    def to_dict(self) -> List[dict]:
        return [node.to_dict() for node in self.nodes]

    def update(self):
        for node in self.nodes:
            node.update()

    def start_guard(self, host_names: Union[List[str], None] = None):
        if not host_names:
            host_names = [node.hostname for node in self.nodes]
        for node in self.nodes:
            if node.hostname in host_names:
                node.start_guard()
        return {node.hostname: node.is_guard_running for node in self.nodes}

    def stop_guard(self, host_names: Union[List[str], None] = None):
        if not host_names:
            host_names = [node.hostname for node in self.nodes]
        for node in self.nodes:
            if node.hostname in host_names:
                node.stop_guard()
        return {node.hostname: not node.is_guard_running for node in self.nodes}

    def update_guard_policy(self, need_guard_interval, active_power_threshold):
        for node in self.nodes:
            node.update_guard_policy(need_guard_interval, active_power_threshold)


if __name__ == "__main__":
    nodes = Nodes("/etc/volcano/all.host")
    for node in nodes.nodes:
        print(node.to_dict())
    # nodes.stop_guard()
