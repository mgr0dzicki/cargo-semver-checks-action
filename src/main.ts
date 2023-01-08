import os = require('os');

import * as core from '@actions/core';
import * as io from '@actions/io';
import * as toolCache from '@actions/tool-cache';
import exec = require('@actions/exec');
import fetch from 'node-fetch';

const releaseEndpoint = 'https://api.github.com/repos/obi1kenobi/cargo-semver-checks/releases/latest'

function getPlatformMatchingTarget(): string {
    const platform = os.platform() as string;
    switch (platform) {
        case "linux":
            return "x86_64-unknown-linux-gnu"
        default:
            throw new Error("Unsupported runner");
    }
}

async function getDownloadURL(target: string): Promise<string> {
    const request = await fetch(releaseEndpoint);
    const releaseInfo = await request.json();
    const asset = releaseInfo["assets"].find((asset: { [x: string]: string; }) => {
        return asset['name'].endsWith(`${target}.tar.gz`)
    });

    if (!asset)
        throw new Error(`Couldn't find a release for target ${target}.`);

    return asset["browser_download_url"];
}

async function run(): Promise<void> {
    await exec.exec('rustup', ['install', 'stable']);

    const url = await getDownloadURL(getPlatformMatchingTarget());
    
    const downloadDir = `${os.tmpdir()}/cargo-semver-checks`;
    await io.mkdirP(downloadDir);

    core.info(`downloading cargo-semver-checks from ${url}`);
    const tarballPath = await toolCache.downloadTool(url);
    core.info(`extracting ${tarballPath}`);
    const binPath = await toolCache.extractTar(tarballPath, undefined, ["xz"]);

    core.addPath(binPath);

    await exec.exec('cargo', ['semver-checks', 'check-release']);
}

async function main() {
    try {
        await run();
    } catch (error: any) {
        core.setFailed(error.message);
    }
}

main();