import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { fetchNodes, startGuard, stopGuard, updateGuardPolicy } from '../services/api';

const useNodeMonitoring = () => {
    const [nodes, setNodes] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const toast = useToast();

    // 事件日志状态
    const [events, setEvents] = useState([]);

    // 用于添加日志的辅助函数
    const addEvent = useCallback((message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setEvents(prevEvents => [
            { id: Date.now() + Math.random(), timestamp, message, type },
            ...prevEvents
        ].slice(0, 50));
    }, []);

    // 清空事件日志的函数
    const onClearEvents = useCallback(() => {
        setEvents([]);
        addEvent("事件日志已清空。", "info");
    }, [addEvent]);

    // Settings states
    const [activePowerThreshold, setActivePowerThreshold] = useState(100);
    const [guardIntervalMinutes, setGuardIntervalMinutes] = useState(5);
    const [refreshInterval, setRefreshInterval] = useState(5000);
    const [isAutoGuardEnabled, setIsAutoGuardEnabled] = useState(true);
    const [isSavingPolicy, setIsSavingPolicy] = useState(false);

    // loadNodes 函数，负责获取数据和执行自动守护逻辑
    const loadNodes = useCallback(async () => {
        if (initialLoading) {
            setInitialLoading(true);
            addEvent("开始加载节点数据...", "info");
        } else {
            setIsUpdating(true);
        }
        setError(null);

        try {
            const data = await fetchNodes();
            setNodes(data);
            addEvent("节点数据已刷新。", "info");

            // 自动守护逻辑
            if (isAutoGuardEnabled) {
                const nodesToAutoGuard = data.filter(node => node.need_guard && !node.guard_running)
                                              .map(node => node.hostname);
                if (nodesToAutoGuard.length > 0) {
                    const message = `自动守护：检测到 ${nodesToAutoGuard.join(', ')} 需要守护。正在启动...`;
                    toast({
                        title: "自动守护：启动中",
                        description: message,
                        status: "info",
                        duration: 3000,
                        isClosable: true,
                    });
                    addEvent(message, "info");
                    await startGuard(nodesToAutoGuard);
                    const updatedDataAfterGuard = await fetchNodes();
                    setNodes(updatedDataAfterGuard);
                    const successMessage = `自动守护：节点 ${nodesToAutoGuard.join(', ')} 已开始守护。`;
                    toast({
                        title: "自动守护：已启动",
                        description: successMessage,
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                    addEvent(successMessage, "success");
                } else {
                    addEvent("自动守护：未检测到需要守护的节点。", "info");
                }
            }

        } catch (err) {
            const errorMessage = `无法加载节点数据或执行自动守护：${err.message || err}`;
            setError(errorMessage);
            console.error("加载节点失败:", err);
            toast({
                title: "加载失败",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            addEvent(errorMessage, "error");
        } finally {
            setInitialLoading(false);
            setIsUpdating(false);
        }
    }, [initialLoading, toast, isAutoGuardEnabled, addEvent]);


    // useEffect for initial load and periodic refresh
    useEffect(() => {
        loadNodes();

        const intervalId = setInterval(loadNodes, refreshInterval);
        return () => clearInterval(intervalId);
    }, [loadNodes, refreshInterval]);


    // 处理“启动所有守护”按钮点击事件
    const handleStartAllGuards = useCallback(async () => {
        setIsUpdating(true);
        try {
            const allHostnames = nodes.map(node => node.hostname);
            await startGuard(allHostnames);
            const message = "手动操作：所有守护进程已启动。";
            toast({
                title: "操作成功",
                description: message,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            addEvent(message, "success");
            loadNodes(); // 重新加载以更新状态
        } catch (error) {
            const errorMessage = `启动所有守护失败: ${error.message}`;
            toast({
                title: "操作失败",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            addEvent(errorMessage, "error");
        } finally {
            setIsUpdating(false);
        }
    }, [nodes, toast, loadNodes, addEvent]);

    // 处理“停止所有守护”按钮点击事件
    const handleStopAllGuards = useCallback(async () => {
        setIsUpdating(true);
        try {
            const allHostnames = nodes.map(node => node.hostname);
            await stopGuard(allHostnames);
            const message = "手动操作：所有守护进程已停止。";
            toast({
                title: "操作成功",
                description: message,
                status: "info",
                duration: 3000,
                isClosable: true,
            });
            addEvent(message, "warning");
            loadNodes(); // 重新加载以更新状态
        } catch (error) {
            const errorMessage = `停止所有守护失败: ${error.message}`;
            toast({
                title: "操作失败",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            addEvent(errorMessage, "error");
        } finally {
            setIsUpdating(false);
        }
    }, [nodes, toast, loadNodes, addEvent]);

    // 处理守护策略保存
    const handleSavePolicy = useCallback(async () => {
        setIsSavingPolicy(true);
        try {
            const policy = {
                enabled: isAutoGuardEnabled,
                active_power_threshold: activePowerThreshold,
                guard_interval_minutes: guardIntervalMinutes,
            };
            await updateGuardPolicy(policy);
            const message = "守护策略已保存。";
            toast({
                title: "操作成功",
                description: message,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            addEvent(message, "success");

            if (isAutoGuardEnabled) {
                addEvent("自动守护策略已启用。", "info");
                loadNodes(); // 策略更新后重新加载节点，以便自动守护立即生效
            } else {
                addEvent("自动守护策略已禁用。", "warning");
            }
        } catch (error) {
            const errorMessage = `策略保存失败: ${error.message}`;
            toast({
                title: "操作失败",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            addEvent(errorMessage, "error");
        } finally {
            setIsSavingPolicy(false);
        }
    }, [activePowerThreshold, guardIntervalMinutes, toast, isAutoGuardEnabled, loadNodes, addEvent]);

    // 计算总览数据
    const totalNodes = nodes.length;
    const guardedNodes = nodes.filter(node => node.guard_running).length;
    const needGuardNodes = nodes.filter(node => node.need_guard).length;
    let totalGpus = 0;
    let totalGpuPowerDraw = 0;
    let totalGpuUtilization = 0;
    let activeGpusCount = 0;

    nodes.forEach(node => {
        totalGpus += node.gpus.length;
        node.gpus.forEach(gpu => {
            totalGpuPowerDraw += gpu.power_draw;
            if (gpu.utilization > 0) {
                totalGpuUtilization += gpu.utilization;
                activeGpusCount++;
            }
        });
    });
    const averageGpuUtilization = activeGpusCount > 0 ? (totalGpuUtilization / activeGpusCount) : 0;
    const averageTotalGpuPowerDraw = totalGpus > 0 ? (totalGpuPowerDraw / totalGpus) : 0;


    return {
        nodes, initialLoading, isUpdating, error, events, onClearEvents, addEvent,
        activePowerThreshold, setActivePowerThreshold, guardIntervalMinutes, setGuardIntervalMinutes,
        refreshInterval, setRefreshInterval, isAutoGuardEnabled, setIsAutoGuardEnabled,
        isSavingPolicy, handleSavePolicy,
        totalNodes, guardedNodes, needGuardNodes, totalGpus, averageTotalGpuPowerDraw, averageGpuUtilization,
        loadNodes, handleStartAllGuards, handleStopAllGuards
    };
};

export default useNodeMonitoring;
