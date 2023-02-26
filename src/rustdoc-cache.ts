import os = require("os");

import * as path from "path";
import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as rustCore from "@actions-rs/core";

export class RustdocCache {
    private readonly cachePath: string;
    private readonly cacheKey: string;

    constructor() {
        const manifestPath = rustCore.input.getInput("manifest-path") || "./";
        const manifestDir = path.extname(manifestPath) ? path.dirname(manifestPath) : manifestPath;
        this.cachePath = path.join(manifestDir, "target", "semver-checks", "cache");

        this.cacheKey = [
            rustCore.input.getInput("cache-key"),
            os.platform() as string,
            "semver-checks-rustdoc",
        ].join("-");
    }

    async restore(): Promise<boolean> {
        const key = await cache.restoreCache([this.cachePath], this.cacheKey);
        if (key) {
            core.info(`Restored rustdoc cache from key: ${key}.`);
            return true;
        } else {
            core.info("Rustdoc cache not found.");
            return false;
        }
    }

    async save(): Promise<void> {
        core.info(`Saving rustdoc cache using key: ${this.cacheKey}...`);
        await cache.saveCache([this.cachePath], this.cacheKey);
    }
}
