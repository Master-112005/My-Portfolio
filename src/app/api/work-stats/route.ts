import { NextResponse } from "next/server";

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

type LeetCodeStats = {
  calendar: CalendarDay[];
  profileUrl: string;
  ranking: number | null;
  solved: {
    easy: number;
    hard: number;
    medium: number;
    total: number;
  };
  username: string;
};

type WorkStats = {
  generatedAt: string;
  github: GithubStats | null;
  leetcode: LeetCodeStats | null;
  messages: string[];
};

const githubLevelMap = {
  FIRST_QUARTILE: 1,
  FOURTH_QUARTILE: 4,
  NONE: 0,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
} as const;

function getLevel(count: number, buckets: number[]) {
  if (count <= 0) {
    return 0;
  }

  if (count >= buckets[3]) {
    return 4;
  }

  if (count >= buckets[2]) {
    return 3;
  }

  if (count >= buckets[1]) {
    return 2;
  }

  return 1;
}

function normalizeLeetCodeCalendar(calendar: string | null | undefined) {
  if (!calendar) {
    return [];
  }

  try {
    const parsed = JSON.parse(calendar) as Record<string, number>;
    const counts = Object.values(parsed).filter((count) => count > 0).sort((left, right) => left - right);
    const buckets = [
      counts[Math.floor(counts.length * 0.25)] ?? 1,
      counts[Math.floor(counts.length * 0.5)] ?? 2,
      counts[Math.floor(counts.length * 0.75)] ?? 3,
      counts[Math.floor(counts.length * 0.9)] ?? 4,
    ];

    return Object.entries(parsed)
      .map(([timestamp, count]) => ({
        count,
        date: new Date(Number(timestamp) * 1000).toISOString().slice(0, 10),
        level: getLevel(count, buckets) as CalendarDay["level"],
      }))
      .sort((left, right) => left.date.localeCompare(right.date));
  } catch {
    return [];
  }
}

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

async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats> {
  const response = await fetch("https://leetcode.com/graphql", {
    body: JSON.stringify({
      query: `
        query PortfolioLeetCode($username: String!) {
          matchedUser(username: $username) {
            profile {
              ranking
            }
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
            userCalendar {
              submissionCalendar
            }
          }
        }
      `,
      variables: { username },
    }),
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
    },
    method: "POST",
    next: { revalidate: 21600 },
  });

  if (!response.ok) {
    throw new Error(`LeetCode returned ${response.status}.`);
  }

  const payload = (await response.json()) as {
    data?: {
      matchedUser?: {
        profile?: {
          ranking?: number | null;
        };
        submitStats?: {
          acSubmissionNum?: {
            count: number;
            difficulty: "All" | "Easy" | "Hard" | "Medium";
          }[];
        };
        userCalendar?: {
          submissionCalendar?: string | null;
        };
      } | null;
    };
  };
  const user = payload.data?.matchedUser;

  if (!user) {
    throw new Error("LeetCode user was not found.");
  }

  const solvedCounts = user.submitStats?.acSubmissionNum ?? [];
  const countFor = (difficulty: "All" | "Easy" | "Hard" | "Medium") =>
    solvedCounts.find((item) => item.difficulty === difficulty)?.count ?? 0;

  return {
    calendar: normalizeLeetCodeCalendar(user.userCalendar?.submissionCalendar),
    profileUrl: `https://leetcode.com/u/${username}/`,
    ranking: user.profile?.ranking ?? null,
    solved: {
      easy: countFor("Easy"),
      hard: countFor("Hard"),
      medium: countFor("Medium"),
      total: countFor("All"),
    },
    username,
  };
}

export async function GET() {
  const githubUsername = process.env.GITHUB_USERNAME?.trim() || "";
  const githubToken = process.env.GITHUB_TOKEN?.trim() || "";
  const leetcodeUsername = process.env.LEETCODE_USERNAME?.trim() || "";
  const messages: string[] = [];
  let github: WorkStats["github"] = null;
  let leetcode: WorkStats["leetcode"] = null;

  if (githubUsername && githubToken) {
    try {
      github = await fetchGithubStats(githubUsername, githubToken);
    } catch (error) {
      messages.push(error instanceof Error ? error.message : "GitHub stats could not be loaded.");
    }
  } else {
    messages.push("Set GITHUB_USERNAME and GITHUB_TOKEN to show live GitHub contributions.");
  }

  if (leetcodeUsername) {
    try {
      leetcode = await fetchLeetCodeStats(leetcodeUsername);
    } catch (error) {
      messages.push(error instanceof Error ? error.message : "LeetCode stats could not be loaded.");
    }
  } else {
    messages.push("Set LEETCODE_USERNAME to show live LeetCode progress.");
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    github,
    leetcode,
    messages,
  } satisfies WorkStats);
}
