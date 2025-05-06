import React, { useState, useEffect, useRef } from "react";
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { uploadNomenclature } from "../api/fastapi";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

export default function Nomenclature() {
  const [nomFile,   setNomFile]   = useState(null);
  const [salesFile, setSalesFile] = useState(null);
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
    if (!nomFile || !salesFile) {
        alert("Selectează *ambele* fișiere: nomenclator și sales");
        return;
      }
    try {
      setLoading(true);
      const res = await uploadNomenclature(nomFile, salesFile);
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

  const nomInputRef   = useRef(null);
  const salesInputRef = useRef(null);

  // Ștergere nomenclator (cu confirmare)
  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear the current nomenclature?")) {
      try {
        setClearLoading(true);
        await axios.delete(`${BASE_URL}/clear-nomenclature`);
        setNomenclatureInfo({ exists: false });
        setUploadResult("Nomenclator cleared.");
        setShowNomenclator(false);
      } catch (err) {
        console.error(err);
        setUploadResult("❌ Clear Failed");
      } finally {
        setClearLoading(false);
      }
    }
  };

  const shortName = (file, fallback) =>
    file ? (file.name.length > 22 ? file.name.slice(0, 19) + "…" : file.name)
         : fallback;

  return (
    <Box flex="1" height="100%" p={10} overflowY="auto">
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
          <HStack align="flex-end" spacing={4}>     {/* ⇐ înlocuiește */}
  {/* ========= Nomenclator ========= */}
  <input
    ref={nomInputRef}
    type="file"
    accept=".xlsx"
    style={{ display: "none" }}
    onChange={(e) => setNomFile(e.target.files[0])}
  />
  <Button
    variant="outline"
    w="300px"
    onClick={() => nomInputRef.current.click()}
  >
    {shortName(nomFile, "Choose Nomenclature")}
  </Button>

  {/* ========= Sales ========= */}
  <input
    ref={salesInputRef}
    type="file"
    accept=".xlsx"
    style={{ display: "none" }}
    onChange={(e) => setSalesFile(e.target.files[0])}
  />
  <Button
    variant="outline"
    w="300px"
    onClick={() => salesInputRef.current.click()}
  >
    {shortName(salesFile, "Choose Sales")}
  </Button>

  {/* ========= Upload ========= */}
  <Button colorScheme="teal" onClick={handleUpload} minW="100px">
    {loading ? "Uploading…" : "Upload"}
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
      <Flex mt={8} justify="center" align="center" direction="column">
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
                w={{ base: "100%", md: "80%" }}
                maxH="400px"         // Înălțime maximă
                overflowY="auto"    // Scroll vertical
              >
                <Heading size="md" mb={4}>
                  Current Nomenclator
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
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>ID</Th>
                          <Th>Articol</Th>
                          <Th>Piata</Th>
                          <Th>Segment</Th>
                          <Th>Categorie</Th>
                          <Th>Familie</Th>
                          <Th isNumeric>Pret mediu</Th>
                          <Th>Provenienta</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {nomenclatureInfo.products.map((row, idx) => (
                          <Tr key={idx}>
                            <Td>{row.ID}</Td>
                            <Td>{row.Articol}</Td>
                            <Td>{row.Piata}</Td>
                            <Td>{row.Segment}</Td>
                            <Td>{row.Categorie}</Td>
                            <Td>{row.Familie}</Td>
                            <Td isNumeric>{Number(row.Pret).toFixed(2)}</Td>
                            <Td>{row.Provenienta}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Text>No products found.</Text>
                  )}
                </Box>
              </Box>
            )}
          </>
        ) : (
          <Text color="orange.300" fontSize="lg">
            ⚠️ No nomenclator found. Please upload.
          </Text>
        )}
      </Flex>
    </Box>
  );
}
