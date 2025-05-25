import React from 'react';
import { Button, Icon, Spacer, Spinner, Badge, Flex, Heading } from '@chakra-ui/react';
import { FaRobot, FaCog } from 'react-icons/fa';

function GlobalActions({
    isAutoGuardEnabled,
    isUpdating,
    initialLoading,
    onStartConfirmOpen,
    onStopConfirmOpen,
    onSettingsModalOpen,
    nodes // 需要知道nodes来判断按钮的disabled状态
}) {
    return (
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
                <Spinner size="sm" color="teal.500" ml={4} title="数据正在更新中..." />
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
    );
}

export default GlobalActions;
