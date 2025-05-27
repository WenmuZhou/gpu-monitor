// src/components/OverviewStats.js

import React from 'react';
import { SimpleGrid, Stat, StatLabel, StatNumber, Icon } from '@chakra-ui/react';
import { FaServer, FaGripHorizontal, FaBolt, FaChartLine } from 'react-icons/fa'; // 引入图标

function OverviewStats({
    totalNodes,
    guardedNodes,
    needGuardNodes,
    totalGpus,
    averageTotalGpuPowerDraw,
    averageGpuUtilization,
    onlineNodesCount // 确保这里接收了 onlineNodesCount
}) {
    return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 5 }} spacing={6} mb={6}>
            {/* 节点总数和在线节点数合并显示 */}
            <Stat p={3} borderWidth={1} borderRadius="lg" bg="white" boxShadow="sm" title="节点总数与在线节点数">
                <StatLabel display="flex" alignItems="center"><Icon as={FaServer} mr={2} color="blue.500" />节点</StatLabel>
                <StatNumber>{onlineNodesCount} / {totalNodes}</StatNumber> {/* 在线节点数 / 总节点数 */}
            </Stat>

            {/* 守护中的节点统计 */}
            <Stat p={3} borderWidth={1} borderRadius="lg" bg="white" boxShadow="sm" title="当前正在守护的节点数量">
                <StatLabel display="flex" alignItems="center"><Icon as={FaGripHorizontal} mr={2} color="green.500" />守护中</StatLabel>
                <StatNumber>{guardedNodes}</StatNumber>
            </Stat>

            {/* 需要守护的节点统计 */}
            <Stat p={3} borderWidth={1} borderRadius="lg" bg="white" boxShadow="sm" title="需要守护但未启动守护进程的节点数量">
                <StatLabel display="flex" alignItems="center"><Icon as={FaServer} mr={2} color="red.500" />需要守护</StatLabel>
                <StatNumber>{needGuardNodes}</StatNumber>
            </Stat>

            {/* 所有 GPU 的平均功耗统计 */}
            <Stat p={3} borderWidth={1} borderRadius="lg" bg="white" boxShadow="sm" title="所有GPU的平均功耗">
                <StatLabel display="flex" alignItems="center"><Icon as={FaBolt} mr={2} color="orange.500" />平均功耗</StatLabel>
                <StatNumber>{averageTotalGpuPowerDraw !== undefined && averageTotalGpuPowerDraw !== null ? averageTotalGpuPowerDraw.toFixed(2) : 'N/A'} W</StatNumber>
            </Stat>

            {/* 所有 GPU 的平均利用率统计 */}
            <Stat p={3} borderWidth={1} borderRadius="lg" bg="white" boxShadow="sm" title="所有GPU的平均利用率">
                <StatLabel display="flex" alignItems="center"><Icon as={FaChartLine} mr={2} color="purple.500" />平均利用率</StatLabel>
                <StatNumber>{averageGpuUtilization !== undefined && averageGpuUtilization !== null ? averageGpuUtilization.toFixed(2) : 'N/A'} %</StatNumber>
            </Stat>
        </SimpleGrid>
    );
}

export default OverviewStats;