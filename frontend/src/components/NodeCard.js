import React from 'react';
import { Box, Text, VStack, Button, Badge, useToast, Flex, Spacer, Icon } from '@chakra-ui/react';
import GpuCard from './GpuCard';
import { startGuard, stopGuard } from '../services/api';
import { FaShieldAlt, FaClock, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const NodeCard = ({ node, onUpdate }) => {
    const toast = useToast();

    const handleToggleGuard = async () => {
        try {
            if (node.guard_running) {
                await stopGuard([node.hostname]);
                toast({
                    title: `${node.hostname} 守护进程已停止`,
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                await startGuard([node.hostname]);
                toast({
                    title: `${node.hostname} 守护进程已启动`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            }
            onUpdate();
        } catch (error) {
            toast({
                title: `操作失败: ${error.message}`,
                description: "请检查后端服务或网络连接。",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Box
            p={6}
            borderWidth="1px"
            borderRadius="xl" // Slightly larger border radius for a softer look
            shadow="md" // Softer base shadow
            bg="gray.50"
            color="gray.800"
            _hover={{
                transform: 'translateY(-3px)',
                transition: 'all 0.2s ease-in-out',
                shadow: 'lg', // Slightly larger shadow on hover
                borderColor: 'purple.400' // Lighter purple on hover
            }}
        >
            <Flex align="center" mb={4}>
                <Text fontSize="3xl" fontWeight="extrabold" color="purple.700">{node.hostname}</Text>
                <Spacer />
                {/* Display need_guard status */}
                <Badge
                    colorScheme={node.need_guard ? "orange" : "gray"}
                    px={3} py={1} borderRadius="full" fontSize="sm"
                    mr={2}
                >
                    <Flex align="center">
                        <Icon as={node.need_guard ? FaExclamationTriangle : FaCheckCircle} mr={1} />
                        {node.need_guard ? "需守护" : "无需守护"}
                    </Flex>
                </Badge>
                <Badge
                    colorScheme={node.guard_running ? "green" : "red"}
                    px={3} py={1} borderRadius="full" fontSize="sm"
                    mr={4}
                >
                    <Flex align="center">
                        <Icon as={FaShieldAlt} mr={1} />
                        {node.guard_running ? "守护中" : "未守护"}
                    </Flex>
                </Badge>
                <Button
                    size="sm"
                    colorScheme={node.guard_running ? "red" : "green"}
                    onClick={handleToggleGuard}
                >
                    {node.guard_running ? "停止守护" : "启动守护"}
                </Button>
            </Flex>

            <Flex align="center" mb={4}>
                <Icon as={FaClock} mr={2} color="gray.600" />
                <Text fontSize="sm" color="gray.600">上次更新: {node.last_updated}</Text>
            </Flex>

            <VStack spacing={4} align="stretch" mb={6}>
                {node.gpus.map(gpu => (
                    <GpuCard key={gpu.index} gpu={gpu} />
                ))}
            </VStack>
        </Box>
    );
};

export default NodeCard;