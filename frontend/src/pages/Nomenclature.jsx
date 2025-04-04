import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  HStack,
  VStack,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { uploadNomenclature } from "../api/fastapi";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

export default function Nomenclature() {
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nomenclatureInfo, setNomenclatureInfo] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [showNomenclator, setShowNomenclator] = useState(false);

  // La montare, verificăm dacă nomenclatorul este încărcat
  useEffect(() => {
    checkNomenclature();
  }, []);

  const checkNomenclature = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/nomenclature-info`);
      setNomenclatureInfo(res.data);
    } catch (err) {
      console.error(err);
      setNomenclatureInfo({ exists: false });
    }
  };

  // Upload fișier
  const handleUpload = async () => {
    if (!file) {
      alert("Select a file");
      return;
    }
    try {
      setLoading(true);
      const res = await uploadNomenclature(file);
      setUploadResult(res.data.message);
      // Reîmprospătăm informațiile nomenclatorului după upload
      checkNomenclature();
    } catch (err) {
      setUploadResult("❌ Upload Failed");
    } finally {
      setLoading(false);
    }
  };

  // Funcție de toggle pentru vizualizare nomenclator
  const toggleView = async () => {
    if (!showNomenclator) {
      setViewLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/nomenclature-info`);
        setNomenclatureInfo(res.data);
        setShowNomenclator(true);
      } catch (err) {
        console.error(err);
        setNomenclatureInfo({ exists: false });
      } finally {
        setViewLoading(false);
      }
    } else {
      setShowNomenclator(false);
    }
  };

  // Ștergere nomenclator (cu confirmare)
  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear the current nomenclature?")) {
      try {
        setClearLoading(true);
        await axios.delete(`${BASE_URL}/clear-nomenclature`);
        setNomenclatureInfo({ exists: false });
        setUploadResult("Nomenclature cleared.");
        setShowNomenclator(false);
      } catch (err) {
        console.error(err);
        setUploadResult("❌ Clear Failed");
      } finally {
        setClearLoading(false);
      }
    }
  };

  return (
    <Box minH="100vh" p={10}>
      {/* Card pentru Upload */}
      <Flex justify="center" align="flex-start">
        <Box
          bg="whiteAlpha.200"
          p={8}
          rounded="2xl"
          shadow="2xl"
          w={{ base: "100%", md: "60%" }}
          _hover={{ transform: "scale(1.02)", transition: "0.3s" }}
        >
          <Heading size="md" mb={4}>
            📥 Upload Nomenclature
          </Heading>
          <HStack>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              bg="whiteAlpha.300"
              border="none"
            />
            <Button colorScheme="teal" onClick={handleUpload}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </HStack>
          {uploadResult && (
            <Text mt={4} color="green.300">
              {uploadResult}
            </Text>
          )}
        </Box>
      </Flex>

      {/* Secțiunea de informații și acțiuni pentru nomenclator */}
      <Flex mt={10} justify="center" align="center" direction="column">
        {nomenclatureInfo && nomenclatureInfo.exists ? (
          <>
            <Text color="green.300" mb={4} fontSize="lg">
              ✅ Nomenclature already uploaded.
            </Text>
            <HStack spacing={4} mb={4}>
              <Button colorScheme="blue" onClick={toggleView}>
                {viewLoading ? <Spinner size="sm" /> : showNomenclator ? "Hide current nomenclature" : "View current nomenclature"}
              </Button>
              <Button colorScheme="red" onClick={handleClear}>
                {clearLoading ? <Spinner size="sm" /> : "Clear nomenclator"}
              </Button>
            </HStack>
            {showNomenclator && nomenclatureInfo.lastUpload && (
              <Box
                mt={6}
                bg="whiteAlpha.200"
                p={6}
                rounded="2xl"
                shadow="2xl"
                w={{ base: "100%", md: "60%" }}
              >
                <Heading size="md" mb={4}>
                  Current Nomenclature
                </Heading>
                <Text>
                  <strong>Last Upload:</strong> {nomenclatureInfo.lastUpload}
                </Text>
                <Text>
                  <strong>Number of Products:</strong> {nomenclatureInfo.productCount}
                </Text>
                <Box mt={4}>
                  <Heading size="sm" mb={2}>
                    Products:
                  </Heading>
                  {nomenclatureInfo.products && nomenclatureInfo.products.length > 0 ? (
                    <VStack spacing={2} align="stretch">
                      {nomenclatureInfo.products.map((product, idx) => (
                        <Box key={idx} bg="gray.700" p={4} rounded="lg" shadow="md">
                          <Text>{product}</Text>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text>No products found.</Text>
                  )}
                </Box>
              </Box>
            )}
          </>
        ) : (
          <Text color="orange.300" fontSize="lg">
            ⚠️ No nomenclature found. Please upload.
          </Text>
        )}
      </Flex>
    </Box>
  );
}
