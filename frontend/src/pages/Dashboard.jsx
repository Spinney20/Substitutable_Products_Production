import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  HStack,
  VStack,
  Badge,
  Flex
} from "@chakra-ui/react";
import { predictSubstitutes } from "../api/fastapi";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard() {
  const [productId, setProductId] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  // Culori aleatorii pentru pie chart
  const pieColors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#00C49F",
    "#FF6347",
  ];

  const handlePredict = async () => {
    if (!productId) {
      alert("Enter Product ID");
      return;
    }
    try {
      setLoading(true);
      const res = await predictSubstitutes(productId);
      setPrediction(res.data);
    } catch (err) {
      setPrediction({ error: "❌ Prediction failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" p={10}>
      {/* Cardul de Predict Substitutes */}
      <Flex justify="center" align="flex-start">
        <Box
          bg="whiteAlpha.200"
          p={8}
          rounded="2xl"
          shadow="2xl"
          flex="1"
          maxW={{ base: "100%", md: "60%" }}
          _hover={{ transform: "scale(1.02)", transition: "0.3s" }}
        >
          <Heading size="md" mb={4}>
            🔎 Predict Substitutes
          </Heading>
          <HStack>
            <Input
              placeholder="Enter Product ID"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              bg="whiteAlpha.300"
              border="none"
            />
            <Button colorScheme="green" onClick={handlePredict}>
              {loading ? "Predicting..." : "Predict"}
            </Button>
          </HStack>
        </Box>
      </Flex>

      {loading && (
        <Text fontSize="2xl" color="yellow.300" mt={6} textAlign="center">
          🔄 Loading predictions...
        </Text>
      )}

      {/* Rezultate (substitutes) */}
      {prediction && prediction.substitutes && (
        <Box bg="whiteAlpha.200" p={8} rounded="2xl" shadow="dark-lg" mt={8}>
          <Heading size="xl" mb={6} color="teal.200">
            🎯 Prediction Results
          </Heading>

          <Flex direction={{ base: "column", md: "row" }} gap={8}>
            {/* Confidence Scores */}
            <Box flex={1} bg="whiteAlpha.100" p={5} rounded="xl" shadow="lg">
              <Heading size="md" mb={4}>
                ✅ Confidence Scores
              </Heading>
              {prediction.substitutes
                .sort(
                  (a, b) =>
                    prediction.confidences[b] - prediction.confidences[a]
                )
                .map((sub, index) => (
                  <Box
                    key={index}
                    p={4}
                    mb={3}
                    bg="gray.700"
                    rounded="lg"
                    _hover={{ bg: "gray.600" }}
                  >
                    <Text fontWeight="bold">🛒 Product ID: {sub}</Text>
                    <Text>
                      Confidence:
                      <Badge ml={2} colorScheme="purple">
                        {prediction.confidences[sub]?.toFixed(2)}%
                      </Badge>
                    </Text>
                  </Box>
                ))}
            </Box>

            {/* Probabilities + Chart */}
            <Box flex={1} bg="whiteAlpha.100" p={5} rounded="xl" shadow="lg">
              <Heading size="md" mb={4}>
                📊 Prediction Probabilities
              </Heading>
              {prediction.substitutes
                .sort(
                  (a, b) =>
                    prediction.probabilities[b] - prediction.probabilities[a]
                )
                .map((sub, index) => (
                  <Box
                    key={index}
                    p={4}
                    mb={3}
                    bg="gray.700"
                    rounded="lg"
                    _hover={{ bg: "gray.600" }}
                  >
                    <Text fontWeight="bold">🛒 Product ID: {sub}</Text>
                    <Text>
                      Probability:
                      <Badge ml={2} colorScheme="green">
                        {prediction.probabilities[sub]?.toFixed(2)}%
                      </Badge>
                    </Text>
                  </Box>
                ))}

              {/* PIE CHART */}
              <Box mt={8} bg="gray.800" p={4} rounded="xl">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prediction.substitutes.map((sub) => ({
                        name: sub,
                        value: prediction.probabilities[sub],
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={60}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }
                    >
                      {prediction.substitutes.map((_, index) => (
                        <Cell
                          key={index}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#333",
                        borderRadius: "8px",
                        color: "white",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Flex>
        </Box>
      )}

      {prediction?.error && (
        <Text color="red.400" mt={4} textAlign="center">
          {prediction.error}
        </Text>
      )}
    </Box>
  );
}
