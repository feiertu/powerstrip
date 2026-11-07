package {{meta.group}}.util;

import {{meta.group}}.{{meta.mainClass}};
import net.minecraft.resources.ResourceLocation;
import net.minecraft.tags.BlockTags;
import net.minecraft.tags.ItemTags;
import net.minecraft.tags.TagKey;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;

public class ModTags {
    public static class Blocks {
        {{#each hubs.ModTags.blockEntries}}
        public static final TagKey<Block> {{regField}} = create("{{tagPath}}");
        {{/each}}

        private static TagKey<Block> create(String name) {
            return BlockTags.create(new ResourceLocation({{meta.mainClass}}.MOD_ID, name));
        }
    }

    public static class Items {
        {{#each hubs.ModTags.itemEntries}}
        public static final TagKey<Item> {{regField}} = create("{{tagPath}}");
        {{/each}}

        private static TagKey<Item> create(String name) {
            return ItemTags.create(new ResourceLocation({{meta.mainClass}}.MOD_ID, name));
        }
    }
}
