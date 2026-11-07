package {{meta.group}}.screen;

import {{meta.group}}.{{meta.mainClass}};
{{#each hubs.ModMenuTypes.entries}}import {{meta.group}}.block.entity.custom.{{beClassName}};
{{/each}}
import net.minecraft.core.BlockPos;
import net.minecraft.world.inventory.AbstractContainerMenu;
import net.minecraft.world.inventory.MenuType;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraftforge.common.extensions.IForgeMenuType;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModMenuTypes {
    public static final DeferredRegister<MenuType<?>> MENUS =
            DeferredRegister.create(ForgeRegistries.MENU_TYPES, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModMenuTypes.entries}}
    public static final RegistryObject<MenuType<{{menuClassName}}>> {{regField}} =
            MENUS.register("{{regPath}}", () -> IForgeMenuType.create((pWindowID, pInventory, pData) -> {
                BlockPos pos = pData.readBlockPos();
                BlockEntity blockEntity = pInventory.player.level().getBlockEntity(pos);
                {{beClassName}} be = ({{beClassName}}) blockEntity;
                return new {{menuClassName}}(pWindowID, pInventory, be, be.data);
            }));
    {{/each}}

    public static void register(IEventBus eventBus) {
        MENUS.register(eventBus);
    }
}
