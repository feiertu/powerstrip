package {{meta.group}}.sound;

import {{meta.group}}.{{meta.mainClass}};
import net.minecraft.resources.ResourceLocation;
import net.minecraft.sounds.SoundEvent;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModSounds {
    public static final DeferredRegister<SoundEvent> SOUND_EVENTS =
            DeferredRegister.create(ForgeRegistries.SOUND_EVENTS, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModSounds.entries}}
    public static final RegistryObject<SoundEvent> {{regField}} = SOUND_EVENTS.register("{{regPath}}",
            () -> {{#if fixedRange}}SoundEvent.createFixedRangeEvent(new ResourceLocation({{meta.mainClass}}.MOD_ID, "{{regPath}}"), 16f){{else}}SoundEvent.createVariableRangeEvent(new ResourceLocation({{meta.mainClass}}.MOD_ID, "{{regPath}}")){{/if}});
    {{/each}}

    public static void register(IEventBus eventBus) {
        SOUND_EVENTS.register(eventBus);
    }
}
