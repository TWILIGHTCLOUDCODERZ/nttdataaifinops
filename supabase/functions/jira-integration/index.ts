import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const JIRA_BASE_URL = Deno.env.get("JIRA_BASE_URL");
const JIRA_EMAIL = Deno.env.get("JIRA_EMAIL");
const JIRA_API_TOKEN = Deno.env.get("JIRA_API_TOKEN");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

function jiraAuthHeader(): string {
  return "Basic " + btoa(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`);
}

async function jiraFetch(path: string): Promise<unknown> {
  const res = await fetch(`${JIRA_BASE_URL}/rest/api/3${path}`, {
    headers: {
      Authorization: jiraAuthHeader(),
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function geminiInsights(issuesSummary: string, question?: string): Promise<string> {
  const systemInstruction =
    "You are an expert Jira project management analyst and agile coach. " +
    "You analyze sprint data, identify risks, and provide clear, actionable recommendations. " +
    "Always respond with well-structured markdown using ## headings, bullet points, and **bold** for key values. " +
    "Be specific — reference actual issue keys and assignee names from the data. " +
    "Use severity indicators (HIGH / MEDIUM / LOW) where relevant.";

  const userMessage = question
    ? `Answer this question about the Jira issues below:\n\n**Question:** ${question}\n\n=== Jira Issues ===\n${issuesSummary}`
    : `Analyze these Jira sprint issues and provide a full report with these sections:\n\n` +
      `## Sprint Health Summary\n## Risk Assessment\n## Workload Distribution\n## Recommendations\n## Key Metrics\n\n` +
      `Be concise, use bullet points, and reference specific issue keys.\n\n=== Jira Issues ===\n${issuesSummary}`;

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error ${res.status}: ${text}`);
  }
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No insights available.";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "issues";

    // ── GET /projects ─────────────────────────────────────────────────────────
    if (action === "projects") {
      const data = await jiraFetch("/project/search?maxResults=50&orderBy=name") as { values: unknown[] };
      return new Response(JSON.stringify({ projects: data.values }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET /boards ───────────────────────────────────────────────────────────
    if (action === "boards") {
      const projectKey = url.searchParams.get("projectKey") ?? "SCRUM";
      const res = await fetch(
        `${JIRA_BASE_URL}/rest/agile/1.0/board?projectKeyOrId=${projectKey}&maxResults=10`,
        {
          headers: { Authorization: jiraAuthHeader(), Accept: "application/json" },
        }
      );
      if (!res.ok) throw new Error(`Board fetch failed: ${res.status}`);
      const data = await res.json() as { values: unknown[] };
      return new Response(JSON.stringify({ boards: data.values }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET /sprints ──────────────────────────────────────────────────────────
    if (action === "sprints") {
      const boardId = url.searchParams.get("boardId") ?? "1";
      const res = await fetch(
        `${JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/sprint?state=active,future&maxResults=10`,
        {
          headers: { Authorization: jiraAuthHeader(), Accept: "application/json" },
        }
      );
      if (!res.ok) throw new Error(`Sprint fetch failed: ${res.status}`);
      const data = await res.json() as { values: unknown[] };
      return new Response(JSON.stringify({ sprints: data.values }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET /issues ───────────────────────────────────────────────────────────
    if (action === "issues") {
      const projectKey = url.searchParams.get("projectKey") ?? "SCRUM";
      const assignee = url.searchParams.get("assignee");
      const sprintId = url.searchParams.get("sprintId");

      let jql = `project = "${projectKey}" ORDER BY updated DESC`;
      if (sprintId) {
        jql = `project = "${projectKey}" AND sprint = ${sprintId} ORDER BY updated DESC`;
      }
      if (assignee) {
        jql = jql.replace("ORDER BY", `AND assignee = "${assignee}" ORDER BY`);
      }

      const fields = "summary,status,priority,issuetype,assignee,reporter,created,updated,duedate,description,parent,labels";
      const data = await jiraFetch(
        `/search/jql?jql=${encodeURIComponent(jql)}&maxResults=100&fields=${fields}`
      ) as { issues: unknown[]; total: number };

      return new Response(JSON.stringify({ issues: data.issues, total: data.total }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET /my-issues ────────────────────────────────────────────────────────
    if (action === "my-issues") {
      const projectKey = url.searchParams.get("projectKey") ?? "SCRUM";
      const jql = `project = "${projectKey}" AND assignee = currentUser() ORDER BY updated DESC`;
      const fields = "summary,status,priority,issuetype,assignee,reporter,created,updated,duedate,description,labels,parent";
      const data = await jiraFetch(
        `/search/jql?jql=${encodeURIComponent(jql)}&maxResults=100&fields=${fields}`
      ) as { issues: unknown[]; total: number };

      return new Response(JSON.stringify({ issues: data.issues, total: data.total }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── POST /create-issue ────────────────────────────────────────────────────
    if (action === "create-issue") {
      const body = await req.json() as {
        projectKey?: string;
        summary: string;
        description?: string;
        issueType?: string;
        priority?: string;
        labels?: string[];
      };

      const projectKey = body.projectKey ?? "SCRUM";
      const issuePayload = {
        fields: {
          project: { key: projectKey },
          summary: body.summary,
          description: body.description
            ? {
                version: 1,
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: body.description }],
                  },
                ],
              }
            : undefined,
          issuetype: { name: body.issueType ?? "Task" },
          priority: body.priority ? { name: body.priority } : { name: "High" },
          labels: body.labels ?? [],
        },
      };

      const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          Authorization: jiraAuthHeader(),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issuePayload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Jira create issue failed: ${res.status}: ${text}`);
      }

      const created = await res.json() as { id: string; key: string; self: string };
      return new Response(
        JSON.stringify({
          id: created.id,
          key: created.key,
          url: `${JIRA_BASE_URL}/browse/${created.key}`,
          status: "To Do",
          assignedTeam: projectKey,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── POST /insights ────────────────────────────────────────────────────────
    if (action === "insights") {
      const body = await req.json() as { issues?: unknown[]; question?: string };
      const { issues, question } = body;

      if (!issues || !Array.isArray(issues)) {
        throw new Error("issues array required");
      }

      const issuesSummary = (issues as { key: string; fields: { summary: string; status: { name: string }; priority: { name: string }; issuetype: { name: string }; assignee?: { displayName: string }; duedate?: string; labels?: string[] } }[])
        .slice(0, 50)
        .map(i => `[${i.key}] ${i.fields.summary} | Status: ${i.fields.status?.name} | Priority: ${i.fields.priority?.name} | Type: ${i.fields.issuetype?.name} | Assignee: ${i.fields.assignee?.displayName ?? "Unassigned"}${i.fields.duedate ? ` | Due: ${i.fields.duedate}` : ""}${i.fields.labels?.length ? ` | Labels: ${i.fields.labels.join(", ")}` : ""}`)
        .join("\n");

      const insights = await geminiInsights(issuesSummary, question);
      return new Response(JSON.stringify({ insights }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
