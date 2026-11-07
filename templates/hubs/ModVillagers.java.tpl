package {{meta.group}}.villager;

import com.google.common.collect.ImmutableSet;
import {{meta.group}}.{{meta.mainClass}};
import {{meta.group}}.block.ModBlocks;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.entity.ai.village.poi.PoiType;
import net.minecraft.world.entity.ai.village.poi.PoiTypes;
import net.minecraft.world.entity.npc.VillagerProfession;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModVillagers {
    public static final DeferredRegister<PoiType> POI_TYPES =
            DeferredRegister.create(ForgeRegistries.POI_TYPES, {{meta.mainClass}}.MOD_ID);
    public static final DeferredRegister<VillagerProfession> VILLAGER_PROFESSIONS =
            DeferredRegister.create(ForgeRegistries.VILLAGER_PROFESSIONS, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModVillagers.entries}}
    public static final RegistryObject<PoiType> {{poiRegField}} = POI_TYPES.register("{{poiRegPath}}",
            () -> new PoiType(ImmutableSet.copyOf(ModBlocks.{{blockRegField}}.get().getStateDefinition().getPossibleStates()), 1, 1));

    public static final RegistryObject<VillagerProfession> {{professionRegField}} = VILLAGER_PROFESSIONS.register("{{professionName}}",
            () -> new VillagerProfession("{{professionName}}", x -> x.get() == {{poiRegField}}.get(),
                    x -> x.get() == {{poiRegField}}.get(), ImmutableSet.of(), ImmutableSet.of(), {{workSound}}));
    {{/each}}

    public static void register(IEventBus eventBus) {
        POI_TYPES.register(eventBus);
        VILLAGER_PROFESSIONS.register(eventBus);
    }
}
