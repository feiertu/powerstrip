package {{meta.group}}.event;

import {{meta.group}}.{{meta.mainClass}};
{{#if flags.hasCreatures}}import {{meta.group}}.entity.ModEntities;
{{#each creatureAttributes}}import {{meta.group}}.entity.custom.{{className}};
{{/each}}{{/if}}{{#if flags.hasSurfaceRules}}import {{meta.group}}.worldgen.biome.surface.ModSurfaceRules;
import terrablender.api.SurfaceRuleManager;
{{/if}}
import net.minecraftforge.event.entity.EntityAttributeCreationEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;

@Mod.EventBusSubscriber(modid = {{meta.mainClass}}.MOD_ID, bus = Mod.EventBusSubscriber.Bus.MOD)
public class ModEventBusEvents {
    @SubscribeEvent
    public static void commonSetup(FMLCommonSetupEvent event) {
        event.enqueueWork(() -> {
            {{#if flags.hasSurfaceRules}}SurfaceRuleManager.addSurfaceRules(SurfaceRuleManager.RuleCategory.OVERWORLD, {{meta.mainClass}}.MOD_ID, ModSurfaceRules.makeRules());
            {{/if}}
        });
    }

    {{#if flags.hasCreatures}}
    @SubscribeEvent
    public static void onAttributeCreate(EntityAttributeCreationEvent event) {
        {{#each creatureAttributes}}event.put(ModEntities.{{regField}}.get(), {{className}}.createAttributes().build());
        {{/each}}
    }
    {{/if}}
}
