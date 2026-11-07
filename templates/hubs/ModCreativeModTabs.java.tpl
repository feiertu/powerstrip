package {{meta.group}}.item;

import {{meta.group}}.{{meta.mainClass}};
import {{meta.group}}.block.ModBlocks;
import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.ItemStack;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.RegistryObject;

public class ModCreativeModTabs {
    public static final DeferredRegister<CreativeModeTab> CREATIVE_MODE_TABS =
            DeferredRegister.create(Registries.CREATIVE_MODE_TAB, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModCreativeModTabs.entries}}
    public static final RegistryObject<CreativeModeTab> {{regField}} = CREATIVE_MODE_TABS.register("{{regPath}}",
            () -> CreativeModeTab.builder().icon(() -> new ItemStack({{iconExpr}}))
                    .title(Component.translatable("creativetab.{{regPath}}"))
                    .displayItems((pParameters, pOutput) -> {
                        {{#each displayItems}}pOutput.accept({{expr}});
                        {{/each}}
                    }).build());
    {{/each}}

    public static void register(IEventBus eventBus) {
        CREATIVE_MODE_TABS.register(eventBus);
    }
}
