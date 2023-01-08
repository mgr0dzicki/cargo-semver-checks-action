import os = require('os');

import * as core from '@actions/core';
import * as io from '@actions/io';
import * as toolCache from '@actions/tool-cache';
import fetch from 'node-fetch';
import * as rustCore from '@actions-rs/core';

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

function optionIfValueProvided(option: string, value?: string): string {
    return value ? ` ${option} ${value}` : '';
}

function getCheckReleaseArguments(): string[] {
    return [
        optionIfValueProvided('--package', rustCore.input.getInput('crate-name')),
        optionIfValueProvided('--manifest-path', rustCore.input.getInput('manifest-path')),
        rustCore.input.getInputBool('verbose') ? ' --verbose' : ''
    ]
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

async function installRustUp(): Promise<void> {
    const rustup = await rustCore.RustUp.getOrInstall();
    await rustup.call(['show']);
    await rustup.setProfile('minimal');
    await rustup.installToolchain('stable');
}

async function run(): Promise<void> {
    await installRustUp();
    const cargo = await rustCore.Cargo.get();

    const url = await getDownloadURL(getPlatformMatchingTarget());
    
    const downloadDir = `${os.tmpdir()}/cargo-semver-checks`;
    await io.mkdirP(downloadDir);

    core.info(`downloading cargo-semver-checks from ${url}`);
    const tarballPath = await toolCache.downloadTool(url);
    core.info(`extracting ${tarballPath}`);
    const binPath = await toolCache.extractTar(tarballPath, undefined, ["xz"]);

    core.addPath(binPath);

    await cargo.call(['semver-checks', 'check-release'].concat(getCheckReleaseArguments()));
}

async function main() {
    try {
        await run();
    } catch (error: any) {
        core.setFailed(error.message);
    }
}

main();