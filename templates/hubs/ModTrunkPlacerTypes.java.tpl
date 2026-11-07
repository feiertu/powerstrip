package {{meta.group}}.worldgen.tree;

import {{meta.group}}.{{meta.mainClass}};
{{#each hubs.ModTrunkPlacerTypes.entries}}import {{meta.group}}.worldgen.tree.custom.{{placerClassName}};
{{/each}}
import net.minecraft.core.registries.Registries;
import net.minecraft.world.level.levelgen.feature.trunkplacers.TrunkPlacerType;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.RegistryObject;

public class ModTrunkPlacerTypes {
    public static final DeferredRegister<TrunkPlacerType<?>> TRUNK_PLACER =
            DeferredRegister.create(Registries.TRUNK_PLACER_TYPE, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModTrunkPlacerTypes.entries}}
    public static final RegistryObject<TrunkPlacerType<{{placerClassName}}>> {{regField}} =
            TRUNK_PLACER.register("{{regPath}}", () -> new TrunkPlacerType<>({{placerClassName}}.CODEC));
    {{/each}}

    public static void register(IEventBus eventBus) {
        TRUNK_PLACER.register(eventBus);
    }
}
