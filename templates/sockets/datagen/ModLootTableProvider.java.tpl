package {{meta.group}}.datagen;

import {{meta.group}}.{{meta.mainClass}};
import {{meta.group}}.block.ModBlocks;
import net.minecraft.data.PackOutput;
import net.minecraft.data.loot.BlockLootSubProvider;
import net.minecraft.data.loot.LootTableProvider;
import net.minecraft.world.flag.FeatureFlags;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.storage.loot.parameters.LootContextParamSets;

import java.util.Collections;
import java.util.List;

public class ModLootTableProvider {
    public static LootTableProvider create(PackOutput output) {
        return new LootTableProvider(output, Collections.emptySet(),
                List.of(new LootTableProvider.SubProviderEntry(ModBlockLootTables::new, LootContextParamSets.BLOCK)));
    }

    public static class ModBlockLootTables extends BlockLootSubProvider {
        public ModBlockLootTables() {
            super(Collections.emptySet(), FeatureFlags.REGISTRY.allFlags());
        }

        @Override
        protected void generate() {
            {{#each params.selfDropBlocks}}
            this.dropSelf(ModBlocks.{{this}}.get());
            {{/each}}
        }

        @Override
        protected Iterable<Block> getKnownBlocks() {
            {{#if params.selfDropBlocks}}return List.of({{#each params.selfDropBlocks}}ModBlocks.{{this}}.get(){{#unless @last}}, {{/unless}}{{/each}});{{else}}return List.of();{{/if}}
        }
    }
}
