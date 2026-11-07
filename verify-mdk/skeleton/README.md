# PowerStrip 编译验证工程骨架

把生成产物放进真实 Forge 1.20.1 MDK 编译验证（全部 8 份示例答卷已通过，见 docs/API核查报告.md）。

## 重建步骤

```bash
# 1. 复制本目录为 verify-mdk（不要直接在本目录编译）
cp -r skeleton ../verify-mdk

# 2. 生成某份答卷的源码并入
node scripts/verify-swap.js examples/machine-capabilities.manifest.json verify-mdk

# 3. 编译（需要本机 JDK ≥21；toolchain 已指向 21 + --release 17 字节码）
#    Windows：set JAVA_HOME=C:\Program Files\Java\jdk-21.0.11
cd verify-mdk && gradlew.bat build
```

说明：
- 依赖 JEI / TerraBlender / GeckoLib（cloudsmith maven）已在 build.gradle 声明，首次构建需联网解析；
- `gradle-wrapper.properties` 用腾讯镜像分发 Gradle 8.5（支持 JDK 21；官方 services.gradle.org 亦可替换）；
- 有 JDK 17 的机器可把 `java.toolchain.languageVersion` 改回 `17` 并删除 `options.release = 17`；
- `verify-mdk/` 运行目录（src/build/.gradle/run）不入库，由 .gitignore 排除，本目录只存可复现的工程配置。
