package {{meta.group}}.loot;

import com.mojang.serialization.Codec;
import {{meta.group}}.{{meta.mainClass}};
{{#each hubs.ModLootModifiers.entries}}import {{meta.group}}.loot.{{modifierClassName}};
{{/each}}
import net.minecraftforge.common.loot.IGlobalLootModifier;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModLootModifiers {
    public static final DeferredRegister<Codec<? extends IGlobalLootModifier>> LOOT_MODIFIER_SERIALIZERS =
            DeferredRegister.create(ForgeRegistries.Keys.GLOBAL_LOOT_MODIFIER_SERIALIZERS, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModLootModifiers.entries}}
    public static final RegistryObject<Codec<? extends IGlobalLootModifier>> {{regField}} =
            LOOT_MODIFIER_SERIALIZERS.register("{{regPath}}", () -> {{modifierClassName}}.CODEC);
    {{/each}}

    public static void register(IEventBus eventBus) {
        LOOT_MODIFIER_SERIALIZERS.register(eventBus);
    }
}
