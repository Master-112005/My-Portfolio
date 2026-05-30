import { NextResponse } from "next/server";

import { readResolvedGithubSettings } from "@/lib/work-settings";

type CalendarDay = {
  count: number;
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
};

type GithubStats = {
  calendar: CalendarDay[];
  profileUrl: string;
  totalContributions: number;
  username: string;
};

type WorkStats = {
  generatedAt: string;
  github: GithubStats | null;
  messages: string[];
};

const githubLevelMap = {
  FIRST_QUARTILE: 1,
  FOURTH_QUARTILE: 4,
  NONE: 0,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
} as const;

async function fetchGithubStats(username: string, token: string): Promise<GithubStats> {
  const response = await fetch("https://api.github.com/graphql", {
    body: JSON.stringify({
      query: `
        query PortfolioContributions($login: String!) {
          user(login: $login) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    contributionLevel
                    date
                  }
                }
              }
            }
          }
        }
      `,
      variables: { login: username },
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    next: { revalidate: 21600 },
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}.`);
  }

  const payload = (await response.json()) as {
    data?: {
      user?: {
        contributionsCollection?: {
          contributionCalendar?: {
            totalContributions?: number;
            weeks?: {
              contributionDays?: {
                contributionCount: number;
                contributionLevel: keyof typeof githubLevelMap;
                date: string;
              }[];
            }[];
          };
        };
      } | null;
    };
    errors?: unknown[];
  };

  const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;

  if (!calendar || payload.errors?.length) {
    throw new Error("GitHub contribution calendar was not available.");
  }

  return {
    calendar:
      calendar.weeks?.flatMap((week) =>
        (week.contributionDays ?? []).map((day) => ({
          count: day.contributionCount,
          date: day.date,
          level: githubLevelMap[day.contributionLevel] ?? 0,
        })),
      ) ?? [],
    profileUrl: `https://github.com/${username}`,
    totalContributions: calendar.totalContributions ?? 0,
    username,
  };
}

export async function GET() {
  const { githubToken, githubUsername } = await readResolvedGithubSettings();
  const messages: string[] = [];
  let github: WorkStats["github"] = null;

  if (githubUsername && githubToken) {
    try {
      github = await fetchGithubStats(githubUsername, githubToken);
    } catch (error) {
      messages.push(error instanceof Error ? error.message : "GitHub stats could not be loaded.");
    }
  } else {
    messages.push("Add a GitHub username and token in My Work edit settings to show live contributions.");
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    github,
    messages,
  } satisfies WorkStats);
}
