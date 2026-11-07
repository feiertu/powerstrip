package {{meta.group}}.entity.client;

import {{meta.group}}.{{meta.mainClass}};
import net.minecraft.client.model.geom.ModelLayerLocation;
import net.minecraft.resources.ResourceLocation;

public class ModModelLayers {
    {{#each hubs.ModModelLayers.entries}}
    public static final ModelLayerLocation {{regField}} = new ModelLayerLocation(
            new ResourceLocation({{meta.mainClass}}.MOD_ID, "{{layerPath}}"), "main");
    {{/each}}
}
