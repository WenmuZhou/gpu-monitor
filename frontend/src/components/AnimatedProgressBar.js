import React, { useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { motion, useSpring, useTransform } from 'framer-motion';

const AnimatedProgressBar = ({ value, h = "8px" }) => {
    // Define gradient based on value
    const getGradientColor = (val) => {
        if (val <= 30) {
            return "linear-gradient(to right, #6EE7B7, #10B981)"; // Green (Chakra's green.300 to green.500)
        } else if (val <= 70) {
            return "linear-gradient(to right, #FCD34D, #F97316)"; // Yellow to Orange (Chakra's yellow.300 to orange.500)
        } else {
            return "linear-gradient(to right, #EF4444, #DC2626)"; // Red (Chakra's red.400 to red.600)
        }
    };

    const springValue = useSpring(value, { stiffness: 100, damping: 20 });

    useEffect(() => {
        springValue.set(value);
    }, [value, springValue]);

    const width = useTransform(springValue, (val) => `${val}%`);
    const currentGradient = getGradientColor(value); // Get gradient dynamically

    return (
        <Box
            w="100%"
            h={h}
            bg="gray.200" // Light gray track background for white theme
            borderRadius="md"
            overflow="hidden"
        >
            <motion.div
                style={{
                    width: width,
                    height: '100%',
                    borderRadius: 'inherit',
                    backgroundImage: currentGradient, // Apply the dynamic gradient as standard CSS
                }}
            />
        </Box>
    );
};

export default AnimatedProgressBar;