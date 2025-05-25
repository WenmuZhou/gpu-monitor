import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Container,
    Heading,
    VStack,
    Text,
    Button,
    Spinner,
    Flex,
    Spacer,
    useToast,
    Box,
    Stat, StatLabel, StatNumber,
    SimpleGrid,
    Icon,
    Select,
    Input,
    InputGroup, InputLeftElement,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    FormControl,
    FormLabel,
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper
} from '@chakra-ui/react';
import { FaServer, FaMicrochip, FaShieldAlt, FaBolt, FaTachometerAlt, FaExclamationTriangle, FaSearch, FaCogs } from 'react-icons/fa';

import NodeCard from './components/NodeCard';
import { fetchNodes, startGuard, stopGuard, updateGuardPolicy } from './services/api';

function App() {
    const [nodes, setNodes] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const toast = useToast();

    // New states for sorting and filtering
    const [sortBy, setSortBy] = useState('hostname');
    const [filterText, setFilterText] = useState('');
    const [refreshInterval, setRefreshInterval] = useState(5000); // Default 5000ms (5s)

    // New states for guard policy modal
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [activePowerThreshold, setActivePowerThreshold] = useState(100); // Default from backend logic
    const [guardIntervalMinutes, setGuardIntervalMinutes] = useState(5); // Default from backend logic
    const [isSavingPolicy, setIsSavingPolicy] = useState(false);

    const anyGuardsRunning = nodes.some(node => node.guard_running);
    const allNodesGuarding = nodes.length > 0 && nodes.every(node => node.guard_running);

    // Calculate overview data
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
        } catch (err) {
            setError("无法加载节点数据，请检查后端服务是否运行。");
            console.error("加载节点失败:", err);
            toast({
                title: "加载失败",
                description: "无法加载节点数据，请稍后重试。",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setInitialLoading(false);
            setIsUpdating(false);
        }
    }, [initialLoading, toast]);

    useEffect(() => {
        loadNodes();
        const intervalId = setInterval(loadNodes, refreshInterval); // Use refreshInterval
        return () => clearInterval(intervalId);
    }, [loadNodes, refreshInterval]); // Add refreshInterval to dependencies

    // Placeholder for fetching current policy (in a real app, this would come from backend)
    useEffect(() => {
        // In a real application, you would fetch the current guard policy from your backend here
        // For now, we'll just use default values or mock fetching
        // Example: fetch('/api/guard_policy').then(res => res.json()).then(data => {
        //   setActivePowerThreshold(data.threshold);
        //   setGuardIntervalMinutes(data.interval);
        // });
    }, []);

    const handleStartAllGuards = async () => {
        setIsUpdating(true);
        try {
            await startGuard();
            toast({
                title: "所有守护进程已启动",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            loadNodes();
        } catch (error) {
            toast({
                title: `启动失败: ${error.message}`,
                description: "请检查后端服务或网络连接。",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            setIsUpdating(false);
        }
    };

    const handleStopAllGuards = async () => {
        setIsUpdating(true);
        try {
            await stopGuard();
            toast({
                title: "所有守护进程已停止",
                status: "info",
                duration: 3000,
                isClosable: true,
            });
            loadNodes();
        } catch (error) {
            toast({
                title: `停止失败: ${error.message}`,
                description: "请检查后端服务或网络连接。",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            setIsUpdating(false);
        }
    };

    const handleSavePolicy = async () => {
        setIsSavingPolicy(true);
        try {
            // Placeholder API call to save the policy
            await updateGuardPolicy({
                active_power_threshold: activePowerThreshold,
                guard_interval_minutes: guardIntervalMinutes
            });
            toast({
                title: "守护策略已更新",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            onClose(); // Close modal on success
        } catch (error) {
            toast({
                title: `保存失败: ${error.message}`,
                description: "请检查后端服务或网络连接。",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSavingPolicy(false);
        }
    };

    // Memoized filtered and sorted nodes
    const filteredAndSortedNodes = useMemo(() => {
        let currentNodes = [...nodes];

        // 1. Filter
        if (filterText) {
            currentNodes = currentNodes.filter(node =>
                node.hostname.toLowerCase().includes(filterText.toLowerCase())
            );
        }

        // 2. Sort
        currentNodes.sort((a, b) => {
            if (sortBy === 'hostname') {
                return a.hostname.localeCompare(b.hostname);
            } else if (sortBy === 'totalGpus') {
                return b.gpus.length - a.gpus.length;
            } else if (sortBy === 'guardedNodes') {
                // Sort by guarded status (guarded first, then non-guarded)
                return (b.guard_running ? 1 : 0) - (a.guard_running ? 1 : 0);
            } else if (sortBy === 'needGuard') {
                // Sort by need_guard status (need guard first)
                return (a.need_guard ? 1 : 0) - (b.need_guard ? 1 : 0);
            }
            return 0;
        });

        return currentNodes;
    }, [nodes, filterText, sortBy]);


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
            {/* 标题和全局操作按钮 */}
            <Flex mb={8} align="center">
                <Heading as="h1" size="2xl" color="purple.700" letterSpacing="tight">
                    GPU 节点监控
                </Heading>
                <Button
                    colorScheme="green"
                    onClick={handleStartAllGuards}
                    isLoading={isUpdating && !anyGuardsRunning}
                    isDisabled={allNodesGuarding}
                    loadingText="启动中..."
                    ml={8}
                >
                    启动所有守护
                </Button>
                <Button
                    colorScheme="red"
                    onClick={handleStopAllGuards}
                    isLoading={isUpdating && anyGuardsRunning}
                    isDisabled={!anyGuardsRunning}
                    loadingText="停止中..."
                    ml={4}
                >
                    停止所有守护
                </Button>
                {/* New: Guard Policy Button */}
                <Button
                    leftIcon={<Icon as={FaCogs} />}
                    colorScheme="blue"
                    onClick={onOpen}
                    ml={4}
                >
                    守护策略
                </Button>

                {isUpdating && !initialLoading && (
                    <Spinner size="sm" color="teal.500" ml={4} />
                )}
                <Spacer />
            </Flex>

            {/* 总览部分 - Optimized display */}
            <Box
                p={6}
                borderWidth="1px"
                borderRadius="lg"
                shadow="md" // Softer shadow
                borderColor="gray.100" // Light border
                bg="gray.50"
                color="gray.800"
                mb={8}
            >
                <Heading as="h2" size="lg" mb={4} color="purple.700">总览</Heading>
                <SimpleGrid columns={{ base: 1, md: 3, lg: 6 }} spacing={5}>
                    <Stat>
                        <Flex align="center" mb={1}>
                            <Icon as={FaServer} mr={2} color="teal.600" />
                            <StatLabel>总节点数</StatLabel>
                        </Flex>
                        <StatNumber>{totalNodes}</StatNumber>
                    </Stat>
                    <Stat>
                        <Flex align="center" mb={1}>
                            <Icon as={FaMicrochip} mr={2} color="orange.600" />
                            <StatLabel>总GPU数量</StatLabel>
                        </Flex>
                        <StatNumber>{totalGpus}</StatNumber>
                    </Stat>
                    <Stat>
                        <Flex align="center" mb={1}>
                            <Icon as={FaShieldAlt} mr={2} color="green.600" />
                            <StatLabel>守护中节点数</StatLabel>
                        </Flex>
                        <StatNumber>{guardedNodes} / {totalNodes}</StatNumber>
                    </Stat>
                    <Stat>
                        <Flex align="center" mb={1}>
                            <Icon as={FaExclamationTriangle} mr={2} color="red.600" />
                            <StatLabel>需守护节点数</StatLabel>
                        </Flex>
                        <StatNumber>{needGuardNodes} / {totalNodes}</StatNumber>
                    </Stat>
                    <Stat>
                        <Flex align="center" mb={1}>
                            <Icon as={FaBolt} mr={2} color="yellow.600" />
                            <StatLabel>总GPU功耗 (W)</StatLabel>
                        </Flex>
                        <StatNumber>{totalGpuPowerDraw.toFixed(2)}</StatNumber>
                    </Stat>
                    <Stat>
                        <Flex align="center" mb={1}>
                            <Icon as={FaTachometerAlt} mr={2} color="blue.600" />
                            <StatLabel>平均GPU利用率 (%)</StatLabel>
                        </Flex>
                        <StatNumber>{averageGpuUtilization.toFixed(2)}</StatNumber>
                    </Stat>
                </SimpleGrid>
            </Box>

            {/* New: Sort, Filter, and Refresh Controls */}
            <Flex mb={6} align="center">
                <Text mr={3} fontWeight="bold">排序方式:</Text>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} width="200px" mr={6}>
                    <option value="hostname">主机名</option>
                    <option value="totalGpus">总GPU数量</option>
                    <option value="guardedNodes">守护状态</option>
                    <option value="needGuard">需要守护</option>
                </Select>

                <Text mr={3} fontWeight="bold">筛选节点:</Text>
                <InputGroup width="250px" mr={6}>
                    <InputLeftElement
                        pointerEvents="none"
                        children={<Icon as={FaSearch} color="gray.300" />}
                    />
                    <Input
                        placeholder="按主机名筛选..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </InputGroup>

                <Text mr={3} fontWeight="bold">刷新间隔:</Text>
                <Select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    width="150px"
                >
                    <option value={1000}>1 秒</option>
                    <option value={3000}>3 秒</option>
                    <option value={5000}>5 秒</option>
                    <option value={10000}>10 秒</option>
                    <option value={30000}>30 秒</option>
                    <option value={60000}>1 分钟</option>
                </Select>
                <Spacer />
            </Flex>

            {/* Node List - now uses filteredAndSortedNodes */}
            <VStack spacing={8} align="stretch">
                {filteredAndSortedNodes.map(node => (
                    <NodeCard key={node.hostname} node={node} onUpdate={loadNodes} />
                ))}
            </VStack>

            {/* Guard Policy Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>守护策略配置</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl mb={4}>
                            <FormLabel htmlFor="power-threshold">GPU活跃功耗阈值 (W)</FormLabel>
                            <NumberInput
                                id="power-threshold"
                                defaultValue={activePowerThreshold}
                                min={0}
                                max={500}
                                onChange={(valueString) => setActivePowerThreshold(Number(valueString))}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                            <Text fontSize="sm" color="gray.500" mt={1}>低于此功耗的GPU将被视为不活跃，触发守护。</Text>
                        </FormControl>

                        <FormControl>
                            <FormLabel htmlFor="guard-interval">功耗判断时间窗口 (分钟)</FormLabel>
                            <NumberInput
                                id="guard-interval"
                                defaultValue={guardIntervalMinutes}
                                min={1}
                                max={60}
                                onChange={(valueString) => setGuardIntervalMinutes(Number(valueString))}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                            <Text fontSize="sm" color="gray.500" mt={1}>GPU在此时间段内的平均功耗将用于判断是否活跃。</Text>
                        </FormControl>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="gray" mr={3} onClick={onClose}>
                            取消
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleSavePolicy}
                            isLoading={isSavingPolicy}
                        >
                            保存
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Container>
    );
}

export default App;