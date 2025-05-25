import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Container, Heading, VStack, Text, Button, Spinner, Flex, Spacer, useToast, Box,
    Stat, StatLabel, StatNumber, SimpleGrid, Icon, Select, Input, InputGroup, InputLeftElement,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    useDisclosure, FormControl, FormLabel, NumberInput, NumberInputField, NumberInputStepper,
    NumberIncrementStepper, NumberDecrementStepper, Switch, Stack, Badge
} from '@chakra-ui/react';
import { FaServer, FaMicrochip, FaShieldAlt, FaBolt, FaTachometerAlt, FaExclamationTriangle, FaSearch, FaCogs, FaRobot, FaCog } from 'react-icons/fa';

import NodeCard from './components/NodeCard';
import EventLog from './components/EventLog'; // 引入 EventLog 组件
import { fetchNodes, startGuard, stopGuard, updateGuardPolicy } from './services/api';

// 定义 SettingsModal 组件 (保持不变)
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
    isSavingPolicy
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader display="flex" alignItems="center">
                    <Icon as={FaCog} mr={3} />
                    应用设置
                </ModalHeader>
                <ModalCloseButton />
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
                                onChange={() => setIsAutoGuardEnabled(prev => !prev)}
                            />
                        </FormControl>

                        {/* 守护策略设置 */}
                        <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
                            <Heading size="md" mb={3}>守护策略</Heading>
                            <FormControl id="guard-interval" mb={4}>
                                <FormLabel>不活跃判断间隔 (分钟)</FormLabel>
                                <NumberInput
                                    value={guardIntervalMinutes}
                                    onChange={(valueString) => setGuardIntervalMinutes(parseInt(valueString))}
                                    min={1}
                                    max={60}
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
                                <FormLabel>活跃功耗阈值 (W)</FormLabel>
                                <NumberInput
                                    value={activePowerThreshold}
                                    onChange={(valueString) => setActivePowerThreshold(parseInt(valueString))}
                                    min={1}
                                    max={500}
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
                            {/* 之前这里有一个 Button, 现在移到 Box 外部与 FormControls 并列 */}
                            </FormControl>
                            <Button
                                colorScheme="blue"
                                onClick={handleSavePolicy}
                                isLoading={isSavingPolicy}
                                size="sm"
                            >
                                保存守护策略
                            </Button>
                        </Box>

                        {/* 刷新时间间隔设置 */}
                        <FormControl>
                            <FormLabel><Icon as={FaTachometerAlt} mr={2} />数据刷新间隔</FormLabel>
                            <Select
                                value={refreshInterval}
                                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                width="full"
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
                    <Button variant="ghost" onClick={onClose}>关闭</Button>
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
        const timestamp = new Date().toLocaleString();
        setEvents(prevEvents => [{ timestamp, message, type }, ...prevEvents].slice(0, 50)); // 只保留最新的50条
    }, []);


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


    // 计算总览数据 (保持不变)
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


    // loadNodes 函数，负责获取数据和执行自动守护逻辑
    const loadNodes = useCallback(async () => {
        if (initialLoading) {
            setInitialLoading(true);
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
    }, [initialLoading, toast, isAutoGuardEnabled, addEvent]); // 依赖中加入 addEvent


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
            const message = "所有守护进程已启动。";
            toast({
                title: "操作成功",
                description: message,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            addEvent(message, "success"); // 添加日志
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
    }, [nodes, toast, loadNodes, addEvent]);

    // 处理“停止所有守护”按钮点击事件
    const handleStopAllGuards = useCallback(async () => {
        setIsUpdating(true);
        try {
            const allHostnames = nodes.map(node => node.hostname);
            await stopGuard(allHostnames);
            const message = "所有守护进程已停止。";
            toast({
                title: "操作成功",
                description: message,
                status: "info",
                duration: 3000,
                isClosable: true,
            });
            addEvent(message, "info"); // 添加日志
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
    }, [nodes, toast, loadNodes, addEvent]);


    // 处理守护策略保存 (现在从 SettingsModal 调用)
    const handleSavePolicy = useCallback(async () => {
        setIsSavingPolicy(true);
        try {
            const policy = {
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
            if (isAutoGuardEnabled) {
                loadNodes(); // 策略保存后，如果自动守护开启，重新加载节点数据以立即生效
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
            addEvent(errorMessage, "error"); // 添加日志
        } finally {
            setIsSavingPolicy(false);
        }
    }, [activePowerThreshold, guardIntervalMinutes, toast, isAutoGuardEnabled, loadNodes, addEvent]);


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
                <Button mt={4} onClick={loadNodes} colorScheme="teal">重试</Button>
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
                    onClick={handleStartAllGuards}
                    isLoading={isUpdating && nodes.some(node => node.need_guard && !node.guard_running)}
                    isDisabled={nodes.every(node => node.guard_running) || nodes.length === 0}
                    loadingText="启动中..."
                    ml={2}
                >
                    启动所有守护
                </Button>
                <Button
                    colorScheme="red"
                    variant="solid"
                    bg="red.500"
                    _hover={{ bg: "red.600" }}
                    minW="120px"
                    onClick={handleStopAllGuards}
                    isLoading={isUpdating && nodes.some(node => node.guard_running)}
                    isDisabled={nodes.every(node => !node.guard_running) || nodes.length === 0}
                    loadingText="停止中..."
                    ml={4}
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
                >
                    设置
                </Button>
            </Flex>

            {/* 总览信息 */}
            <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={4} mb={8}>
                <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="blue.50">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaServer} mr={2} />总节点数</StatLabel>
                    <StatNumber fontSize="2xl">{totalNodes}</StatNumber>
                </Stat>
                <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="green.50">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaShieldAlt} mr={2} />守护中</StatLabel>
                    <StatNumber fontSize="2xl">{guardedNodes} / {totalNodes}</StatNumber>
                </Stat>
                <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="red.50">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaExclamationTriangle} mr={2} />需要守护</StatLabel>
                    <StatNumber fontSize="2xl">{needGuardNodes} / {totalNodes}</StatNumber>
                </Stat>
                <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="purple.50">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaMicrochip} mr={2} />总GPU数</StatLabel>
                    <StatNumber fontSize="2xl">{totalGpus}</StatNumber>
                </Stat>
                <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="orange.50">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaBolt} mr={2} />总GPU功耗 (W)</StatLabel>
                    <StatNumber fontSize="2xl">{totalGpuPowerDraw.toFixed(2)} W</StatNumber>
                </Stat>
                 <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="teal.50">
                    <StatLabel display="flex" alignItems="center"><Icon as={FaTachometerAlt} mr={2} />平均GPU利用率 (%)</StatLabel>
                    <StatNumber fontSize="2xl">{averageGpuUtilization.toFixed(2)} %</StatNumber>
                </Stat>
            </SimpleGrid>

            {/* 排序和筛选控制 */}
            <Flex mb={6} align="center">
                <Text mr={3} fontWeight="bold">排序方式:</Text>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} width="200px" mr={6}>
                    <option value="hostname">主机名</option>
                    <option value="totalGpus">总GPU数量</option>
                    <option value="guardedNodes">守护状态</option>
                    <option value="needGuard">需要守护</option>
                </Select>

                <Text mr={3} fontWeight="bold">筛选状态:</Text>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} width="150px" mr={6}>
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
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </InputGroup>
                <Spacer />
            </Flex>

            {/* 事件日志组件 */}
            <EventLog events={events} onClearEvents={() => setEvents([])} />

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
            />
        </Container>
    );
}

export default App;