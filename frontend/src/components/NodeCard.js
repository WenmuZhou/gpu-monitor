// frontend/src/components/NodeCard.js
import React from 'react';
import {
    Box, Heading, Text, VStack, SimpleGrid, Stat, StatLabel, StatNumber, Icon,
    Divider, Flex, Badge, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react';
import { FaLaptop, FaMicrochip, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

import GpuCard from './GpuCard';

function NodeCard({ node }) {
    const totalGpus = node.gpus ? node.gpus.length : 0;
    const guardedStatusColor = node.guard_running ? "green" : "red";
    const guardedStatusText = node.guard_running ? "守护中" : "未守护";
    const needsGuardColor = node.need_guard ? "orange" : "gray";
    const needsGuardText = node.need_guard ? "需要守护" : "状态正常";

    // 这些变量现在将不会直接在 StatNumber 中显示，因为我们只显示 GPU 功率
    // 但为了代码健壮性，仍然保留防御性检查，以防将来需要
    const cpuUsage = (typeof node.cpu_usage === 'number') ? node.cpu_usage.toFixed(2) : 'N/A';
    const memoryUsedGB = (typeof node.memory_used === 'number' && node.memory_used !== null) ? (node.memory_used / 1024).toFixed(1) : 'N/A';
    const memoryTotalGB = (typeof node.memory_total === 'number' && node.memory_total !== null) ? (node.memory_total / 1024).toFixed(1) : 'N/A';
    const averagePowerDraw = (typeof node.average_power_draw === 'number' && node.average_power_draw !== null) ? node.average_power_draw.toFixed(2) : 'N/A';


    return (
        <Box p={6} shadow="lg" borderWidth="1px" borderRadius="lg" bg="white">
            <Flex align="center" justify="space-between" mb={4} flexWrap="wrap">
                <Heading as="h3" size="lg" color="blue.800" display="flex" alignItems="center">
                    <Icon as={FaLaptop} mr={3} color="blue.600" />
                    {node.hostname}
                </Heading>
                <Flex align="center" mt={{ base: 2, md: 0 }}>
                    <Badge colorScheme={guardedStatusColor} mr={3} p={1} px={3} borderRadius="full">
                        <Icon as={node.guard_running ? FaCheckCircle : FaTimesCircle} mr={1} />
                        {guardedStatusText}
                    </Badge>
                    <Badge colorScheme={needsGuardColor} p={1} px={3} borderRadius="full">
                        <Icon as={FaExclamationTriangle} mr={1} />
                        {needsGuardText}
                    </Badge>
                </Flex>
            </Flex>

            <Divider my={4} />

            {/* 未展开时，直接显示每个 GPU 的功率信息，以 Stat 形式排列 */}
            {totalGpus > 0 ? (
                // 调整 columns 属性，使其在更大屏幕上显示更多列
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: Math.min(totalGpus, 6), xl: Math.min(totalGpus, 8) }} spacing={4} mb={4}>
                    {/* 使用 Math.min(totalGpus, X) 可以确保列数不会超过实际的GPU数量，并且在X个以内时，尽可能显示在同一行 */}
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

            {/* GPU 列表折叠/展开 (保持每个 GPU 一行) */}
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
        </Box>
    );
}

export default NodeCard;