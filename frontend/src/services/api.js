import axios from 'axios';

// Flask 后端 API 的基本 URL
const API_BASE_URL = 'http://' + window.location.hostname + ':5000/api';
export const fetchNodes = async () => {
    try {
        // 请求所有节点数据
        const response = await axios.get(`${API_BASE_URL}/nodes_data`);
        return response.data;
    } catch (error) {
        console.error("获取节点数据失败:", error);
        throw error;
    }
};

export const startGuard = async (hostnames = []) => {
    try {
        // 向后端发送启动守护进程的请求
        const response = await axios.post(`${API_BASE_URL}/start_guard`, { hostnames });
        return response.data;
    } catch (error) {
        console.error("启动守护进程失败:", error);
        throw error;
    }
};

export const stopGuard = async (hostnames = []) => {
    try {
        // 向后端发送停止守护进程的请求
        const response = await axios.post(`${API_BASE_URL}/stop_guard`, { hostnames });
        return response.data;
    } catch (error) {
        console.error("停止守护进程失败:", error);
        throw error;
    }
};

export const updateGuardPolicy = async (policy) => {
    // In a real application, you would send this policy to your backend.
    // Example:
    try {
        // 前端通过 axios 发送的请求体是 { policy: { active_power_threshold: X, guard_interval_minutes: Y } }
        const response = await axios.post(`${API_BASE_URL}/guard_policy`, { policy });
        return response.data;
    } catch (error) {
        console.error("更新守护策略失败:", error);
        throw error;
    }
};

