import React, { useMemo, useRef } from 'react';
import {
    Container, Text, Spinner, useDisclosure,
    AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
    Button, SimpleGrid,
    Box
} from '@chakra-ui/react';

// 引入自定义 Hook
import useNodeMonitoring from './hooks/useNodeMonitoring';
// 引入拆分后的组件
import NodeCard from './components/NodeCard';
import EventLog from './components/EventLog';
import SettingsModal from './components/SettingsModal';
import OverviewStats from './components/OverviewStats';
import ControlPanel from './components/ControlPanel';
import GlobalActions from './components/GlobalActions';

function App() {
    const {
        nodes, initialLoading, error, events, onClearEvents, addEvent,
        activePowerThreshold, setActivePowerThreshold, guardIntervalMinutes, setGuardIntervalMinutes,
        refreshInterval, setRefreshInterval, isAutoGuardEnabled, setIsAutoGuardEnabled,
        isSavingPolicy, handleSavePolicy,
        totalNodes, guardedNodes, needGuardNodes, totalGpus, averageTotalGpuPowerDraw, averageGpuUtilization,
        loadNodes,
        handleStartAllGuards, handleStopAllGuards,
        onlineNodesCount,
        isStartingAllGuards, isStoppingAllGuards,
    } = useNodeMonitoring();

    // Modal disclosure for SettingsModal
    const { isOpen: isSettingsModalOpen, onOpen: onSettingsModalOpen, onClose: onSettingsModalClose } = useDisclosure();

    // Disclosure for "Start All Guards" confirmation dialog
    const { isOpen: isStartConfirmOpen, onOpen: onStartConfirmOpen, onClose: onStartConfirmClose } = useDisclosure();
    const cancelRef = useRef();

    // Disclosure for "Stop All Guards" confirmation dialog
    const { isOpen: isStopConfirmOpen, onOpen: onStopConfirmOpen, onClose: onStopConfirmClose } = useDisclosure();
    const cancelStopRef = useRef();

    // States for sorting and filtering
    const [sortBy, setSortBy] = React.useState('hostname');
    const [filterText, setFilterText] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all');

    // Memoized filtered and sorted nodes
    const filteredAndSortedNodes = useMemo(() => {
        let currentNodes = [...nodes];

        // --- 统一的筛选逻辑 ---
        // 按照状态进行筛选
        if (filterStatus === 'online') {
            currentNodes = currentNodes.filter(node => node.isOnline); // 假设 node 对象有 'isOnline' 属性
        } else if (filterStatus === 'offline') {
            currentNodes = currentNodes.filter(node => !node.isOnline); // 假设 node 对象有 'isOnline' 属性
        } else if (filterStatus === 'guarding') {
            currentNodes = currentNodes.filter(node => node.guard_running);
        } else if (filterStatus === 'not_guarding') {
            currentNodes = currentNodes.filter(node => !node.guard_running);
        } else if (filterStatus === 'needs_guard') {
            currentNodes = currentNodes.filter(node => node.need_guard);
        }
        // --- 结束状态筛选 ---

        // 主机名搜索筛选
        if (filterText) {
            const lowerCaseFilterText = filterText.toLowerCase();
            currentNodes = currentNodes.filter(node =>
                node.hostname.toLowerCase().includes(lowerCaseFilterText)
            );
        }

        // 排序逻辑
        currentNodes.sort((a, b) => {
            if (sortBy === 'hostname') {
                return a.hostname.localeCompare(b.hostname);
            } else if (sortBy === 'totalGpus') {
                return b.gpus.length - a.gpus.length;
            } else if (sortBy === 'guardedNodes') {
                // 守护状态排序 (true 优先)
                return (b.guard_running ? 1 : 0) - (a.guard_running ? 1 : 0);
            } else if (sortBy === 'needGuard') {
                // 需要守护状态排序 (true 优先)
                return (a.need_guard ? 1 : 0) - (b.need_guard ? 1 : 0);
            }
            return 0;
        });
        return currentNodes;
    }, [nodes, filterText, sortBy, filterStatus]); // 确保 filterStatus 作为依赖项

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
            <GlobalActions
                isAutoGuardEnabled={isAutoGuardEnabled}
                initialLoading={initialLoading}
                onStartConfirmOpen={onStartConfirmOpen}
                onStopConfirmOpen={onStopConfirmOpen}
                onSettingsModalOpen={onSettingsModalOpen}
                nodes={nodes}
                isStartingAllGuards={isStartingAllGuards}
                isStoppingAllGuards={isStoppingAllGuards}
            />

            <OverviewStats
                totalNodes={totalNodes}
                guardedNodes={guardedNodes}
                needGuardNodes={needGuardNodes}
                totalGpus={totalGpus}
                averageTotalGpuPowerDraw={averageTotalGpuPowerDraw}
                averageGpuUtilization={averageGpuUtilization}
                onlineNodesCount={onlineNodesCount}
            />

            <ControlPanel
                sortBy={sortBy} setSortBy={setSortBy}
                filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                filterText={filterText} setFilterText={setFilterText}
                addEvent={addEvent}
            />

            <Box mt={6} mb={6}>
                <EventLog events={events} onClearEvents={onClearEvents} />
            </Box>


            {filteredAndSortedNodes.length === 0 && !initialLoading && !error ? (
                <Text textAlign="center" mt={6} color="gray.500">
                    没有找到符合条件的节点。
                </Text>
            ) : (
                <SimpleGrid columns={1} spacing={6} mt={6}>
                    {filteredAndSortedNodes.map(node => (
                        <NodeCard key={node.hostname} node={node} addEvent={addEvent} />
                    ))}
                </SimpleGrid>
            )}

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

            {/* 启动所有守护进程的确认对话框 */}
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
                            <Button colorScheme="green" onClick={() => {
                                handleStartAllGuards();
                                onStartConfirmClose();
                            }} ml={3} title="确认启动所有守护进程">
                                启动
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* 停止所有守护进程的确认对话框 */}
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
                            <Button colorScheme="red" onClick={() => {
                                handleStopAllGuards();
                                onStopConfirmClose();
                            }} ml={3} title="确认停止所有守护进程">
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