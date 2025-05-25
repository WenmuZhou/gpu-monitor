import React from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    FormControl, FormLabel, NumberInput, NumberInputField, NumberInputStepper,
    NumberIncrementStepper, NumberDecrementStepper, Switch, Stack, Box, Heading, Button, Icon, Text, Select
} from '@chakra-ui/react';
import { FaCog, FaRobot, FaTachometerAlt } from 'react-icons/fa';

function SettingsModal({
    isOpen,
    onClose,
    activePowerThreshold,
    setActivePowerThreshold,
    guardIntervalMinutes,
    setGuardIntervalMinutes,
    refreshInterval,
    setRefreshInterval,
    isAutoGuardEnabled,
    setIsAutoGuardEnabled,
    handleSavePolicy,
    isSavingPolicy,
    addEvent
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader display="flex" alignItems="center">
                    <Icon as={FaCog} mr={3} />
                    应用设置
                </ModalHeader>
                <ModalCloseButton title="关闭设置窗口" />
                <ModalBody>
                    <Stack spacing={6}>
                        {/* 自动守护开关 */}
                        <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="auto-guard-switch" mb="0" flexGrow={1}>
                                <Icon as={FaRobot} mr={2} color="teal.600" />
                                自动守护 (在需要时自动启动守护进程)
                            </FormLabel>
                            <Switch
                                id="auto-guard-switch"
                                colorScheme="teal"
                                isChecked={isAutoGuardEnabled}
                                onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setIsAutoGuardEnabled(isChecked);
                                    addEvent(`设置：自动守护功能已${isChecked ? '开启' : '关闭'}。`, 'info');
                                }}
                                title="切换自动守护功能的开启/关闭"
                            />
                        </FormControl>

                        {/* 守护策略设置 */}
                        <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
                            <Heading size="md" mb={3}>守护策略</Heading>
                            <FormControl id="guard-interval" mb={4}>
                                <FormLabel>不活跃判断间隔 (分钟)</FormLabel>
                                <NumberInput
                                    value={guardIntervalMinutes}
                                    onChange={(valueString) => {
                                        const newInterval = parseInt(valueString);
                                        setGuardIntervalMinutes(newInterval);
                                        addEvent(`设置：不活跃判断间隔已设置为 ${newInterval} 分钟。`, 'info');
                                    }}
                                    min={1}
                                    max={60}
                                    title="设置判断GPU不活跃的时间间隔"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="sm" color="gray.500">
                                    在此时间段内平均功耗低于阈值，则认为节点不活跃。
                                </Text>
                            </FormControl>
                            <FormControl id="power-threshold" mb={4}>
                                <FormLabel>活跃功耗阈值 (W)</FormLabel>
                                <NumberInput
                                    value={activePowerThreshold}
                                    onChange={(valueString) => {
                                        const newThreshold = parseInt(valueString);
                                        setActivePowerThreshold(newThreshold);
                                        addEvent(`设置：活跃功耗阈值已设置为 ${newThreshold} W。`, 'info');
                                    }}
                                    min={1}
                                    max={500}
                                    title="设置判断GPU活跃的功耗阈值"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="sm" color="gray.500">
                                    当GPU平均功耗低于此值时，视为不活跃。
                                </Text>
                            </FormControl>
                            <Button
                                colorScheme="blue"
                                onClick={handleSavePolicy}
                                isLoading={isSavingPolicy}
                                size="sm"
                                title="保存当前的守护策略设置"
                            >
                                保存守护策略
                            </Button>
                        </Box>

                        {/* 刷新时间间隔设置 */}
                        <FormControl>
                            <FormLabel><Icon as={FaTachometerAlt} mr={2} />数据刷新间隔</FormLabel>
                            <Select
                                value={refreshInterval}
                                onChange={(e) => {
                                    const newInterval = Number(e.target.value);
                                    setRefreshInterval(newInterval);
                                    addEvent(`设置：数据刷新间隔已设置为 ${newInterval / 1000} 秒。`, 'info');
                                }}
                                width="full"
                                title="设置页面自动刷新数据的时间间隔"
                            >
                                <option value={1000}>1 秒</option>
                                <option value={3000}>3 秒</option>
                                <option value={5000}>5 秒</option>
                                <option value={10000}>10 秒</option>
                                <option value={30000}>30 秒</option>
                                <option value={60000}>1 分钟</option>
                            </Select>
                            <Text fontSize="sm" color="gray.500">
                                页面自动刷新节点数据的时间间隔。
                            </Text>
                        </FormControl>
                    </Stack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose} title="关闭设置窗口">关闭</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default SettingsModal;
