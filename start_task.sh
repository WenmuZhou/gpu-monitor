#!/bin/bash

# 参数：任务名 和 日志文件路径
TASK_NAME=${1:-hold}
LOG_PATH=${2:-"./logs/${TASK_NAME}_$(date +%Y%m%d_%H%M%S).log"}

# 自动查找空闲端口
FREE_PORT=$(python3 -c "import socket; s=socket.socket(); s.bind(('', 0)); print(s.getsockname()[1]); s.close()")

echo "Launching torchrun..."
echo "  task: $TASK_NAME"
echo "  port: $FREE_PORT"
echo "  log : $LOG_PATH"

# 创建日志目录（如果必要）
mkdir -p "$(dirname "$LOG_PATH")"

# 启动 torchrun，输出重定向到指定日志路径
nohup \
  torchrun --nproc-per-node=$(nvidia-smi -L | wc -l) --master_port=$FREE_PORT \
  gpu_guard.py --name "$TASK_NAME" \
  > "$LOG_PATH" 2>&1 &
