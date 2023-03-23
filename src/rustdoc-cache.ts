import os = require("os");
import hashFiles = require("hash-files");

import * as exec from "@actions/exec";
import * as path from "path";
import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as rustCore from "@actions-rs/core";

export class RustdocCache {
    private cachePath = "";
    private cacheKey = "";

    async save(): Promise<void> {
        this.cachePath = path.join("target", "semver-checks", "cache");
        core.info(`Rustdoc cache path: ${this.cachePath}.`);

        this.cacheKey = [
            rustCore.input.getInput("cache-key"),
            os.platform() as string,
            await this.getRustcVersion(),
            this.getCargoLocksHash(),
            "semver-checks-rustdoc",
        ].join("-");
        core.info(`Rustdoc cache key: ${this.cacheKey}.`);

        core.info("Saving rustdoc cache...");
        await cache.saveCache([this.cachePath], this.cacheKey);
    }

    async restore(): Promise<boolean> {
        const key = await cache.restoreCache([this.cachePath], this.cacheKey);
        if (key) {
            core.info(`Restored rustdoc cache.`);
            return true;
        } else {
            core.info(`Rustdoc cache not found.`);
            return false;
        }
    }

    private getCargoLocksHash(): string {
        const manifestPath = rustCore.input.getInput("manifest-path") || "./";
        const manifestDir = path.extname(manifestPath) ? path.dirname(manifestPath) : manifestPath;
        return hashFiles.sync({
            files: [path.join(manifestDir, "**", "Cargo.lock")],
        });
    }

    private async getRustcVersion(): Promise<string> {
        let stdout = "";
        const execOptions = {
            listeners: {
                stdout: (buffer: Buffer): void => {
                    stdout += buffer.toString();
                },
            },
        };
        await exec.exec("rustc", ["--version"], execOptions);
        return stdout.trim().replace(/\s/g, " ");
    }
}
