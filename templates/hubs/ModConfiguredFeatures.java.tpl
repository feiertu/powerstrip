package {{meta.group}}.worldgen;

import {{meta.group}}.{{meta.mainClass}};
import {{meta.group}}.block.ModBlocks;
{{#each hubs.ModConfiguredFeatures.treeEntries}}import {{meta.group}}.worldgen.tree.custom.{{trunkPlacerClassName}};
import {{meta.group}}.worldgen.tree.custom.{{foliagePlacerClassName}};
{{/each}}
import net.minecraft.core.registries.Registries;
import net.minecraft.data.worldgen.BootstapContext;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.tags.BlockTags;
import net.minecraft.util.valueproviders.ConstantInt;
import net.minecraft.world.level.levelgen.feature.ConfiguredFeature;
import net.minecraft.world.level.levelgen.feature.Feature;
import net.minecraft.world.level.levelgen.feature.configurations.FeatureConfiguration;
import net.minecraft.world.level.levelgen.feature.configurations.OreConfiguration;
import net.minecraft.world.level.levelgen.feature.configurations.TreeConfiguration;
import net.minecraft.world.level.levelgen.feature.featuresize.TwoLayersFeatureSize;
import net.minecraft.world.level.levelgen.feature.stateproviders.BlockStateProvider;
import net.minecraft.world.level.levelgen.structure.templatesystem.RuleTest;
import net.minecraft.world.level.levelgen.structure.templatesystem.TagMatchTest;

import java.util.List;

public class ModConfiguredFeatures {
    {{#each hubs.ModConfiguredFeatures.oreEntries}}
    public static final ResourceKey<ConfiguredFeature<?, ?>> {{keyField}} = registerKey("{{keyPath}}");
    {{/each}}
    {{#each hubs.ModConfiguredFeatures.treeEntries}}
    public static final ResourceKey<ConfiguredFeature<?, ?>> {{keyField}} = registerKey("{{keyPath}}");
    {{/each}}

    public static void bootstrap(BootstapContext<ConfiguredFeature<?, ?>> context) {
        RuleTest stoneReplaceables = new TagMatchTest(BlockTags.STONE_ORE_REPLACEABLES);
        RuleTest deepslateReplaceables = new TagMatchTest(BlockTags.DEEPSLATE_ORE_REPLACEABLES);

        {{#each hubs.ModConfiguredFeatures.oreEntries}}
        register(context, {{keyField}}, Feature.ORE, new OreConfiguration(List.of(
                OreConfiguration.target(stoneReplaceables, ModBlocks.{{blockRegField}}.get().defaultBlockState()),
                OreConfiguration.target(deepslateReplaceables, ModBlocks.{{blockRegField}}.get().defaultBlockState())),
                {{veinSize}}));
        {{/each}}
        {{#each hubs.ModConfiguredFeatures.treeEntries}}
        register(context, {{keyField}}, Feature.TREE, new TreeConfiguration.TreeConfigurationBuilder(
                BlockStateProvider.simple(ModBlocks.{{logBlockRegField}}.get()),
                new {{trunkPlacerClassName}}({{baseHeight}}, {{heightRandA}}, {{heightRandB}}),
                BlockStateProvider.simple(ModBlocks.{{leavesBlockRegField}}.get()),
                new {{foliagePlacerClassName}}(ConstantInt.of({{foliageRadius}}), ConstantInt.of({{foliageOffset}}), {{foliageHeight}}),
                new TwoLayersFeatureSize(1, 0, 2)).build());
        {{/each}}
    }

    public static ResourceKey<ConfiguredFeature<?, ?>> registerKey(String name) {
        return ResourceKey.create(Registries.CONFIGURED_FEATURE, new ResourceLocation({{meta.mainClass}}.MOD_ID, name));
    }

    private static <FC extends FeatureConfiguration, F extends Feature<FC>> void register(BootstapContext<ConfiguredFeature<?, ?>> context,
                                                                                          ResourceKey<ConfiguredFeature<?, ?>> key, F feature, FC configuration) {
        context.register(key, new ConfiguredFeature<>(feature, configuration));
    }
}
