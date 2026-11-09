import { loadEnv, type Plugin } from "vite";

export type BuildInfo = {
  commitSha: string | null;
  workspaceMeasurementsEnabled: boolean;
};

type VercelBuildEnv = Pick<
  NodeJS.ProcessEnv,
  "VERCEL" | "VERCEL_ENV" | "VERCEL_URL" | "VERCEL_GIT_COMMIT_SHA"
>;

type BuildInfoPluginOptions = {
  mode: string;
  envDir: string;
  vercelEnv?: VercelBuildEnv;
};

const COMMIT_SHA_PATTERN = /^[a-f0-9]{40}$/i;

export function resolveBuildInfo(
  viteEnv: Record<string, string | undefined>,
  vercelEnv: VercelBuildEnv,
): BuildInfo {
  const hasVercelMetadata = Boolean(
    vercelEnv.VERCEL_ENV ||
      vercelEnv.VERCEL_URL ||
      vercelEnv.VERCEL_GIT_COMMIT_SHA,
  );
  // Release precondition: Vercel's "Enable access to System Environment Variables"
  // must stay enabled. If disabled, its build cannot be distinguished from local.
  const isVercelBuild = vercelEnv.VERCEL === "1";

  if (!isVercelBuild && hasVercelMetadata) {
    throw new Error("Inconsistent Vercel build metadata.");
  }

  let commitSha: string | null = null;
  if (isVercelBuild) {
    const candidate = vercelEnv.VERCEL_GIT_COMMIT_SHA;
    if (!candidate || !COMMIT_SHA_PATTERN.test(candidate)) {
      throw new Error("Vercel build requires a valid commit SHA.");
    }
    commitSha = candidate.toLowerCase();
  }

  return {
    commitSha,
    workspaceMeasurementsEnabled:
      viteEnv.VITE_WORKSPACE_MEASUREMENTS_ENABLED === "true",
  };
}

function readVercelBuildEnv(): VercelBuildEnv {
  return {
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  };
}

export function createBuildInfoPlugin({
  mode,
  envDir,
  vercelEnv = readVercelBuildEnv(),
}: BuildInfoPluginOptions): Plugin {
  return {
    name: "saas-nutrit-build-info",
    apply: "build",
    generateBundle() {
      const viteEnv = loadEnv(mode, envDir, "VITE_");
      const info = resolveBuildInfo(viteEnv, vercelEnv);

      this.emitFile({
        type: "asset",
        fileName: "build-info.json",
        source: `${JSON.stringify(info)}\n`,
      });
    },
  };
}
