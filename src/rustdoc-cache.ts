import os = require("os");

import * as path from "path";
import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as rustCore from "@actions-rs/core";
import * as exec from "@actions/exec";

export class RustdocCache {
    private readonly cachePath: string;
    private readonly cacheKey: string;

    constructor() {
        const manifestPath = rustCore.input.getInput("manifest-path") || "./";
        const manifestDir = path.extname(manifestPath) ? path.dirname(manifestPath) : manifestPath;
        this.cachePath = path.join(manifestDir, "target", "semver-checks", "cache");
        core.info(`Rustdoc cache path: ${this.cachePath}.`);

        this.cacheKey = [
            rustCore.input.getInput("cache-key"),
            os.platform() as string,
            "semver-checks-rustdoc",
        ].join("-");
        core.info(`Rustdoc cache key: ${this.cacheKey}.`);
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

    async save(): Promise<void> {
        core.info("Saving rustdoc cache...");
        try {
            await exec.exec("ls ref_slice/target");
        } catch (error) {
            core.info("Ajjj.");
        }
        await cache.saveCache([this.cachePath], this.cacheKey);
    }
}
