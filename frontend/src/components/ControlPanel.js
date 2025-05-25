import React from 'react';
import { Flex, Text, Select, Input, InputGroup, InputLeftElement, Icon, Spacer } from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';

function ControlPanel({ sortBy, setSortBy, filterStatus, setFilterStatus, filterText, setFilterText, addEvent }) {
    return (
        <Flex mb={6} align="center" flexWrap="wrap">
            <Text mr={3} fontWeight="bold" minW="80px">排序方式:</Text>
            <Select value={sortBy} onChange={(e) => {
                setSortBy(e.target.value);
                addEvent(`排序：排序方式已更改为 "${e.target.options[e.target.selectedIndex].text}"。`, 'info');
            }} width={{ base: "full", sm: "200px" }} mr={{ base: 0, sm: 6 }} mb={{ base: 4, sm: 0 }} title="选择节点列表的排序方式">
                <option value="hostname">主机名</option>
                <option value="totalGpus">总GPU数量</option>
                <option value="guardedNodes">守护状态</option>
                <option value="needGuard">需要守护</option>
            </Select>

            <Text mr={3} fontWeight="bold" minW="80px">筛选状态:</Text>
            <Select value={filterStatus} onChange={(e) => {
                setFilterStatus(e.target.value);
                addEvent(`筛选：状态筛选已更改为 "${e.target.options[e.target.selectedIndex].text}"。`, 'info');
            }} width={{ base: "full", sm: "150px" }} mr={{ base: 0, sm: 6 }} mb={{ base: 4, sm: 0 }} title="根据节点守护状态筛选列表">
                <option value="all">所有节点</option>
                <option value="guarding">守护中</option>
                <option value="not_guarding">未守护</option>
                <option value="needs_guard">需要守护</option>
            </Select>

            <Text mr={3} fontWeight="bold" minW="80px">搜索主机名:</Text>
            <InputGroup width={{ base: "full", sm: "250px" }} mr={{ base: 0, sm: 6 }}>
                <InputLeftElement
                    pointerEvents="none"
                    children={<Icon as={FaSearch} color="gray.300" />}
                />
                <Input
                    placeholder="输入主机名搜索..."
                    value={filterText}
                    onChange={(e) => {
                        setFilterText(e.target.value);
                        // 移除或优化频繁的 addEvent 调用，因为搜索框输入可能非常快
                        // if (e.target.value) {
                        //     addEvent(`筛选：搜索文本已更改为 "${e.target.value}"。`, 'info');
                        // } else {
                        //     addEvent("筛选：搜索文本已清空。", "info");
                        // }
                    }}
                    title="输入主机名以搜索特定节点"
                />
            </InputGroup>
            <Spacer />
        </Flex>
    );
}

export default ControlPanel;
