#!/bin/bash

# 启动Web服务器
echo "Starting GPU Monitor Web Server..."
python3 main.py &

# 保存进程ID
WEB_SERVER_PID=$!
echo "Web server started with PID $WEB_SERVER_PID on port 5001"

# 启动本地守护进程（可选）
#echo "Starting local GPU protector..."
#python3 guardian_script.py &

# 保存守护进程ID
#GUARDIAN_PID=$!
echo "GPU protector started with PID $GUARDIAN_PID"

# 创建日志目录
mkdir -p logs

# 保持脚本运行
wait