import { spawn, execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const scratchPath = "C:\\Users\\Lenovo\\AppData\\Local\\Temp\\saas-nutrit-release-pilot-20261104";
const projectId = "saas-nutrit-release-pilot-20261104";
const dbPort = 59722;
const dbContainer = `supabase_db_${projectId}`;
const configPath = `${scratchPath}\\supabase\\config.toml`;
const config = readFileSync(configPath, "utf8");
const normalizePath = (value) => value.replaceAll("\\", "/").replace(/\/$/, "").toLowerCase();

const configuredProject = config.match(/^project_id\s*=\s*"([^"]+)"\s*$/m)?.[1];
const dbSection = config.match(/^\[db\]\s*$([\s\S]*?)(?=^\[|$(?!\n))/m)?.[1];
const configuredDbPort = Number(dbSection?.match(/^port\s*=\s*(\d+)\s*$/m)?.[1]);
if (
  normalizePath(scratchPath) !== normalizePath("C:\\Users\\Lenovo\\AppData\\Local\\Temp\\saas-nutrit-release-pilot-20261104")
  || configuredProject !== projectId
  || configuredDbPort !== dbPort
) {
  throw new Error("Scratch path/project/config/database-port mismatch; refusing to connect.");
}

const running = execFileSync("docker", ["inspect", "--format", "{{.State.Running}}", dbContainer], {
  encoding: "utf8",
  timeout: 5_000,
}).trim();
if (running !== "true") throw new Error("The exact scratch database container is not running; refusing to connect.");

const labels = execFileSync(
  "docker",
  ["inspect", "--format", '{{ index .Config.Labels "com.supabase.cli.project" }}|{{ index .Config.Labels "com.supabase.cli.workdir" }}', dbContainer],
  { encoding: "utf8", timeout: 5_000 },
).trim();
const [actualProject, actualWorkdir] = labels.split("|");
if (actualProject !== projectId || normalizePath(actualWorkdir) !== normalizePath(scratchPath)) {
  throw new Error("Docker project/workdir labels do not match the fixed scratch; refusing to connect.");
}

const userId = randomUUID();
const suffix = randomUUID();
const email = `invite-sibling-race-${suffix}@example.test`;
const firstWorkspaceName = `Sibling race first ${suffix}`;
const secondWorkspaceName = `Sibling race second ${suffix}`;
const firstToken = randomBytes(32).toString("hex");
let secondToken = randomBytes(32).toString("hex");
while (secondToken === firstToken) secondToken = randomBytes(32).toString("hex");
const appName = `invite-sibling-race-${suffix}`;
const quote = (value) => `'${value.replaceAll("'", "''")}'`;
const psqlArgs = [
  "exec", "-i", dbContainer, "psql", "-X", "-v", "ON_ERROR_STOP=1", "-A", "-t", "-q", "-U", "postgres", "-d", "postgres",
];
const activeProcesses = new Set();

function startDockerPsql(sql, label, timeoutMs = 20_000) {
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
    label,
    async stop() {
      if (child.exitCode !== null || child.signalCode !== null) {
        await closed;
        return;
      }
      child.kill("SIGTERM");
      const graceful = await Promise.race([closed.then(() => true), delay(1_500).then(() => false)]);
      if (!graceful) {
        child.kill("SIGKILL");
        const forced = await Promise.race([closed.then(() => true), delay(2_000).then(() => false)]);
        if (!forced) throw new Error(`Could not stop and reap local psql process: ${label}.`);
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
    if (code !== 0) throw new Error(`Scratch psql failed (${code ?? signal}): ${stderr.trim()}`);
    return stdout.trim();
  }).finally(() => clearTimeout(timer));

  return { child, closed, get stdout() { return stdout; }, label, result, stop: processRecord.stop };
}

async function runScratchSql(sql, label = "scratch SQL", timeoutMs = 15_000) {
  return startDockerPsql(sql, label, timeoutMs).result;
}

function startAcceptance(label, token, holdSeconds = 0) {
  const sql = `
SET application_name = ${quote(`${appName}-${label}`)};
SET statement_timeout = '15s';
SET lock_timeout = '12s';
SET idle_in_transaction_session_timeout = '15s';
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = ${quote(userId)};
SET LOCAL request.jwt.claim.role = 'authenticated';
SELECT 'ACCEPT_${label}=' || coalesce(public.accept_workspace_invitation(${quote(token)})::text, 'NULL');
${holdSeconds > 0 ? `SELECT pg_catalog.pg_sleep(${holdSeconds});` : ""}
COMMIT;
`;
  return startDockerPsql(sql, `acceptance ${label}`, 20_000);
}

async function waitForAcceptanceSessionsToClose() {
  const deadline = Date.now() + 18_000;
  while (Date.now() < deadline) {
    const count = await runScratchSql(`
SELECT count(*)::text
FROM pg_catalog.pg_stat_activity
WHERE application_name LIKE ${quote(`${appName}-%`)};
`, "wait for exact fixture sessions to close", 5_000);
    if (count === "0") return;
    await delay(100);
  }
  throw new Error("Timed out waiting for fixture sessions to close; refusing cleanup while a session may still use them.");
}

let fixtureAttempted = false;
let testError;
try {
  const readiness = await runScratchSql(`
SELECT CASE
  WHEN pg_catalog.to_regprocedure('public.accept_workspace_invitation(text)') IS NOT NULL
   AND pg_catalog.strpos(
     pg_catalog.lower(pg_catalog.pg_get_functiondef('public.accept_workspace_invitation(text)'::pg_catalog.regprocedure)),
     'set status = ''revoked'''
   ) > 0
   AND NOT EXISTS (
     SELECT 1 FROM pg_catalog.pg_indexes
     WHERE schemaname = 'public'
       AND indexname = 'workspace_invitations_one_pending_email'
   )
  THEN 'READY'
  ELSE 'NOT_READY'
END;
`, "read-only scratch migration readiness");
  if (readiness !== "READY") {
    throw new Error("Scratch schema is not at invitation sibling-revocation semantics; refusing to run fixtures.");
  }

  fixtureAttempted = true;
  await runScratchSql(`
BEGIN;
INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at)
VALUES (${quote(userId)}, ${quote(email)}, 'authenticated', 'authenticated', 'local-test-only', now());
INSERT INTO public.workspace_invitations (invited_email, workspace_name, token_hash, expires_at)
VALUES
  (${quote(email)}, ${quote(firstWorkspaceName)}, encode(extensions.digest(${quote(firstToken)}, 'sha256'), 'hex'), now() + interval '7 days'),
  (${quote(email)}, ${quote(secondWorkspaceName)}, encode(extensions.digest(${quote(secondToken)}, 'sha256'), 'hex'), now() + interval '7 days');
COMMIT;
`, "atomic local auth-user and sibling-invitation fixtures");

  const first = startAcceptance("first", firstToken, 6);
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

  const second = startAcceptance("second", secondToken);
  const waitDeadline = Date.now() + 4_000;
  let advisoryLockWait;
  while (Date.now() < waitDeadline && second.child.exitCode === null && second.child.signalCode === null) {
    const waiting = await runScratchSql(`
SELECT blocked.pid::text || '|' || count(*)::text
FROM pg_catalog.pg_stat_activity AS blocked
JOIN pg_catalog.pg_locks AS blocked_lock ON blocked_lock.pid = blocked.pid
WHERE blocked.application_name = ${quote(`${appName}-second`)}
  AND blocked_lock.locktype = 'advisory'
  AND NOT blocked_lock.granted
  AND EXISTS (
    SELECT 1
    FROM pg_catalog.pg_stat_activity AS holder
    JOIN pg_catalog.pg_locks AS held_lock ON held_lock.pid = holder.pid
    WHERE holder.application_name = ${quote(`${appName}-first`)}
      AND held_lock.locktype = 'advisory'
      AND held_lock.granted
      AND held_lock.database IS NOT DISTINCT FROM blocked_lock.database
      AND held_lock.classid IS NOT DISTINCT FROM blocked_lock.classid
      AND held_lock.objid IS NOT DISTINCT FROM blocked_lock.objid
      AND held_lock.objsubid IS NOT DISTINCT FROM blocked_lock.objsubid
  )
GROUP BY blocked.pid;
`, "observe second session waiting for first session advisory lock", 5_000);
    const [pid, lockCount] = waiting.split("|");
    if (pid && Number(lockCount) > 0) {
      advisoryLockWait = pid;
      break;
    }
    await delay(50);
  }
  if (!advisoryLockWait) {
    throw new Error("Second session was not observed waiting on an advisory lock held by the first session.");
  }

  const [firstOutput, secondOutput] = await Promise.all([first.result, second.result]);
  const secondResult = secondOutput.match(/ACCEPT_second=([^\s]+)/)?.[1];
  if (secondResult !== "NULL") {
    throw new Error(`Second acceptance should return NULL after the first commits; got ${secondResult ?? "no result"}.`);
  }

  const state = await runScratchSql(`
SELECT
  (SELECT count(*) FROM public.workspaces AS workspace
   JOIN public.workspace_members AS member ON member.workspace_id = workspace.id
   WHERE member.user_id = ${quote(userId)} AND member.status = 'active'
     AND workspace.name IN (${quote(firstWorkspaceName)}, ${quote(secondWorkspaceName)}))::text || '|' ||
  (SELECT count(*) FROM public.workspace_members
   WHERE user_id = ${quote(userId)} AND status = 'active')::text || '|' ||
  (SELECT status FROM public.workspace_invitations
   WHERE token_hash = encode(extensions.digest(${quote(firstToken)}, 'sha256'), 'hex')) || '|' ||
  (SELECT accepted_by::text FROM public.workspace_invitations
   WHERE token_hash = encode(extensions.digest(${quote(firstToken)}, 'sha256'), 'hex')) || '|' ||
  (SELECT workspace_id::text FROM public.workspace_invitations
   WHERE token_hash = encode(extensions.digest(${quote(firstToken)}, 'sha256'), 'hex')) || '|' ||
  (SELECT status FROM public.workspace_invitations
   WHERE token_hash = encode(extensions.digest(${quote(secondToken)}, 'sha256'), 'hex')) || '|' ||
  (SELECT count(*) FROM public.workspaces
   WHERE name IN (${quote(firstWorkspaceName)}, ${quote(secondWorkspaceName)}))::text;
`, "verify sibling acceptance final state");
  const [ownedWorkspaces, activeMemberships, firstStatus, acceptedBy, acceptedWorkspace, secondStatus, workspaceCount] = state.split("|");
  if (
    ownedWorkspaces !== "1"
    || activeMemberships !== "1"
    || firstStatus !== "accepted"
    || acceptedBy !== userId
    || acceptedWorkspace !== firstResult
    || secondStatus !== "revoked"
    || workspaceCount !== "1"
  ) {
    throw new Error(`Unexpected final fixture state: ${state}`);
  }

  console.log("PASS: two independent local PostgreSQL sessions attempted different pending tokens for the same confirmed account.");
  console.log(`PASS: second session PID ${advisoryLockWait} was observed waiting on an ungranted advisory lock held by the first session.`);
  console.log("PASS: first RPC returned a workspace UUID; the second returned NULL after the first committed.");
  console.log("PASS: final state has one workspace/membership, first invite accepted, and sibling invite revoked.");
  console.log(`PASS: both psql sessions returned their expected results (${firstOutput.includes("ACCEPT_first=") && secondOutput.includes("ACCEPT_second=NULL") ? "verified" : "unexpected"}).`);
} catch (error) {
  testError = error;
} finally {
  const stopResults = await Promise.allSettled([...activeProcesses].map((processRecord) => processRecord.stop()));
  const stopFailure = stopResults.find((result) => result.status === "rejected");
  if (fixtureAttempted) {
    try {
      if (stopFailure) throw stopFailure.reason;
      await waitForAcceptanceSessionsToClose();
      const cleanupState = await runScratchSql(`
BEGIN;
DELETE FROM public.workspace_members WHERE user_id = ${quote(userId)};
DELETE FROM public.workspaces
WHERE id IN (
  SELECT workspace_id FROM public.workspace_invitations
  WHERE token_hash IN (
    encode(extensions.digest(${quote(firstToken)}, 'sha256'), 'hex'),
    encode(extensions.digest(${quote(secondToken)}, 'sha256'), 'hex')
  )
);
DELETE FROM public.workspace_invitations
WHERE token_hash IN (
  encode(extensions.digest(${quote(firstToken)}, 'sha256'), 'hex'),
  encode(extensions.digest(${quote(secondToken)}, 'sha256'), 'hex')
);
DELETE FROM auth.users WHERE id = ${quote(userId)};
SELECT
  (SELECT count(*) FROM auth.users WHERE id = ${quote(userId)})::text || '|' ||
  (SELECT count(*) FROM public.workspace_invitations
   WHERE token_hash IN (
     encode(extensions.digest(${quote(firstToken)}, 'sha256'), 'hex'),
     encode(extensions.digest(${quote(secondToken)}, 'sha256'), 'hex')
   ))::text || '|' ||
  (SELECT count(*) FROM public.workspace_members WHERE user_id = ${quote(userId)})::text || '|' ||
  (SELECT count(*) FROM public.workspaces
   WHERE name IN (${quote(firstWorkspaceName)}, ${quote(secondWorkspaceName)}))::text;
COMMIT;
`, "atomic exact-fixture cleanup and verification");
      if (cleanupState !== "0|0|0|0") {
        throw new Error(`Fixture cleanup verification was not empty: ${cleanupState}.`);
      }
      console.log("PASS: atomic cleanup verified zero fixture auth users, invitations, memberships, and workspaces.");
    } catch (cleanupError) {
      testError ??= cleanupError;
    }
  }
  if (stopFailure) testError ??= stopFailure.reason;
}

if (testError) throw testError;
