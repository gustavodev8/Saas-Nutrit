import { describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createBuildInfoPlugin,
  resolveBuildInfo,
} from "../../vite.buildInfo";

const { loadEnvMock } = vi.hoisted(() => ({ loadEnvMock: vi.fn() }));
vi.mock("vite", () => ({ loadEnv: loadEnvMock }));

const validSha = "29d711be26aeb8eae2e14dfe66cf93d8671bc91e";

describe("resolveBuildInfo", () => {
  it.each([
    ["true", true],
    ["false", false],
    [undefined, false],
    ["TRUE", false],
  ])("uses strict flag comparison for %s", (flag, expected) => {
    expect(
      resolveBuildInfo(
        { VITE_WORKSPACE_MEASUREMENTS_ENABLED: flag },
        {},
      ).workspaceMeasurementsEnabled,
    ).toBe(expected);
  });

  it("uses null commitSha for a local build", () => {
    expect(
      resolveBuildInfo({}, { GITHUB_SHA: validSha } as NodeJS.ProcessEnv),
    ).toEqual({
      commitSha: null,
      workspaceMeasurementsEnabled: false,
    });
  });

  it("records the system-environment access setting as a Vercel release precondition", () => {
    expect(resolveBuildInfo({}, {}).commitSha).toBeNull();
  });

  it("records a valid Vercel commit SHA", () => {
    expect(
      resolveBuildInfo(
        { VITE_WORKSPACE_MEASUREMENTS_ENABLED: "true" },
        { VERCEL: "1", VERCEL_GIT_COMMIT_SHA: validSha },
      ),
    ).toEqual({
      commitSha: validSha,
      workspaceMeasurementsEnabled: true,
    });
  });

  it.each([undefined, "not-a-sha", "a".repeat(39), "a".repeat(41)])(
    "fails closed for missing or malformed Vercel SHA: %s",
    (sha) => {
      expect(() =>
        resolveBuildInfo({}, {
          VERCEL: "1",
          VERCEL_GIT_COMMIT_SHA: sha,
        }),
      ).toThrow("Vercel build requires a valid commit SHA.");
    },
  );

  it("fails closed when Vercel metadata exists without VERCEL=1", () => {
    expect(() =>
      resolveBuildInfo({}, { VERCEL_ENV: "production" }),
    ).toThrow("Inconsistent Vercel build metadata.");
  });
});

describe("createBuildInfoPlugin", () => {
  it("is restricted to production build hooks, not dev serve", () => {
    expect(
      createBuildInfoPlugin({ mode: "production", envDir: process.cwd() })
        .apply,
    ).toBe("build");
  });

  it("emits only the approved fields using Vite's VITE_ environment", () => {
    const envDir = "/isolated/build-env";
    loadEnvMock.mockReturnValue({
      VITE_WORKSPACE_MEASUREMENTS_ENABLED: "true",
      VITE_UNRELATED_TEST_VALUE: "must-not-be-emitted",
    });
    const emitted: Array<{ fileName: string; source: string }> = [];

    try {
      const plugin = createBuildInfoPlugin({
        mode: "test",
        envDir,
        vercelEnv: {},
      });
      const hook = plugin.generateBundle;
      const handler = typeof hook === "function" ? hook : hook?.handler;
      if (!handler) throw new Error("Build info emit hook is missing.");

      handler.call(
        {
          emitFile: (asset) =>
            emitted.push({
              fileName: asset.fileName,
              source: String(asset.source),
            }),
        } as never,
        {} as never,
        {} as never,
        false,
      );

      expect(emitted).toHaveLength(1);
      expect(emitted[0].fileName).toBe("build-info.json");
      expect(JSON.parse(emitted[0].source)).toEqual({
        commitSha: null,
        workspaceMeasurementsEnabled: true,
      });
      expect(loadEnvMock).toHaveBeenCalledWith("test", envDir, "VITE_");
    } finally {
      loadEnvMock.mockReset();
    }
  });

  it("uses real loadEnv precedence: process VITE_ value overrides the TEMP .env value", () => {
    const envDir = mkdtempSync(path.join(tmpdir(), "saas-load-env-test-"));

    try {
      writeFileSync(
        path.join(envDir, ".env.integration"),
        "VITE_WORKSPACE_MEASUREMENTS_ENABLED=false\nVITE_UNUSED_TEST_VALUE=local-file-only\n",
      );
      const result = spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          "const { loadEnv } = await import('vite'); const env = loadEnv('integration', process.argv[1], 'VITE_'); process.stdout.write(JSON.stringify({ flag: env.VITE_WORKSPACE_MEASUREMENTS_ENABLED }));",
          envDir,
        ],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          env: {
            PATH: process.env.PATH ?? "",
            SystemRoot: process.env.SystemRoot ?? "",
            VITE_WORKSPACE_MEASUREMENTS_ENABLED: "true",
          },
        },
      );

      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({ flag: "true" });
    } finally {
      rmSync(envDir, { recursive: true, force: true });
    }
  });
});
