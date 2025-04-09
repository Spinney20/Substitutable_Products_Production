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
  Image
} from "@chakra-ui/react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon
} from "@chakra-ui/icons";
import logo from "../assets/LOGO_SMEKER.png";
import LanguageDropdown from "../components/LanguageDropdown";

export default function SidebarLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Flex minH="100vh">
      {/* Sidebar */}
      <Box
        bg="whiteAlpha.200"
        w={isCollapsed ? "70px" : "200px"}
        transition="width 0.2s"
        p={3}
      >
        <Flex justify="space-between" align="center" mb={4}>
          {!isCollapsed && (
            <Text fontSize="lg" fontWeight="bold" color="teal.200" ml={2}>
              MENU
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
            Nomenclature
          </Button>
          <Button
            as={Link}
            to="/train-model"
            variant="ghost"
            color="white"
            justifyContent={isCollapsed ? "center" : "flex-start"}
          >
            Train Model
          </Button>
          <Button
            as={Link}
            to="/reports"
            variant="ghost"
            color="white"
            justifyContent={isCollapsed ? "center" : "flex-start"}
          >
            Reports
          </Button>
        </VStack>
      </Box>

      {/* Main content */}
      <Flex direction="column" flex="1">
        {/* Top bar */}
        <Flex justify="space-between" align="center" p={4} bg="whiteAlpha.100" shadow="md">
          {/* Logo + Title */}
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

          {/* Language + Dark mode */}
          <Flex align="center" gap={3}>
            <LanguageDropdown />
            <IconButton
              icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              size="lg"
              colorScheme="teal"
              variant="outline"
              aria-label="Toggle Dark Mode"
            />
          </Flex>
        </Flex>

        {/* Content */}
        <Box flex="1">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}
