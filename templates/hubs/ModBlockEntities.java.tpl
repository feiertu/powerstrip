package {{meta.group}}.block.entity;

import {{meta.group}}.{{meta.mainClass}};
import {{meta.group}}.block.ModBlocks;
{{#each hubs.ModBlockEntities.entries}}import {{meta.group}}.block.entity.custom.{{beClassName}};
{{/each}}{{#each hubs.ModBlockEntities.signs}}import {{meta.group}}.block.entity.custom.{{beClassName}};
{{/each}}
import net.minecraft.world.level.block.entity.BlockEntityType;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModBlockEntities {
    public static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITIES =
            DeferredRegister.create(ForgeRegistries.BLOCK_ENTITY_TYPES, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModBlockEntities.entries}}
    public static final RegistryObject<BlockEntityType<{{beClassName}}>> {{regField}} =
            BLOCK_ENTITIES.register("{{regPath}}", () ->
                    BlockEntityType.Builder.of({{beClassName}}::new,
                            ModBlocks.{{blockRegField}}.get()).build(null));
    {{/each}}
    {{#each hubs.ModBlockEntities.signs}}
    public static final BlockEntityType<{{beClassName}}> {{regField}} =
            BlockEntityType.Builder.of({{beClassName}}::new,
                    ModBlocks.{{standingRegField}}.get(), ModBlocks.{{wallRegField}}.get()).build(null);
    {{/each}}

    public static void register(IEventBus eventBus) {
        BLOCK_ENTITIES.register(eventBus);
    }
}
