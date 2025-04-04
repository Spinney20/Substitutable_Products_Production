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
  Flex,
} from "@chakra-ui/react";
import { uploadNomenclature } from "../api/fastapi";

export default function Nomenclature() {
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Select a file");
      return;
    }
    try {
      setLoading(true);
      const res = await uploadNomenclature(file);
      setUploadResult(res.data.message);
    } catch (err) {
      setUploadResult("❌ Upload Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" p={10}>
      {/* Un container simplu, identic cu cardul tău */}
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
    </Box>
  );
}
