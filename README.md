# cargo-semver-checks-action
Lint your crate API changes for semver violations.

*This is the work-in-progress v2 version of this action. Find the docs for the stable v1 action [here](https://github.com/obi1kenobi/cargo-semver-checks-action/tree/v1.4).*

```yaml
- name: Check semver
  uses: obi1kenobi/cargo-semver-checks-action@v2
- name: Publish to crates.io
  run: # your `cargo publish` code here
```

# Input options

Every argument is optional.

| Input              | Description                                                                                                                       | Default |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------|---------|
| `package`            | The package whose API to check for semver (in Package Id Specification format, see https://doc.rust-lang.org/cargo/reference/pkgid-spec.html for reference). If not set, all packages defined in the Cargo.toml file are processed. | |
| `manifest-path`      | Path to Cargo.toml of crate or workspace to check. If not specified, the action assumes the manifest is under the default [`GITHUB_WORKSPACE`](https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables) path. | |
| `verbose`            | Enables verbose output of `cargo-semver-checks`. | `false` |
| `rust-toolchain`     | Rust toolchain name to use, e.g. `stable`, `nightly` or `1.68.0`. It will be installed if necessary and used regardless of local overrides and the `rust-toolchain.toml` file. However, if the input is set to be an empty string, the action assumes some Rust toolchain is already installed and uses the default one. | `stable` |
| `shared-key`          | A cache key that will be used instead of the automatic key based on the name of the GitHub job and values of the inputs `package` and `manifest-path`. Might be provided e.g. to share the cache between the jobs. | |
| `prefix-key`         | Additional prefix of the cache key, can be set to start a new cache manually. | |
| `github-token`       | The `GITHUB_TOKEN` secret used to download precompiled binaries from GitHub API. If not specified, the [automatic GitHub token](https://docs.github.com/en/actions/security-guides/automatic-token-authentication) provided to the workflow will be used. The token may be alternatively passed in an environment variable `GITHUB_TOKEN`. | `${{ github.token }}` |

# Use in workspaces with a single crate

The action will work out-of-the-box if it is run inside the package root directory. When the package location is different, you have to specify the path to its `Cargo.toml` file:
```yaml
- name: Check semver for my-crate
  uses: obi1kenobi/cargo-semver-checks-action@v2
  with:
    manifest-path: semver/my-crate/Cargo.toml  # or just semver/my-crate/
- name: Publish my-crate to crates.io
  run: # your `cargo publish` code here
```

# Use in workspaces with more than one crate

By default, if workspace contains multiple crates, all of them are checked for semver violations. You can specify a single crate to be checked instead using `package` or `manifest-path`.

For example, this will check `my-crate`:
```yaml
- name: Check semver for my-crate from the current workspace
  uses: obi1kenobi/cargo-semver-checks-action@v2
  with:
    package: my-crate
- name: Publish my-crate to crates.io
  run: # your `cargo publish` code here
```

If the action is not run inside the workspace root directory, you again have to specify the path to its `Cargo.toml` file:
```yaml
- name: Check semver for all crates from my-workspace
  uses: obi1kenobi/cargo-semver-checks-action@v2
  with:
    manifest-path: semver/my-workspace/Cargo.toml  # or just semver/my-workspace/
- name: Publish my-workspace to crates.io
  run: # your `cargo publish` code here
```

The two above might be also used together:
```yaml
- name: Check semver for my-crate from my-workspace
  uses: obi1kenobi/cargo-semver-checks-action@v2
  with:
    manifest-path: semver/my-workspace/Cargo.toml  # or just semver/my-workspace/
    package: my-crate
- name: Publish my-crate to crates.io
  run: # your `cargo publish` code here
```

# Customizing baseline rustdoc caching strategy

The action caches the baseline rustdoc for each package in the workspace. The keys used to distinguish the caches consist of four components:

 - `prefix-key` input, which defaults to an empty string,
 - `shared-key` input if provided, otherwise a concatenation of the value of environmental variable `GITHUB_JOB`, the value of `package` and the hashed value of the `manifest-path` variable (not the file it points to),
 - internal, unchangable component, being a concatenation of the runner OS, `rustc` version, `cargo-semver-checks` version and hash of all `Cargo.lock` files in the current workspace,
 - constant suffix `"semver-checks-rustdoc"`.

Runs that differ in at least one of the above components will use separate caches. Inputs `shared-key` and `cache-key` might be therefore used to customize the caching strategy. For example, the two following jobs will share the key even despite using different `manifest-path`:
```yaml
semver:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout
      uses: actions/checkout@v3
    - name: Check semver
      uses: obi1kenobi/cargo-semver-checks-action@v2
      with:
        shared-key: my-workspace-semver

semver2:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout
      uses: actions/checkout@v3
      with:
        path: semver
    - name: Check semver
      uses: obi1kenobi/cargo-semver-checks-action@v2
      with:
        manifest-path: semver/Cargo.toml
        shared-key: my-workspace-semver
```
which is reasonable until they are checking the same packages. Runs with different targets must not share the cache! For example, the below job is doing well with default settings:
```yaml
semver:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      crate: ['api', 'core']
  steps:
    - name: Checkout
      uses: actions/checkout@v3
    - name: Check semver
      uses: obi1kenobi/cargo-semver-checks-action@v2
      with:
        package: ${{ matrix.crate }}
        # Do not do this!
        # shared-key: 'my-workspace-semver'
```
as both runs will use separate caches, but providing the shared key will lead to data race and significant drop of performance. On the other hand, if you want to further separate the caches that are shared by default, you can use the input `prefix-key`:
```yaml
- name: Check semver
  uses: obi1kenobi/cargo-semver-checks-action@v2
  with:
    prefix-key: v1
```
