import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from "@mantine/core";
import axios from "axios";
import PropTypes from "prop-types";
import {
  ArrowsClockwise,
  BookOpenText,
  GraduationCap,
  Trophy,
  Tray,
} from "@phosphor-icons/react";

import { ErrorState } from "../../ui/components/ErrorState";
import { student_credit_summary } from "../Examination/routes/examinationRoutes";
import {
  DEGREE_CREDIT_REQUIREMENT,
  SWAYAM_CREDIT_CAP,
  computeCreditSummary,
  fmtCredits,
  remainingCreditRequirement,
  swayamAboveCap,
} from "../../lib/credits";
import classes from "./StudentCreditSummary.module.css";

const MUTED = "#868e96";

const COLUMNS = [
  {
    key: "earned",
    label: "Credits Earned",
    short: "Earned",
    accent: "#1864ab",
    icon: GraduationCap,
  },
  {
    key: "regular",
    label: "Regular Credits",
    short: "Regular",
    accent: "#1baf7a",
    icon: Trophy,
  },
  {
    key: "backlogImp",
    label: "Backlog / Improvement",
    short: "Backlog",
    accent: "#eda100",
    icon: ArrowsClockwise,
    muteWhenZero: true,
  },
  {
    key: "swayam",
    label: "Swayam Credits",
    short: "Swayam",
    accent: "#4a3aa7",
    icon: BookOpenText,
  },
];

function StatTile({ label, short, value, accent, icon: Icon }) {
  return (
    <Card padding={{ base: "xs", sm: "sm" }} className={classes.tile}>
      <Box className={classes.tileRule} style={{ background: accent }} />
      <Group justify="space-between" align="center" wrap="nowrap" gap={6}>
        <Text className={classes.tileLabel}>
          <span className={classes.labelFull}>{label}</span>
          <span className={classes.labelShort}>{short}</span>
        </Text>
        <ThemeIcon
          className={classes.tileIcon}
          radius="md"
          variant="light"
          style={{ background: `${accent}1a`, color: accent }}
        >
          <Icon />
        </ThemeIcon>
      </Group>
      <Text className={classes.tileValue}>{value}</Text>
    </Card>
  );
}

StatTile.propTypes = {
  label: PropTypes.string.isRequired,
  short: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  accent: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
};

function SemesterCard({ label, row, emphasis }) {
  return (
    <Box className={emphasis ? classes.mCardTotal : classes.mCard}>
      <Text className={classes.mCardTitle}>{label}</Text>
      <SimpleGrid cols={2} spacing="xs" mt={8}>
        {COLUMNS.map((col) => (
          <Group key={col.key} justify="space-between" gap="xs" wrap="nowrap">
            <Text className={classes.mCardLabel}>{col.short}</Text>
            <Text
              className={classes.mCardValue}
              c={row[col.key] === 0 ? MUTED : undefined}
            >
              {fmtCredits(row[col.key])}
            </Text>
          </Group>
        ))}
      </SimpleGrid>
    </Box>
  );
}

SemesterCard.propTypes = {
  label: PropTypes.string.isRequired,
  row: PropTypes.shape({
    earned: PropTypes.number.isRequired,
    regular: PropTypes.number.isRequired,
    backlogImp: PropTypes.number.isRequired,
    swayam: PropTypes.number.isRequired,
  }).isRequired,
  emphasis: PropTypes.bool,
};

export default function StudentCreditSummary() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setState({ loading: false, error: null, data: null });
      return undefined;
    }
    let cancelled = false;
    axios
      .get(student_credit_summary, {
        headers: { Authorization: `Token ${token}` },
      })
      .then(({ data }) => {
        if (!cancelled) setState({ loading: false, error: null, data });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  if (state.error) return <ErrorState error={state.error} />;

  const { rows, totals } = computeCreditSummary(state.data?.semesters ?? []);
  const extraSwayam = swayamAboveCap(totals);
  // The degree requirement and the swayam cap are undergraduate rules.
  const isUg = state.data?.programme_category === "UG";

  if (!rows.length) {
    return (
      <Card padding="xl">
        <Center py="lg">
          <Stack align="center" gap={6}>
            <ThemeIcon size={48} radius="xl" variant="light" color="gray">
              <Tray size={22} />
            </ThemeIcon>
            <Text fw={600} ta="center">
              No credits to show yet
            </Text>
            <Text c="dimmed" size="sm" ta="center">
              Credits appear here once your semester result is announced.
            </Text>
          </Stack>
        </Center>
      </Card>
    );
  }

  return (
    <Stack gap={{ base: "sm", sm: "lg" }}>
      <SimpleGrid
        cols={{ base: 2, lg: 4 }}
        spacing={{ base: "xs", sm: "md" }}
        data-testid="credit-tiles"
      >
        {COLUMNS.map((col) => {
          const value = totals[col.key];
          const quiet = col.muteWhenZero && value === 0;
          return (
            <StatTile
              key={col.key}
              label={col.label}
              short={col.short}
              value={fmtCredits(value)}
              accent={quiet ? MUTED : col.accent}
              icon={col.icon}
            />
          );
        })}
      </SimpleGrid>

      <Card padding={0} className={classes.panel}>
        <Box className={classes.panelHead}>
          <Text className={classes.panelTitle}>Credits Details</Text>
          <Text className={classes.panelHint}>
            Semester-wise credit record, as issued by the Academic Office
          </Text>
        </Box>

        <Box visibleFrom="sm">
          <Table.ScrollContainer minWidth={640}>
            <Table className={classes.table} highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Semester</Table.Th>
                  {COLUMNS.map((col) => (
                    <Table.Th key={col.key} ta="center">
                      {col.label}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => (
                  <Table.Tr key={row.label}>
                    <Table.Td className={classes.cellSem}>{row.label}</Table.Td>
                    {COLUMNS.map((col) => (
                      <Table.Td key={col.key} ta="center">
                        <Text
                          className={classes.cellNum}
                          c={row[col.key] === 0 ? MUTED : undefined}
                        >
                          {fmtCredits(row[col.key])}
                        </Text>
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
                <Table.Tr className={classes.totalRow}>
                  <Table.Td>Total</Table.Td>
                  {COLUMNS.map((col) => (
                    <Table.Td key={col.key} ta="center">
                      {fmtCredits(totals[col.key])}
                    </Table.Td>
                  ))}
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Box>

        <Stack gap={0} hiddenFrom="sm" className={classes.mList}>
          {rows.map((row) => (
            <SemesterCard key={row.label} label={row.label} row={row} />
          ))}
          <SemesterCard label="Total" row={totals} emphasis />
        </Stack>

        {isUg && (
          <Group
            justify="space-between"
            align="center"
            wrap="wrap"
            gap="sm"
            className={classes.formula}
          >
            <Stack gap={2} className={classes.formulaText}>
              <Text className={classes.formulaLabel}>
                Remaining Credits requirement for degree
              </Text>
              <Text className={classes.formulaWorking}>
                {extraSwayam > 0 ? (
                  <>
                    {DEGREE_CREDIT_REQUIREMENT} &minus; (
                    {fmtCredits(totals.earned)} &minus; (
                    {fmtCredits(totals.swayam)} &minus; {SWAYAM_CREDIT_CAP}))
                  </>
                ) : (
                  <>
                    {DEGREE_CREDIT_REQUIREMENT} &minus;{" "}
                    {fmtCredits(totals.earned)}
                  </>
                )}
              </Text>
              <Text className={classes.formulaNote}>
                {extraSwayam > 0
                  ? `Credits earned minus the ${fmtCredits(extraSwayam)} swayam credits above the ${SWAYAM_CREDIT_CAP}-credit limit`
                  : `Degree requirement minus credits earned; up to ${SWAYAM_CREDIT_CAP} swayam credits count`}
              </Text>
            </Stack>
            <Text className={classes.formulaValue}>
              {fmtCredits(remainingCreditRequirement(totals))}
            </Text>
          </Group>
        )}
      </Card>
    </Stack>
  );
}
