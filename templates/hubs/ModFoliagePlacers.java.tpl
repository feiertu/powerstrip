package {{meta.group}}.worldgen.tree;

import {{meta.group}}.{{meta.mainClass}};
{{#each hubs.ModFoliagePlacers.entries}}import {{meta.group}}.worldgen.tree.custom.{{placerClassName}};
{{/each}}
import net.minecraft.core.registries.Registries;
import net.minecraft.world.level.levelgen.feature.foliageplacers.FoliagePlacerType;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.RegistryObject;

public class ModFoliagePlacers {
    public static final DeferredRegister<FoliagePlacerType<?>> FOLIAGE_PLACERS =
            DeferredRegister.create(Registries.FOLIAGE_PLACER_TYPE, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModFoliagePlacers.entries}}
    public static final RegistryObject<FoliagePlacerType<{{placerClassName}}>> {{regField}} =
            FOLIAGE_PLACERS.register("{{regPath}}", () -> new FoliagePlacerType<>({{placerClassName}}.CODEC));
    {{/each}}

    public static void register(IEventBus eventBus) {
        FOLIAGE_PLACERS.register(eventBus);
    }
}
