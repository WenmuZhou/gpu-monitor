import React from 'react';
import {
    Box, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, Icon,
    Divider, Flex, Badge, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react';
// Updated icons to include FaPlug and FaPowerOff for online/offline status
import { FaLaptop, FaMicrochip, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaPlug, FaPowerOff } from 'react-icons/fa'; 

import GpuCard from './GpuCard';

function NodeCard({ node }) {
    const totalGpus = node.gpus ? node.gpus.length : 0;
    
    // Determine online status properties
    const isOnline = node.is_online;
    const onlineStatusColor = isOnline ? "green" : "red";
    const onlineStatusText = isOnline ? "在线" : "离线";
    const onlineStatusIcon = isOnline ? FaPlug : FaPowerOff; // Use FaPlug for online, FaPowerOff for offline

    // Determine guarded status properties
    const guardedStatusColor = node.guard_running ? "green" : "red";
    const guardedStatusText = node.guard_running ? "守护中" : "未守护";

    // Determine needs guard status properties
    const needsGuardColor = node.need_guard ? "orange" : "gray";
    const needsGuardText = node.need_guard ? "需要守护" : "状态正常";

    return (
        <Box p={6} shadow="lg" borderWidth="1px" borderRadius="lg" bg="white">
            <Flex align="center" justify="space-between" mb={4} flexWrap="wrap">
                <Heading as="h3" size="lg" color="blue.800" display="flex" alignItems="center">
                    <Icon as={FaLaptop} mr={3} color="blue.600" />
                    {node.hostname}
                </Heading>
                <Flex align="center" mt={{ base: 2, md: 0 }}>
                    {/* NEW: Online Status Badge */}
                    <Badge
                        colorScheme={onlineStatusColor}
                        mr={3} p={1} px={3}
                        borderRadius="full"
                        title={isOnline ? "节点当前在线并可访问" : "节点当前离线或不可访问"}
                    >
                        <Icon as={onlineStatusIcon} mr={1} />
                        {onlineStatusText}
                    </Badge>

                    <Badge
                        colorScheme={guardedStatusColor}
                        mr={3} p={1} px={3}
                        borderRadius="full"
                        title={node.guard_running ? "该节点GPU守护进程正在运行" : "该节点GPU守护进程未运行"}
                    >
                        <Icon as={node.guard_running ? FaCheckCircle : FaTimesCircle} mr={1} />
                        {guardedStatusText}
                    </Badge>
                    <Badge
                        colorScheme={needsGuardColor}
                        p={1} px={3}
                        borderRadius="full"
                        title={node.need_guard ? "该节点GPU功耗低，可能需要启动守护进程" : "该节点GPU功耗正常，无需守护"}
                    >
                        <Icon as={FaExclamationTriangle} mr={1} />
                        {needsGuardText}
                    </Badge>
                </Flex>
            </Flex>

            <Divider my={4} />

            {/* Display "Node Offline" message if the node is not online */}
            {!isOnline ? (
                <Text color="red.600" mb={4} fontWeight="semibold">节点离线，无法获取GPU数据和管理守护进程。</Text>
            ) : (
                <>
                    {totalGpus > 0 ? (
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: Math.min(totalGpus, 6), xl: Math.min(totalGpus, 8) }} spacing={4} mb={4}>
                            {node.gpus.map(gpu => (
                                <Stat key={gpu.index} p={4} shadow="sm" borderWidth="1px" borderRadius="lg" bg="purple.50">
                                    <StatLabel display="flex" alignItems="center">
                                        <Icon as={FaMicrochip} mr={2} color="purple.600" />
                                        GPU {gpu.index}
                                    </StatLabel>
                                    <StatNumber fontSize="xl">
                                        {typeof gpu.power_draw === 'number' ? gpu.power_draw.toFixed(2) : 'N/A'} W
                                    </StatNumber>
                                </Stat>
                            ))}
                        </SimpleGrid>
                    ) : (
                        <Text color="gray.500" mb={4}>该节点没有检测到GPU。</Text>
                    )}

                    <Divider my={4} />

                    <Accordion allowToggle>
                        <AccordionItem>
                            <h2>
                                <AccordionButton _expanded={{ bg: 'purple.50' }}>
                                    <Box flex="1" textAlign="left" display="flex" alignItems="center">
                                        <Icon as={FaMicrochip} mr={3} color="purple.600" />
                                        <Heading size="md">
                                            详细 GPU 信息
                                        </Heading>
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel pb={4}>
                                {totalGpus === 0 ? (
                                    <Text color="gray.500" mt={2}>该节点没有检测到GPU。</Text>
                                ) : (
                                    <SimpleGrid columns={1} spacing={4} mt={4}>
                                        {node.gpus.map(gpu => (
                                            <GpuCard key={gpu.index} gpu={gpu} />
                                        ))}
                                    </SimpleGrid>
                                )}
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                </>
            )}
        </Box>
    );
}

export default NodeCard;
