package {{meta.group}}.item;

import {{meta.group}}.{{meta.mainClass}};
{{#each hubs.ModItems.items}}{{#if customClass}}import {{meta.group}}.item.custom.{{className}};
{{/if}}{{/each}}{{#if flags.hasSeeds}}import net.minecraft.world.item.ItemNameBlockItem;
{{/if}}import net.minecraft.world.item.Item;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModItems {
    public static final DeferredRegister<Item> ITEMS =
            DeferredRegister.create(ForgeRegistries.ITEMS, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModItems.items}}
    public static final RegistryObject<Item> {{regField}} = ITEMS.register("{{regPath}}", () -> {{constructorExpr}});
    {{/each}}

    public static void register(IEventBus eventBus) {
        ITEMS.register(eventBus);
    }
}
