import React, { useState, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  HStack,
  Badge,
  Flex,
} from "@chakra-ui/react";
import { predictSubstitutes } from "../api/fastapi";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";

// Motion component for Box
const MotionBox = motion(Box);

export default function Dashboard() {
  const [productId, setProductId] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false); // toggle list length

  // Palette for the pie slices
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

  // Fetch prediction from backend
  const handlePredict = async () => {
    if (!productId) {
      alert("Enter Product ID");
      return;
    }
    try {
      setLoading(true);
      setShowAll(false); // reset toggle on new request
      const res = await predictSubstitutes(productId);
      setPrediction(res.data);
    } catch (err) {
      setPrediction({ error: "❌ Prediction failed" });
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
   * Helpers: displayed vs hidden items
   * ---------------------------------- */
  const displayedSubs = useMemo(() => {
    if (!prediction || !prediction.substitutes) return [];
    const subs = prediction.substitutes;

    // If list is small or we explicitly want all, show everything
    if (showAll || subs.length <= 3) return subs;

    // Otherwise keep only candidates with Confidence ≥ 40 AND Probability > 10%
    return subs.filter(
      (sub) =>
        prediction.confidences[sub] >= 40 && prediction.probabilities[sub] > 10
    );
  }, [prediction, showAll]);

  const hiddenSubs = useMemo(() => {
    if (!prediction || !prediction.substitutes) return [];
    return prediction.substitutes.filter((sub) => !displayedSubs.includes(sub));
  }, [prediction, displayedSubs]);

  // Aggregate hidden items under “Others” / “Average Others”
  const othersConfidence = hiddenSubs.reduce(
    (acc, sub) => acc + (prediction?.confidences[sub] || 0),
    0
  );
  const othersProbability = hiddenSubs.reduce(
    (acc, sub) => acc + (prediction?.probabilities[sub] || 0),
    0
  );

  const avgOthersConfidence =
    hiddenSubs.length > 0 ? othersConfidence / hiddenSubs.length : 0;

  /* --------------------
   * Chart datasets
   * -------------------- */
  const barData = displayedSubs.map((sub) => ({
    name: sub,
    value: prediction?.confidences[sub],
  }));
  // In the bar chart we show the *average* of hidden items, not the sum.
  if (hiddenSubs.length > 0)
    barData.push({ name: "Average Others", value: avgOthersConfidence });

  const pieData = displayedSubs.map((sub) => ({
    name: sub,
    value: prediction?.probabilities[sub],
  }));
  // In the pie chart we keep the cumulative probability of hidden items.
  if (othersProbability > 0)
    pieData.push({ name: "Others", value: othersProbability });

  const getColor = (idx, name) =>
    name === "Others" ? "#808080" : pieColors[idx % pieColors.length];

  const isPredicted = prediction && prediction.substitutes && !prediction.error;

  return (
    <Box flex="1" height="100%" p={10} overflowY="auto">
      {isPredicted ? (
        <Flex direction="row" gap={6} align="flex-start" height="100%">
          {/* Left column: results */}
          <Box flex="1" overflowY="auto">
            <Box
              bg="whiteAlpha.200"
              p={6}
              rounded="xl"
              shadow="dark-lg"
              maxH="80vh"
              overflowY="auto"
            >
              <Flex direction={{ base: "column", md: "row" }} gap={6}>
                {/* Confidence list + bar chart */}
                <Box flex={1} bg="whiteAlpha.100" p={4} rounded="lg" shadow="md">
                  <Heading size="md" mb={3}>
                    ✅ Confidence Scores
                  </Heading>
                  {displayedSubs
                    .sort((a, b) => prediction.confidences[b] - prediction.confidences[a])
                    .map((sub) => (
                      <Box
                        key={sub}
                        p={3}
                        mb={3}
                        bg="gray.700"
                        rounded="md"
                        _hover={{ bg: "gray.600" }}
                      >
                        <Text fontWeight="bold">🛒 Product ID: {sub}</Text>
                        <Text>
                          Confidence:{" "}
                          <Badge ml={2} colorScheme="purple">
                            {prediction.confidences[sub]?.toFixed(2)}%
                          </Badge>
                        </Text>
                      </Box>
                    ))}

                  <Box mt={6} bg="transparent" p={3} rounded="md">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={barData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis dataKey="name" stroke="#fff" />
                        <YAxis stroke="#fff" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#333",
                            borderRadius: "8px",
                            color: "white",
                          }}
                        />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>

                {/* Probabilities list + pie chart */}
                <Box flex={1} bg="whiteAlpha.100" p={4} rounded="lg" shadow="md">
                  <Heading size="md" mb={3}>
                    📊 Prediction Probabilities
                  </Heading>
                  {displayedSubs
                    .sort((a, b) => prediction.probabilities[b] - prediction.probabilities[a])
                    .map((sub) => (
                      <Box
                        key={sub}
                        p={3}
                        mb={3}
                        bg="gray.700"
                        rounded="md"
                        _hover={{ bg: "gray.600" }}
                      >
                        <Text fontWeight="bold">🛒 Product ID: {sub}</Text>
                        <Text>
                          Probability:{" "}
                          <Badge ml={2} colorScheme="green">
                            {prediction.probabilities[sub]?.toFixed(2)}%
                          </Badge>
                        </Text>
                      </Box>
                    ))}

                  <Box mt={6} bg="transparent" p={3} rounded="md">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={50}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(1)}%`
                          }
                        >
                          {pieData.map((entry, idx) => (
                            <Cell key={idx} fill={getColor(idx, entry.name)} />
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

              {/* Toggle show/hide link */}
              {hiddenSubs.length > 0 && (
                <Text
                  mt={4}
                  color="cyan.300"
                  cursor="pointer"
                  _hover={{ textDecoration: "underline" }}
                  onClick={() => setShowAll((prev) => !prev)}
                >
                  {showAll
                    ? "Hide extras"
                    : `Show all (${prediction.substitutes.length})`}
                </Text>
              )}
            </Box>
          </Box>

          {/* Right column: predict card */}
          <MotionBox
            bg="whiteAlpha.200"
            p={6}
            rounded="xl"
            shadow="2xl"
            maxW="300px"
            width="100%"
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
          </MotionBox>
        </Flex>
      ) : (
        /* Centered card when no prediction */
        <>
          <Flex justify="center" align="flex-start">
            <MotionBox
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
            </MotionBox>
          </Flex>
          {loading && (
            <Text fontSize="2xl" color="yellow.300" mt={6} textAlign="center">
              🔄 Loading predictions...
            </Text>
          )}
        </>
      )}

      {prediction?.error && (
        <Text color="red.400" mt={4} textAlign="center">
          {prediction.error}
        </Text>
      )}
    </Box>
  );
}
