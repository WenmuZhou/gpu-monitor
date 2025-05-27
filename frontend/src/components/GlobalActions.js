// src/components/GlobalActions.js

import React from 'react';
// 确保导入了 Badge 和 Flex
import { Button, ButtonGroup, Icon, Flex, Spacer, Tooltip, Heading, Badge } from '@chakra-ui/react';
import { FaCogs, FaPlay, FaStop } from 'react-icons/fa';

function GlobalActions({
    isAutoGuardEnabled, // 接收自动守护状态
    onStartConfirmOpen,
    onStopConfirmOpen,
    onSettingsModalOpen,
    nodes,
    initialLoading,
    isStartingAllGuards,
    isStoppingAllGuards,
}) {
    // 检查是否有节点数据，以便判断是否可以进行操作
    const hasNodes = nodes && nodes.length > 0;
    // 判断是否有任何操作正在进行，以便禁用其他按钮防止冲突
    const anyOperationInProgress = initialLoading || isStartingAllGuards || isStoppingAllGuards;

    return (
        <Flex mb={6} align="center" wrap="wrap">
            {/* 平台名称 */}
            <Heading as="h1" size="lg" color="blue.700" mr={4}>
                节点管理平台
            </Heading>

            {/* 新增：自动守护状态显示，放在按钮组左侧 */}
            <Flex align="center" mr={4}> {/* 使用 Flex 确保对齐和间距 */}
                <Badge
                    colorScheme={isAutoGuardEnabled ? "green" : "red"}
                    variant="solid"
                    px={3} // 增加左右内边距
                    py={1.5} // 增加上下内边距
                    borderRadius="full" // 更圆润的边角
                    fontSize="md" // 调整字体大小
                    fontWeight="bold"
                >
                    自动守护: {isAutoGuardEnabled ? "已开启" : "已关闭"}
                </Badge>
            </Flex>

            {/* 左侧按钮组：启动所有守护和停止所有守护 */}
            <ButtonGroup spacing={3} mb={{ base: 4, md: 0 }}>
                {/* 启动所有守护按钮 */}
                <Tooltip label="为所有节点启动守护进程" hasArrow>
                    <Button
                        leftIcon={<Icon as={FaPlay} />}
                        colorScheme="green"
                        onClick={onStartConfirmOpen}
                        isLoading={isStartingAllGuards} // 显示启动守护加载状态
                        loadingText="启动中..."
                        isDisabled={!hasNodes || anyOperationInProgress} // 没有节点或任何操作进行中时禁用
                        title="启动所有守护"
                    >
                        启动所有守护
                    </Button>
                </Tooltip>

                {/* 停止所有守护按钮 */}
                <Tooltip label="停止所有正在运行的守护进程" hasArrow>
                    <Button
                        leftIcon={<Icon as={FaStop} />}
                        colorScheme="red"
                        onClick={onStopConfirmOpen}
                        isLoading={isStoppingAllGuards} // 显示停止守护加载状态
                        loadingText="停止中..."
                        isDisabled={!hasNodes || anyOperationInProgress} // 没有节点或任何操作进行中时禁用
                        title="停止所有守护"
                    >
                        停止所有守护
                    </Button>
                </Tooltip>
            </ButtonGroup>

            {/* 弹性间隔，将两组按钮推开 */}
            <Spacer />

            {/* 右侧按钮组：设置 */}
            <ButtonGroup spacing={3}>
                {/* 设置按钮 */}
                <Tooltip label="管理守护策略与系统设置" hasArrow>
                    <Button
                        leftIcon={<Icon as={FaCogs} />}
                        colorScheme="teal"
                        onClick={onSettingsModalOpen}
                        isDisabled={anyOperationInProgress} // 任何操作进行中时禁用
                        title="设置"
                    >
                        设置
                    </Button>
                </Tooltip>
            </ButtonGroup>
        </Flex>
    );
}

export default GlobalActions;