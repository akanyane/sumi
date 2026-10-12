"use client";

import {
  Box,
  ClientOnly,
  Collapsible,
  Flex,
  HoverCard,
  IconButton,
  Image,
  Link,
  Portal,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import NextLink from "next/link";
import {
  LuChevronDown,
  LuChevronRight,
  LuMenu,
  LuMoon,
  LuSun,
  LuX,
} from "react-icons/lu";
import { useColorMode } from "../ui/color-mode";

interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: "Grades",
    children: [1, 2, 3, 4, 5, 6, 8].map((grade) => ({
      label: `Grade ${grade}`,
      href: `/grade-${grade}`,
    })),
  },
  {
    label: "Jouyou",
    href: "/jouyou",
  },
  {
    label: "Jinmeiyou",
    href: "/jinmeiyou",
  },
];

const ColorModeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <ClientOnly fallback={<Skeleton boxSize="10" rounded="md" />}>
      <IconButton
        variant="outline"
        aria-label="Toggle color mode"
        onClick={toggleColorMode}
      >
        {colorMode === "dark" ? <LuSun /> : <LuMoon />}
      </IconButton>
    </ClientOnly>
  );
};

const Header = () => {
  const { open, onToggle } = useDisclosure();

  return (
    <Box>
      <Flex
        bg="bg"
        color="fg.muted"
        minH="60px"
        py={2}
        px={4}
        borderBottomWidth="1px"
        borderColor="border"
        align="center"
      >
        <Flex
          flex={{ base: 1, md: "auto" }}
          ml={-2}
          display={{ base: "flex", md: "none" }}
        >
          <IconButton
            onClick={onToggle}
            variant="ghost"
            aria-label="Toggle Navigation"
          >
            {open ? <LuX /> : <LuMenu />}
          </IconButton>
        </Flex>

        <Flex flex={1} justify={{ base: "center", md: "start" }} align="center">
          <NextLink href="/">
            <Image src="/logo.png" alt="Kanji Dictionary" h={6} />
          </NextLink>

          <Flex display={{ base: "none", md: "flex" }} ml={10}>
            <DesktopNav />
          </Flex>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify="flex-end"
          direction="row"
          gap={6}
        >
          <ColorModeToggle />
        </Stack>
      </Flex>

      <Collapsible.Root open={open}>
        <Collapsible.Content>
          <MobileNav />
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

export default Header;

const navLinkStyles = {
  p: 2,
  fontSize: "sm",
  fontWeight: 500,
  color: "fg.muted",
  _hover: { textDecoration: "none", color: "fg" },
} as const;

const DesktopNav = () => (
  <Stack direction="row" gap={4}>
    {NAV_ITEMS.map((navItem) =>
      navItem.children ? (
        <HoverCard.Root
          key={navItem.label}
          positioning={{ placement: "bottom-start" }}
          openDelay={0}
        >
          <HoverCard.Trigger asChild>
            <Link {...navLinkStyles} cursor="pointer">
              {navItem.label}
            </Link>
          </HoverCard.Trigger>
          <Portal>
            <HoverCard.Positioner>
              <HoverCard.Content p={4} rounded="xl" minW="sm" shadow="xl">
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </HoverCard.Content>
            </HoverCard.Positioner>
          </Portal>
        </HoverCard.Root>
      ) : (
        <Link key={navItem.label} asChild {...navLinkStyles}>
          <NextLink href={navItem.href ?? "#"}>{navItem.label}</NextLink>
        </Link>
      ),
    )}
  </Stack>
);

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => (
  <Link
    asChild
    className="group"
    display="block"
    p={2}
    rounded="md"
    _hover={{
      bg: { base: "pink.50", _dark: "gray.900" },
      textDecoration: "none",
    }}
  >
    <NextLink href={href ?? "#"}>
      <Stack direction="row" align="center" w="full">
        <Box>
          <Text
            transition="all .3s ease"
            _groupHover={{ color: "pink.400" }}
            fontWeight={500}
          >
            {label}
          </Text>
          {subLabel && <Text fontSize="sm">{subLabel}</Text>}
        </Box>
        <Flex
          transition="all .3s ease"
          transform="translateX(-10px)"
          opacity={0}
          _groupHover={{ opacity: "100%", transform: "translateX(0)" }}
          justify="flex-end"
          align="center"
          flex={1}
          color="pink.400"
        >
          <LuChevronRight />
        </Flex>
      </Stack>
    </NextLink>
  </Link>
);

const MobileNav = () => (
  <Stack bg="bg" p={4} display={{ md: "none" }}>
    {NAV_ITEMS.map((navItem) => (
      <MobileNavItem key={navItem.label} {...navItem} />
    ))}
  </Stack>
);

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { open, onToggle } = useDisclosure();

  const row = (
    <Flex py={2} justify="space-between" align="center" w="full">
      <Text fontWeight={600} color="fg.muted">
        {label}
      </Text>
      {children && (
        <Box
          transition="all .25s ease-in-out"
          transform={open ? "rotate(180deg)" : undefined}
        >
          <LuChevronDown />
        </Box>
      )}
    </Flex>
  );

  if (!children) {
    return (
      <Link asChild _hover={{ textDecoration: "none" }}>
        <NextLink href={href ?? "#"}>{row}</NextLink>
      </Link>
    );
  }

  return (
    <Collapsible.Root open={open}>
      <Box as="button" w="full" onClick={onToggle} cursor="pointer">
        {row}
      </Box>
      <Collapsible.Content>
        <Stack
          mt={2}
          pl={4}
          borderLeftWidth="1px"
          borderColor="border"
          align="start"
        >
          {children.map((child) => (
            <Link key={child.label} asChild py={2}>
              <NextLink href={child.href ?? "#"}>{child.label}</NextLink>
            </Link>
          ))}
        </Stack>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
