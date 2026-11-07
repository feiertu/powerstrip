package {{meta.group}}.loot;

import {{meta.group}}.{{meta.mainClass}};
{{#each hubs.ModLootModifiers.entries}}import {{meta.group}}.loot.{{modifierClassName}};
{{/each}}
import net.minecraftforge.common.loot.GlobalLootModifierSerializer;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModLootModifiers {
    public static final DeferredRegister<GlobalLootModifierSerializer<?>> LOOT_MODIFIER_SERIALIZERS =
            DeferredRegister.create(ForgeRegistries.Keys.GLOBAL_LOOT_MODIFIER_SERIALIZERS, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModLootModifiers.entries}}
    public static final RegistryObject<GlobalLootModifierSerializer<{{modifierClassName}}>> {{regField}} =
            LOOT_MODIFIER_SERIALIZERS.register("{{regPath}}", () -> {{modifierClassName}}.Serializer.INSTANCE);
    {{/each}}

    public static void register(IEventBus eventBus) {
        LOOT_MODIFIER_SERIALIZERS.register(eventBus);
    }
}
