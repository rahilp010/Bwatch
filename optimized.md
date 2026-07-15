# React Native Build Size Optimization Prompt

You are a senior React Native performance engineer and Android build optimization expert.

Your goal is to reduce my React Native application's APK/AAB size as much as possible while maintaining the exact same functionality, UI, and user experience.

## Objectives

- Minimize release APK/AAB size.
- Reduce installation size.
- Reduce startup time.
- Reduce memory usage where possible.
- Remove unnecessary dependencies and assets.
- Improve Gradle and Metro configuration.
- Do NOT remove any feature unless it is completely unused.

## Project Audit

Perform a complete audit of the entire project.

Check:

- package.json
- android/
- ios/
- metro.config.js
- babel.config.js
- react-native.config.js
- assets/
- fonts/
- images/
- node_modules usage
- native modules
- Gradle configuration
- ProGuard/R8
- Hermes
- New Architecture settings
- Flipper
- Debug dependencies
- Release configuration

Find:

- Unused npm packages
- Duplicate packages
- Large libraries
- Unused fonts
- Unused images
- Duplicate assets
- Dead code
- Unused screens
- Unused components
- Unused utilities
- Unused imports
- Large JSON files
- Unused native libraries

## Android Optimizations

Verify and configure:

- Hermes enabled
- R8 enabled
- ProGuard enabled
- Resource shrinking enabled
- Code shrinking enabled
- PNG crunching
- Native library stripping
- ABI splits
- App Bundle support
- Packaging options
- Compress native libraries
- Remove debug symbols
- Strip unused locales
- Strip unused resources
- Remove unused permissions
- Remove unused manifest entries

Enable every safe optimization available.

## Metro Optimizations

Optimize Metro configuration.

- inlineRequires
- RAM bundles if beneficial
- Tree shaking
- Asset optimization
- SVG optimization
- Minification

## Babel Optimizations

Review Babel plugins.

Remove unnecessary plugins.

Optimize transforms.

## Dependency Optimization

Replace heavy libraries with lightweight alternatives when safe.

Examples:

- Moment → Day.js
- Lodash → lodash-es or per-function imports
- Large icon packs → individual SVGs
- Heavy animation libraries only if unused

Only replace when there is no functionality loss.

## Image Optimization

Audit every image.

For each image:

- Compress losslessly
- Convert PNG → WebP where supported
- Resize oversized images
- Remove duplicates
- Remove unused assets

Provide:

Original size

Optimized size

Savings

## Font Optimization

Check fonts.

Remove unused weights.

Remove unused families.

Subset fonts when possible.

## JavaScript Optimization

Improve:

Tree shaking

Lazy loading

Dynamic imports

Memoization

Bundle splitting

Remove dead code

Optimize re-renders

## Native Optimization

Audit Android native configuration.

Remove:

Unused native modules

Unused Gradle plugins

Unused repositories

Unused dependencies

Unused manifest permissions

Unused services

Unused providers

## Build Configuration

Produce the smallest production build possible.

Review:

android/app/build.gradle

android/build.gradle

gradle.properties

settings.gradle

AndroidManifest.xml

Update them with best practices.

## Analyze Bundle

Generate instructions for:

Android bundle analysis

Hermes bytecode analysis

APK Analyzer

Bundle size comparison

## Output

For every optimization:

Explain:

- Why it helps
- Expected size reduction
- Risk level
- Exact files changed

At the end provide:

1. Total estimated APK reduction
2. Total estimated AAB reduction
3. Startup improvement
4. Memory improvement
5. Build time impact
6. Final optimization checklist

## Important Rules

- Do NOT break functionality.
- Do NOT remove used code.
- Do NOT change UI.
- Do NOT change business logic.
- Keep all APIs working.
- Keep navigation intact.
- Keep release builds stable.
- Apply only production-safe optimizations.
- Show the complete updated code for every modified file.
- Do not omit any code.
- Ensure the project builds successfully after every change.
