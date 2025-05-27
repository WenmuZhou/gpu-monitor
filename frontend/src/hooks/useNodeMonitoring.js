// src/hooks/useNodeMonitoring.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@chakra-ui/react';
import { fetchNodes, startGuard, stopGuard, updateGuardPolicy } from '../services/api';

const useNodeMonitoring = () => {
    const [nodes, setNodes] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);

    // --- 新增的独立的加载状态 ---
    const [isRefreshingNodes, setIsRefreshingNodes] = useState(false); // 用于数据刷新
    const [isStartingAllGuards, setIsStartingAllGuards] = useState(false); // 用于启动所有守护
    const [isStoppingAllGuards, setIsStoppingAllGuards] = useState(false); // 用于停止所有守护
    // isSavingPolicy 已经存在且是独立的，无需修改
    // --- 结束新增 ---

    const [error, setError] = useState(null);
    const toast = useToast();

    // 事件日志状态
    const [events, setEvents] = useState([]);
    const addEvent = useCallback((message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setEvents(prevEvents => [
            { id: Date.now() + Math.random(), timestamp, message, type },
            ...prevEvents
        ].slice(0, 50));
    }, []);
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


    const loadNodes = useCallback(async () => {
        if (initialLoading) {
            setInitialLoading(true); // 第一次加载时保持此状态为true
            addEvent("开始加载节点数据...", "info");
        } else {
            setIsRefreshingNodes(true); // 后续刷新时设置此状态为true
        }
        setError(null);

        try {
            const fetchedData = await fetchNodes();
            // 在这里保留 isOnline 的反转逻辑，因为你之前指出前端筛选是反的
            const nodesWithCorrectedOnlineStatus = fetchedData.map(node => ({
                ...node,
                isOnline: !node.isOnline,
            }));
            setNodes(nodesWithCorrectedOnlineStatus);
            addEvent("节点数据已刷新。", "info");

            // 自动守护逻辑 (保持不变)
            if (isAutoGuardEnabled) {
                const nodesToAutoGuard = nodesWithCorrectedOnlineStatus.filter(node => node.need_guard && !node.guard_running && node.isOnline)
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
                    const updatedNodesWithCorrectedOnlineStatus = updatedDataAfterGuard.map(node => ({
                        ...node,
                        isOnline: !node.isOnline,
                    }));
                    setNodes(updatedNodesWithCorrectedOnlineStatus);
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
            setInitialLoading(false); // 确保初始加载结束后设置为 false
            setIsRefreshingNodes(false); // 无论如何都结束刷新状态
        }
    }, [initialLoading, toast, isAutoGuardEnabled, addEvent]);


    useEffect(() => {
        loadNodes();
        const intervalId = setInterval(loadNodes, refreshInterval);
        return () => clearInterval(intervalId);
    }, [loadNodes, refreshInterval]);


    const handleStartAllGuards = useCallback(async () => {
        setIsStartingAllGuards(true); // 专门用于此操作的加载状态
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
            loadNodes(); // 操作完成后刷新数据
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
            setIsStartingAllGuards(false); // 结束加载状态
        }
    }, [nodes, toast, loadNodes, addEvent]);


    const handleStopAllGuards = useCallback(async () => {
        setIsStoppingAllGuards(true); // 专门用于此操作的加载状态
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
            loadNodes(); // 操作完成后刷新数据
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
            setIsStoppingAllGuards(false); // 结束加载状态
        }
    }, [nodes, toast, loadNodes, addEvent]);


    const handleSavePolicy = useCallback(async () => {
        setIsSavingPolicy(true); // 已经独立的加载状态
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
                loadNodes();
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

    // 计算总览数据 (保持不变)
    const totalNodes = nodes.length;
    const guardedNodes = nodes.filter(node => node.guard_running).length;
    const needGuardNodes = nodes.filter(node => node.need_guard).length;
    const onlineNodesCount = useMemo(() => {
        return nodes.filter(node => node.isOnline).length;
    }, [nodes]);

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
        nodes, initialLoading, error, events, onClearEvents, addEvent,
        activePowerThreshold, setActivePowerThreshold, guardIntervalMinutes, setGuardIntervalMinutes,
        refreshInterval, setRefreshInterval, isAutoGuardEnabled, setIsAutoGuardEnabled,
        // --- 返回新的独立的加载状态 ---
        isRefreshingNodes,
        isStartingAllGuards,
        isStoppingAllGuards,
        isSavingPolicy,
        // --- 结束新的加载状态 ---
        totalNodes, guardedNodes, needGuardNodes, totalGpus, averageTotalGpuPowerDraw, averageGpuUtilization,
        onlineNodesCount,
        loadNodes, handleStartAllGuards, handleStopAllGuards, handleSavePolicy
    };
};

export default useNodeMonitoring;