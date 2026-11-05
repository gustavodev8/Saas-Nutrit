import { spawn, execFileSync } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const scratchPath = "C:\\Users\\Lenovo\\AppData\\Local\\Temp\\saas-nutrit-release-pilot-20261104";
const projectId = "saas-nutrit-release-pilot-20261104";
const dbContainer = `supabase_db_${projectId}`;
const config = readFileSync(`${scratchPath}\\supabase\\config.toml`, "utf8");
const normalizePath = (value) => value.replaceAll("\\", "/").replace(/\/$/, "").toLowerCase();

if (!config.includes(`project_id = "${projectId}"`) || !config.includes("port = 59722")) {
  throw new Error("Scratch config identity/port mismatch; refusing to connect.");
}

const labels = execFileSync(
  "docker",
  ["inspect", "--format", '{{ index .Config.Labels "com.supabase.cli.project" }}|{{ index .Config.Labels "com.supabase.cli.workdir" }}', dbContainer],
  { encoding: "utf8", timeout: 5_000 },
).trim();
const [actualProject, actualWorkdir] = labels.split("|");
if (actualProject !== projectId || normalizePath(actualWorkdir) !== normalizePath(scratchPath)) {
  throw new Error(`Scratch container identity mismatch (${labels}); refusing to connect.`);
}

const userId = randomUUID();
const suffix = randomUUID();
const email = `invite-concurrency-${suffix}@example.test`;
const workspaceName = `Concurrency ${suffix}`;
const token = randomBytes(32).toString("hex");
const appName = `invite-race-${suffix}`;
const quote = (value) => `'${value.replaceAll("'", "''")}'`;
const psqlArgs = [
  "exec", "-i", dbContainer, "psql", "-X", "-v", "ON_ERROR_STOP=1", "-A", "-t", "-q", "-U", "postgres", "-d", "postgres",
];
const activeProcesses = new Set();

function startDockerExec(sql, label, timeoutMs = 15_000) {
  const child = spawn("docker", psqlArgs, { stdio: ["pipe", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  let timedOut = false;
  child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });

  const closed = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal }));
  });
  const processRecord = {
    child,
    closed,
    get stdout() { return stdout; },
    get stderr() { return stderr; },
    label,
    async stop() {
      if (child.exitCode !== null || child.signalCode !== null) {
        await closed;
        return;
      }
      child.kill("SIGTERM");
      const graceful = await Promise.race([
        closed.then(() => true),
        delay(1_500).then(() => false),
      ]);
      if (!graceful) {
        child.kill("SIGKILL");
        const forced = await Promise.race([
          closed.then(() => true),
          delay(2_000).then(() => false),
        ]);
        if (!forced) throw new Error(`Could not stop and reap docker exec process: ${label}.`);
      }
    },
  };
  activeProcesses.add(processRecord);
  closed.finally(() => activeProcesses.delete(processRecord)).catch(() => {});

  const timer = setTimeout(() => {
    timedOut = true;
    void processRecord.stop().catch(() => {});
  }, timeoutMs);
  child.stdin.end(sql);

  const result = closed.then(({ code, signal }) => {
    if (timedOut) throw new Error(`Timed out after ${timeoutMs}ms: ${label}.`);
    if (code !== 0) throw new Error(`Local psql failed (${code ?? signal}): ${stderr.trim()}`);
    return stdout.trim();
  }).finally(() => clearTimeout(timer));

  return {
    child,
    closed,
    get stdout() { return stdout; },
    get stderr() { return stderr; },
    label,
    stop: processRecord.stop,
    result,
  };
}

async function runPsql(sql, label = "scratch SQL", timeoutMs = 15_000) {
  return startDockerExec(sql, label, timeoutMs).result;
}

function startAcceptance(label, holdSeconds = 0) {
  const sql = `
SET application_name = ${quote(`${appName}-${label}`)};
SET statement_timeout = '12s';
SET idle_in_transaction_session_timeout = '12s';
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', ${quote(userId)}, true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT 'ACCEPT_${label}=' || coalesce(public.accept_workspace_invitation(${quote(token)})::text, 'NULL');
${holdSeconds > 0 ? `SELECT pg_catalog.pg_sleep(${holdSeconds});` : ""}
COMMIT;
`;
  return startDockerExec(sql, `acceptance ${label}`, 15_000);
}

async function waitForAcceptanceSessionsToClose() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const count = await runPsql(`
SELECT count(*)::text
FROM pg_catalog.pg_stat_activity
WHERE application_name LIKE ${quote(`${appName}-%`)};
`, "wait for fixture sessions to close", 5_000);
    if (count === "0") return;
    await delay(100);
  }
  throw new Error("Timed out waiting for fixture PostgreSQL sessions to close; refusing to clean fixtures while a session may still be using them.");
}

let fixtureCreated = false;
let testError;
try {
  await runPsql(`
BEGIN;
INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at)
VALUES (${quote(userId)}, ${quote(email)}, 'authenticated', 'authenticated', 'local-test-only', now());
INSERT INTO public.workspace_invitations (invited_email, workspace_name, token_hash, expires_at)
VALUES (
  ${quote(email)}, ${quote(workspaceName)},
  encode(extensions.digest(${quote(token)}, 'sha256'), 'hex'),
  now() + interval '7 days'
);
COMMIT;
`, "atomic fixture creation");
  fixtureCreated = true;

  const first = startAcceptance("first", 6);
  const firstResult = await (async () => {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const match = first.stdout.match(/ACCEPT_first=([^\s]+)/);
      if (match) return match[1];
      if (first.child.exitCode !== null || first.child.signalCode !== null) {
        await first.result;
        throw new Error("First session exited before returning from the RPC.");
      }
      await delay(25);
    }
    throw new Error("Timed out waiting for the first acceptance result.");
  })();

  if (!/^[0-9a-f-]{36}$/i.test(firstResult)) {
    throw new Error(`First acceptance did not return a workspace UUID: ${firstResult}`);
  }

  const second = startAcceptance("second");
  const waitDeadline = Date.now() + 4_000;
  let advisoryLockWait = false;
  let blockedPid;
  while (Date.now() < waitDeadline && second.child.exitCode === null && second.child.signalCode === null) {
    const waiting = await runPsql(`
SELECT a.pid::text || '|' || count(*)::text
FROM pg_catalog.pg_stat_activity AS a
JOIN pg_catalog.pg_locks AS l ON l.pid = a.pid
WHERE a.application_name = ${quote(`${appName}-second`)}
  AND l.locktype = 'advisory'
  AND NOT l.granted
GROUP BY a.pid;
`, "observe specific advisory-lock wait", 5_000);
    const [pid, lockCount] = waiting.split("|");
    if (pid && Number(lockCount) > 0) {
      advisoryLockWait = true;
      blockedPid = pid;
      break;
    }
    await delay(50);
  }

  if (!advisoryLockWait) {
    throw new Error("Second session was not observed waiting on an ungranted PostgreSQL advisory lock.");
  }

  const [firstOutput, secondOutput] = await Promise.all([first.result, second.result]);
  const secondResult = secondOutput.match(/ACCEPT_second=([^\s]+)/)?.[1];
  if (secondResult !== firstResult) {
    throw new Error(`Concurrent accepts returned different results: ${firstResult} vs ${secondResult ?? "missing"}`);
  }

  const outcome = await runPsql(`
SELECT
  (SELECT count(*) FROM public.workspace_members WHERE user_id = ${quote(userId)} AND status = 'active')::text || '|' ||
  (SELECT status FROM public.workspace_invitations WHERE token_hash = encode(extensions.digest(${quote(token)}, 'sha256'), 'hex')) || '|' ||
  (SELECT accepted_by::text FROM public.workspace_invitations WHERE token_hash = encode(extensions.digest(${quote(token)}, 'sha256'), 'hex')) || '|' ||
  (SELECT workspace_id::text FROM public.workspace_invitations WHERE token_hash = encode(extensions.digest(${quote(token)}, 'sha256'), 'hex'));
`, "verify final fixture state");
  const [membershipCount, inviteStatus, acceptedBy, workspaceId] = outcome.split("|");
  if (membershipCount !== "1" || inviteStatus !== "accepted" || acceptedBy !== userId || workspaceId !== firstResult) {
    throw new Error(`Inconsistent final state: ${outcome}`);
  }

  console.log("PASS: two independent PostgreSQL sessions overlapped on accept_workspace_invitation().");
  console.log(`PASS: second session PID ${blockedPid} held an ungranted advisory lock observed through pg_stat_activity/pg_locks.`);
  console.log("PASS: both calls returned the same workspace UUID; final active membership count is exactly one.");
  console.log(`PASS: invitation is accepted by the expected fixture user and references ${firstResult}.`);
  console.log(`Local sessions: ${firstOutput.includes("ACCEPT_first=") && secondOutput.includes("ACCEPT_second=") ? "2" : "unexpected"}`);
} catch (error) {
  testError = error;
} finally {
  const stopResults = await Promise.allSettled([...activeProcesses].map((processRecord) => processRecord.stop()));
  const stopFailure = stopResults.find((result) => result.status === "rejected");
  if (fixtureCreated) {
    try {
      if (stopFailure) throw stopFailure.reason;
      await waitForAcceptanceSessionsToClose();
      await runPsql(`
BEGIN;
DELETE FROM public.workspace_members WHERE user_id = ${quote(userId)};
DELETE FROM public.workspaces
WHERE id IN (
  SELECT workspace_id FROM public.workspace_invitations
  WHERE token_hash = encode(extensions.digest(${quote(token)}, 'sha256'), 'hex')
);
DELETE FROM public.workspace_invitations
WHERE token_hash = encode(extensions.digest(${quote(token)}, 'sha256'), 'hex');
DELETE FROM auth.users WHERE id = ${quote(userId)};
COMMIT;
`, "atomic fixture cleanup");
      console.log("PASS: temporary auth user, invitation, membership, and workspace fixtures cleaned up.");
    } catch (cleanupError) {
      testError ??= cleanupError;
    }
  }
  if (stopFailure) testError ??= stopFailure.reason;
}

if (testError) throw testError;
