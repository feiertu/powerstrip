package {{meta.group}};

{{#if flags.hasBlocks}}import {{meta.group}}.block.ModBlocks;
{{/if}}{{#if flags.hasBlockEntities}}import {{meta.group}}.block.entity.ModBlockEntities;
{{/if}}{{#each berRegistrations}}import {{meta.group}}.block.entity.renderer.{{rendererClassName}};
{{/each}}{{#if flags.hasEntities}}import {{meta.group}}.entity.ModEntities;
{{/if}}{{#each layerRegistrations}}import {{meta.group}}.entity.client.ModModelLayers;
import {{meta.group}}.entity.client.{{modelClassName}};
{{/each}}{{#each boatRenderers}}import {{meta.group}}.entity.client.{{rendererClassName}};
{{/each}}{{#if flags.hasItems}}import {{meta.group}}.item.ModItems;
{{/if}}{{#if flags.hasTabs}}import {{meta.group}}.item.ModCreativeModTabs;
{{/if}}{{#if flags.hasLootModifiers}}import {{meta.group}}.loot.ModLootModifiers;
{{/if}}{{#if flags.hasRecipes}}import {{meta.group}}.recipe.ModRecipes;
{{/if}}{{#if flags.hasMenus}}import {{meta.group}}.screen.ModMenuTypes;
{{/if}}{{#each screenRegistrations}}import {{meta.group}}.screen.{{screenClassName}};
{{/each}}{{#if flags.hasSounds}}import {{meta.group}}.sound.ModSounds;
{{/if}}{{#if flags.hasVillagers}}import {{meta.group}}.villager.ModVillagers;
{{/if}}{{#if flags.hasBiomeModifiers}}import {{meta.group}}.worldgen.ModBiomeModifiers;
{{/if}}{{#if flags.hasConfigured}}import {{meta.group}}.worldgen.ModConfiguredFeatures;
{{/if}}{{#if flags.hasOreGen}}import {{meta.group}}.worldgen.ModPlacedFeatures;
{{/if}}{{#if flags.hasTreeGen}}import {{meta.group}}.worldgen.tree.ModFoliagePlacers;
import {{meta.group}}.worldgen.tree.ModTrunkPlacerTypes;
{{/if}}{{#if flags.hasSurfaceRules}}import {{meta.group}}.worldgen.biome.surface.ModSurfaceRules;
import terrablender.api.SurfaceRuleManager;
{{/if}}{{#if flags.hasBiomes}}import {{meta.group}}.worldgen.biome.ModTerrablender;
{{/if}}{{#if flags.hasWoodTypes}}import {{meta.group}}.util.ModWoodTypes;
import net.minecraft.client.renderer.Sheets;
{{/if}}{{#if flags.hasDimensions}}import {{meta.group}}.worldgen.dimension.ModDimensions;
{{/if}}{{#if flags.hasDatagen}}import {{meta.group}}.datagen.DataGenerators;
{{/if}}{{#if flags.hasNetworking}}import {{meta.group}}.networking.{{networkingCtx.networkClassName}};
{{/if}}{{#if flags.hasConfig}}import {{meta.group}}.config.{{configCtx.configClassName}};
import net.minecraftforge.fml.config.ModConfig;
{{/if}}
import net.minecraft.client.gui.screens.MenuScreens;
import net.minecraft.client.renderer.blockentity.BlockEntityRenderers;
import net.minecraft.client.renderer.entity.EntityRenderers;
{{#if flags.hasProjectiles}}import net.minecraft.client.renderer.entity.ThrownItemRenderer;
{{/if}}
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.common.MinecraftForge;
{{#unless flags.hasEventListeners}}import net.minecraftforge.event.server.ServerStartingEvent;
{{/unless}}
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.event.lifecycle.FMLClientSetupEvent;
{{#if flags.needsCommonSetup}}import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;
{{/if}}
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;

@Mod({{meta.mainClass}}.MOD_ID)
public class {{meta.mainClass}} {
    public static final String MOD_ID = "{{meta.modId}}";

    public {{meta.mainClass}}(FMLJavaModLoadingContext context) {
        IEventBus modEventBus = context.getModEventBus();

        {{#if flags.hasTabs}}ModCreativeModTabs.register(modEventBus);
        {{/if}}{{#if flags.hasItems}}ModItems.register(modEventBus);
        {{/if}}{{#if flags.hasBlocks}}ModBlocks.register(modEventBus);
        {{/if}}{{#if flags.hasBlockEntities}}ModBlockEntities.register(modEventBus);
        {{/if}}{{#if flags.hasMenus}}ModMenuTypes.register(modEventBus);
        {{/if}}{{#if flags.hasRecipes}}ModRecipes.register(modEventBus);
        {{/if}}{{#if flags.hasSounds}}ModSounds.register(modEventBus);
        {{/if}}{{#if flags.hasVillagers}}ModVillagers.register(modEventBus);
        {{/if}}{{#if flags.hasEntities}}ModEntities.register(modEventBus);
        {{/if}}{{#if flags.hasLootModifiers}}ModLootModifiers.register(modEventBus);
        {{/if}}{{#if flags.hasBiomeModifiers}}modEventBus.addListener(ModBiomeModifiers::bootstrap);
        {{/if}}{{#if flags.hasDimensions}}modEventBus.addListener(ModDimensions::bootstrapType);
        modEventBus.addListener(ModDimensions::bootstrapStem);
        {{/if}}{{#if flags.hasTreeGen}}ModTrunkPlacerTypes.register(modEventBus);
        ModFoliagePlacers.register(modEventBus);
        {{/if}}{{#if flags.hasBiomes}}ModTerrablender.registerBiomes();
        {{/if}}{{#if flags.hasConfigured}}modEventBus.addListener(ModConfiguredFeatures::bootstrap);
        {{/if}}{{#if flags.hasOreGen}}modEventBus.addListener(ModPlacedFeatures::bootstrap);
        {{/if}}{{#if flags.hasDatagen}}modEventBus.addListener(DataGenerators::gatherData);
        {{/if}}{{#if flags.needsCommonSetup}}modEventBus.addListener(this::commonSetup);
        {{/if}}{{#if flags.hasNetworking}}{{networkingCtx.networkClassName}}.register();
        {{/if}}{{#if flags.hasConfig}}context.registerConfig(ModConfig.Type.COMMON, {{configCtx.configClassName}}.SPEC, "{{meta.modId}}-common.toml");
        {{/if}}
        MinecraftForge.EVENT_BUS.register(this);
    }

    {{#if flags.needsCommonSetup}}
    private void commonSetup(final FMLCommonSetupEvent event) {
        event.enqueueWork(() -> {
            {{#if flags.hasSurfaceRules}}SurfaceRuleManager.addSurfaceRules(SurfaceRuleManager.RuleCategory.OVERWORLD, MOD_ID, ModSurfaceRules.makeRules());
            {{/if}}
        });
    }
    {{/if}}
    {{#unless flags.hasEventListeners}}
    @SubscribeEvent
    public void onServerStarting(ServerStartingEvent event) {
    }
    {{/unless}}

    @Mod.EventBusSubscriber(modid = MOD_ID, bus = Mod.EventBusSubscriber.Bus.MOD, value = Dist.CLIENT)
    public static class ClientModEvents {
        @SubscribeEvent
        public static void onClientSetup(FMLClientSetupEvent event) {
            {{#each woodTypes}}
            Sheets.addWoodType(ModWoodTypes.{{regField}});
            {{/each}}{{#each berRegistrations}}
            BlockEntityRenderers.register(ModBlockEntities.{{beRegField}}.get(), {{rendererClassName}}::new);
            {{/each}}{{#each screenRegistrations}}
            MenuScreens.register(ModMenuTypes.{{menuRegField}}.get(), {{screenClassName}}::new);
            {{/each}}{{#each creatureRenderers}}
            EntityRenderers.register(ModEntities.{{entityRegField}}.get(), {{rendererClassName}}::new);
            {{/each}}{{#each projectileRenderers}}
            EntityRenderers.register(ModEntities.{{regField}}.get(), ThrownItemRenderer::new);
            {{/each}}{{#each boatRenderers}}
            EntityRenderers.register(ModEntities.{{regField}}.get(), {{rendererClassName}}::new);
            {{/each}}{{#each layerRegistrations}}
            event.registerLayerDefinition(ModModelLayers.{{layerRegField}}, {{modelClassName}}::createBodyLayer);
            {{/each}}
        }
    }
}
