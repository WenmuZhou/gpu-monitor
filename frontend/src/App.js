import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Container, Heading, VStack, Text, Button, Spinner, Flex, Spacer, useToast, Box,
    Stat, StatLabel, StatNumber, SimpleGrid, Icon, Select, Input, InputGroup, InputLeftElement,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    useDisclosure, FormControl, FormLabel, NumberInput, NumberInputField, NumberInputStepper,
    NumberIncrementStepper, NumberDecrementStepper, Switch, Stack, Badge,
    AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay
} from '@chakra-ui/react';
import { FaServer, FaMicrochip, FaShieldAlt, FaBolt, FaTachometerAlt, FaExclamationTriangle, FaSearch, FaCogs, FaRobot, FaCog, FaGlobe, FaMemory } from 'react-icons/fa';

import NodeCard from './components/NodeCard';
import EventLog from './components/EventLog'; // 引入 EventLog 组件
import { fetchNodes, startGuard, stopGuard, updateGuardPolicy } from './services/api';

// 定义 SettingsModal 组件
function SettingsModal({
    isOpen,
    onClose,
    activePowerThreshold,
    setActivePowerThreshold,
    guardIntervalMinutes,
    setGuardIntervalMinutes,
    refreshInterval,
    setRefreshInterval,
    isAutoGuardEnabled,
    setIsAutoGuardEnabled,
    handleSavePolicy,
    isSavingPolicy,
    addEvent // IMPORTANT: Add addEvent prop here
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader display="flex" alignItems="center">
                    <Icon as={FaCog} mr={3} />
                    应用设置
                </ModalHeader>
                <ModalCloseButton title="关闭设置窗口" />
                <ModalBody>
                    <Stack spacing={6}>
                        {/* 自动守护开关 */}
                        <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="auto-guard-switch" mb="0" flexGrow={1}>
                                <Icon as={FaRobot} mr={2} color="teal.600" />
                                自动守护 (在需要时自动启动守护进程)
                            </FormLabel>
                            <Switch
                                id="auto-guard-switch"
                                colorScheme="teal"
                                isChecked={isAutoGuardEnabled}
                                onChange={(e) => { // Capture event to get checked status
                                    const isChecked = e.target.checked;
                                    setIsAutoGuardEnabled(isChecked);
                                    // Log for auto-guard switch toggle
                                    addEvent(`设置：自动守护功能已${isChecked ? '开启' : '关闭'}。`, 'info');
                                }}
                                title="切换自动守护功能的开启/关闭"
                            />
                        </FormControl>

                        {/* 守护策略设置 */}
                        <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
                            <Heading size="md" mb={3}>守护策略</Heading>
                            <FormControl id="guard-interval" mb={4}>
                                <FormLabel>不活跃判断间隔 (分钟)</FormLabel>
                                <NumberInput
                                    value={guardIntervalMinutes}
                                    onChange={(valueString) => {
                                        const newInterval = parseInt(valueString);
                                        setGuardIntervalMinutes(newInterval);
                                        // Log for guard interval change
                                        addEvent(`设置：不活跃判断间隔已设置为 ${newInterval} 分钟。`, 'info');
                                    }}
                                    min={1}
                                    max={60}
                                    title="设置判断GPU不活跃的时间间隔"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="sm" color="gray.500">
                                    在此时间段内平均功耗低于阈值，则认为节点不活跃。
                                </Text>
                            </FormControl>
                            <FormControl id="power-threshold" mb={4}>
                                <FormLabel>活跃功耗阈值 (W)</FormLabel> {/* Corrected closing tag from </Label> to </FormLabel> */}
                                <NumberInput
                                    value={activePowerThreshold}
                                    onChange={(valueString) => {
                                        const newThreshold = parseInt(valueString);
                                        setActivePowerThreshold(newThreshold);
                                        // Log for power threshold change
                                        addEvent(`设置：活跃功耗阈值已设置为 ${newThreshold} W。`, 'info');
                                    }}
                                    min={1}
                                    max={500}
                                    title="设置判断GPU活跃的功耗阈值"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="sm" color="gray.500">
                                    当GPU平均功耗低于此值时，视为不活跃。
                                </Text>
                            </FormControl>
                            <Button
                                colorScheme="blue"
                                onClick={handleSavePolicy}
                                isLoading={isSavingPolicy}
                                size="sm"
                                title="保存当前的守护策略设置"
                            >
                                保存守护策略
                            </Button>
                        </Box>

                        {/* 刷新时间间隔设置 */}
                        <FormControl>
                            <FormLabel><Icon as={FaTachometerAlt} mr={2} />数据刷新间隔</FormLabel>
                            <Select
                                value={refreshInterval}
                                onChange={(e) => {
                                    const newInterval = Number(e.target.value);
                                    setRefreshInterval(newInterval);
                                    // Log for refresh interval change
                                    addEvent(`设置：数据刷新间隔已设置为 ${newInterval / 1000} 秒。`, 'info');
                                }}
                                width="full"
                                title="设置页面自动刷新数据的时间间隔"
                            >
                                <option value={1000}>1 秒</option>
                                <option value={3000}>3 秒</option>
                                <option value={5000}>5 秒</option>
                                <option value={10000}>10 秒</option>
                                <option value={30000}>30 秒</option>
                                <option value={60000}>1 分钟</option>
                            </Select>
                            <Text fontSize="sm" color="gray.500">
                                页面自动刷新节点数据的时间间隔。
                            </Text>
                        </FormControl>
                    </Stack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose} title="关闭设置窗口">关闭</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}


function App() {
    const [nodes, setNodes] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const toast = useToast();

    // 事件日志状态
    const [events, setEvents] = useState([]);

    // 用于添加日志的辅助函数
    const addEvent = useCallback((message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString(); // Use toLocaleTimeString for better formatting
        setEvents(prevEvents => [
            { id: Date.now() + Math.random(), timestamp, message, type }, // Use unique ID
            ...prevEvents
        ].slice(0, 50)); // 只保留最新的50条
    }, []);

    // 清空事件日志的函数
    const onClearEvents = useCallback(() => {
        setEvents([]);
        addEvent("事件日志已清空。", "info");
    }, [addEvent]);


    // States for sorting and filtering
    const [sortBy, setSortBy] = useState('hostname');
    const [filterText, setFilterText] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Settings states
    const [activePowerThreshold, setActivePowerThreshold] = useState(100);
    const [guardIntervalMinutes, setGuardIntervalMinutes] = useState(5);
    const [refreshInterval, setRefreshInterval] = useState(5000);
    const [isAutoGuardEnabled, setIsAutoGuardEnabled] = useState(false);
    const [isSavingPolicy, setIsSavingPolicy] = useState(false);

    // Modal disclosure for SettingsModal
    const { isOpen: isSettingsModalOpen, onOpen: onSettingsModalOpen, onClose: onSettingsModalClose } = useDisclosure();

    // Disclosure for "Start All Guards" confirmation dialog
    const { isOpen: isStartConfirmOpen, onOpen: onStartConfirmOpen, onClose: onStartConfirmClose } = useDisclosure();
    const cancelRef = React.useRef();

    // Disclosure for "Stop All Guards" confirmation dialog
    const { isOpen: isStopConfirmOpen, onOpen: onStopConfirmOpen, onClose: onStopConfirmClose } = useDisclosure();
    const cancelStopRef = React.useRef();


    // 计算总览数据
    const totalNodes = nodes.length;
    // Removed onlineNodes and offlineNodes calculations and display
    // const onlineNodes = nodes.filter(node => node.is_online).length;
    // const offlineNodes = totalNodes - onlineNodes;

    const guardedNodes = nodes.filter(node => node.guard_running).length;
    const needGuardNodes = nodes.filter(node => node.need_guard).length;
    let totalGpus = 0;
    let totalGpuPowerDraw = 0; // This will become sum for average calculation
    let totalGpuUtilization = 0;
    let activeGpusCount = 0;
    // Removed totalGpuMemoryUsed and totalGpuMemoryTotal calculations
    // let totalGpuMemoryUsed = 0;
    // let totalGpuMemoryTotal = 0;

    nodes.forEach(node => {
        totalGpus += node.gpus.length;
        node.gpus.forEach(gpu => {
            totalGpuPowerDraw += gpu.power_draw; // Still sum up for average
            // totalGpuMemoryUsed += gpu.memory_used; // Removed
            // totalGpuMemoryTotal += gpu.memory_total; // Removed
            if (gpu.utilization > 0) { // Consider GPUs with >0 utilization as active for average calculation
                totalGpuUtilization += gpu.utilization;
                activeGpusCount++;
            }
        });
    });
    const averageGpuUtilization = activeGpusCount > 0 ? (totalGpuUtilization / activeGpusCount) : 0;
    // Calculate average power draw for all GPUs
    const averageTotalGpuPowerDraw = totalGpus > 0 ? (totalGpuPowerDraw / totalGpus) : 0;
    // Removed averageGpuMemoryUtilization calculation
    // const averageGpuMemoryUtilization = totalGpuMemoryTotal > 0 ? (totalGpuMemoryUsed / totalGpuMemoryTotal * 100) : 0;


    // loadNodes 函数，负责获取数据和执行自动守护逻辑
    const loadNodes = useCallback(async () => {
        if (initialLoading) {
            setInitialLoading(true);
            addEvent("开始加载节点数据...", "info"); // Log initial loading start
        } else {
            setIsUpdating(true);
        }
        setError(null);

        try {
            const data = await fetchNodes();
            setNodes(data);
            addEvent("节点数据已刷新。", "info"); // 添加日志

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
                    addEvent(message, "info"); // 添加日志
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
                    addEvent(successMessage, "success"); // 添加日志
                } else {
                    addEvent("自动守护：未检测到需要守护的节点。", "info"); // 添加日志
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
            addEvent(errorMessage, "error"); // 添加日志
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


    // 处理“启动所有守护”按钮点击事件 (现在通过确认弹窗触发)
    const handleStartAllGuards = useCallback(async () => {
        onStartConfirmClose(); // Close the confirmation dialog
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
            addEvent(message, "success"); // 添加日志: "开启守护"
            loadNodes();
        } catch (error) {
            const errorMessage = `启动所有守护失败: ${error.message}`;
            toast({
                title: "操作失败",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            addEvent(errorMessage, "error"); // 添加日志
        } finally {
            setIsUpdating(false);
        }
    }, [nodes, toast, loadNodes, addEvent, onStartConfirmClose]);

    // 处理“停止所有守护”按钮点击事件 (现在通过确认弹窗触发)
    const handleStopAllGuards = useCallback(async () => {
        onStopConfirmClose(); // Close the confirmation dialog
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
            addEvent(message, "warning"); // 添加日志: "关闭守护", 使用 'warning' 类型
            loadNodes();
        } catch (error) {
            const errorMessage = `停止所有守护失败: ${error.message}`;
            toast({
                title: "操作失败",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            addEvent(errorMessage, "error"); // 添加日志
        } finally {
            setIsUpdating(false);
        }
    }, [nodes, toast, loadNodes, addEvent, onStopConfirmClose]);


    // 处理守护策略保存 (现在从 SettingsModal 调用)
    const handleSavePolicy = useCallback(async () => {
        setIsSavingPolicy(true);
        try {
            const policy = {
                enabled: isAutoGuardEnabled, // Ensure 'enabled' is passed to backend
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
            addEvent(message, "success"); // 添加日志

            // Log for auto-guard policy save (enabled/disabled)
            if (isAutoGuardEnabled) {
                addEvent("自动守护策略已启用。", "info");
                loadNodes(); // 策略保存后，如果自动守护开启，重新加载节点数据以立即生效
            } else {
                addEvent("自动守护策略已禁用。", "warning"); // 添加日志: "保存自动守护策略" - 禁用
            }
            onSettingsModalClose(); // Close modal on successful save
        } catch (error) {
            const errorMessage = `策略保存失败: ${error.message}`;
            toast({
                title: "操作失败",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            addEvent(errorMessage, "error"); // 添加日志
        } finally {
            setIsSavingPolicy(false);
        }
    }, [activePowerThreshold, guardIntervalMinutes, toast, isAutoGuardEnabled, loadNodes, addEvent, onSettingsModalClose]);


    // Memoized filtered and sorted nodes (保持不变)
    const filteredAndSortedNodes = useMemo(() => {
        let currentNodes = [...nodes];
        if (filterStatus === 'guarding') {
            currentNodes = currentNodes.filter(node => node.guard_running);
        } else if (filterStatus === 'not_guarding') {
            currentNodes = currentNodes.filter(node => !node.guard_running);
        } else if (filterStatus === 'needs_guard') {
            currentNodes = currentNodes.filter(node => node.need_guard);
        }
        if (filterText) {
            const lowerCaseFilterText = filterText.toLowerCase();
            currentNodes = currentNodes.filter(node =>
                node.hostname.toLowerCase().includes(lowerCaseFilterText)
            );
        }
        currentNodes.sort((a, b) => {
            if (sortBy === 'hostname') {
                return a.hostname.localeCompare(b.hostname);
            } else if (sortBy === 'totalGpus') {
                return b.gpus.length - a.gpus.length;
            } else if (sortBy === 'guardedNodes') {
                return (b.guard_running ? 1 : 0) - (a.guard_running ? 1 : 0);
            } else if (sortBy === 'needGuard') {
                return (a.need_guard ? 1 : 0) - (b.need_guard ? 1 : 0);
            }
            return 0;
        });
        return currentNodes;
    }, [nodes, filterText, sortBy, filterStatus]);


    if (initialLoading) {
        return (
            <Container centerContent py={10} bg="white" minHeight="100vh">
                <Spinner size="xl" color="teal.500" />
                <Text mt={4} color="gray.700">加载节点数据中...</Text>
            </Container>
        );
    }

    if (error) {
        return (
            <Container centerContent py={10} bg="white" minHeight="100vh">
                <Text color="red.500" fontSize="lg">{error}</Text>
                <Button mt={4} onClick={loadNodes} colorScheme="teal" title="重新加载节点数据">重试</Button>
            </Container>
        );
    }

    return (
        <Container maxW="container.xl" py={8} bg="white" minHeight="100vh">
            {/* 标题、自动守护提示和全局操作按钮 */}
            <Flex mb={8} align="center" flexWrap="wrap" justify="flex-start">
                <Heading as="h1" size="2xl" color="purple.700" letterSpacing="tight" mr={6}>
                    GPU 节点监控
                </Heading>

                {isAutoGuardEnabled && (
                    <Badge
                        colorScheme="teal"
                        variant="subtle"
                        fontSize="lg"
                        p={2}
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        mr={4}
                        title={isAutoGuardEnabled ? "自动守护功能当前已开启，系统将自动管理不活跃GPU" : "自动守护功能当前已关闭，需要手动管理GPU"}
                    >
                        <Icon as={FaRobot} mr={2} /> 自动守护已启用
                    </Badge>
                )}

                <Button
                    colorScheme="green"
                    variant="solid"
                    bg="green.500"
                    _hover={{ bg: "green.600" }}
                    minW="120px"
                    onClick={onStartConfirmOpen}
                    isLoading={isUpdating && nodes.some(node => node.need_guard && !node.guard_running)}
                    isDisabled={nodes.every(node => node.guard_running) || nodes.length === 0}
                    loadingText="启动中..."
                    ml={2}
                    title="手动启动所有节点的GPU守护进程"
                >
                    启动所有守护
                </Button>
                <Button
                    colorScheme="red"
                    variant="solid"
                    bg="red.500"
                    _hover={{ bg: "red.600" }}
                    minW="120px"
                    onClick={onStopConfirmOpen}
                    isLoading={isUpdating && nodes.some(node => node.guard_running)}
                    isDisabled={nodes.every(node => !node.guard_running) || nodes.length === 0}
                    loadingText="停止中..."
                    ml={4}
                    title="手动停止所有节点的GPU守护进程"
                >
                    停止所有守护
                </Button>

                <Spacer />

                {isUpdating && !initialLoading && (
                    <Spinner size="sm" color="teal.500" ml={4} />
                )}

                {/* “设置”按钮 */}
                <Button
                    leftIcon={<Icon as={FaCog} />}
                    colorScheme="gray"
                    variant="solid"
                    onClick={onSettingsModalOpen}
                    ml={4}
                    title="打开应用设置"
                >
                    设置
                </Button>
            </Flex>

            {/* 总览信息 - 优化布局与内容 */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={6} mb={8}>

                {/* 节点状态概览 */}
                <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="blue.50" title="当前集群中的总节点数量">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaServer} mr={2} />总节点数</StatLabel>
                    <StatNumber fontSize="2xl">{totalNodes}</StatNumber>
                </Stat>

                {/* 守护状态概览 */}
                <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="teal.50" title="当前正在运行守护进程的节点数量">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaShieldAlt} mr={2} />守护中</StatLabel>
                    <StatNumber fontSize="2xl">{guardedNodes} / {totalNodes}</StatNumber>
                </Stat>
                <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="orange.50" title="当前检测到需要启动守护进程的节点数量">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaExclamationTriangle} mr={2} />需要守护</StatLabel>
                    <StatNumber fontSize="2xl">{needGuardNodes} / {totalNodes}</StatNumber>
                </Stat>

                {/* 资源使用概览 */}
                <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="purple.50" title="当前集群中所有GPU的总数量">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaMicrochip} mr={2} />总GPU数</StatLabel>
                    <StatNumber fontSize="2xl">{totalGpus}</StatNumber>
                </Stat>
                <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="orange.50" title="所有GPU的平均功耗">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaBolt} mr={2} />平均功耗 (W)</StatLabel>
                    <StatNumber fontSize="2xl">{averageTotalGpuPowerDraw.toFixed(2)} W</StatNumber>
                </Stat>
                <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="teal.50" title="所有GPU的平均利用率">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaTachometerAlt} mr={2} />平均GPU利用率 (%)</StatLabel>
                    <StatNumber fontSize="2xl">{averageGpuUtilization.toFixed(2)} %</StatNumber>
                </Stat>
            </SimpleGrid>

            {/* 排序和筛选控制 */}
            <Flex mb={6} align="center">
                <Text mr={3} fontWeight="bold">排序方式:</Text>
                <Select value={sortBy} onChange={(e) => {
                    setSortBy(e.target.value);
                    addEvent(`排序：排序方式已更改为 "${e.target.options[e.target.selectedIndex].text}"。`, 'info'); // Log sort change
                }} width="200px" mr={6} title="选择节点列表的排序方式">
                    <option value="hostname">主机名</option>
                    <option value="totalGpus">总GPU数量</option>
                    <option value="guardedNodes">守护状态</option>
                    <option value="needGuard">需要守护</option>
                </Select>

                <Text mr={3} fontWeight="bold">筛选状态:</Text>
                <Select value={filterStatus} onChange={(e) => {
                    setFilterStatus(e.target.value);
                    addEvent(`筛选：状态筛选已更改为 "${e.target.options[e.target.selectedIndex].text}"。`, 'info'); // Log filter change
                }} width="150px" mr={6} title="根据节点守护状态筛选列表">
                    <option value="all">所有节点</option>
                    <option value="guarding">守护中</option>
                    <option value="not_guarding">未守护</option>
                    <option value="needs_guard">需要守护</option>
                </Select>

                <Text mr={3} fontWeight="bold">搜索主机名:</Text>
                <InputGroup width="250px" mr={6}>
                    <InputLeftElement
                        pointerEvents="none"
                        children={<Icon as={FaSearch} color="gray.300" />}
                    />
                    <Input
                        placeholder="输入主机名搜索..."
                        value={filterText}
                        onChange={(e) => {
                            setFilterText(e.target.value);
                            // Log search text change
                            if (e.target.value) {
                                addEvent(`筛选：搜索文本已更改为 "${e.target.value}"。`, 'info');
                            } else {
                                addEvent("筛选：搜索文本已清空。", "info");
                            }
                        }}
                        title="输入主机名以搜索特定节点"
                    />
                </InputGroup>
                <Spacer />
            </Flex>

            {/* 事件日志组件 */}
            <EventLog events={events} onClearEvents={onClearEvents} />

            {/* 节点列表 */}
            <SimpleGrid columns={1} spacing={6}>
                {filteredAndSortedNodes.map(node => (
                    <NodeCard key={node.hostname} node={node} />
                ))}
            </SimpleGrid>

            {/* SettingsModal 组件 */}
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={onSettingsModalClose}
                activePowerThreshold={activePowerThreshold}
                setActivePowerThreshold={setActivePowerThreshold}
                guardIntervalMinutes={guardIntervalMinutes}
                setGuardIntervalMinutes={setGuardIntervalMinutes}
                refreshInterval={refreshInterval}
                setRefreshInterval={setRefreshInterval}
                isAutoGuardEnabled={isAutoGuardEnabled}
                setIsAutoGuardEnabled={setIsAutoGuardEnabled}
                handleSavePolicy={handleSavePolicy}
                isSavingPolicy={isSavingPolicy}
                addEvent={addEvent}
            />

            {/* Start All Guards Confirmation Dialog */}
            <AlertDialog
                isOpen={isStartConfirmOpen}
                leastDestructiveRef={cancelRef}
                onClose={onStartConfirmClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            确认启动所有守护进程
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            您确定要为所有检测到的节点启动守护进程吗？此操作会使所有符合条件的 GPU 处于守护状态。
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onStartConfirmClose} title="取消启动所有守护进程">
                                取消
                            </Button>
                            <Button colorScheme="green" onClick={handleStartAllGuards} ml={3} title="确认启动所有守护进程">
                                启动
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* Stop All Guards Confirmation Dialog */}
            <AlertDialog
                isOpen={isStopConfirmOpen}
                leastDestructiveRef={cancelStopRef}
                onClose={onStopConfirmClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            确认停止所有守护进程
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            您确定要停止所有正在运行的守护进程吗？此操作将停止所有节点的 GPU 守护。
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelStopRef} onClick={onStopConfirmClose} title="取消停止所有守护进程">
                                取消
                            </Button>
                            <Button colorScheme="red" onClick={handleStopAllGuards} ml={3} title="确认停止所有守护进程">
                                停止
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Container>
    );
}

export default App;
