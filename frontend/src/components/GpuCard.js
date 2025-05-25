import React from 'react';
import {
    Box,
    Text,
    Flex,
    Icon,
    Stat,
    StatLabel,
    StatNumber,
    SimpleGrid,
    Card,
    CardHeader,
    CardBody,
    Heading,
} from '@chakra-ui/react';
import { FaMemory, FaBolt, FaThermometerHalf, FaTachometerAlt } from 'react-icons/fa';

import AnimatedProgressBar from './AnimatedProgressBar';

const GpuCard = ({ gpu }) => {
    const tempColor = gpu.temperature > 75 ? "red.500" : "green.500";
    const memoryUsagePercentage = (gpu.memory_used / gpu.memory_total) * 100;

    return (
        <Card
            bg="white"
            color="gray.700"
            shadow="base" // Keep base shadow for subtlety
            borderRadius="lg" // Slightly larger border radius
            overflow="hidden"
            _hover={{
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out',
                shadow: 'md', // Slightly larger shadow on hover
                borderColor: 'gray.200' // subtle border on hover
            }}
        >
            <CardHeader pb={0}>
                <Heading size="sm" color="pink.700">
                    GPU {gpu.index}: {gpu.name}
                </Heading>
            </CardHeader>

            <CardBody pt={2} pb={2}>
                {/* Increased spacing to give more room */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                    {/* Temperature */}
                    <Stat>
                        <Flex align="center">
                            <Icon as={FaThermometerHalf} mr={1} color={tempColor} />
                            <StatLabel fontSize="xs">温度</StatLabel>
                        </Flex>
                        <StatNumber fontSize="md" color={tempColor}>{gpu.temperature.toFixed(0)}°C</StatNumber>
                    </Stat>
                    {/* Power */}
                    <Stat>
                        <Flex align="center">
                            <Icon as={FaBolt} mr={1} color="yellow.600" />
                            <StatLabel fontSize="xs">功耗</StatLabel>
                        </Flex>
                        <StatNumber fontSize="md">{gpu.power_draw.toFixed(2)}W</StatNumber>
                    </Stat>

                    {/* Memory Usage (integrated) */}
                    <Box>
                        {/* Adjusted Flex to use space-between for better distribution */}
                        <Flex align="center" mb={1} justify="space-between">
                            <Flex align="center">
                                <Icon as={FaMemory} mr={1} color="blue.500" />
                                <Text fontSize="xs" fontWeight="medium">显存</Text>
                            </Flex>
                            <Text fontSize="xs" fontWeight="bold">{memoryUsagePercentage.toFixed(2)}%</Text>
                        </Flex>
                        <AnimatedProgressBar value={memoryUsagePercentage} h="4px" />
                    </Box>

                    {/* Utilization (integrated) */}
                    <Box>
                        {/* Adjusted Flex to use space-between for better distribution */}
                        <Flex align="center" mb={1} justify="space-between">
                            <Flex align="center">
                                <Icon as={FaTachometerAlt} mr={1} color="purple.500" />
                                <Text fontSize="xs" fontWeight="medium">利用率</Text>
                            </Flex>
                            <Text fontSize="xs" fontWeight="bold">{gpu.utilization.toFixed(2)}%</Text>
                        </Flex>
                        <AnimatedProgressBar value={gpu.utilization} h="4px" />
                    </Box>
                </SimpleGrid>
            </CardBody>
        </Card>
    );
};

export default GpuCard;