#!/bin/bash
# 如果任何命令失败，则立即退出
set -e

echo "正在启动 GPU 监控系统的后端和前端..."

# 创建日志目录 (统一在项目根目录下的 tmp 文件夹)
mkdir -p tmp

# --- 检查并安装 Python 和 pip 环境 ---
echo "正在检查 Python 和 pip 环境..."

# 检查 Python 是否已安装
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "Python 未安装。正在尝试自动安装 Python..."

        OS=$(uname -s) # 获取操作系统类型

        if [ "$OS" == "Linux" ]; then
            if command -v apt &> /dev/null; then
                echo "检测到 Debian/Ubuntu 系统，正在使用 apt 安装 Python3..."
                sudo apt update
                sudo apt install -y python3 python3-pip
            elif command -v yum &> /dev/null; then
                echo "检测到 CentOS/RHEL 系统，正在使用 yum 安装 Python3..."
                sudo yum install -y python3 python3-pip
            else
                echo "无法自动检测到适合的 Linux 包管理器 (apt/yum)。"
                echo "请手动安装 Python3 和 pip。"
                exit 1
            fi
        elif [ "$OS" == "Darwin" ]; then
            if command -v brew &> /dev/null; then
                echo "检测到 macOS 系统，正在使用 Homebrew 安装 Python3..."
                brew install python
            else
                echo "Homebrew 未安装。请先安装 Homebrew (https://brew.sh/)，然后重新运行此脚本，或者手动安装 Python3。"
                echo "  /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                exit 1
            fi
        else
            echo "无法自动安装 Python。您的操作系统 ($OS) 未被支持自动安装。"
            echo "请手动安装 Python (包含 pip)。推荐访问 Python 官方网站获取安装包："
            echo "  https://www.python.org/downloads/"
            exit 1
        fi

        # 再次检查 Python 是否安装成功
        if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
            echo "Python 自动安装失败。请尝试手动安装 Python 和 pip 后再运行此脚本。"
            exit 1
        fi
        echo "Python 已成功安装。"
    else
        echo "Python (旧版本) 已安装。建议使用 Python 3。"
    fi
else
    echo "Python3 已安装。"
fi

# 检查 pip 是否已安装
if ! command -v pip3 &> /dev/null; then
    if ! command -v pip &> /dev/null; then
        echo "pip 未安装。正在尝试安装 pip..."
        # 尝试使用 get-pip.py 安装 pip
        if command -v python3 &> /dev/null; then
            python3 -m ensurepip --default-pip || curl https://bootstrap.pypa.io/get-pip.py | python3
        elif command -v python &> /dev/null; then
            python -m ensurepip --default-pip || curl https://bootstrap.pypa.io/get-pip.py | python
        else
            echo "无法找到 Python 解释器来安装 pip。请手动安装 pip。"
            exit 1
        fi

        if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
            echo "pip 自动安装失败。请尝试手动安装 pip 后再运行此脚本。"
            exit 1
        fi
        echo "pip 已成功安装。"
    else
        echo "pip (旧版本) 已安装。建议使用 pip3。"
    fi
else
    echo "pip3 已安装。"
fi

echo "Python 和 pip 环境已就绪。"

# --- 检查并安装 Node.js 和 npm 环境 ---
echo "正在检查 Node.js 和 npm 环境..."

# 检查 Node.js 是否已安装
if ! command -v node &> /dev/null; then
    echo "Node.js 未安装。正在尝试自动安装 Node.js..."

    OS=$(uname -s) # 获取操作系统类型

    if [ "$OS" == "Linux" ]; then
        # 尝试检测并安装 Debian/Ubuntu 上的 Node.js
        if command -v apt &> /dev/null; then
            echo "检测到 Debian/Ubuntu 系统，正在使用 apt 安装 Node.js..."
            sudo apt update
            sudo apt install -y nodejs npm
        elif command -v yum &> /dev/null; then
            echo "检测到 CentOS/RHEL 系统，正在使用 yum 安装 Node.js..."
            sudo yum install -y nodejs npm
        else
            echo "无法自动检测到适合的 Linux 包管理器 (apt/yum)。"
            echo "请手动安装 Node.js 和 npm。推荐使用 nvm (Node Version Manager)。"
            echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash"
            echo "安装 nvm 后，请关闭并重新打开终端，然后运行："
            echo "  nvm install --lts"
            echo "  nvm use --lts"
            echo "  npm install -g npm@latest"
            exit 1
        fi
    elif [ "$OS" == "Darwin" ]; then
        # 尝试在 macOS 上使用 Homebrew 安装 Node.js
        if command -v brew &> /dev/null; then
            echo "检测到 macOS 系统，正在使用 Homebrew 安装 Node.js..."
            brew install node
        else
            echo "Homebrew 未安装。请先安装 Homebrew (https://brew.sh/)，然后重新运行此脚本，或者手动安装 Node.js。"
            echo "  /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            echo "安装 Homebrew 后，请重新运行此脚本。"
            exit 1
        fi
    else
        echo "无法自动安装 Node.js。您的操作系统 ($OS) 未被支持自动安装。"
        echo "请手动安装 Node.js (包含 npm)。推荐访问 Node.js 官方网站获取安装包："
        echo "  https://nodejs.org/en/download/"
        exit 1
    fi

    # 再次检查 Node.js 是否安装成功
    if ! command -v node &> /dev/null; then
        echo "Node.js 自动安装失败。请尝试手动安装 Node.js 和 npm 后再运行此脚本。"
        exit 1
    fi
    echo "Node.js 已成功安装。"
else
    echo "Node.js 已安装。"
fi

# 检查 npm 是否已安装 (Node.js 安装通常会包含 npm)
if ! command -v npm &> /dev/null; then
    echo "npm 未安装。正在尝试安装 npm..."
    npm install -g npm@latest
    if ! command -v npm &> /dev/null; then
        echo "npm 自动安装失败。请尝试手动安装 npm 后再运行此脚本："
        echo "  npm install -g npm@latest"
        exit 1
    fi
    echo "npm 已成功安装。"
else
    echo "npm 已安装。"
fi

echo "Node.js 和 npm 环境已就绪。"

# --- 启动后端 (使用系统环境) ---
echo "正在启动后端服务..."
cd backend

# 安装后端依赖到系统 Python 环境，并检查是否已安装
echo "正在检查并安装后端依赖 (到系统环境)..."
while IFS= read -r line || [[ -n "$line" ]]; do
    # 移除注释和空白行
    package=$(echo "$line" | sed 's/#.*//' | xargs)
    if [ -z "$package" ]; then
        continue
    fi

    # 提取包名 (处理带版本号的情况，如 'flask==2.0.0' 只取 'flask')
    package_name=$(echo "$package" | cut -d'=' -f1 | cut -d'>' -f1 | cut -d'<' -f1)

    if pip show "$package_name" &> /dev/null; then
        echo "  - $package_name 已安装，跳过。"
    else
        echo "  - 正在安装 $package..."
        pip install "$package"
    fi
done < requirements.txt

# 在后台启动 Flask 应用，并将输出重定向到项目根目录下的 tmp/backend.log
nohup python app.py > ../tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已在后台启动，PID: $BACKEND_PID。请查看 tmp/backend.log 获取输出。"
cd .. # 返回项目根目录

# --- 启动前端 ---
echo "正在启动前端应用..."
cd frontend

# 检查 npm 依赖是否已安装
if [ -d "node_modules" ]; then
    echo "前端依赖已安装 (node_modules 目录存在)，跳过 npm install。"
else
    echo "正在安装前端依赖..."
    npm install
fi

# 获取本机局域网 IP 地址
# 尝试使用 hostname -I (Linux) 或 ipconfig getifaddr (macOS)
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}') || \
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null) || \
LOCAL_IP="无法获取IP" # 备用文本

# --- 在启动前端前，先输出所有重要信息 ---
echo ""
echo "===================================================="
echo "服务启动概览:"
echo "后端已在后台启动 (PID: $BACKEND_PID)。"
echo "前端即将启动，并占用当前终端。"
echo "您可以通过浏览器访问前端: http://${LOCAL_IP}:3000"
echo "后端 API 地址: http://${LOCAL_IP}:5000" # 添加后端地址
echo "所有日志文件位于: ./tmp/backend.log 和 ./tmp/frontend.log"
echo ""
echo "--- 如何停止服务 ---"
echo "要停止前端，请在当前终端中按 Ctrl+C。"
echo "要停止后端，请使用以下命令 (可能需要管理员权限或根据实际PID调整):"
echo "  kill $BACKEND_PID"
echo "或者，更通用的方法 (请谨慎使用，因为它会杀死所有匹配的进程):"
echo "  pkill -f \"python app.py\""
echo "  pkill -f \"npm start\""
echo "===================================================="
echo ""
echo "正在启动前端应用... (按 Ctrl+C 停止)"

# 在前台启动 React 应用，并将输出通过 tee 同步到项目根目录下的 tmp/frontend.log
# 注意：前端将占用当前终端，直到您手动停止 (Ctrl+C)
HOST=0.0.0.0 npm start 2>&1 | tee ../tmp/frontend.log

