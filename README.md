# GPU 节点监控系统

这是一个用于监控 GPU 节点并提供自动守护功能的系统。

## 目录

- [GPU 节点监控系统](#gpu-节点监控系统)
  - [目录](#目录)
  - [功能](#功能)
  - [技术栈](#技术栈)
  - [快速启动 (开发环境)](#快速启动-开发环境)
    - [先决条件](#先决条件)
    - [一键启动脚本](#一键启动脚本)
    - [截图](#截图)
  - [项目结构](#项目结构)
  - [配置](#配置)
  - [日志](#日志)
  - [停止服务](#停止服务)

## 功能

* 实时监控 GPU 节点的状态、CPU 使用率、内存使用和平均功耗。
* 显示每个 GPU 的详细信息，包括温度、利用率、显存使用和功耗。
* 自动守护功能：根据预设策略（例如，低功耗不活跃）自动启动 GPU 守护进程。
* 手动启动/停止所有节点的守护进程。
* 可配置的守护策略（不活跃判断间隔、活跃功耗阈值）。
* 可配置的数据刷新间隔。
* 事件日志记录，方便追踪系统操作和异常。
* 节点列表的排序、筛选和搜索功能。

## 技术栈

**前端:**
* React
* Chakra UI (用于组件和样式)
* `react-icons` (用于图标)

**后端:**
* Python Flask (作为 RESTful API)
* （您的后端可能使用的其他 Python 库，例如用于 GPU 监控的 `pynvml` 或其他系统信息库）

## 快速启动 (开发环境)

### 先决条件

在运行本系统之前，请确保您的系统已安装以下环境：

* **Python 3.x** (后端需要)
* **Node.js 和 npm** (前端需要)

脚本会自动尝试安装 Node.js 和 npm，但如果自动安装失败，请根据您的操作系统手动安装。

### 一键启动脚本

我们提供了一个便捷的脚本 `start_dev.sh` (适用于 Linux/macOS) 来一键启动后端和前端服务。

1.  **下载项目:**
    克隆或下载本项目的代码到您的本地机器。

2.  **赋予脚本执行权限 (Linux/macOS):**
    打开终端，导航到项目根目录，然后运行以下命令：
    ```bash
    chmod +x start_dev.sh
    ```

3.  **运行脚本:**
    在项目根目录运行脚本：
    ```bash
    ./start_dev.sh
    ```
    脚本将执行以下操作：
    * 检查并尝试自动安装 Node.js 和 npm（如果未安装）。
    * 进入 `backend` 目录，安装 Python 依赖，并在后台启动 Flask 后端服务。后端日志将输出到 `./tmp/backend.log`。
    * 进入 `frontend` 目录，安装 npm 依赖，并在前台启动 React 前端应用。前端日志将同步输出到 `./tmp/frontend.log`，同时也会在当前终端显示。

4.  **访问应用:**
    前端应用启动后，您可以通过浏览器访问：
    [http://localhost:3000](http://localhost:3000)

### 截图

您可以在此处插入应用的实际运行截图，例如：

* **主界面截图:** ![](./images/zhuye.png)
* **设置界面截图:** ![](./images/setting.png)
* **节点详情截图:** ![](./images/node.png)

## 项目结构

```bash
gpu-monitor/
├── backend/                  # 后端 Flask 应用
│   ├── app.py                # Flask 主应用文件
│   ├── requirements.txt      # 后端 Python 依赖
│   └── ...
├── frontend/                 # 前端 React 应用
│   ├── public/               # 静态文件 (index.html, favicon.ico 等)
│   ├── src/                  # React 源代码
│   │   ├── components/       # 可复用 UI 组件 (NodeCard, EventLog, SettingsModal, OverviewStats, ControlPanel, GlobalActions)
│   │   ├── hooks/            # 自定义 React Hooks (useNodeMonitoring)
│   │   ├── services/         # API 调用服务
│   │   ├── App.js            # 主应用组件
│   │   └── index.js          # React 应用入口
│   └── package.json          # 前端依赖配置
├── tmp/                      # 统一的日志输出目录 (由脚本自动创建)
│   ├── backend.log           # 后端服务日志
│   └── frontend.log          # 前端应用日志
├── start_dev.sh              # 一键启动脚本 (Linux/macOS)
└── README.md                 # 本文件
```


## 配置

您可以通过前端界面的“设置”按钮修改以下配置：

* **自动守护：** 开启/关闭自动守护功能。
* **不活跃判断间隔：** 设置判断 GPU 不活跃的时间段（分钟）。
* **活跃功耗阈值：** 设置判断 GPU 活跃的功耗阈值（瓦特）。
* **数据刷新间隔：** 设置页面自动刷新节点数据的时间间隔。

## 日志

所有服务日志都将统一输出到项目根目录下的 `./tmp` 文件夹：

* `./tmp/backend.log`：后端 Flask 服务的日志。
* `./tmp/frontend.log`：前端 React 应用的日志（会同步显示在终端）。

## 停止服务

* **停止前端：** 在运行 `start_dev.sh` 脚本的终端中，直接按 `Ctrl+C` 即可停止前台运行的前端应用。
* **停止后端：** 后端服务在后台运行。您可以使用以下命令停止它（请根据 `start_dev.sh` 脚本输出的 PID 替换 `$BACKEND_PID`）：
    ```bash
    kill $BACKEND_PID
    ```
    或者，更通用的方法（请谨慎使用，因为它会杀死所有匹配的 Python 进程）：
    ```bash
    pkill -f "python app.py"
    ```
* **停止所有相关进程（谨慎使用）：**
    ```bash
    pkill -f "python app.py"
    pkill -f "npm start"
    ```