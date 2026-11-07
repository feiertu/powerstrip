package {{meta.group}}.worldgen.biome;

import {{meta.group}}.{{meta.mainClass}};
{{#each hubs.ModTerrablender.entries}}import {{meta.group}}.worldgen.biome.{{regionClassName}};
{{/each}}
import net.minecraft.resources.ResourceLocation;
import terrablender.api.Regions;

public class ModTerrablender {
    public static void registerBiomes() {
        {{#each hubs.ModTerrablender.entries}}
        Regions.register(new {{regionClassName}}(new ResourceLocation({{meta.mainClass}}.MOD_ID, "{{regionName}}"), {{weight}}));
        {{/each}}
    }
}
