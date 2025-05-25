// frontend/src/components/EventLog.js
import React from 'react';
import {
    Box, Heading, VStack, Text, Button, Accordion,
    AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Icon
} from '@chakra-ui/react';
import { FaHistory, FaTimesCircle } from 'react-icons/fa'; // 引入图标

function EventLog({ events, onClearEvents }) {
    return (
        <Box borderWidth="1px" borderRadius="lg" p={4} mb={8} bg="gray.50" shadow="md">
            <Accordion allowToggle defaultIndex={[0]}> {/* 默认展开第一个（通常是日志列表） */}
                <AccordionItem>
                    <h2>
                        <AccordionButton _expanded={{ bg: 'gray.100' }}>
                            <Box flex="1" textAlign="left" display="flex" alignItems="center">
                                <Icon as={FaHistory} mr={3} color="blue.600" />
                                <Heading size="md">事件日志 ({events.length} 条)</Heading>
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        {events.length === 0 ? (
                            <Text color="gray.500" fontStyle="italic" mt={2}>暂无事件记录。</Text>
                        ) : (
                            <VStack align="stretch" spacing={2} mt={3} maxHeight="300px" overflowY="auto">
                                {events.map((event, index) => (
                                    <Box
                                        key={index} // 实际应用中应该使用更稳定的ID，这里用index简化
                                        p={2}
                                        bg={event.type === 'error' ? 'red.50' : (event.type === 'info' ? 'blue.50' : 'gray.100')}
                                        borderRadius="md"
                                        borderLeft="4px solid"
                                        borderColor={event.type === 'error' ? 'red.400' : (event.type === 'info' ? 'blue.400' : 'gray.300')}
                                        fontSize="sm"
                                    >
                                        <Text fontWeight="bold" color="gray.700">{event.timestamp}</Text>
                                        <Text color="gray.800">{event.message}</Text>
                                    </Box>
                                ))}
                            </VStack>
                        )}
                        <Button
                            leftIcon={<Icon as={FaTimesCircle} />}
                            colorScheme="red"
                            size="sm"
                            mt={4}
                            onClick={onClearEvents}
                            isDisabled={events.length === 0}
                        >
                            清空日志
                        </Button>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Box>
    );
}

export default EventLog;