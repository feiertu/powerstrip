package {{meta.group}}.loot;

import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import it.unimi.dsi.fastutil.objects.ObjectArrayList;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.storage.loot.LootContext;
import net.minecraftforge.common.loot.IGlobalLootModifier;

public class {{params.className}} implements IGlobalLootModifier {
    public static final Codec<{{params.className}}> CODEC = RecordCodecBuilder.create(inst -> inst.group(
            ItemStack.CODEC.fieldOf("added_item").forGetter(m -> m.addedItem)
    ).apply(inst, {{params.className}}::new));

    private final ItemStack addedItem;

    public {{params.className}}(ItemStack addedItem) {
        this.addedItem = addedItem;
    }

    @Override
    public ObjectArrayList<ItemStack> apply(ObjectArrayList<ItemStack> generatedLoot, LootContext context) {
        generatedLoot.add(this.addedItem.copy());
        return generatedLoot;
    }

    @Override
    public Codec<? extends IGlobalLootModifier> codec() {
        return CODEC;
    }
}
