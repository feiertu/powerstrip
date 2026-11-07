package {{meta.group}}.worldgen.biome;

import {{meta.group}}.{{meta.mainClass}};
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.level.biome.Biome;

public class ModBiomes {
    {{#each hubs.ModBiomes.entries}}
    public static final ResourceKey<Biome> {{keyField}} = register("{{keyPath}}");
    {{/each}}

    private static ResourceKey<Biome> register(String name) {
        return ResourceKey.create(Registries.BIOME, new ResourceLocation({{meta.mainClass}}.MOD_ID, name));
    }
}
