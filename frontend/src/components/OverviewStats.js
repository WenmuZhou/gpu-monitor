import React from 'react';
import { SimpleGrid, Stat, StatLabel, StatNumber, Icon } from '@chakra-ui/react';
import { FaServer, FaShieldAlt, FaExclamationTriangle, FaMicrochip, FaBolt, FaTachometerAlt } from 'react-icons/fa';

function OverviewStats({ totalNodes, guardedNodes, needGuardNodes, totalGpus, averageTotalGpuPowerDraw, averageGpuUtilization }) {
    return (
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
                <StatLabel display="flex" alignItems="center"><Icon as={FaBolt} mr={2} />平均功耗</StatLabel>
                <StatNumber fontSize="2xl">{averageTotalGpuPowerDraw.toFixed(2)} W</StatNumber>
            </Stat>
            <Stat p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="teal.50" title="所有GPU的平均利用率">
                <StatLabel display="flex" alignItems="center"><Icon as={FaTachometerAlt} mr={2} />平均GPU利用率</StatLabel>
                <StatNumber fontSize="2xl">{averageGpuUtilization.toFixed(2)} %</StatNumber>
            </Stat>
        </SimpleGrid>
    );
}

export default OverviewStats;
