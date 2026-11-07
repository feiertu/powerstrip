package {{meta.group}}.worldgen.dimension;

import {{meta.group}}.{{meta.mainClass}};
import com.mojang.datafixers.util.Pair;
import net.minecraft.core.HolderGetter;
import net.minecraft.core.registries.Registries;
import net.minecraft.data.worldgen.BootstapContext;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.tags.BlockTags;
import net.minecraft.util.valueproviders.ConstantInt;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.biome.Biome;
import net.minecraft.world.level.biome.Biomes;
import net.minecraft.world.level.biome.Climate;
import net.minecraft.world.level.biome.MultiNoiseBiomeSource;
import net.minecraft.world.level.dimension.BuiltinDimensionTypes;
import net.minecraft.world.level.dimension.DimensionType;
import net.minecraft.world.level.dimension.LevelStem;
import net.minecraft.world.level.levelgen.NoiseBasedChunkGenerator;
import net.minecraft.world.level.levelgen.NoiseGeneratorSettings;

import java.util.List;
import java.util.OptionalLong;

public class ModDimensions {
    {{#each hubs.ModDimensions.entries}}
    public static final ResourceKey<LevelStem> {{levelStemKeyField}} = ResourceKey.create(Registries.LEVEL_STEM,
            new ResourceLocation({{meta.mainClass}}.MOD_ID, "{{dimPath}}"));
    public static final ResourceKey<Level> {{levelKeyField}} = ResourceKey.create(Registries.DIMENSION,
            new ResourceLocation({{meta.mainClass}}.MOD_ID, "{{dimPath}}"));
    public static final ResourceKey<DimensionType> {{typeKeyField}} = ResourceKey.create(Registries.DIMENSION_TYPE,
            new ResourceLocation({{meta.mainClass}}.MOD_ID, "{{dimPath}}_type"));
    {{/each}}

    public static void bootstrapType(BootstapContext<DimensionType> context) {
        {{#each hubs.ModDimensions.entries}}
        context.register({{typeKeyField}}, new DimensionType(
                OptionalLong.of(12000), false, false, false, false, 1.0, true, false,
                0, 256, 256, BlockTags.INFINIBURN_OVERWORLD, BuiltinDimensionTypes.OVERWORLD_EFFECTS, 1.0f,
                new DimensionType.MonsterSettings(false, false, ConstantInt.of(0), 0)));
        {{/each}}
    }

    public static void bootstrapStem(BootstapContext<LevelStem> context) {
        HolderGetter<Biome> biomeRegistry = context.lookup(Registries.BIOME);
        HolderGetter<DimensionType> dimTypes = context.lookup(Registries.DIMENSION_TYPE);
        HolderGetter<NoiseGeneratorSettings> noiseGenSettings = context.lookup(Registries.NOISE_SETTINGS);

        {{#each hubs.ModDimensions.entries}}
        NoiseBasedChunkGenerator noiseBasedChunkGenerator = new NoiseBasedChunkGenerator(
                MultiNoiseBiomeSource.createFromList(
                        new Climate.ParameterList<>(List.of(Pair.of(
                                Climate.parameters(0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F), biomeRegistry.getOrThrow(Biomes.PLAINS))))),
                noiseGenSettings.getOrThrow(NoiseGeneratorSettings.AMPLIFIED));

        context.register({{levelStemKeyField}}, new LevelStem(dimTypes.getOrThrow({{typeKeyField}}), noiseBasedChunkGenerator));
        {{/each}}
    }
}
