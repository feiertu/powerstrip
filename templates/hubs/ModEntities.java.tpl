package {{meta.group}}.entity;

import {{meta.group}}.{{meta.mainClass}};
{{#each hubs.ModEntities.entries}}import {{meta.group}}.entity.custom.{{entityClassName}};
{{/each}}
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.MobCategory;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModEntities {
    public static final DeferredRegister<EntityType<?>> ENTITY_TYPES =
            DeferredRegister.create(ForgeRegistries.ENTITY_TYPES, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModEntities.entries}}
    public static final RegistryObject<EntityType<{{entityClassName}}>> {{regField}} =
            ENTITY_TYPES.register("{{regPath}}", () -> EntityType.Builder.of({{entityClassName}}::new, MobCategory.{{category}})
                    .sized({{width}}f, {{height}}f).build("{{regPath}}"));
    {{/each}}

    public static void register(IEventBus eventBus) {
        ENTITY_TYPES.register(eventBus);
    }
}
