package {{meta.group}}.worldgen;

import {{meta.group}}.{{meta.mainClass}};
import net.minecraft.core.HolderSet;
import net.minecraft.core.registries.Registries;
import net.minecraft.data.worldgen.BootstapContext;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.level.levelgen.GenerationStep;
import net.minecraftforge.common.world.BiomeModifier;
import net.minecraftforge.common.world.ForgeBiomeModifiers;
import net.minecraftforge.registries.ForgeRegistries;

public class ModBiomeModifiers {
    {{#each hubs.ModBiomeModifiers.entries}}
    public static final ResourceKey<BiomeModifier> {{keyField}} = registerKey("{{keyPath}}");
    {{/each}}

    public static void bootstrap(BootstapContext<BiomeModifier> context) {
        var placedFeatures = context.lookup(Registries.PLACED_FEATURE);
        var biomes = context.lookup(Registries.BIOME);

        {{#each hubs.ModBiomeModifiers.entries}}
        context.register({{keyField}}, new ForgeBiomeModifiers.AddFeaturesBiomeModifier(
                biomes.getOrThrow(net.minecraft.tags.BiomeTags.{{biomeTarget}}),
                HolderSet.direct(placedFeatures.getOrThrow(ModPlacedFeatures.{{placedKeyField}})),
                GenerationStep.Decoration.UNDERGROUND_ORES));
        {{/each}}
    }

    private static ResourceKey<BiomeModifier> registerKey(String name) {
        return ResourceKey.create(ForgeRegistries.Keys.BIOME_MODIFIERS, new ResourceLocation({{meta.mainClass}}.MOD_ID, name));
    }
}
