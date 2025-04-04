import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import {
  Flex,
  Box,
  IconButton,
  Text,
  Button,
  VStack,
  useColorMode,
  useColorModeValue,
  Image,
} from "@chakra-ui/react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon,
} from "@chakra-ui/icons";

// Importăm logo-ul
import logo from "../assets/LOGO_SMEKER.png";

export default function SidebarLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Flex minH="100vh">
      {/* SIDEBAR (stânga) */}
      <Box
        bg="whiteAlpha.200"
        w={isCollapsed ? "70px" : "200px"}
        transition="width 0.2s"
        p={3}
      >
        <Flex justify="space-between" align="center" mb={4}>
          {/* Titlu Meniu (ascuns dacă e collapsed) */}
          {!isCollapsed && (
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="teal.200"
              ml={2}
            >
              MENIU
            </Text>
          )}
          <IconButton
            icon={isCollapsed ? <ArrowRightIcon /> : <ArrowLeftIcon />}
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            colorScheme="teal"
            variant="outline"
            aria-label="Toggle sidebar"
          />
        </Flex>

        <VStack align={isCollapsed ? "center" : "stretch"} spacing={2}>
          <Button
            as={Link}
            to="/dashboard"
            variant="ghost"
            color="white"
            justifyContent={isCollapsed ? "center" : "flex-start"}
          >
            Dashboard
          </Button>

          <Button
            as={Link}
            to="/nomenclature"
            variant="ghost"
            color="white"
            justifyContent={isCollapsed ? "center" : "flex-start"}
          >
            Upload
          </Button>
        </VStack>
      </Box>

      {/* CONȚINUT (dreapta) */}
      <Flex direction="column" flex="1">
        {/* TOP BAR (sus) */}
        <Flex
          justify="space-between"
          align="center"
          p={4}
          // un mic fundal semitransparent
          bg="whiteAlpha.100"
          shadow="md"
        >
          {/* Logo + titlu */}
          <Flex align="center" height="60px">
            <Image
              src={logo}
              alt="Logo"
              height="60px"
              objectFit="contain"
            />
            <Box ml={4} lineHeight="1.2">
              <Text fontSize="2xl" fontWeight="bold">
                PAIRADOX.AI
              </Text>
              <Text fontSize="sm" color="gray.300">
                for when something's missing
              </Text>
            </Box>
          </Flex>

          {/* Buton toggle dark/light */}
          <IconButton
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            size="lg"
            colorScheme="teal"
            variant="outline"
            aria-label="Toggle Dark Mode"
          />
        </Flex>

        {/* Aici se încarcă paginile (Dashboard / Nomenclature) */}
        <Box flex="1">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}
