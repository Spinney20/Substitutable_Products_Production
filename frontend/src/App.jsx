import { useState } from "react";
import {
  ChakraProvider, Box, Heading, Text, Button, Input,
  VStack, HStack, Grid, GridItem, useColorMode, IconButton, Flex, Badge,
  extendTheme, Tooltip as ChakraTooltip
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import { uploadNomenclature, predictSubstitutes } from "./api/fastapi";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import logo from "./assets/LOGO_SMEKER.png";

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bgGradient: "linear(to-br, #0f0c29, #302b63, #24243e)",
        color: "white",
      },
    },
  },
});

export default function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [productId, setProductId] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const pieColors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
    "#9966FF", "#FF9F40", "#00C49F", "#FF6347"
  ];

  const handleUpload = async () => {
    if (!file) return alert("Select a file");
    try {
      setLoading(true);
      const res = await uploadNomenclature(file);
      setUploadResult(res.data.message);
    } catch {
      setUploadResult("❌ Upload Failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!productId) return alert("Enter Product ID");
    try {
      setLoading(true);
      const res = await predictSubstitutes(productId);
      setPrediction(res.data);
    } catch {
      setPrediction({ error: "❌ Prediction failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" p={10}>
      <Flex justify="space-between" align="center" mb={10}>
        <Flex align="center" height="100px">
          <img
            src={logo}
            alt="Logo"
            style={{
              height: "150%",
              objectFit: "contain",
            }}
          />
          <Box ml={4} lineHeight="1.2">
            <Text fontSize="2xl" fontWeight="bold">
              PAIRADOX.AI
            </Text>
            <Text fontSize="sm" color="gray.500">
              for when something's missing
            </Text>
          </Box>
        </Flex>

        <IconButton
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
          size="lg"
          colorScheme="teal"
          variant="outline"
          aria-label="Toggle Dark Mode"
        />
      </Flex>


        {/* UPLOAD + PREDICT */}
        <HStack spacing={10} mb={10} align="flex-start">
          <Box bg="whiteAlpha.200" p={8} rounded="2xl" shadow="2xl" flex="1" _hover={{ transform: 'scale(1.02)', transition: '0.3s' }}>
            <Heading size="md" mb={4}>📥 Upload Nomenclature</Heading>
            <HStack>
              <Input type="file" onChange={e => setFile(e.target.files[0])} bg="whiteAlpha.300" border="none" />
              <Button colorScheme="teal" onClick={handleUpload}>Upload</Button>
            </HStack>
            {uploadResult && <Text mt={4} color="green.300">{uploadResult}</Text>}
          </Box>

          <Box bg="whiteAlpha.200" p={8} rounded="2xl" shadow="2xl" flex="1" _hover={{ transform: 'scale(1.02)', transition: '0.3s' }}>
            <Heading size="md" mb={4}>🔎 Predict Substitutes</Heading>
            <HStack>
              <Input
                placeholder="Enter Product ID"
                value={productId}
                onChange={e => setProductId(e.target.value)}
                bg="whiteAlpha.300"
                border="none"
              />
              <Button colorScheme="green" onClick={handlePredict}>Predict</Button>
            </HStack>
          </Box>
        </HStack>

        {loading && <Text fontSize="2xl" color="yellow.300">🔄 Loading predictions...</Text>}

        {prediction && prediction.substitutes && (
          <Box bg="whiteAlpha.200" p={8} rounded="2xl" shadow="dark-lg" mt={8}>
            <Heading size="xl" mb={6} color="teal.200">🎯 Prediction Results</Heading>

            <Flex direction={{ base: "column", md: "row" }} gap={8}>
              {/* Confidence Scores */}
              <Box flex={1} bg="whiteAlpha.100" p={5} rounded="xl" shadow="lg">
                <Heading size="md" mb={4}>✅ Confidence Scores</Heading>
                {prediction.substitutes
                  .sort((a, b) => prediction.confidences[b] - prediction.confidences[a])
                  .map((sub, index) => (
                    <Box key={index} p={4} mb={3} bg="gray.700" rounded="lg" _hover={{ bg: "gray.600" }}>
                      <Text fontWeight="bold">🛒 Product ID: {sub}</Text>
                      <Text>
                        Confidence:
                        <Badge ml={2} colorScheme="purple">{prediction.confidences[sub]?.toFixed(2)}%</Badge>
                      </Text>
                    </Box>
                  ))}
              </Box>

              {/* Probabilities + Chart */}
              <Box flex={1} bg="whiteAlpha.100" p={5} rounded="xl" shadow="lg">
                <Heading size="md" mb={4}>📊 Prediction Probabilities</Heading>
                {prediction.substitutes
                  .sort((a, b) => prediction.probabilities[b] - prediction.probabilities[a])
                  .map((sub, index) => (
                    <Box key={index} p={4} mb={3} bg="gray.700" rounded="lg" _hover={{ bg: "gray.600" }}>
                      <Text fontWeight="bold">🛒 Product ID: {sub}</Text>
                      <Text>
                        Probability:
                        <Badge ml={2} colorScheme="green">{prediction.probabilities[sub]?.toFixed(2)}%</Badge>
                      </Text>
                    </Box>
                  ))}

                {/* PIE CHART */}
                <Box mt={8} bg="gray.800" p={4} rounded="xl">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={prediction.substitutes.map((sub, index) => ({
                          name: sub,
                          value: prediction.probabilities[sub],
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={60}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {prediction.substitutes.map((_, index) => (
                          <Cell key={index} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#333", borderRadius: "8px", color: "white" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Flex>
          </Box>
        )}

        {prediction?.error && (
          <Text color="red.400" mt={4}>{prediction.error}</Text>
        )}
      </Box>
    </ChakraProvider>
  );
}
